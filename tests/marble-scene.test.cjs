'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const physics=require('../marble-physics');
// Lightweight host only: exercises scene/input logic, not browser layout or rendering quality.
function host(w=390,h=620){
  const elements=new Map(),events=new Map();
  const ctx2d=new Proxy({createRadialGradient:()=>({addColorStop(){}})}, {get:(o,k)=>o[k]||(()=>{})});
  function el(id){if(!elements.has(id))elements.set(id,{clientWidth:w,clientHeight:h,style:{},dataset:{},classList:{add(){},remove(){}},open:false,
    setAttribute(){},addEventListener(name,fn){events.set(id+':'+name,fn);},showModal(){this.open=true;},close(){this.open=false;},
    click(){this.onclick?.();},getContext:()=>ctx2d,getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){},hasPointerCapture:()=>false});return elements.get(id);}
  const env={console,MarblePhysics:physics,document:{getElementById:el,querySelectorAll:()=>[],addEventListener(){},createElement:()=>el('generated'),hidden:false},
    window:{p5:{},devicePixelRatio:2,matchMedia:()=>({matches:true}),addEventListener(){}},ResizeObserver:class{observe(){}},
    pixelDensity(){},createCanvas:(width,height)=>{env.width=width;env.height=height;return{elt:el('canvas'),parent(){}};},
    resizeCanvas:(w,h)=>{env.width=w;env.height=h;},drawingContext:ctx2d,deltaTime:1000/60,setTimeout:()=>0,clearTimeout(){},
    localStorage:{getItem(){return this.saved||null;},setItem(k,v){this.saved=v;}}};
  vm.createContext(env);vm.runInContext(fs.readFileSync(require.resolve('../marble.js'),'utf8'),env);// p5's global-mode startup assigns its own smooth() after loading the sketch.
  env.smooth=()=>({renderer:'p5'});
  vm.runInContext('setup()',env);
  return {run:s=>vm.runInContext(s,env),events,el,env};
}
test('scene boots and runs its draw loop at portrait and desktop sizes',()=>{
  for(const [width,height]of[[320,420],[390,620],[1440,800]]){
    const h=host(width,height);h.run('for(let i=0;i<10;i++)draw()');
    assert.ok(h.run('world.balls.length')>0);assert.ok(h.run('view.scale')>0);
  }
});
test('portrait fit preserves geometry and ball coordinates during rotation',()=>{
  const h=host();const before=h.run('JSON.stringify(snapshot())');
  h.run('width=844;height=250;fitView()');
  assert.equal(h.run('JSON.stringify(snapshot())'),before);
  assert.ok(h.run('world.width*view.scale<=width && world.height*view.scale<=height'));
});
test('track extension becomes one object; erasing a standalone line leaves its rails intact',()=>{
  const h=host();h.run(`makePreset('empty');paths=[{id:1,type:'track',closed:false,points:[{x:60,y:100},{x:160,y:100}]},{id:2,type:'line',closed:false,points:[{x:10,y:400},{x:200,y:400}]}];pathId=3;rebuild();
    const before=snapshot();commitStroke({mode:'track',points:[{x:160,y:100},{x:220,y:130},{x:300,y:180}],startSnap:nearestEnd({x:160,y:100})});remember(before);`);
  assert.equal(h.run("paths.filter(p=>p.type==='track').length"),1);
  h.el('btnBackLine').onclick();assert.equal(h.run('paths.length'),1);assert.equal(h.run('geometry.length'),2);
  h.run('undo()');assert.equal(h.run('paths.length'),2);
  h.run('undo()');assert.equal(h.run("paths.find(p=>p.type==='track').points.length"),2);
});
test('closed track rails have explicit closure with no duplicate zero-length seam',()=>{
  const h=host();h.run(`makePreset('empty');commitStroke({mode:'track',points:[{x:100,y:100},{x:230,y:100},{x:240,y:260},{x:100,y:260},{x:101,y:101}],startSnap:null});`);
  assert.equal(h.run('paths[0].closed'),true);
  assert.equal(h.run('world.segments.length'),h.run('paths[0].points.length*2'));
  assert.ok(h.run('world.segments.every(s=>s.len>0)'));
});
test('save/load and undo/redo retain the complete scene',()=>{
  const h=host();const before=h.run('JSON.stringify(snapshot())');
  h.el('btnSave').onclick();h.el('btnClear').onclick();assert.equal(h.run('paths.length'),0);
  h.el('btnLoad').onclick();assert.equal(h.run('JSON.stringify(snapshot())'),before);
  h.run('undo()');assert.equal(h.run('paths.length'),0);h.run('redo()');assert.equal(h.run('JSON.stringify(snapshot())'),before);
});
test('import validation rejects non-finite state, duplicate IDs, malformed geometry and excess balls',()=>{
  const h=host();
  for(const mutation of ['d.width=Infinity','d.paths[0].points[0].x=null','d.balls[0].vx="0"','d.balls[1].id=d.balls[0].id','d.balls=Array(501).fill(d.balls[0])'])
    assert.throws(()=>h.run(`{const d=snapshot();${mutation};validateScene(d)}`));
});
test('cancelled touch records already-poured marbles as one undoable action',()=>{
  const h=host();h.run("makePreset('empty');setMode('ball')");
  h.events.get('canvas:pointerdown')({isPrimary:true,button:0,clientX:150,clientY:100,pointerId:7,preventDefault(){}});
  assert.equal(h.run('world.balls.length'),1);h.events.get('canvas:pointercancel')();
  h.run('undo()');assert.equal(h.run('world.balls.length'),0);assert.equal(h.run('gesture'),null);
});

