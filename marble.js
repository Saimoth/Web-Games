/* p5 hosts the canvas; scene geometry and physics use stable world coordinates. */
'use strict';
const $ = id => document.getElementById(id);
const COLORS=[350,32,53,160,207,270];
const MAX_BALLS=500, MAX_POINTS=10000, SAVE_KEY='marble-playground-v2';
let world, clock, cnv, paths=[], pathId=1, hueIndex=0;
let mode='line', paused=false, rate=1, view={scale:1,x:0,y:0};
let gesture=null, hover=null, undoStack=[], redoStack=[], particles=[];
let toastTimer, lastCount=-1, sprites=new Map(), geometry=[];
const copy = value => JSON.parse(JSON.stringify(value));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const point = p => ({x:p.x,y:p.y});

function setup(){
  pixelDensity(Math.min(window.devicePixelRatio||1,2));
  const stage=$('stage');
  cnv=createCanvas(stage.clientWidth,stage.clientHeight); cnv.parent(stage);
  cnv.elt.setAttribute('aria-label','Draw walls and tracks, or pour marbles. Choose a tool below.');
  world=new MarblePhysics.World({width:Math.max(320,stage.clientWidth),height:Math.max(350,stage.clientHeight)});
  clock=new MarblePhysics.Clock(dt=>world.step(dt));
  setupUI(); setupPointer(); fitView();
  new ResizeObserver(()=>{resizeCanvas(stage.clientWidth,stage.clientHeight);fitView();}).observe(stage);
  makePreset('bowl'); setMode('ball'); syncUI();
}
function fitView(){
  if(!world)return;
  view.scale=Math.min(width/world.width,height/world.height);
  view.x=(width-world.width*view.scale)/2; view.y=(height-world.height*view.scale)/2;
  // A resize invalidates an in-progress pointer mapping, never committed geometry.
  if(gesture) finishGesture(true);
}
function toast(message){
  $('toast').textContent=message; $('toast').classList.add('show');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600);
}
function snapshot(){
  return {version:2,width:world.width,height:world.height,paths:copy(paths),
    balls:world.balls.map(b=>({id:b.id,x:b.pos.x,y:b.pos.y,vx:b.vel.x,vy:b.vel.y,radius:b.r,hue:b.hue}))};
}
function remember(before=snapshot()){
  undoStack.push(before); if(undoStack.length>35)undoStack.shift(); redoStack=[]; syncUI();
}
function restore(data){
  world.width=data.width; world.height=data.height; paths=copy(data.paths);
  world.balls=[]; world.nextId=1;
  for(const b of data.balls)world.addBall(b.x,b.y,b);
  pathId=Math.max(0,...paths.map(p=>p.id))+1;
  particles=[]; gesture=null; clock.reset(); rebuild(); fitView(); syncUI();
}
function undo(){
  finishGesture(true); if(!undoStack.length)return;
  redoStack.push(snapshot());restore(undoStack.pop());toast('Undone');
}
function redo(){
  finishGesture(true); if(!redoStack.length)return;
  undoStack.push(snapshot());restore(redoStack.pop());toast('Redone');
}
function syncUI(){
  $('btnUndo').disabled=!undoStack.length; $('btnRedo').disabled=!redoStack.length;
  $('btnPause').textContent=paused?'Play':'Pause';$('btnPause').setAttribute('aria-pressed',String(paused));
  $('btnSpeed').setAttribute('aria-pressed',String(world.boost));
  $('state').textContent=paused?'Paused':(world.boost?'Speed on':(rate!==1?rate+'× time':''));
}
function setMode(next){
  finishGesture(); mode=next;
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  $('hint').textContent={line:'Draw a wall or a bowl. Undo any time.',track:'Draw twin rails. Join the ends to make a loop.',ball:'Tap to drop a marble. Hold and move to pour.',erase:'Swipe over a marble, line or track to remove it.'}[mode];
  if(cnv)cnv.elt.style.cursor=mode==='erase'?'crosshair':mode==='ball'?'copy':'crosshair';
}
function togglePause(){paused=!paused;clock.reset();syncUI();}
function segmentsOf(points,closed=false){
  const result=[];
  for(let i=0;i<points.length-(closed?0:1);i++){
    const a=points[i],b=points[(i+1)%points.length];
    result.push({ax:a.x,ay:a.y,bx:b.x,by:b.y});
  }
  return result;
}
function smooth(points,closed=false){
  let result=points.map(point);
  for(let pass=0;pass<2;pass++)result=result.map((p,i)=>{
    if(!closed&&(i===0||i===result.length-1))return p;
    const a=result[(i-1+result.length)%result.length],b=result[(i+1)%result.length];
    return {x:(a.x+2*p.x+b.x)/4,y:(a.y+2*p.y+b.y)/4};
  });
  return result;
}
function rails(points,closed=false){
  const left=[],right=[],n=points.length;
  for(let i=0;i<n;i++){
    const p=points[i],a=points[closed?(i-1+n)%n:Math.max(0,i-1)],b=points[closed?(i+1)%n:Math.min(n-1,i+1)];
    const dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy)||1;
    const nx=-dy/length*18,ny=dx/length*18;
    left.push({x:p.x+nx,y:p.y+ny});right.push({x:p.x-nx,y:p.y-ny});
  }
  return [left,right];
}
function rebuild(){
  geometry=paths.flatMap(p=>(p.type==='track'?rails(p.points,p.closed):[p.points])
    .map(points=>({points,closed:p.closed,type:p.type,id:p.id})));
  world.setSegments(geometry.flatMap(p=>segmentsOf(p.points,p.closed)));
}
function nearestEnd(p,excludeId=null){
  let nearest=null,best=24;
  for(const path of paths){
    if(path.type!=='track'||path.closed||path.id===excludeId)continue;
    for(const index of [0,path.points.length-1]){
      const d=distance(p,path.points[index]);
      if(d<best){best=d;nearest={path,index,p:point(path.points[index])};}
    }
  }
  return nearest;
}
function commitStroke(g){
  if(g.points.length<2)return false;
  const length=g.points.reduce((n,p,i)=>n+(i?distance(p,g.points[i-1]):0),0);
  if(length<8)return false;
  let pts=g.points.map(point),closed=false;
  if(length>100&&distance(pts[0],pts[pts.length-1])<24){pts.pop();closed=pts.length>3;}
  if(g.mode==='track'&&!closed){
    const start=g.startSnap,end=nearestEnd(pts[pts.length-1]);
    if(end)pts[pts.length-1]=point(end.p);
    if(start&&end&&start.path.id===end.path.id&&start.index!==end.index){
      const old=start.index===0?[...start.path.points].reverse():start.path.points;
      pts=[...old,...pts.slice(1,-1)];closed=true;
      paths=paths.filter(p=>p.id!==start.path.id);
    }else{
      if(start){
        const old=start.index===0?[...start.path.points].reverse():start.path.points;
        pts=[...old,...pts.slice(1)];paths=paths.filter(p=>p.id!==start.path.id);
      }
      if(end&&(!start||end.path.id!==start.path.id)){
        const old=end.index===0?end.path.points:[...end.path.points].reverse();
        pts=[...pts,...old.slice(1)];paths=paths.filter(p=>p.id!==end.path.id);
      }
    }
  }
  paths.push({id:pathId++,type:g.mode,points:smooth(pts,closed),closed});rebuild();return true;
}
function toWorld(e){
  const rect=cnv.elt.getBoundingClientRect();
  return {x:(e.clientX-rect.left-view.x)/view.scale,y:(e.clientY-rect.top-view.y)/view.scale};
}
function inside(p){return p.x>=0&&p.y>=0&&p.x<=world.width&&p.y<=world.height;}
function setupPointer(){
  const canvas=cnv.elt;
  canvas.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||e.button!==0||gesture)return;
    const p=toWorld(e);if(!inside(p))return;e.preventDefault();canvas.setPointerCapture(e.pointerId);
    const snap=mode==='track'?nearestEnd(p):null;
    gesture={id:e.pointerId,mode,points:[snap?snap.p:p],p,startSnap:snap,before:snapshot(),changed:false,lastSpawn:0};
    if(mode==='ball')spawnAt(p);else if(mode==='erase')eraseAt(p);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!e.isPrimary)return;
    hover=toWorld(e);if(!gesture||gesture.id!==e.pointerId)return;e.preventDefault();
    const samples=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[];
    for(const sample of (samples.length?samples:[e])){
      const p=toWorld(sample);if(!inside(p))continue;gesture.p=p;
      if(gesture.mode==='line'||gesture.mode==='track'){
        const last=gesture.points[gesture.points.length-1];
        if(distance(last,p)>=5&&gesture.points.length<1500)gesture.points.push(p);
      }else if(gesture.mode==='erase')eraseAt(p);
    }
  });
  canvas.addEventListener('pointerup',e=>{
    if(gesture?.id!==e.pointerId)return;
    const p=toWorld(e);
    if(inside(p)&&(gesture.mode==='line'||gesture.mode==='track')&&distance(p,gesture.points.at(-1))>1)gesture.points.push(p);
    finishGesture();
  });
  canvas.addEventListener('pointercancel',()=>finishGesture(true));
  canvas.addEventListener('lostpointercapture',()=>{if(gesture)finishGesture(true);});
  canvas.addEventListener('pointerleave',()=>hover=null);
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  document.addEventListener('visibilitychange',()=>{clock.reset();if(document.hidden)finishGesture(true);});
  window.addEventListener('blur',()=>{finishGesture(true);clock.reset();});
}
function finishGesture(cancel=false){
  if(!gesture)return;
  const g=gesture;gesture=null;
  if(!cancel&&(g.mode==='line'||g.mode==='track')){
    if(paths.reduce((n,p)=>n+p.points.length,0)+g.points.length>MAX_POINTS){toast('Drawing limit reached — erase a few lines first.');}
    else g.changed=commitStroke(g);
  }
  // Pouring/erasing already changed the world even when touch is interrupted.
  if(g.changed)remember(g.before);
  if(cnv?.elt.hasPointerCapture(g.id))cnv.elt.releasePointerCapture(g.id);
}
function spawnAt(p){
  if(world.balls.length>=MAX_BALLS){if(gesture&&!gesture.limitShown){toast('500 marbles — clear some to make room.');gesture.limitShown=true;}return;}
  if(!world.canSpawn(p.x,p.y))return;
  world.addBall(p.x,p.y,{hue:COLORS[hueIndex++%COLORS.length],vx:(Math.random()-.5)*.5});
  if(gesture)gesture.changed=true;
}
function segmentDistance(s,p){
  const dx=s.bx-s.ax,dy=s.by-s.ay;
  const t=Math.max(0,Math.min(1,((p.x-s.ax)*dx+(p.y-s.ay)*dy)/(dx*dx+dy*dy||1)));
  return Math.hypot(p.x-s.ax-dx*t,p.y-s.ay-dy*t);
}
function eraseAt(p){
  const ball=world.balls.findLastIndex(b=>distance(p,b.pos)<b.r+10/view.scale);
  if(ball>=0){world.balls.splice(ball,1);gesture.changed=true;return;}
  let best=null,bestD=14/view.scale;
  for(const line of geometry)for(const seg of segmentsOf(line.points,line.closed)){
    const d=segmentDistance(seg,p);if(d<bestD){bestD=d;best=line.id;}
  }
  if(best!==null){paths=paths.filter(path=>path.id!==best);rebuild();gesture.changed=true;}
}
function boom(){
  finishGesture();if(!world.balls.length){toast('Add some marbles first.');return;}remember();
  const b=world.balls.splice(Math.floor(Math.random()*world.balls.length),1)[0];
  for(const other of world.balls){
    const dx=other.pos.x-b.pos.x,dy=other.pos.y-b.pos.y,d=Math.hypot(dx,dy);
    if(d<140){const force=40*(1-d/140)**2;other.vel.x+=dx/(d||1)*force;other.vel.y+=dy/(d||1)*force;}
  }
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)for(let i=0;i<30;i++){
    const angle=Math.random()*Math.PI*2,speed=2+Math.random()*4;
    particles.push({x:b.pos.x,y:b.pos.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,hue:b.hue});
  }
}
function makePreset(name){
  paths=[];world.balls=[];particles=[];
  // Loading a starter deliberately uses the current viewport; resizing only fits it.
  world.width=Math.max(320,width);world.height=Math.max(350,height);
  const w=world.width,h=world.height;
  if(name==='bowl'){
    const left=w*.14,right=w*.86,top=h*.30,bottom=h*.90,curve=Math.min(w*.15,h*.17);
    const pts=[{x:left,y:top},{x:left,y:bottom-curve}];
    for(let i=1;i<=16;i++){const a=Math.PI-i/16*Math.PI/2;pts.push({x:left+curve+Math.cos(a)*curve,y:bottom-curve+Math.sin(a)*curve});}
    pts.push({x:right-curve,y:bottom});
    for(let i=1;i<=16;i++){const a=Math.PI/2-i/16*Math.PI/2;pts.push({x:right-curve+Math.cos(a)*curve,y:bottom-curve+Math.sin(a)*curve});}
    pts.push({x:right,y:top});paths.push({id:pathId++,type:'line',points:pts,closed:false});
  }else if(name==='run'){
    for(let i=0;i<3;i++){
      const y=h*(.25+i*.20),reverse=i%2;
      paths.push({id:pathId++,type:'line',closed:false,points:reverse?[{x:w*.91,y},{x:w*.18,y:y+h*.09}]:[{x:w*.09,y},{x:w*.82,y:y+h*.09}]});
    }
    paths.push({id:pathId++,type:'line',closed:false,points:[{x:w*.1,y:h*.82},{x:w*.1,y:h*.94},{x:w*.9,y:h*.94},{x:w*.9,y:h*.82}]});
  }
  rebuild();fitView();clock.reset();
  if(name!=='empty')for(let row=0;row<3;row++)for(let col=0;col<6;col++){
    const x=w/2+(col-2.5)*26,y=35+row*26;
    if(world.canSpawn(x,y))world.addBall(x,y,{hue:COLORS[hueIndex++%COLORS.length]});
  }
}
function validateScene(data){
  const finite=(n,lo,hi)=>typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi;
  if(!data||data.version!==2||!finite(data.width,100,10000)||!finite(data.height,100,10000)||!Array.isArray(data.paths)||!Array.isArray(data.balls)||data.paths.length>1000||data.balls.length>MAX_BALLS)throw Error('Invalid scene');
  let total=0,totalLength=0;const ids=new Set();
  for(const p of data.paths){
    if(!Number.isSafeInteger(p.id)||ids.has(p.id)||!['line','track'].includes(p.type)||typeof p.closed!=='boolean'||!Array.isArray(p.points)||p.points.length<2)throw Error('Invalid path');
    ids.add(p.id);total+=p.points.length;
    for(let i=0;i<p.points.length;i++){
      const q=p.points[i];
      if(!finite(q.x,0,data.width)||!finite(q.y,0,data.height))throw Error('Invalid point');
      if(i)totalLength+=distance(q,p.points[i-1]);
    }
  }
  if(total>MAX_POINTS||totalLength>500000)throw Error('Scene too large');
  ids.clear();
  for(const b of data.balls){
    if(!Number.isSafeInteger(b.id)||ids.has(b.id)||!finite(b.x,-10000,20000)||!finite(b.y,-10000,20000)||!finite(b.vx,-100,100)||!finite(b.vy,-100,100)||b.radius!==12||!finite(b.hue,0,360))throw Error('Invalid marble');
    ids.add(b.id);
  }
  return data;
}
function setupUI(){
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  $('btnPause').onclick=togglePause;$('btnUndo').onclick=undo;$('btnRedo').onclick=redo;$('btnBoom').onclick=boom;
  $('btnSpeed').onclick=()=>{world.boost=!world.boost;syncUI();};
  $('btnMore').onclick=()=>{finishGesture();$('menu').showModal();clock.reset();};
  $('btnClose').onclick=()=>$('menu').close();$('menu').addEventListener('close',()=>clock.reset());
  $('timeScale').onchange=e=>{rate=Number(e.target.value);clock.reset();syncUI();};
  $('btnPreset').onclick=()=>{remember();makePreset($('preset').value);$('menu').close();toast('Scene loaded. Undo brings your previous scene back.');};
  $('btnClearBalls').onclick=()=>{remember();world.balls=[];particles=[];$('menu').close();};
  $('btnClear').onclick=()=>{remember();makePreset('empty');$('menu').close();};
  $('btnBackBall').onclick=()=>{if(world.balls.length){remember();world.balls.pop();}$('menu').close();};
  for(const type of ['Line','Track'])$('btnBack'+type).onclick=()=>{
    const index=paths.findLastIndex(p=>p.type===type.toLowerCase());
    if(index>=0){remember();paths.splice(index,1);rebuild();}$('menu').close();
  };
  $('btnSave').onclick=()=>{
    try{localStorage.setItem(SAVE_KEY,JSON.stringify(snapshot()));toast('Scene saved on this device.');$('menu').close();}
    catch{toast('This browser could not save. Try Export scene.');}
  };
  $('btnLoad').onclick=()=>{
    try{const raw=localStorage.getItem(SAVE_KEY);if(!raw){toast('No saved scene on this device yet.');return;}
      const data=validateScene(JSON.parse(raw));remember();restore(data);$('menu').close();toast('Saved scene restored.');}
    catch{toast('The saved scene could not be read.');}
  };
  $('btnExport').onclick=()=>{
    const blob=new Blob([JSON.stringify(snapshot())],{type:'application/json'}),url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='marble-scene.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  };
  $('btnImport').onclick=()=>$('loadFile').click();
  $('loadFile').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try{if(file.size>2_000_000)throw Error('Too large');const data=validateScene(JSON.parse(await file.text()));remember();restore(data);$('menu').close();toast('Scene imported.');}
    catch{toast('Choose a valid exported Marble scene (up to 2 MB).');}finally{e.target.value='';}
  };
  document.addEventListener('keydown',e=>{
    if($('menu').open||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
    const key=e.key.toLowerCase();
    if((e.ctrlKey||e.metaKey)&&key==='z'){e.preventDefault();e.shiftKey?redo():undo();return;}
    if((e.ctrlKey||e.metaKey)&&key==='y'){e.preventDefault();redo();return;}
    if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
    if(key===' '){e.preventDefault();togglePause();}
    else if('1234'.includes(key)&&key.length===1)setMode(['line','track','ball','erase'][Number(key)-1]);
    else if(key==='b')boom();else if(key==='s')$('btnSpeed').click();else if(key==='escape')finishGesture(true);
  });
}
function sprite(hue){
  if(sprites.has(hue))return sprites.get(hue);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d');
  const gradient=c.createRadialGradient(23,20,2,32,32,26);
  gradient.addColorStop(0,'#fff');gradient.addColorStop(.16,`hsl(${hue} 92% 83%)`);gradient.addColorStop(.43,`hsl(${hue} 85% 60%)`);gradient.addColorStop(.82,`hsl(${hue} 75% 38%)`);gradient.addColorStop(1,`hsl(${hue} 78% 19%)`);
  c.fillStyle=gradient;c.beginPath();c.arc(32,32,25,0,Math.PI*2);c.fill();
  c.strokeStyle=`hsl(${hue} 85% 79% / .6)`;c.lineWidth=1;c.stroke();
  c.beginPath();c.ellipse(24,20,6,3,-.5,0,Math.PI*2);c.fillStyle='#ffffffa8';c.fill();
  sprites.set(hue,canvas);return canvas;
}
function strokePath(c,points,closed,color,dashed=false){
  if(points.length<2)return;
  c.beginPath();c.moveTo(points[0].x,points[0].y);for(let i=1;i<points.length;i++)c.lineTo(points[i].x,points[i].y);
  if(closed)c.closePath();c.lineWidth=3;c.strokeStyle=color;c.setLineDash(dashed?[5,6]:[]);c.stroke();c.setLineDash([]);
}
function draw(){
  if(!world)return;
  const seconds=Math.min(deltaTime/1000,.1),menuOpen=$('menu').open;
  if(!paused&&!document.hidden&&!menuOpen)clock.advance(seconds,rate);else clock.reset();
  if(gesture?.mode==='ball'&&!menuOpen){
    gesture.lastSpawn+=seconds;if(gesture.lastSpawn>=.09){spawnAt(gesture.p);gesture.lastSpawn=0;}
  }
  const c=drawingContext;c.save();c.fillStyle='#0b111b';c.fillRect(0,0,width,height);
  c.translate(view.x,view.y);c.scale(view.scale,view.scale);
  c.beginPath();c.rect(0,0,world.width,world.height);c.clip();
  c.fillStyle='#263546';
  for(let x=20;x<world.width;x+=32)for(let y=20;y<world.height;y+=32)c.fillRect(x,y,1,1);
  c.lineCap='round';c.lineJoin='round';
  for(const p of geometry)strokePath(c,p.points,p.closed,p.type==='track'?'#77decd':'#c9d8e8');
  if(gesture&&(gesture.mode==='line'||gesture.mode==='track')){
    const pts=gesture.points;
    for(const points of gesture.mode==='track'?rails(pts):[pts])strokePath(c,points,false,'#77f2ce',true);
    if(pts.length>3){const target=gesture.mode==='track'?nearestEnd(pts.at(-1)):null;
      const snap=target?.p||(distance(pts[0],pts.at(-1))<24?pts[0]:null);
      if(snap){c.beginPath();c.arc(snap.x,snap.y,9,0,Math.PI*2);c.strokeStyle='#77f2ce';c.lineWidth=2;c.stroke();}}
  }
  for(const b of world.balls){const size=b.r*2*64/50;c.drawImage(sprite(b.hue),b.pos.x-size/2,b.pos.y-size/2,size,size);}
  for(const p of particles){
    if(!paused&&!menuOpen){p.x+=p.vx*seconds*60;p.y+=p.vy*seconds*60;p.life-=seconds*1.8;}
    c.globalAlpha=Math.max(0,p.life);c.fillStyle=`hsl(${p.hue} 100% 75%)`;c.beginPath();c.arc(p.x,p.y,2,0,Math.PI*2);c.fill();
  }
  particles=particles.filter(p=>p.life>0);c.globalAlpha=1;
  if(hover&&mode==='erase'&&inside(hover)){c.beginPath();c.arc(hover.x,hover.y,14/view.scale,0,Math.PI*2);c.strokeStyle='#ffcb7c';c.lineWidth=1/view.scale;c.stroke();}
  c.restore();
  if(lastCount!==world.balls.length){lastCount=world.balls.length;$('counter').textContent=lastCount+' marble'+(lastCount===1?'':'s')+' / '+MAX_BALLS;}
}
if(typeof window.p5==='undefined'||typeof window.MarblePhysics==='undefined'){
  $('hint').textContent='The game could not load. Refresh the page to try again.';
}
