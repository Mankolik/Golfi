export const W = 420, H = 660, DT = 1 / 120;
export const CLUBS = {
  driver: {speed: 190, loft: 54, bounce: .32, label: 'Low flight · long roll'},
  iron: {speed: 144, loft: 76, bounce: .25, label: 'Balanced flight · soft landing'},
  wedge: {speed: 88, loft: 98, bounce: .15, label: 'High flight · little roll'},
  putter: {speed: 65, loft: 0, bounce: 0, label: 'Ground roll · precision control'},
};
export function random(seed) { let a = seed >>> 0; return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export function hash(text) { let h = 2166136261; for (const c of String(text)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
export const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
export function segmentDistance(p,a,b) { const dx=b.x-a.x,dy=b.y-a.y; const t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy || 1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy); }
export function pathDistance(p,points) { return Math.min(...points.slice(1).map((b,i)=>segmentDistance(p,points[i],b))); }
export function inEllipse(p,e,pad=0) { return ((p.x-e.x)/(e.rx+pad))**2 + ((p.y-e.y)/(e.ry+pad))**2 < 1; }
const NAMES=['The quiet pines','Sunday meander','A little sand','Willow bend','Stillwater club','The long way home','Pocket paradise','Golden hour','One more round'];
export function generateCourse(seed,hole=0) {
  const r=random(hash(seed+':'+hole)), side=r()>.5?1:-1;
  const tee={x:210+(r()-.5)*85,y:579};
  const pin={x:210+(r()-.5)*150,y:90+r()*28};
  const width=34+r()*13;
  const points=[tee,{x:210+side*(35+r()*50),y:453},{x:210-side*(20+r()*54),y:320},{x:210+side*(20+r()*30),y:205},pin];
  const green={...pin,rx:49+r()*6,ry:44+r()*6};
  const bunkers=[];
  for(let i=0;i<3+(hole%3);i++){
    const p=points[1+Math.floor(r()*3)], direction=r()>.5?1:-1;
    const e={x:clamp(p.x+direction*(width+15+r()*12),35,W-35),y:p.y+(r()-.5)*60,rx:16+r()*12,ry:22+r()*18};
    if(dist(e,pin)>green.rx+35&&dist(e,tee)>70)bunkers.push(e);
  }
  const water=[];
  // Keep a full-width playable corridor down every fairway.
  for(let i=0;i<2;i++) { const e={x:i===0?25:W-25,y:190+r()*280,rx:25+r()*29,ry:40+r()*45}; if(pathDistance(e,points)>width+e.rx+10)water.push(e); }
  const trees=[];
  for(let i=0;i<160;i++){ const p={x:12+r()*(W-24),y:55+r()*(H-90),r:9+r()*11}; if(pathDistance(p,points)>width+p.r+24 && dist(p,pin)>green.rx+p.r+25 && !water.some(e=>inEllipse(p,e,p.r)) && !bunkers.some(e=>inEllipse(p,e,p.r)))trees.push(p); if(trees.length>=26)break; }
  const length=points.slice(1).reduce((n,p,i)=>n+dist(p,points[i]),0);
  const windAngle=r()*Math.PI*2,windSpeed=hole===0?1.2:1+r()*3;
  return {seed,hole,name:NAMES[hole%9],tee,pin,points,width,green,bunkers,water,trees,par:length>560?5:4,wind:{x:Math.cos(windAngle)*windSpeed,y:Math.sin(windAngle)*windSpeed,speed:windSpeed},slope:{x:(r()-.5)*2.4,y:(r()-.5)*2.4},decorSeed:hash(seed+':decor:'+hole)};
}
export function terrain(c,p) {
  if(c.water.some(e=>inEllipse(p,e)))return 'water';
  if(c.bunkers.some(e=>inEllipse(p,e)))return 'sand';
  if(inEllipse(p,c.green))return 'green';
  if(dist(p,c.tee)<22)return 'tee';
  return pathDistance(p,c.points)<c.width?'fairway':'rough';
}
export function makeBall(p) {return {x:p.x,y:p.y,z:0,vx:0,vy:0,vz:0,moving:false,sunk:false,age:0,bounce:.25,lastSafe:{x:p.x,y:p.y},shotFrom:{x:p.x,y:p.y}};}
export function strike(b,c,club,angle,power) {
  if(b.moving||b.sunk)return false;
  const spec=CLUBS[club],p=clamp(power,.02,1),lie=terrain(c,b);
  const penalty=lie==='sand'?(club==='wedge'?.85:.5):lie==='rough'?.79:1;
  b.vx=Math.cos(angle)*spec.speed*p*penalty;b.vy=Math.sin(angle)*spec.speed*p*penalty;
  b.vz=spec.loft*Math.sqrt(p)*(lie==='sand'&&club!=='wedge'?.65:1);b.z=b.vz>0?.1:0;
  b.bounce=spec.bounce;b.moving=true;b.age=0;b.shotFrom={x:b.x,y:b.y};return true;
}
function stop(b){b.vx=b.vy=b.vz=0;b.z=0;b.moving=false;}
export function step(b,c,dt=DT) {
  if(!b.moving||b.sunk)return null;
  b.age+=dt; const previous={x:b.x,y:b.y};
  const air=b.z>0||b.vz>0;
  if(air){b.vx+=(c.wind.x*.9-b.vx*.065)*dt;b.vy+=(c.wind.y*.9-b.vy*.065)*dt;b.vz-=110*dt;b.z+=b.vz*dt;}
  else{
    const lie=terrain(c,b), friction={green:12,fairway:27,tee:27,rough:61,sand:100,water:100}[lie];
    // Gentle putting slopes; static friction always wins at low speed.
    if(lie==='green'){b.vx+=c.slope.x*dt;b.vy+=c.slope.y*dt;}
    const speed=Math.hypot(b.vx,b.vy),next=Math.max(0,speed-friction*dt);
    if(speed>0){b.vx*=next/speed;b.vy*=next/speed;}
    if(next<.7){stop(b);return 'rest';}
  }
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(b.z<0){b.z=0;const impact=-b.vz;const lie=terrain(c,b);b.vz=impact*(lie==='sand'?.06:b.bounce);b.vx*=lie==='sand'?.42:lie==='rough'?.66:.82;b.vy*=lie==='sand'?.42:lie==='rough'?.66:.82;if(b.vz<5)b.vz=0;}
  if(b.x<5||b.x>W-5||b.y<15||b.y>H-10){b.x=clamp(b.x,5,W-5);b.y=clamp(b.y,15,H-10);if(b.x===5||b.x===W-5)b.vx*=-.48;if(b.y===15||b.y===H-10)b.vy*=-.48;}
  for(const t of c.trees){ const d=dist(b,t),radius=7;if(b.z<30&&d<radius){let nx=(b.x-t.x)/(d||1),ny=(b.y-t.y)/(d||1);if(!d){nx=1;ny=0;}b.x=t.x+nx*(radius+.1);b.y=t.y+ny*(radius+.1);const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=1.55*dot*nx;b.vy-=1.55*dot*ny;} } }
  if(b.z<1&&terrain(c,b)==='water'){stop(b);b.x=b.shotFrom.x;b.y=b.shotFrom.y;return 'water';}
  const speed=Math.hypot(b.vx,b.vy);
  if(b.z<2&&b.vz<6&&speed<47&&segmentDistance(c.pin,previous,b)<5.4){b.x=c.pin.x;b.y=c.pin.y;stop(b);b.sunk=true;return 'hole';}
  if(b.z===0&&terrain(c,b)!=='water')b.lastSafe={x:b.x,y:b.y};
  if(b.age>25){stop(b);return 'rest';}
  return null;
}
export function preview(c,b,club,angle,power) {
  const ghost=makeBall(b);strike(ghost,c,club,angle,power);const points=[];
  for(let i=0;i<3000&&ghost.moving;i++){const event=step(ghost,c);if(i%12===0)points.push({x:ghost.x,y:ghost.y,z:ghost.z});if(event==='water')break;}
  return {points,end:ghost};
}
