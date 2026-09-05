/* Marble physics. Units: CSS/world pixels and nominal 60 Hz frames.
 * The solver is independent of p5 and the DOM so containment can be stress-tested.
 */
(function (root) {
  'use strict';
  const EPS = 1e-7, SKIN = 0.015, WALL_RADIUS = 1.5;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  function closest(s, x, y) {
    const t = clamp(((x-s.ax)*s.dx+(y-s.ay)*s.dy)/s.len2, 0, 1);
    return {x:s.ax+s.dx*t, y:s.ay+s.dy*t};
  }
  class Grid {
    constructor(size) { this.size=size; this.cells=new Map(); }
    clear() { this.cells.clear(); }
    insert(value, x0,y0,x1=x0,y1=y0) {
      const k=this.size;
      for(let x=Math.floor(x0/k); x<=Math.floor(x1/k); x++)
        for(let y=Math.floor(y0/k); y<=Math.floor(y1/k); y++) {
          const key=x+','+y, list=this.cells.get(key);
          if(list) list.push(value); else this.cells.set(key,[value]);
        }
    }
    query(x0,y0,x1,y1) {
      const found=new Set(), k=this.size;
      for(let x=Math.floor(x0/k); x<=Math.floor(x1/k); x++)
        for(let y=Math.floor(y0/k); y<=Math.floor(y1/k); y++) {
          const list=this.cells.get(x+','+y);
          if(list) for(const v of list) found.add(v);
        }
      return found;
    }
  }
  // Earliest moving-circle hit against a capsule, including both round end caps.
  function sweep(s, x,y, dx,dy, radius) {
    let hit=null;
    function accept(t,nx,ny) {
      if(t>=-EPS && t<=1+EPS && dx*nx+dy*ny < -EPS && (!hit || t<hit.t))
        hit={t:clamp(t,0,1),nx,ny};
    }
    const nx=-s.dy/s.len, ny=s.dx/s.len;
    const d=(x-s.ax)*nx+(y-s.ay)*ny, v=dx*nx+dy*ny;
    if(Math.abs(v)>EPS) for(const side of [-1,1]) {
      const t=(side*radius-d)/v;
      if(t>=-EPS && t<=1+EPS) {
        const u=((x+dx*t-s.ax)*s.dx+(y+dy*t-s.ay)*s.dy)/s.len2;
        if(u>=0 && u<=1) accept(t,nx*side,ny*side);
      }
    }
    const a=dx*dx+dy*dy;
    if(a>EPS) for(const [cx,cy] of [[s.ax,s.ay],[s.bx,s.by]]) {
      const ox=x-cx, oy=y-cy, b=ox*dx+oy*dy, c=ox*ox+oy*oy-radius*radius;
      const disc=b*b-a*c;
      if(disc>=0) {
        const t=(-b-Math.sqrt(disc))/a;
        const hx=x+dx*t-cx, hy=y+dy*t-cy, h=Math.hypot(hx,hy)||1;
        accept(t,hx/h,hy/h);
      }
    }
    return hit;
  }
  class World {
    constructor({width=800,height=800,iterations=10}={}) {
      this.width=width; this.height=height; this.iterations=iterations;
      this.balls=[]; this.segments=[]; this.walls=new Grid(64); this.pairs=new Grid(32);
      this.contacts=new Map(); this.activeContacts=new Map(); this.lastH=0.5;
      this.gravity=0.3; this.boost=false; this.nextId=1;
    }
    setSegments(segments) {
      this.contacts.clear();
      this.walls.clear(); this.segments=[];
      for(const input of segments) {
        const s={...input}; s.dx=s.bx-s.ax; s.dy=s.by-s.ay;
        s.len2=s.dx*s.dx+s.dy*s.dy; if(s.len2<EPS) continue;
        s.len=Math.sqrt(s.len2); this.segments.push(s);
        // Index short bounding boxes along the segment rather than its full AABB;
        // a long diagonal should cost O(length), not fill an entire screen of cells.
        const chunks=Math.max(1,Math.ceil(s.len/this.walls.size));
        for(let i=0;i<chunks;i++) {
          const ax=s.ax+s.dx*i/chunks,ay=s.ay+s.dy*i/chunks;
          const bx=s.ax+s.dx*(i+1)/chunks,by=s.ay+s.dy*(i+1)/chunks;
          this.walls.insert(s,Math.min(ax,bx)-WALL_RADIUS,Math.min(ay,by)-WALL_RADIUS,
            Math.max(ax,bx)+WALL_RADIUS,Math.max(ay,by)+WALL_RADIUS);
        }
      }
      // Newly drawn walls may overlap existing marbles; recover before sweeping.
      for(const b of this.balls) this.recover(b);
    }
    addBall(x,y,{radius=12,vx=0,vy=0,hue=200,id}={}) {
      const b={id:id??this.nextId++,pos:{x,y},vel:{x:vx,y:vy},r:radius,hue};
      this.nextId=Math.max(this.nextId,b.id+1); this.balls.push(b); return b;
    }
    canSpawn(x,y,r=12) {
      if(x<r || y<r || x>this.width-r || y>this.height-r) return false;
      for(const b of this.balls) if(Math.hypot(x-b.pos.x,y-b.pos.y)<r+b.r+0.2) return false;
      for(const s of this.walls.query(x-r-2,y-r-2,x+r+2,y+r+2)) {
        const p=closest(s,x,y); if(Math.hypot(x-p.x,y-p.y)<r+WALL_RADIUS+SKIN) return false;
      }
      return true;
    }
    recover(b) {
      const r=b.r+WALL_RADIUS;
      for(let pass=0;pass<6;pass++) {
        let changed=false;
        for(const s of this.walls.query(b.pos.x-r,b.pos.y-r,b.pos.x+r,b.pos.y+r)) {
          const p=closest(s,b.pos.x,b.pos.y), dx=b.pos.x-p.x,dy=b.pos.y-p.y;
          const d=Math.hypot(dx,dy);
          if(d>r+SKIN*2) continue;
          const nx=d>EPS?dx/d:-s.dy/s.len, ny=d>EPS?dy/d:s.dx/s.len;
          this.wallVelocity(b,nx,ny,false);
          if(d<r-SKIN*0.25) {
            b.pos.x+=nx*(r-d+SKIN); b.pos.y+=ny*(r-d+SKIN); changed=true;
          }
        }
        if(!changed) break;
      }
    }
    wallVelocity(b,nx,ny,bounce) {
      const vn=b.vel.x*nx+b.vel.y*ny;
      if(vn<0) {
        // No restitution for resting contact: bouncing every frame destabilises piles.
        const e=bounce && vn < -1.2 ? 0.25 : 0;
        b.vel.x-=(1+e)*vn*nx; b.vel.y-=(1+e)*vn*ny;
      }
    }
    move(b,dx,dy,bounce=false) {
      const r=b.r+WALL_RADIUS;
      for(let pass=0;pass<5 && dx*dx+dy*dy>EPS*EPS;pass++) {
        let first=null;
        for(const s of this.walls.query(Math.min(b.pos.x,b.pos.x+dx)-r,Math.min(b.pos.y,b.pos.y+dy)-r,
          Math.max(b.pos.x,b.pos.x+dx)+r,Math.max(b.pos.y,b.pos.y+dy)+r)) {
          const hit=sweep(s,b.pos.x,b.pos.y,dx,dy,r);
          if(hit && (!first || hit.t<first.t)) first=hit;
        }
        if(!first) { b.pos.x+=dx; b.pos.y+=dy; return; }
        b.pos.x+=dx*first.t+first.nx*SKIN; b.pos.y+=dy*first.t+first.ny*SKIN;
        const remain=1-first.t;
        dx*=remain; dy*=remain;
        const vn=dx*first.nx+dy*first.ny;
        if(vn<0) { dx-=vn*first.nx; dy-=vn*first.ny; }
        this.wallVelocity(b,first.nx,first.ny,bounce);
      }
      // If several simultaneous contacts exhaust the budget, discard the remaining
      // move. Advancing unchecked here would reintroduce corner tunnelling.
    }
    pair(a,b,bounce=false) {
      let dx=b.pos.x-a.pos.x,dy=b.pos.y-a.pos.y;
      const r=a.r+b.r, d2=dx*dx+dy*dy;
      if(d2>=r*r) return;
      const d=Math.sqrt(d2);
      if(d<EPS) { dx=a.id<b.id?1:-1; dy=0; } else { dx/=d; dy/=d; }
      const ia=1/(a.r*a.r), ib=1/(b.r*b.r), sum=ia+ib;
      const correction=Math.max(0,r-d-0.015)*0.9;
      // Separating an overlap is movement too. Sweep BOTH corrections against walls.
      const ax=a.pos.x,ay=a.pos.y,bx=b.pos.x,by=b.pos.y;
      this.move(a,-dx*correction*ia/sum,-dy*correction*ia/sum);
      this.move(b, dx*correction*ib/sum, dy*correction*ib/sum);
      // If a wall blocks one marble, give its unfulfilled correction to the other.
      // Otherwise the bottom of a deep stack loses half its correction each pass.
      const blockedA=Math.max(0,correction*ia/sum-((ax-a.pos.x)*dx+(ay-a.pos.y)*dy));
      const blockedB=Math.max(0,correction*ib/sum-((b.pos.x-bx)*dx+(b.pos.y-by)*dy));
      if(blockedA>SKIN)this.move(b,dx*blockedA,dy*blockedA);
      if(blockedB>SKIN)this.move(a,-dx*blockedB,-dy*blockedB);
      const key=a.id+':'+b.id;
      let contact=this.activeContacts.get(key);
      const impulse=j=>{
        a.vel.x-=j*ia*dx; a.vel.y-=j*ia*dy;
        b.vel.x+=j*ib*dx; b.vel.y+=j*ib*dy;
      };
      if(!contact) {
        const vn=(b.vel.x-a.vel.x)*dx+(b.vel.y-a.vel.y)*dy;
        contact={lambda:0,nx:dx,ny:dy,target:bounce && vn < -1.2 ? -0.65*vn : 0};
        this.activeContacts.set(key,contact);
      }
      contact.seen=true;
      const vn=(b.vel.x-a.vel.x)*dx+(b.vel.y-a.vel.y)*dy;
      const next=Math.max(0,contact.lambda+(contact.target-vn)/sum);
      impulse(next-contact.lambda); contact.lambda=next;
    }
    step(dt=0.5) {
      let maxSpeed=0;
      for(const b of this.balls) {
        const speed=Math.hypot(b.vel.x,b.vel.y);
        if(speed>60) { b.vel.x*=60/speed; b.vel.y*=60/speed; }
        maxSpeed=Math.max(maxSpeed,Math.min(speed,60));
      }
      const count=Math.max(1,Math.ceil((maxSpeed+this.gravity*dt)*dt/5));
      const h=dt/count;
      for(let sub=0;sub<count;sub++) {
        this.activeContacts=new Map(); this.hRatio=h/this.lastH;
        for(const b of this.balls) {
          b.vel.y+=this.gravity*h;
          if(this.boost) {
            const speed=Math.hypot(b.vel.x,b.vel.y);
            if(speed>0.01) { b.vel.x*=10/speed; b.vel.y*=10/speed; }
          }
          this.move(b,b.vel.x*h,b.vel.y*h,true);
        }
        // Apply cached impulses together BEFORE solving any pair. Applying them lazily
        // pair-by-pair makes the first solve cancel a neighbour's pending support.
        const byId=new Map(this.balls.map(b=>[b.id,b]));
        for(const [key,old] of this.contacts) {
          const ids=key.split(':').map(Number),a=byId.get(ids[0]),b=byId.get(ids[1]);
          if(!a||!b)continue;
          const dx=b.pos.x-a.pos.x,dy=b.pos.y-a.pos.y,d=Math.hypot(dx,dy);
          if(d<EPS || d>a.r+b.r+0.1 || (old.nx*dx+old.ny*dy)/d<0.95)continue;
          const vn=(b.vel.x-a.vel.x)*old.nx+(b.vel.y-a.vel.y)*old.ny;
          if(vn>1.2)continue;
          const lambda=old.lambda*this.hRatio;
          a.vel.x-=lambda*old.nx/(a.r*a.r);a.vel.y-=lambda*old.ny/(a.r*a.r);
          b.vel.x+=lambda*old.nx/(b.r*b.r);b.vel.y+=lambda*old.ny/(b.r*b.r);
          this.activeContacts.set(key,{lambda,nx:old.nx,ny:old.ny,target:0,seen:false});
        }
        // Rebuild broadphase each pass: earlier corrections invalidate old positions.
        for(let iter=0;iter<this.iterations;iter++) {
          this.pairs.clear();
          let maxR=12; for(const b of this.balls) { this.pairs.insert(b,b.pos.x,b.pos.y); maxR=Math.max(maxR,b.r); }
          const ordered=iter%2?[...this.balls].reverse():this.balls;
          for(const a of ordered) {
            const r=a.r+maxR+1;
            for(const b of this.pairs.query(a.pos.x-r,a.pos.y-r,a.pos.x+r,a.pos.y+r))
              if(b.id>a.id) this.pair(a,b,iter===0);
          }
          for(const b of this.balls) this.recover(b);
        }
        const damping=Math.pow(0.999,h);
        for(const b of this.balls) { b.vel.x*=damping; b.vel.y*=damping; }
        this.contacts=new Map([...this.activeContacts].filter(([,c])=>c.seen)); this.lastH=h;
      }
      // Preserve the original sandbox's horizontal wrap and open bottom.
      for(const b of this.balls) {
        if(b.pos.x-b.r>this.width) b.pos.x=-b.r;
        else if(b.pos.x+b.r<0) b.pos.x=this.width+b.r;
      }
      this.balls=this.balls.filter(b=>b.pos.y-b.r<=this.height+60);
    }
  }
  class Clock {
    constructor(step) { this.step=step; this.debt=0; }
    reset() { this.debt=0; }
    advance(seconds,rate=1) {
      this.debt+=Math.min(Math.max(seconds,0),0.1)*rate;
      let steps=0;
      while(this.debt+1e-9>=1/120 && steps<24) { this.step(0.5); this.debt-=1/120; steps++; }
      if(steps===24) this.debt=0;
      return steps;
    }
  }
  const api={World,Clock,closest,sweep,WALL_RADIUS};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.MarblePhysics=api;
})(typeof window!=='undefined'?window:globalThis);
