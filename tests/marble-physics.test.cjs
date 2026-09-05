'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {World,Clock}=require('../marble-physics.js');
const wall=(ax,ay,bx,by)=>({ax,ay,bx,by});
function finite(world){for(const b of world.balls)for(const n of [b.pos.x,b.pos.y,b.vel.x,b.vel.y])assert.ok(Number.isFinite(n),'finite state');}

test('a fast marble cannot tunnel through a thin wall from either side',()=>{
  for(const direction of [-1,1]){
    const w=new World();w.gravity=0;w.setSegments([wall(0,400,800,400)]);
    const b=w.addBall(400,400-direction*100);w.move(b,0,direction*300,true);
    assert.ok(direction*(b.pos.y-400)<=-13.49);
  }
});
test('swept endpoint and acute corner contacts do not leak',()=>{
  const w=new World();w.setSegments([wall(200,300,400,300),wall(400,300,480,100)]);
  const b=w.addBall(100,300);w.move(b,350,0,true);assert.ok(b.pos.x<187);
  const c=w.addBall(360,200);for(let i=0;i<100;i++){w.move(c,10,15);finite(w);}
  assert.ok(c.pos.y<=286.51,'stays above floor');
});
test('marble separation cannot push a neighbour through a wall',()=>{
  const w=new World();w.gravity=0;w.setSegments([wall(0,200,800,200)]);
  const lower=w.addBall(400,186.49);w.addBall(400,170);
  for(let i=0;i<100;i++)w.step();assert.ok(lower.pos.y<=186.51);finite(w);
});
test('coincident marbles separate without NaNs',()=>{
  const w=new World();w.gravity=0;w.addBall(400,400);w.addBall(400,400);
  for(let i=0;i<10;i++)w.step();finite(w);
  assert.ok(Math.hypot(w.balls[0].pos.x-w.balls[1].pos.x,w.balls[0].pos.y-w.balls[1].pos.y)>23.9);
});
test('300 marbles remain in a deep bowl under sustained pressure',()=>{
  const w=new World({width:600,height:1200});
  w.setSegments([wall(100,50,100,1100),wall(100,1100,500,1100),wall(500,1100,500,50)]);
  for(let row=0;row<25;row++)for(let col=0;col<12;col++)w.addBall(155+col*24,480+row*24);
  for(let i=0;i<1200;i++){
    w.step();
    for(const b of w.balls){
      assert.ok(b.pos.x>=113.48&&b.pos.x<=486.52,'no side leak');
      assert.ok(b.pos.y<=1086.52,'no floor leak');
    }
  }
  finite(w);assert.equal(w.balls.length,300,'no marbles disappeared');
  let overlap=0;
  for(let i=0;i<w.balls.length;i++){
    const a=w.balls[i];
    assert.ok(Math.hypot(a.vel.x,a.vel.y)<0.1,'pile settles without stored downward velocity');
    for(let j=i+1;j<w.balls.length;j++){
      const b=w.balls[j];overlap=Math.max(overlap,24-Math.hypot(a.pos.x-b.pos.x,a.pos.y-b.pos.y));
    }
  }
  assert.ok(overlap<0.35,'pile does not visibly compress');
  assert.ok(Math.min(...w.balls.map(b=>b.pos.y))>400,'support impulses do not launch the pile');
});
test('curved segmented bowl contains 200 marbles and repeated impulses',()=>{
  const w=new World({width:600,height:1000});const segments=[wall(100,0,100,700),wall(500,700,500,0),wall(100,0,500,0)];
  let previous={x:100,y:700};
  for(let i=1;i<=48;i++){
    const a=Math.PI-i/48*Math.PI,p={x:300+200*Math.cos(a),y:700+200*Math.sin(a)};
    segments.push(wall(previous.x,previous.y,p.x,p.y));previous=p;
  }
  w.setSegments(segments);
  for(let row=0;row<20;row++)for(let col=0;col<10;col++)w.addBall(185+col*24,190+row*24);
  for(let i=0;i<600;i++){
    if(i%120===0)for(let j=0;j<w.balls.length;j++){const b=w.balls[j];b.vel.x=Math.sin(j*1.7)*35;b.vel.y=Math.cos(j*2.3)*35;}
    w.step();
    for(const b of w.balls){
      if(b.pos.y<700)assert.ok(b.pos.x>=113.45&&b.pos.x<=486.55,'vertical sides at step '+i+': '+JSON.stringify(b));
      else assert.ok(Math.hypot(b.pos.x-300,b.pos.y-700)<186.6,'curved floor');
    }
  }
  finite(w);assert.equal(w.balls.length,200);
});
test('clock gives the same physics at 30, 60 and 144 Hz; tab resumes have bounded work',()=>{
  function run(hz){
    const w=new World({height:5000});w.addBall(100,100,{vx:2});const clock=new Clock(dt=>w.step(dt));
    for(let i=0;i<hz*2;i++)clock.advance(1/hz);
    return [w.balls[0].pos.x,w.balls[0].pos.y];
  }
  const expected=run(60);for(const hz of [30,144])run(hz).forEach((n,i)=>assert.ok(Math.abs(n-expected[i])<1e-6));
  let calls=0;const clock=new Clock(()=>calls++);clock.advance(3600);assert.ok(calls<=12);clock.reset();assert.equal(clock.debt,0);
});
test('spawning rejects overlaps with marbles and walls',()=>{
  const w=new World();w.setSegments([wall(0,300,800,300)]);w.addBall(200,200);
  assert.equal(w.canSpawn(200,200),false);assert.equal(w.canSpawn(200,295),false);assert.equal(w.canSpawn(250,200),true);
});
test('Speed mode stays contained in a closed box',()=>{
  const w=new World({width:600,height:800});w.boost=true;
  w.setSegments([wall(100,50,500,50),wall(500,50,500,700),wall(500,700,100,700),wall(100,700,100,50)]);
  for(let i=0;i<100;i++)w.addBall(150+i%10*28,150+Math.floor(i/10)*28,{vx:Math.sin(i)*5,vy:Math.cos(i)*5});
  for(let i=0;i<240;i++){w.step();for(const b of w.balls)assert.ok(b.pos.x>=113.45&&b.pos.x<=486.55&&b.pos.y>=63.45&&b.pos.y<=686.55);}
  finite(w);assert.equal(w.balls.length,100);
});
test('long diagonal wall indexing grows with length and still detects hits',()=>{
  const w=new World({width:10000,height:10000});w.setSegments([wall(0,0,10000,10000)]);
  assert.ok(w.walls.cells.size<1500);
  const b=w.addBall(5000,4900);w.move(b,0,200);
  assert.ok((b.pos.x-b.pos.y)/Math.SQRT2>=13.49,'slides along the original side of the diagonal');
});