test('pointer strokes commit both lines and tracks with p5 globals installed',()=>{
  for(const mode of ['line','track']){
    const h=host();h.run("makePreset('empty');setMode('"+mode+"')");
    const event=(x,y)=>({isPrimary:true,button:0,clientX:x,clientY:y,pointerId:1,preventDefault(){}});
    h.events.get('canvas:pointerdown')(event(60,180));
    h.events.get('canvas:pointermove')(event(120,220));
    h.events.get('canvas:pointermove')(event(210,240));
    h.events.get('canvas:pointerup')(event(260,260));
    assert.equal(h.run('paths.length'),1);
    assert.ok(h.run('Array.isArray(paths[0].points)'));
    assert.ok(h.run('world.segments.length')>0);
    h.run('draw();undo();draw();redo();draw()');
    assert.equal(h.run('paths.length'),1);
  }
});

test('starter marbles vary between loads without overlapping walls or each other',()=>{
  for(const [width,height] of [[320,350],[390,620],[1440,800]]){
    const h=host(width,height);const first=h.run('JSON.stringify(snapshot().balls.map(b=>[b.x,b.y]))');
    assert.equal(h.run('world.balls.length'),18);
    h.run("makePreset('bowl')");
    assert.notEqual(h.run('JSON.stringify(snapshot().balls.map(b=>[b.x,b.y]))'),first);
    assert.equal(h.run('world.balls.length'),18);
    assert.ok(h.run(`world.balls.every((a,i)=>world.balls.every((b,j)=>i===j||distance(a.pos,b.pos)>=a.r+b.r))`));
    assert.ok(h.run(`world.balls.every(b=>world.segments.every(s=>segmentDistance(s,b.pos)>=b.r+MarblePhysics.WALL_RADIUS))`));
  }
});

test('sketch helper functions do not collide with the bundled p5 API',()=>{
  const api=new Set([...fs.readFileSync(require.resolve('../P5.js'),'utf8').matchAll(/prototype\.([A-Za-z_$][\w$]*)\s*=/g)].map(m=>m[1]));
  const helpers=[...fs.readFileSync(require.resolve('../marble.js'),'utf8').matchAll(/^function (\w+)\(/gm)].map(m=>m[1]);
  assert.deepEqual(helpers.filter(name=>api.has(name)&&!['setup','draw'].includes(name)),[]);
});
