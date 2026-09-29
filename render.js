import {W,H,random,dist} from './engine.js';
const TAU=Math.PI*2;
function ellipse(ctx,x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
function route(ctx,c,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();c.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();}
export class Renderer {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.cache=document.createElement('canvas');this.trail=[];this.resize();}
  resize(){const rect=this.canvas.getBoundingClientRect();this.w=rect.width;this.h=rect.height;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(this.w*dpr);this.canvas.height=Math.round(this.h*dpr);this.dpr=dpr;this.scale=Math.min((this.w-22)/W,(this.h-58)/H);this.ox=(this.w-W*this.scale)/2;this.oy=(this.h-H*this.scale)/2+5;}
  toWorld(x,y){return {x:(x-this.ox)/this.scale,y:(y-this.oy)/this.scale};}
  build(c){this.c=c;this.trail=[];this.cache.width=W*2;this.cache.height=H*2;const ctx=this.cache.getContext('2d');ctx.scale(2,2);const r=random(c.decorSeed);
    ctx.fillStyle='#95af7d';ctx.fillRect(0,0,W,H);
    // Fine stipple and soft contour lines make the terrain feel printed.
    for(let i=0;i<3600;i++){ellipse(ctx,r()*W,r()*H,.5+r()*.7,.5+r()*.7,r()>.5?'#ffffff12':'#294f3020');}
    ctx.strokeStyle='#73915c20';ctx.lineWidth=1;for(let i=0;i<9;i++){ctx.beginPath();ctx.ellipse(25,370,60+i*24,160+i*32,-.22,0,TAU);ctx.stroke();}
    route(ctx,c,c.width*2+23,'#759359');route(ctx,c,c.width*2+16,'#a6bd87');route(ctx,c,c.width*2,'#b4ca93');
    // Clip mowing stripes to the same polyline used by terrain physics.
    ctx.save();ctx.beginPath();for(let i=1;i<c.points.length;i++){const a=c.points[i-1],b=c.points[i],ang=Math.atan2(b.y-a.y,b.x-a.x),nx=Math.sin(ang)*c.width,ny=-Math.cos(ang)*c.width;ctx.moveTo(a.x+nx,a.y+ny);ctx.lineTo(b.x+nx,b.y+ny);ctx.lineTo(b.x-nx,b.y-ny);ctx.lineTo(a.x-nx,a.y-ny);ctx.closePath();}for(const p of c.points){ctx.moveTo(p.x+c.width,p.y);ctx.arc(p.x,p.y,c.width,0,TAU);}ctx.clip();ctx.strokeStyle='#ffffff0b';ctx.lineWidth=19;for(let y=-W;y<H+W;y+=38){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y+W*.55);ctx.stroke();}ctx.restore();
    for(const e of c.water){ellipse(ctx,e.x+2,e.y+3,e.rx+5,e.ry+5,'#67875c');ellipse(ctx,e.x,e.y,e.rx+2,e.ry+2,'#cfcca0');ellipse(ctx,e.x,e.y,e.rx,e.ry,'#6ba8a0');ellipse(ctx,e.x-3,e.y-3,e.rx-7,e.ry-7,'#80b6a8');ctx.save();ctx.beginPath();ctx.ellipse(e.x,e.y,e.rx-4,e.ry-4,0,0,TAU);ctx.clip();ctx.strokeStyle='#d6eee44a';ctx.lineWidth=1;for(let i=0;i<6;i++){ctx.beginPath();ctx.moveTo(e.x-e.rx+9,e.y-e.ry+i*17);ctx.lineTo(e.x+e.rx-9,e.y-e.ry+i*17);ctx.stroke();}ctx.restore();}
    for(const e of c.bunkers){ellipse(ctx,e.x+1,e.y+3,e.rx+4,e.ry+4,'#78915e');ellipse(ctx,e.x,e.y,e.rx+2,e.ry+2,'#e8d6a5');ellipse(ctx,e.x,e.y,e.rx-3,e.ry-4,'#f0dfb3');ctx.save();ctx.beginPath();ctx.ellipse(e.x,e.y,e.rx-4,e.ry-5,0,0,TAU);ctx.clip();ctx.strokeStyle='#c5b28544';ctx.lineWidth=.8;for(let i=-40;i<50;i+=7){ctx.beginPath();ctx.moveTo(e.x-35,e.y+i);ctx.lineTo(e.x+35,e.y+i+18);ctx.stroke();}ctx.restore();}
    const g=c.green;ellipse(ctx,g.x+1,g.y+2,g.rx+7,g.ry+7,'#8ead72');ellipse(ctx,g.x,g.y,g.rx+3,g.ry+3,'#cbdba1');ellipse(ctx,g.x,g.y,g.rx,g.ry,'#bfcf94');
    ctx.save();ctx.beginPath();ctx.ellipse(g.x,g.y,g.rx,g.ry,0,0,TAU);ctx.clip();ctx.strokeStyle='#f4f3c228';ctx.lineWidth=9;for(let i=-80;i<80;i+=19){ctx.beginPath();ctx.moveTo(g.x-60,g.y+i);ctx.lineTo(g.x+60,g.y+i-40);ctx.stroke();}ctx.restore();
    // Contour marks indicate the green's gentle fall line.
    ctx.strokeStyle='#8ba37166';ctx.lineWidth=.8;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(g.x-14,g.y+12,29+i*7,13+i*7,.3,.3,2.1);ctx.stroke();}
    ctx.fillStyle='#6f925f';ctx.beginPath();ctx.roundRect(c.tee.x-19,c.tee.y-14,38,28,5);ctx.fill();ctx.fillStyle='#a4bd85';ctx.fillRect(c.tee.x-16,c.tee.y-11,32,22);
    ellipse(ctx,c.tee.x-18,c.tee.y,2.5,2.5,'#f6eee0');ellipse(ctx,c.tee.x+18,c.tee.y,2.5,2.5,'#f6eee0');
    for(const t of [...c.trees].sort((a,b)=>a.y-b.y))this.tree(ctx,t);
    ctx.fillStyle='#45684499';ctx.font='8px Arial';ctx.textAlign='center';ctx.fillText('TEE',c.tee.x,c.tee.y+35);
  }
  tree(ctx,t){ellipse(ctx,t.x+9,t.y+11,t.r*1.1,t.r*.7,'#34563727');ctx.strokeStyle='#5e6346';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(t.x,t.y);ctx.lineTo(t.x+2,t.y+9);ctx.stroke();ellipse(ctx,t.x,t.y-4,t.r,t.r,'#426c4a');ellipse(ctx,t.x-3,t.y-7,t.r*.81,t.r*.8,'#547f52');ellipse(ctx,t.x-6,t.y-9,t.r*.53,t.r*.55,'#648c59');}
  draw(state,time){const {ctx,c}=this;if(!c)return;ctx.setTransform(this.dpr,0,0,this.dpr,0,0);ctx.fillStyle='#95af7d';ctx.fillRect(0,0,this.w,this.h);ctx.save();ctx.translate(this.ox,this.oy);ctx.scale(this.scale,this.scale);ctx.drawImage(this.cache,0,0,W,H);
    const b=state.ball;
    if(b.moving&&(!this.trail.length||dist(b,this.trail[this.trail.length-1])>3)){this.trail.push({x:b.x,y:b.y,z:b.z});if(this.trail.length>60)this.trail.shift();}
    if(this.trail.length>1){ctx.beginPath();for(const [i,p] of this.trail.entries())i?ctx.lineTo(p.x,p.y-p.z*.42):ctx.moveTo(p.x,p.y-p.z*.42);ctx.strokeStyle='#fff9e057';ctx.lineWidth=1.7;ctx.stroke();}
    if(!b.moving&&!b.sunk&&state.phase==='ready'){
      const angle=state.angle,aim=state.aim;
      ctx.setLineDash([3,6]);ctx.lineWidth=1.3;ctx.strokeStyle='#fdf9ebbb';ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x+Math.cos(angle)*70,b.y+Math.sin(angle)*70);ctx.stroke();ctx.setLineDash([]);
      if(aim&&state.power>.02){ctx.strokeStyle='#fffce599';ctx.lineWidth=1.4;ctx.setLineDash([2,5]);ctx.beginPath();aim.points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y-p.z*.42):ctx.moveTo(p.x,p.y-p.z*.42));ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#fff9e9';ctx.beginPath();ctx.arc(aim.end.x,aim.end.y,7,0,TAU);ctx.stroke();}
      ctx.strokeStyle='#fff9e965';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(b.x,b.y,12+Math.sin(time*3)*1.5,0,TAU);ctx.stroke();
    }
    // Cup, leaning flag shadow, and cloth flutter.
    const pin=c.pin;ellipse(ctx,pin.x,pin.y,5.3,3.6,'#355039');ellipse(ctx,pin.x,pin.y,3.1,2,'#182f23');
    ctx.strokeStyle='#3c55354a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pin.x,pin.y);ctx.lineTo(pin.x+21,pin.y+12);ctx.stroke();
    ctx.strokeStyle='#fcf3d9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pin.x,pin.y);ctx.lineTo(pin.x,pin.y-37);ctx.stroke();ctx.fillStyle='#df8e62';ctx.beginPath();ctx.moveTo(pin.x+1,pin.y-38);ctx.quadraticCurveTo(pin.x+12,pin.y-37+Math.sin(time*3)*2,pin.x+24,pin.y-29);ctx.lineTo(pin.x+1,pin.y-23);ctx.fill();
    if(!b.sunk){const h=b.z*.42;ellipse(ctx,b.x+2+h*.18,b.y+2,4+Math.min(h*.03,2),2.6,'#213e3650');ellipse(ctx,b.x,b.y-h,4.3,4.3,'#fdfbf0');ellipse(ctx,b.x-1,b.y-h-1.2,1.6,1.5,'#ffffff');}
    if(!b.moving&&!b.sunk||state.phase==='swing'){
      const swing=state.phase==='swing'?state.swingProgress:0;
      const rotation=state.angle+Math.PI/2+(state.phase==='swing'?(1-swing)*-1.8: -state.power*1.7);
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(rotation);ctx.strokeStyle='#314a3c';ctx.lineWidth=2.3;ctx.beginPath();ctx.moveTo(0,27);ctx.lineTo(0,8);ctx.stroke();ctx.strokeStyle='#bfcbba';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(0,-7);ctx.stroke();ctx.fillStyle=state.club==='driver'?'#244334':'#ecebdd';ctx.beginPath();ctx.roundRect(-5,-12,11,6,2);ctx.fill();ctx.restore();
    }
    for(const p of state.particles||[]){ctx.globalAlpha=p.life;ellipse(ctx,p.x,p.y,2.5,2.5,p.color);}ctx.globalAlpha=1;ctx.restore();
  }
}
