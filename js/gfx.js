/* 3D 繪圖核心（Three.js r128）：低多邊形切面造型、暖冷對比光、霧氣景深、燈籠與旗串
   遊戲邏輯在 2D 平面，這裡只把狀態「擺」成場景：x = 欄、z = 列、y 向上。 */
(function(){
'use strict';
const PH=window.PH,U=PH.U,W=PH.World,T3=window.THREE;
const G=PH.GFX={ok:false,anim:[],shake:0,t:0,parts:[],rings:[],txt:[],flashT:0,flashC:'#fff',cur:null,lanterns:0};
let R3,scene,camera,root,sky,hemi,sun,amb,V3,cw=1,ch=1,cv,ov,ox,dpr=1;
const MATS={},GEO={};
const FONT="'Chiron GoRound TC','Noto Sans TC','Microsoft JhengHei','PingFang TC',sans-serif";

// 霧面材質：柔和明暗、不反光（手繪童話感，不是亮面塑膠）
function M(c,o){
  if(typeof c!=='string')return c;
  const key=c+(o?JSON.stringify(o):'');
  return MATS[key]||(MATS[key]=new T3.MeshStandardMaterial(Object.assign({color:c,flatShading:false,roughness:0.92,metalness:0},o||{})));
}
/* ---------- 程序手繪貼圖：灰階為主，顏色由材質決定；同一種貼圖全遊戲共用 ---------- */
const TEX={};
function rng(seed){let s=seed%2147483647;if(s<=0)s+=2147483646;return function(){s=s*16807%2147483647;return (s-1)/2147483646;};}
function blot(c,r,x,y,rad,col,a){c.globalAlpha=a;c.fillStyle=col;c.beginPath();c.ellipse(x,y,rad,rad*(.5+r()*.6),r()*3,0,6.283);c.fill();c.globalAlpha=1;}
// 筆刷：一筆是一段有寬度、兩端收尖的短筆觸，疊很多筆做出手繪的色差
function dabs(c,r,w,h,n,cols,len,wid,ang,angVar,a){
  c.lineCap='round';
  for(let i=0;i<n;i++){
    const x=r()*w,y=r()*h,an=ang+(r()-.5)*angVar,l=len*(.5+r()),dx=Math.cos(an)*l/2,dy=Math.sin(an)*l/2;
    c.globalAlpha=a*(.5+r()*.5);c.strokeStyle=cols[(r()*cols.length)|0];c.lineWidth=wid*(.5+r()*.8);
    c.beginPath();c.moveTo(x-dx,y-dy);c.quadraticCurveTo(x+(r()-.5)*wid,y+(r()-.5)*wid,x+dx,y+dy);c.stroke();
  }
  c.globalAlpha=1;
}
function vignette(c,w,h,k){const g=c.createRadialGradient(w/2,h/2,w*.2,w/2,h/2,w*.75);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,'+k+')');c.fillStyle=g;c.fillRect(0,0,w,h);}
const PAINT={
  plaster:function(c,w,h){const r=rng(11);c.fillStyle='#ececec';c.fillRect(0,0,w,h);
    for(let i=0;i<60;i++)blot(c,r,r()*w,r()*h,10+r()*40,r()<.5?'#ffffff':'#d2d2d2',.16);
    dabs(c,r,w,h,260,['#ffffff','#dcdcdc','#cfcfcf'],26,7,0,6.3,.22);
    dabs(c,r,w,h,10,['#b4b4b4'],60,1.5,.2,.6,.3);},
  wood:function(c,w,h){const r=rng(23);c.fillStyle='#e4e4e4';c.fillRect(0,0,w,h);
    for(let i=0;i<6;i++){c.globalAlpha=.14;c.fillStyle=r()<.5?'#b8b8b8':'#ffffff';c.fillRect(0,r()*h,w,10+r()*40);}
    dabs(c,r,w,h,220,['#ffffff','#c8c8c8','#b0b0b0'],70,4,0,.18,.25);
    c.strokeStyle='#9a9a9a';for(let i=0;i<4;i++){c.globalAlpha=.35;c.lineWidth=2;const x=r()*w,y=r()*h;c.beginPath();c.ellipse(x,y,14+r()*10,4+r()*3,0,0,6.3);c.stroke();}   // 木節
    c.globalAlpha=1;},
  plank:function(c,w,h){const r=rng(37);c.fillStyle='#e8e8e8';c.fillRect(0,0,w,h);
    for(let k=0;k<3;k++){c.globalAlpha=.16;c.fillStyle=r()<.5?'#bdbdbd':'#ffffff';c.fillRect(0,k*h/3,w,h/3);}
    dabs(c,r,w,h,200,['#ffffff','#c4c4c4','#ababab'],60,4,0,.12,.22);
    c.globalAlpha=.55;c.fillStyle='#7c7c7c';for(let k=1;k<3;k++)c.fillRect(0,k*h/3-1.5,w,3);
    c.fillRect(((r()*w)|0),0,3,h/3);c.fillRect(((r()*w)|0),h/3,3,h/3);c.fillRect(((r()*w)|0),2*h/3,3,h/3);
    c.globalAlpha=1;vignette(c,w,h,.25);},
  // 石板：博物館、月面
  stone:function(c,w,h){const r=rng(71);c.fillStyle='#e2e2e2';c.fillRect(0,0,w,h);
    for(let i=0;i<40;i++)blot(c,r,r()*w,r()*h,14+r()*36,r()<.5?'#f6f6f6':'#c6c6c6',.2);
    dabs(c,r,w,h,160,['#ffffff','#cccccc'],22,8,0,6.3,.18);
    c.strokeStyle='#9c9c9c';c.globalAlpha=.4;c.lineWidth=2;c.beginPath();c.moveTo(r()*w,0);c.lineTo(r()*w,h*.4);c.lineTo(r()*w,h*.7);c.stroke();c.globalAlpha=1;vignette(c,w,h,.2);},
  // 霧面錫：罐頭月亮
  tin:function(c,w,h){const r=rng(83);c.fillStyle='#e6e6e6';c.fillRect(0,0,w,h);
    dabs(c,r,w,h,240,['#ffffff','#d0d0d0','#c0c0c0'],90,3,0,.05,.22);
    for(let i=0;i<14;i++){c.globalAlpha=.3;c.fillStyle='#b8b8b8';c.beginPath();c.arc(r()*w,r()*h,2+r()*2,0,6.3);c.fill();}   // 鉚釘、小凹痕
    c.globalAlpha=1;},
  swirl:function(c,w,h){const r=rng(53);c.fillStyle='#e6e6e6';c.fillRect(0,0,w,h);
    c.strokeStyle='#ffffff';c.lineCap='round';for(let i=0;i<16;i++){c.globalAlpha=.35;c.lineWidth=2+r()*4;const x=r()*w,y=r()*h,rad=8+r()*20;c.beginPath();c.arc(x,y,rad,r()*6,r()*6+2.4);c.stroke();}
    c.globalAlpha=1;},
  weave:function(c,w,h){c.fillStyle='#dcdcdc';c.fillRect(0,0,w,h);c.fillStyle='#ffffff';
    for(let y=0;y<h;y+=16)for(let x=0;x<w;x+=16){c.globalAlpha=.5;if(((x+y)/16)%2)c.fillRect(x+2,y+5,12,6);else c.fillRect(x+5,y+2,6,12);}c.globalAlpha=1;},
  cloth:function(c,w,h){c.fillStyle='#F1DFC0';c.fillRect(0,0,w,h);
    c.globalAlpha=.32;c.fillStyle='#E77863';for(let i=0;i<w;i+=32){c.fillRect(i,0,12,h);c.fillRect(0,i,w,12);}
    c.globalAlpha=.18;c.fillStyle='#315C53';for(let i=16;i<w;i+=32){c.fillRect(i,0,4,h);c.fillRect(0,i,w,4);}c.globalAlpha=1;},
  fishrug:function(c,w,h){c.fillStyle='#3d6b61';c.fillRect(0,0,w,h);c.strokeStyle='#F1DFC0';c.lineWidth=3;c.lineCap='round';
    for(let y=20;y<h;y+=42)for(let x=18+(y%84?20:0);x<w;x+=52){c.beginPath();c.moveTo(x-12,y);c.lineTo(x+12,y);for(let k=-1;k<=1;k++){c.moveTo(x+k*6,y-6);c.lineTo(x+k*6,y+6);}c.moveTo(x+12,y);c.lineTo(x+18,y-5);c.moveTo(x+12,y);c.lineTo(x+18,y+5);c.stroke();}
    c.strokeStyle='#F3BC68';c.lineWidth=5;c.strokeRect(6,6,w-12,h-12);}
};
function paint(kind){
  if(TEX[kind])return TEX[kind];
  const t=tex(256,256,PAINT[kind]);t.wrapS=t.wrapT=T3.RepeatWrapping;
  return TEX[kind]=t;
}
// 柔邊圓點（粒子、光斑共用）
function soft(){
  if(TEX.soft)return TEX.soft;
  return TEX.soft=tex(64,64,function(c,w,h){const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.4,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.fillRect(0,0,w,h);});
}
// 光柱的透明度貼圖：上亮下淡，幾道直向光束紋
function shaftTex(){
  if(TEX.shaft)return TEX.shaft;
  return TEX.shaft=tex(128,128,function(c,w,h){
    const r=rng(97),g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#ffffff');g.addColorStop(.7,'#6a6a6a');g.addColorStop(1,'#000000');
    c.fillStyle=g;c.fillRect(0,0,w,h);
    for(let i=0;i<14;i++){c.globalAlpha=.25+r()*.3;c.fillStyle=r()<.5?'#000000':'#ffffff';c.fillRect(r()*w,0,3+r()*10,h);}c.globalAlpha=1;
  });
}
function shaftMat(c,op){return new T3.MeshBasicMaterial({color:c,alphaMap:shaftTex(),transparent:true,opacity:op,depthWrite:false,side:T3.DoubleSide,blending:T3.AdditiveBlending,fog:false});}
function softMat(c,op){return new T3.MeshBasicMaterial({color:c,map:soft(),transparent:true,opacity:op,depthWrite:false,blending:T3.AdditiveBlending});}
// 帶手繪貼圖的霧面材質
function MT(c,kind,o){
  const key='t'+kind+c+(o?JSON.stringify(o):'');
  return MATS[key]||(MATS[key]=new T3.MeshStandardMaterial(Object.assign({color:c,map:paint(kind),roughness:0.95,metalness:0},o||{})));
}
/* ---------- 圓角方塊：家具、櫃子、狗的方正輪廓都用它（幾何依尺寸快取） ---------- */
const RBG={};
function rbGeo(w,h,d,r){
  const key=w.toFixed(2)+'|'+h.toFixed(2)+'|'+d.toFixed(2)+'|'+r.toFixed(3);
  if(RBG[key])return RBG[key];
  const b=Math.max(.004,Math.min(r,w*.45,h*.45,d*.45)),iw=w-2*b,ih=h-2*b,cr=Math.min(b,iw*.45,ih*.45);
  const s=new T3.Shape(),x0=-iw/2,y0=-ih/2;
  s.moveTo(x0+cr,y0);s.lineTo(x0+iw-cr,y0);s.quadraticCurveTo(x0+iw,y0,x0+iw,y0+cr);
  s.lineTo(x0+iw,y0+ih-cr);s.quadraticCurveTo(x0+iw,y0+ih,x0+iw-cr,y0+ih);
  s.lineTo(x0+cr,y0+ih);s.quadraticCurveTo(x0,y0+ih,x0,y0+ih-cr);
  s.lineTo(x0,y0+cr);s.quadraticCurveTo(x0,y0,x0+cr,y0);
  const g=new T3.ExtrudeGeometry(s,{depth:Math.max(.002,d-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:2,curveSegments:3});
  g.center();
  return RBG[key]=g;
}
function rb(w,h,d,r,c,x,y,z,p){return add(rbGeo(w,h,d,r),c,1,1,1,x,y,z,p);}
// 魚骨圖樣（把手、縫線符號共用）：橫躺在 XY 平面，s 是大小
function fishMesh(p,mat,s){
  const g=gp(0,0,0,p);
  add(GEO.box,mat,.5*s,.05*s,.05*s,0,0,0,g);
  [-.14,0,.14].forEach(function(dx){add(GEO.box,mat,.05*s,.24*s,.05*s,dx*s,0,0,g);});
  add(GEO.ico,mat,.07*s,.07*s,.05*s,-.3*s,0,0,g);
  add(GEO.box,mat,.16*s,.045*s,.05*s,.3*s,.05*s,0,g).rotation.z=.7;add(GEO.box,mat,.16*s,.045*s,.05*s,.3*s,-.05*s,0,g).rotation.z=-.7;
  g.children.forEach(function(m){m.castShadow=false;m.receiveShadow=false;});
  return g;
}
function MB(c,op,addv){
  const key='b'+c+op+(addv?'a':'');
  return MATS[key]||(MATS[key]=new T3.MeshBasicMaterial({color:c,transparent:op<1,opacity:op,depthWrite:op>=1,side:T3.DoubleSide,blending:addv?T3.AdditiveBlending:T3.NormalBlending,fog:!addv}));
}
function add(geo,mat,sx,sy,sz,x,y,z,p){
  const m=new T3.Mesh(geo,M(mat));
  m.scale.set(sx,sy,sz);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;(p||G.cur).add(m);return m;
}
function bx(w,h,d,c,x,y,z,p){return add(GEO.box,c,w,h,d,x,y,z,p);}
function bl(rx,ry,rz,c,x,y,z,p){return add(GEO.ico,c,rx,ry,rz,x,y,z,p);}
function cy(r,h,c,x,y,z,p){return add(GEO.cyl,c,r,h,r,x,y,z,p);}
function cn(r,h,c,x,y,z,p){return add(GEO.cone,c,r,h,r,x,y,z,p);}
function gp(x,y,z,p){const g=new T3.Group();g.position.set(x||0,y||0,z||0);(p||G.cur).add(g);return g;}
function flat(geo,mat,x,y,z,p){const m=new T3.Mesh(geo,mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);(p||G.cur).add(m);return m;}
function rot(m,rx,ry,rz){if(rx)m.rotation.x=rx;if(ry)m.rotation.y=ry;if(rz)m.rotation.z=rz;return m;}
function tex(w,h,fn){const c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);const t=new T3.CanvasTexture(c);return t;}
G.h={M:M,MB:MB,MT:MT,fishMesh:fishMesh,add:add,bx:bx,bl:bl,cy:cy,cn:cn,gp:gp,flat:flat,rb:rb,rbGeo:rbGeo,paint:paint,GEO:GEO,T3:T3,tex:tex,FONT:FONT};
// 動態點光源：全場最多 6 盞（燈籠也算），減少特效模式完全不建
const LIGHT_CAP=6;
function pointLight(c,int,dist,x,y,z,p){
  if(PH.opt.lowfx||G.lanterns>=LIGHT_CAP)return null;
  G.lanterns++;const l=new T3.PointLight(c,int,dist,1.6);l.position.set(x,y,z);(p||G.cur).add(l);return l;
}

/* ---------- 給關卡裝飾用的工具組 ---------- */
const B=G.kit={
  box:function(w,h,d,c,x,y,z,rx,ry,rz){return rot(bx(w,h,d,c,x,y,z),rx,ry,rz);},
  ball:function(rx,ry,rz,c,x,y,z){return bl(rx,ry,rz,c,x,y,z);},
  cyl:function(r,h,c,x,y,z,rx,ry,rz){return rot(cy(r,h,c,x,y,z),rx,ry,rz);},
  cone:function(r,h,c,x,y,z,rx,ry,rz){return rot(cn(r,h,c,x,y,z),rx,ry,rz);},
  torus:function(R,r,c,x,y,z,rx,ry){const m=add(new T3.TorusGeometry(R,r,6,14),c,1,1,1,x,y,z);return rot(m,rx,ry,0);},
  grp:function(x,y,z){return gp(x,y,z);},
  // 燈籠：暖色自發光＋有限數量的點光源（暖光對上冷色陰影）
  lantern:function(x,y,z,c){
    const g=gp(x,y,z);
    add(GEO.box,M(c,{emissive:c,emissiveIntensity:0.9}),.22,.28,.22,0,0,0,g).castShadow=false;
    bx(.3,.05,.3,'#3a2a2a',0,.17,0,g);bx(.26,.04,.26,'#3a2a2a',0,-.16,0,g);bx(.03,.3,.03,'#3a2a2a',0,.34,0,g);
    const halo=new T3.Mesh(GEO.ico,MB(c,0.16,true));halo.scale.set(.55,.55,.55);g.add(halo);
    pointLight(c,0.75,7.5,0,-.1,0,g);
    G.anim.push(function(t){halo.scale.setScalar(.5+Math.sin(t*2.3+x)*.05);});
    return g;
  },
  // 旗串：兩點之間下垂的一排小三角旗
  bunting:function(x0,z0,x1,z1,y){
    const cols=['#E77863','#F3BC68','#86E0C2','#F1DFC0','#6E8D55','#D99556'],len=Math.hypot(x1-x0,z1-z0),n=Math.max(4,Math.round(len/0.55)),a=Math.atan2(z1-z0,x1-x0);
    for(let i=0;i<=n;i++){
      const k=i/n,sag=Math.sin(k*Math.PI)*Math.min(0.5,len*0.04);
      const m=add(GEO.tri,M(cols[i%6],{side:T3.DoubleSide}),.2,.26,.2,x0+(x1-x0)*k,y-sag,z0+(z1-z0)*k);
      m.rotation.y=-a;m.castShadow=false;
    }
  },
  // 光柱：半透明的光束，營造霧氣裡的光
  // 假體積光：上亮下淡、帶幾道光束紋的半透明光柱，地上一圈柔邊光斑，光裡飄著灰塵（減少特效時只剩光柱）
  shaft:function(x,z,r,h,c){
    const m=new T3.Mesh(new T3.CylinderGeometry(r*0.3,r,h,16,1,true),shaftMat(c,.2));
    m.position.set(x,h/2,z);G.cur.add(m);
    const d=new T3.Mesh(GEO.circ,softMat(c,.22));d.rotation.x=-Math.PI/2;d.position.set(x,.02,z);d.scale.set(r*1.1,r*1.1,1);G.cur.add(d);
    B.motes(x,z,r*1.2,r*1.2,h*.9,16,c,'dust');
    return m;
  },
  // 環境粒子：dust 灰塵慢飄、rise 泡泡上升、spark 夢境亮點閃爍、petal 花瓣斜飄、star 星塵
  motes:function(cx,cz,w,d,h,n,c,mode,y0){
    if(PH.opt.lowfx)n=Math.floor(n/3);if(n<=0)return null;
    y0=y0||.2;
    const r=rng((cx*31+cz*17+n)|0),pos=new Float32Array(n*3),sp=[];
    for(let i=0;i<n;i++){pos[i*3]=cx+(r()-.5)*w;pos[i*3+1]=y0+r()*h;pos[i*3+2]=cz+(r()-.5)*d;sp.push(r()*6.3);}
    const g=new T3.BufferGeometry(),at=new T3.BufferAttribute(pos,3);g.setAttribute('position',at);
    const mat=new T3.PointsMaterial({color:c,map:soft(),size:mode==='rise'?.14:mode==='petal'?.12:.07,transparent:true,opacity:.85,depthWrite:false,blending:T3.AdditiveBlending,sizeAttenuation:true});
    const p=new T3.Points(g,mat);G.cur.add(p);
    G.anim.push(function(t,dt){
      for(let i=0;i<n;i++){
        const k=i*3,s=sp[i];
        if(mode==='rise'){pos[k+1]+=dt*(.25+(i%5)*.06);pos[k]+=Math.sin(t*1.3+s)*dt*.08;if(pos[k+1]>y0+h)pos[k+1]=y0;}
        else if(mode==='petal'){pos[k+1]-=dt*.18;pos[k]+=dt*.25;pos[k+2]+=Math.sin(t+s)*dt*.12;if(pos[k+1]<y0){pos[k+1]=y0+h;pos[k]-=w*.6;}}
        else{pos[k]+=Math.sin(t*.4+s)*dt*.06;pos[k+1]+=Math.sin(t*.3+s*2)*dt*.05;pos[k+2]+=Math.cos(t*.35+s)*dt*.06;}
      }
      at.needsUpdate=true;
      if(mode==='spark'||mode==='star')mat.opacity=.55+Math.sin(t*2.2)*.3;
    });
    return p;
  },
  photo:function(x,y,z,ry){
    const g=gp(x,y,z);g.rotation.y=ry||0;
    bx(.05,.6,.8,'#ffffff',0,0,0,g);bx(.06,.46,.66,'#ffcf9e',.012,0,0,g);bx(.07,.14,.36,'#f6a23c',.02,-.1,0,g);bl(.04,.07,.09,'#f6a23c',.03,-.02,.17,g);
    return g;
  },
  // 時鐘：全部停在三點
  clock:function(x,y,z,ry){
    const g=gp(x,y,z);g.rotation.y=ry||0;
    rot(cy(.3,.06,'#ffffff',0,0,0,g),0,0,Math.PI/2);bx(.02,.045,.2,'#2b1b2e',.04,0,.1,g);bx(.02,.22,.045,'#2b1b2e',.04,.1,0,g);
    return g;
  },
  rug:function(x,z,r,c1,c2){
    const a=flat(GEO.circ,M(c1,{side:T3.DoubleSide}),x,.012,z);a.scale.set(r,r,1);a.receiveShadow=true;
    const b=flat(GEO.circ,M(c2,{side:T3.DoubleSide}),x,.016,z);b.scale.set(r*.68,r*.68,1);b.receiveShadow=true;
  },
  sign:function(text,x,y,z,ry,w,h,bg,fg){
    const t=tex(256,Math.max(32,Math.round(256*h/w)),function(c,W_,H_){
      c.fillStyle=bg;c.fillRect(0,0,W_,H_);c.strokeStyle=fg;c.lineWidth=4;c.strokeRect(4,4,W_-8,H_-8);
      c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';
      let fs=H_*0.56;c.font='800 '+fs+'px '+FONT;while(c.measureText(text).width>W_-22&&fs>8){fs-=2;c.font='800 '+fs+'px '+FONT;}
      c.fillText(text,W_/2,H_/2+1);
    });
    const m=new T3.Mesh(GEO.plane,new T3.MeshBasicMaterial({map:t,side:T3.DoubleSide}));
    m.scale.set(w,h,1);m.position.set(x,y,z);m.rotation.y=ry||0;G.cur.add(m);return m;
  },
  cloud:function(x,y,z,s){
    const g=gp(x,y,z),c=PH.L&&PH.L.def.mood.dark?'#4a4a78':'#ffffff';
    [[0,0,0,1],[.8,-.1,.2,.7],[-.8,-.15,-.1,.75],[.2,.3,-.3,.6]].forEach(function(q){const m=bl(s*q[3],s*q[3]*.55,s*q[3]*.8,c,q[0]*s,q[1]*s,q[2]*s,g);m.castShadow=false;m.receiveShadow=false;});
    G.anim.push(function(t){g.position.x=x+Math.sin(t*.08+z)*1.5;});
    return g;
  },
  bubble:function(x,y,z,r){
    const m=new T3.Mesh(GEO.ico2,new T3.MeshStandardMaterial({color:'#dff6ff',transparent:true,opacity:.3,roughness:.1,depthWrite:false}));
    m.scale.set(r,r,r);m.position.set(x,y,z);G.cur.add(m);
    G.anim.push(function(t){m.position.y=y+Math.sin(t*.9+x*2)*.25;m.position.x=x+Math.sin(t*.4+z)*.2;});
    return m;
  },
  rock:function(x,z,s,c){const m=add(GEO.rock,c,s,s*.7,s*.9,x,s*.3,z);m.rotation.y=x*1.7;return m;},
  tree:function(x,z,s,c){
    const g=gp(x,0,z);cy(.12*s,.8*s,'#7a4a2b',0,.4*s,0,g);
    for(let i=0;i<3;i++)cn((.75-i*.18)*s,(.9-i*.1)*s,c||'#3f9f5a',0,(.95+i*.5)*s,0,g);
    return g;
  },
  stars:function(cx,cz,n){
    const pos=new Float32Array(n*6*3);
    for(let i=0;i<n*6;i++){const a=Math.random()*6.283,e=0.08+Math.random()*1.2,r=110;pos[i*3]=cx+Math.cos(a)*Math.cos(e)*r;pos[i*3+1]=Math.sin(e)*r;pos[i*3+2]=cz+Math.sin(a)*Math.cos(e)*r;}
    const g=new T3.BufferGeometry();g.setAttribute('position',new T3.BufferAttribute(pos,3));
    const p=new T3.Points(g,new T3.PointsMaterial({color:'#fff6d8',size:1.1,sizeAttenuation:true,fog:false,transparent:true,opacity:.9}));
    G.cur.add(p);return p;
  },
  // 倒著下的雨：往上飄的短線粒子，不影響物理
  rain:function(cx,cz,w,d){
    if(PH.opt.lowfx)return;
    const n=220,pos=new Float32Array(n*3),sp=new Float32Array(n);
    for(let i=0;i<n;i++){pos[i*3]=cx+(Math.random()-.5)*w;pos[i*3+1]=Math.random()*9;pos[i*3+2]=cz+(Math.random()-.5)*d;sp[i]=1.5+Math.random()*2;}
    const g=new T3.BufferGeometry(),at=new T3.BufferAttribute(pos,3);g.setAttribute('position',at);
    const p=new T3.Points(g,new T3.PointsMaterial({color:'#dff6ff',size:.09,transparent:true,opacity:.7}));G.cur.add(p);
    G.anim.push(function(t,dt){for(let i=0;i<n;i++){pos[i*3+1]+=sp[i]*dt;if(pos[i*3+1]>9)pos[i*3+1]=0;}at.needsUpdate=true;});
  },
  governor:function(x,z){const o=G.makeBoss();o.g.position.set(x,0,z);o.g.rotation.y=0;return o.g;},
  // 以下是美術整合新增的工具
  rbox:function(w,h,d,r,c,x,y,z,ry){const m=rb(w,h,d,r,c,x,y,z);if(ry)m.rotation.y=ry;return m;},
  mat:MT,
  light:function(c,int,dist,x,y,z){return pointLight(c,int,dist,x,y,z);},
  // 只發光、不照亮別人的小燈（低成本，減少特效模式也保留）
  glowBall:function(x,y,z,r,c){const g=gp(x,y,z),m=add(GEO.ico,M(c,{emissive:c,emissiveIntensity:.95}),r,r,r,0,0,0,g);m.castShadow=false;
    const h=new T3.Mesh(GEO.ico,MB(c,.14,true));h.scale.setScalar(r*2.4);g.add(h);return g;},
  // 平鋪在地上的布、地毯（只是裝飾，不影響碰撞）
  cloth:function(x,z,w,d,kind,c,ry){const m=new T3.Mesh(GEO.plane,MT(c||'#ffffff',kind,{side:T3.DoubleSide}));m.rotation.x=-Math.PI/2;m.rotation.z=ry||0;m.scale.set(w,d,1);m.position.set(x,.014,z);m.receiveShadow=true;G.cur.add(m);return m;},
  // 藤蔓：沿著牆頂下垂的一串葉子，偶爾垂下一條；只放在牆面、天花板高度
  vine:function(x0,z0,x1,z1,y,seed){
    const r=rng(seed||7),len=Math.hypot(x1-x0,z1-z0),n=Math.max(4,Math.round(len*4)),cols=['#6E8D55','#5d7d48','#7f9c5f','#4f6e44'];
    for(let i=0;i<=n;i++){
      const k=i/n,sag=Math.sin(k*Math.PI)*Math.min(.45,len*.06),x=x0+(x1-x0)*k,z=z0+(z1-z0)*k;
      const m=bl(.09+r()*.05,.05,.07+r()*.04,cols[i%4],x,y-sag,z);m.rotation.y=r()*3;m.castShadow=false;
      if(r()<.18){const dl=.4+r()*.7;for(let j=1;j<5;j++){const q=bl(.06,.04,.05,cols[(i+j)%4],x+(r()-.5)*.08,y-sag-j*dl/4,z);q.castShadow=false;}}
    }
  },
  // 有葉子的小盆栽（放在檯面上）
  herb:function(x,y,z,s,pot){
    s=s||1;const g=gp(x,y,z);cy(.13*s,.18*s,pot||'#c4704f',0,.09*s,0,g);
    for(let i=0;i<5;i++){const a=i*1.26,m=bl(.07*s,.13*s,.05*s,i%2?'#6E8D55':'#86a865',Math.cos(a)*.06*s,.26*s,Math.sin(a)*.06*s,g);m.rotation.z=Math.cos(a)*.5;m.rotation.x=Math.sin(a)*.5;m.castShadow=false;}
    return g;
  },
  // 從上方垂下的盆栽
  hanger:function(x,y,z,len){
    cy(.012,len,'#5a3d24',x,y+len/2,z).castShadow=false;
    const g=gp(x,y,z);cy(.16,.16,'#c4704f',0,0,0,g);
    for(let i=0;i<7;i++){const a=i*.9,dl=.2+(i%3)*.18;for(let j=0;j<3;j++){const m=bl(.05,.04,.04,j%2?'#6E8D55':'#86a865',Math.cos(a)*.15,-.06-j*dl/3,Math.sin(a)*.15,g);m.castShadow=false;}}
    return g;
  },
  // 簡化光片：從窗戶斜落到檯面的半透明光（不落到走道，不遮狗的路線）；減少特效時不建
  shaftAt:function(x,y0,z,r,h,c,op){
    if(PH.opt.lowfx)return null;
    const m=new T3.Mesh(new T3.CylinderGeometry(r*.35,r,h,14,1,true),shaftMat(c,(op||.06)*2.4));m.position.set(x,y0+h/2,z);G.cur.add(m);
    B.motes(x,z,r*1.2,r*1.2,h,10,c,'dust',y0);
    return m;
  },
  // 天花板木樑：框住天空，讓室內有「屋頂」的感覺（高於所有鏡頭高度）
  beam:function(x0,z0,x1,z1,y){const len=Math.hypot(x1-x0,z1-z0),m=rb(len,.22,.26,.05,MT('#6b4430','wood'),(x0+x1)/2,y,(z0+z1)/2);m.rotation.y=-Math.atan2(z1-z0,x1-x0);m.castShadow=false;return m;}
};

/* ---------- 特效介面（世界邏輯透過 PH.FX 呼叫） ---------- */
Object.assign(PH.FX,{
  poof:function(x,y,n,col){
    if(PH.opt.lowfx)n=Math.ceil(n/3);
    for(let i=0;i<n&&G.parts.length<90;i++){const a=Math.random()*6.283,v=0.8+Math.random()*2.2;G.parts.push({x:x,y:.25+Math.random()*.3,z:y,vx:Math.cos(a)*v,vy:1+Math.random()*2.2,vz:Math.sin(a)*v,a:0.5+Math.random()*.4,c:col||'#fff'});}
  },
  ring:function(x,y,rad,kind){
    if(G.rings.length>10)G.rings.shift();
    G.rings.push({x:x,y:y,max:rad,t:0,c:kind==='scent'?'#ff8fa3':(kind==='echo'||kind==='meow'||kind==='roar')?'#ffd23f':'#ffffff'});
  },
  text:function(x,y,s,c){if(G.txt.length>14)G.txt.shift();G.txt.push({x:x,y:y,s:s,c:c||'#fff',t:0});},
  shake:function(v){G.shake=Math.max(G.shake,PH.opt.calm?v*0.12:v);},
  flash:function(c){if(PH.opt.flash)return;G.flashT=0.35;G.flashC=c||'#fff';}
});

/* ---------- 初始化 ---------- */
G.init=function(canvas,overlay){
  cv=canvas;ov=overlay;ox=ov.getContext('2d');
  if(!T3){PH.UI.fatal('3D 函式庫沒有載入成功，請確認 lib/three.min.js 存在後重新整理。');return false;}
  // 手機：關掉抗鋸齒（改用 1.5 倍解析度補）、陰影貼圖減半、用較省電的柔邊陰影
  try{R3=new T3.WebGLRenderer({canvas:cv,antialias:!PH.mobile,powerPreference:PH.mobile?'default':'high-performance'});}catch(e){PH.UI.fatal('這個瀏覽器無法啟動 3D 繪圖（WebGL）。');return false;}
  R3.shadowMap.enabled=!PH.opt.lowfx;R3.shadowMap.type=PH.mobile?T3.PCFShadowMap:T3.PCFSoftShadowMap;
  V3=new T3.Vector3();
  scene=new T3.Scene();
  camera=new T3.PerspectiveCamera(56,1,0.05,400);
  GEO.box=new T3.BoxGeometry(1,1,1);GEO.ico=new T3.IcosahedronGeometry(1,1);GEO.ico2=new T3.IcosahedronGeometry(1,2);GEO.rock=new T3.IcosahedronGeometry(1,0);
  GEO.cyl=new T3.CylinderGeometry(1,1,1,10);GEO.cone=new T3.ConeGeometry(1,1,6);GEO.tri=new T3.ConeGeometry(1,1,3,1);GEO.tri.rotateX(Math.PI);GEO.tri.scale(1,1,0.12);
  GEO.circ=new T3.CircleGeometry(1,40);GEO.ring=new T3.RingGeometry(0.93,1,48);GEO.plane=new T3.PlaneGeometry(1,1);
  GEO.sec60=new T3.CircleGeometry(1,14,0,1.0472);GEO.quad=new T3.CircleGeometry(1,20,0,Math.PI/2);GEO.arc=new T3.CircleGeometry(1,24,-1.2,2.4);
  hemi=new T3.HemisphereLight('#fff','#888',0.7);scene.add(hemi);
  amb=new T3.AmbientLight('#000',1);scene.add(amb);
  sun=new T3.DirectionalLight('#fff',0.6);scene.add(sun);scene.add(sun.target);
  sun.castShadow=!PH.opt.lowfx;const sm=PH.mobile?1024:2048;sun.shadow.mapSize.set(sm,sm);sun.shadow.bias=-0.0006;sun.shadow.normalBias=0.02;
  // 漸層天空球
  const sg=new T3.SphereGeometry(180,24,12);sg.setAttribute('color',new T3.BufferAttribute(new Float32Array(sg.attributes.position.count*3),3));
  sky=new T3.Mesh(sg,new T3.MeshBasicMaterial({vertexColors:true,side:T3.BackSide,fog:false,depthWrite:false}));scene.add(sky);
  G.ok=true;G.scene=scene;G.camera=camera;
  // 輝光（Bloom）：門檻高，只有自發光的主罐、貓縫、燈籠會暈開；減少特效或手機上不開。後製腳本沒載到就直接略過
  try{
    if(T3.EffectComposer&&T3.RenderPass&&T3.UnrealBloomPass){
      G.comp=new T3.EffectComposer(R3);G.comp.addPass(new T3.RenderPass(scene,camera));
      G.bloom=new T3.UnrealBloomPass(new T3.Vector2(256,256),.28,.3,.96);G.comp.addPass(G.bloom);   // 實測：門檻 .88 會把亮色場景整片洗白，調到只有自發光才暈開
    }
  }catch(e){G.comp=null;}
  window.addEventListener('resize',G.resize);G.resize();
  return true;
};
function setSky(top,bot){
  const a=new T3.Color(top),b=new T3.Color(bot),p=sky.geometry.attributes.position,c=sky.geometry.attributes.color,q=new T3.Color();
  for(let i=0;i<p.count;i++){let k=U.clamp(p.getY(i)/180*1.6+0.12,0,1);k=k*k*(3-2*k);q.copy(b).lerp(a,k);c.setXYZ(i,q.r,q.g,q.b);}
  c.needsUpdate=true;
}
G.resize=function(){
  if(!G.ok)return;
  const st=cv.parentElement;cw=st.clientWidth||1;ch=st.clientHeight||1;
  dpr=Math.min(window.devicePixelRatio||1,PH.opt.lowfx?1:PH.mobile?1.5:2);
  R3.setPixelRatio(dpr);R3.setSize(cw,ch,false);
  ov.width=Math.round(cw*dpr);ov.height=Math.round(ch*dpr);
  camera.aspect=cw/ch;camera.updateProjectionMatrix();
  G.cw=cw;G.ch=ch;
  if(G.comp){G.comp.setPixelRatio(dpr);G.comp.setSize(cw,ch);}
};

/* ---------- 建立關卡場景 ---------- */
function run(L,lg,c0,c1,r,g){
  const len=c1-c0+1,x=c0+len/2,z=r+.5,pal=L.def.pal,h=lg.h,m=lg.m;
  const col=lg.col||pal.block,top=lg.top||pal.top;
  switch(m){
  case 'wall':{
    // 灰泥牆＋木護牆板，頂端一條木壓條；全部是霧面手繪貼圖
    const a=add(GEO.box,MT(pal.wall,pal.wallTex||'plaster'),len,h,1,x,h/2,z,g);a.castShadow=false;
    add(GEO.box,MT(pal.trim,'wood'),len+.03,.9,1.03,x,.45,z,g).castShadow=false;
    add(GEO.box,MT(pal.cap||'#F1DFC0','wood'),len+.05,.07,1.05,x,.93,z,g).castShadow=false;
    add(GEO.box,MT('#6b4430','wood'),len+.04,.1,1.04,x,h-.05,z,g).castShadow=false;
    break;}
  case 'counter':{
    // 木櫃：櫃門只畫在面向走道的那一側，門板略歪，魚骨形把手
    const wood=lg.col||pal.block,top=lg.top||pal.top;
    rb(len-.02,h-.14,.98,.05,MT(wood,'wood'),x,(h-.14)/2+.02,z,g);
    rb(len+.04,.12,1.04,.04,MT(top,'wood'),x,h-.06,z,g);
    bx(len-.1,.05,.9,'#3b2a22',x,.025,z,g).castShadow=false;
    const open=function(cc,rr){if(cc<0||rr<0||cc>=L.w||rr>=L.h)return false;const t=L.leg[L.base[rr*L.w+cc]];return !!t&&t.k!=='solid';};
    for(let i=0;i<len;i++){
      const cx=c0+i+.5;
      [-1,1].forEach(function(s){
        if(!open(c0+i,r+s))return;
        const tilt=(((c0+i)*7+r*3+s)%5-2)*.012,d=rb(.8,h*.58,.05,.025,MT(lg.door||'#9a6648','wood'),cx,h*.45,z+s*.5,g);d.rotation.z=tilt;d.castShadow=false;
        const f=fishMesh(g,M('#F3BC68'),.32);f.position.set(cx+.22,h*.62,z+s*.535);
      });
    }
    break;}
  case 'basket':{
    // 一籃蔬菜：裝飾比可互動物件低調
    for(let i=0;i<len;i++){
      const cx=c0+i+.5;cy(.42,h-.08,MT('#b98a5a','weave'),cx,(h-.08)/2,z,g);
      bl(.16,.14,.16,'#6E8D55',cx-.12,h,z+.05,g);bl(.14,.12,.14,'#d9874a',cx+.12,h-.02,z-.08,g);bl(.12,.1,.12,'#c9b26a',cx+.02,h+.04,z+.14,g);
    }
    break;}
  case 'cloudwall':{
    bx(len,h*.7,1,'#efe2d2',x,h*.35,z,g).castShadow=false;
    for(let i=0;i<len;i++){const m2=bl(.62,.5,.62,'#f4eadf',c0+i+.5,h*.72+((c0+i+r)%2)*.12,z,g);m2.castShadow=false;}
    break;}
  case 'rim':{
    add(GEO.box,MT('#b4b9c2','tin'),len,h,1,x,h/2,z,g).castShadow=false;bx(len+.04,.14,1.04,'#E8C77A',x,h-.2,z,g).castShadow=false;add(GEO.box,MT('#8f95a2','tin'),len+.02,.5,1.02,x,.25,z,g).castShadow=false;
    break;}
  case 'block':
    // 手工感：圓角＋手繪貼圖（只是外觀，碰撞照格子）
    rb(len,h,1,Math.min(.08,h*.2),MT(col,lg.tex||pal.blockTex||'wood'),x,h/2,z,g);rb(len+.04,.08,1.04,.03,MT(top,lg.tex||pal.blockTex||'wood'),x,h+.02,z,g);
    if(h>1.6)for(let i=0;i<len;i++)bx(.5,.06,.02,top,c0+i+.5,h*.62,z+.51,g).castShadow=false;
    break;
  case 'gapblock':{
    const lo=lg.lo||.34;
    rb(len,h-lo,1,.05,MT(col,'wood'),x,(h+lo)/2,z,g);rb(len+.04,.08,1.04,.03,MT(top,'wood'),x,h+.02,z,g);
    [c0+.08,c1+.92].forEach(function(px){cy(.06,lo,'#5a3d24',px,lo/2,z-.4,g);cy(.06,lo,'#5a3d24',px,lo/2,z+.4,g);});
    const s=flat(GEO.plane,MB('#1a1022',0.35),x,.011,z,g);s.scale.set(len*.96,.96,1);
    // 小洞入口：從地面視角看得出來的深色拱門，門口有磨損、爪痕和一撮貓毛
    const pass=function(cc,rr){if(cc<0||rr<0||cc>=L.w||rr>=L.h)return false;const t=L.leg[L.base[rr*L.w+cc]];return !!t&&t.k!=='solid';};
    const mouth=function(px,pz,ry,ox,oz){
      const a=new T3.Mesh(GEO.circ,MB('#140c1c',.92));a.scale.set(.3,Math.min(.42,lo*.95),1);a.position.set(px,0,pz);a.rotation.y=ry;g.add(a);
      const rim=new T3.Mesh(GEO.ring,MB('#F1DFC0',.55));rim.scale.set(.33,Math.min(.45,lo*1.02),1);rim.position.set(px,0,pz);rim.rotation.y=ry;g.add(rim);
      for(let k=-1;k<=1;k++){const sc=flat(GEO.plane,MB('#F1DFC0',.45),px+ox*.3+(oz?k*.07:0),.016,pz+oz*.3+(ox?k*.07:0),g);sc.scale.set(ox?.22:.025,ox?.025:.22,1);}
      [[.18,.1],[-.2,.16]].forEach(function(q){const t=bl(.016,.006,.03,'#e9d6b8',px+ox*.42+(oz?q[0]:q[1]*.3),.008,pz+oz*.42+(ox?q[0]:q[1]*.3),g);t.castShadow=false;t.rotation.y=q[0]*5;});   // 一小撮貓毛，壓扁貼地，不像可撿的東西
    };
    for(let i=0;i<len;i++){
      const cc=c0+i,cx=cc+.5;
      if(pass(cc,r-1))mouth(cx,r-.005,0,0,-1);
      if(pass(cc,r+1))mouth(cx,r+1.005,0,0,1);
      if(i===0&&pass(cc-1,r))mouth(cc-.005,z,Math.PI/2,-1,0);
      if(i===len-1&&pass(cc+1,r))mouth(cc+1.005,z,Math.PI/2,1,0);
    }
    break;}
  case 'table':
    bx(len,.1,1,col,x,h-.02,z,g);
    [c0+.12,c1+.88].forEach(function(px){cy(.07,h-.06,'#e58f4e',px,(h-.06)/2,z,g);});
    break;
  case 'sofa':
    rb(len,.3,1,.08,MT('#4f7f74','weave'),x,.38,z,g);rb(len,.62,.34,.1,MT('#3d6b61','weave'),x,.64,z-.33,g);
    rb(.3,.5,1,.1,MT('#3d6b61','weave'),c0+.15,.5,z,g);rb(.3,.5,1,.1,MT('#3d6b61','weave'),c1+.85,.5,z,g);
    for(let i=0;i<len;i++)rb(.8,.12,.6,.05,MT('#F1DFC0','weave'),c0+i+.5,.56,z+.1,g);
    break;
  case 'rack':
    cy(.05,1.5,MT('#805238','wood'),x-.35,.75,z,g);cy(.05,1.5,MT('#805238','wood'),x+.35,.75,z,g);rb(.86,.07,.07,.02,MT('#805238','wood'),x,1.45,z,g);
    bl(.06,.06,.06,'#F3BC68',x-.35,1.52,z,g);bl(.06,.06,.06,'#F3BC68',x+.35,1.52,z,g);
    break;
  case 'fence':
    // 光柵欄：只有影子穿得過
    for(let i=0;i<len*3;i++){const m2=new T3.Mesh(GEO.box,MB('#fff2c4',0.55,true));m2.scale.set(.05,h,.05);m2.position.set(c0+(i+.5)/3,h/2,z);g.add(m2);}
    bx(len,.08,.14,'#c9a24a',x,h+.02,z,g);bx(len,.06,.2,'#c9a24a',x,.03,z,g);
    break;
  case 'grate':
    bx(len,.06,1,'#3a3a4a',x,.03,z,g);
    break;
  case 'pillar':
    for(let i=0;i<len;i++){cy(.44,h,col,c0+i+.5,h/2,z,g);cy(.5,.12,top,c0+i+.5,.06,z,g);cy(.5,.12,top,c0+i+.5,h-.06,z,g);}
    break;
  }
}
G.load=function(L){
  if(!G.ok)return;
  if(root)scene.remove(root);
  root=new T3.Group();scene.add(root);G.cur=root;G.anim.length=0;G.lanterns=0;G.parts.length=0;G.rings.length=0;G.txt.length=0;G.shake=0;
  const def=L.def,pal=def.pal,mood=def.mood,w=L.w,h=L.h;
  scene.fog=new T3.Fog(pal.fog,pal.fogNear,pal.fogFar);
  setSky(pal.sky,pal.sky2||pal.fog);
  hemi.color.set(mood.hemi[0]);hemi.groundColor.set(mood.hemi[1]);hemi.intensity=mood.hemi[2];
  amb.color.set(mood.amb||'#000000');amb.intensity=mood.amb?(mood.ambI||0.6):0;
  // 偷罐後的警戒色：環境光慢慢偏向珊瑚紅並微微脈動（只有設定了 mood.alarm 的關卡）
  G.moodK=0;G.moodBase=new T3.Color(mood.hemi[0]);G.moodAlarm=mood.alarm?new T3.Color(mood.alarm):null;
  sun.color.set(mood.sun[0]);sun.intensity=mood.sun[1];
  const sp=mood.sun[2];sun.position.set(sp[0],sp[1],sp[2]);sun.target.position.set(w/2,0,h/2);
  const sc=sun.shadow.camera,hs=Math.max(w,h)*0.62+4;sc.left=-hs;sc.right=hs;sc.top=hs;sc.bottom=-hs;sc.near=1;sc.far=120;sc.updateProjectionMatrix();
  sun.position.set(w/2+(sp[0]-w/2)*1.2,sp[1]*1.6,h/2+(sp[2]-h/2)*1.2);
  // 地板（每格一塊小磚；變成湯的格子會沉下去）
  const tiles=[];
  for(let r=0;r<h;r++)for(let c=0;c<w;c++){
    const lg=L.leg[L.base[r*w+c]];let fl=null;
    if(lg.fl!=null)fl=lg.fl;else if(lg.k==='gap'||lg.k==='pipe'||lg.k==='shade')fl=0;
    if(fl!=null)tiles.push({c:c,r:r,fl:fl,y:-.15,ty:-.15});
  }
  G.tiles=tiles;
  const fm=new T3.InstancedMesh(new T3.BoxGeometry(.985,.3,.985),new T3.MeshStandardMaterial({color:'#ffffff',map:paint(pal.floorTex||'plank'),roughness:.95}),Math.max(1,tiles.length));
  fm.receiveShadow=true;fm.frustumCulled=false;
  const col=new T3.Color();G.mtx=new T3.Matrix4();
  tiles.forEach(function(q,i){
    const odd=(q.c+q.r)%2;
    col.set(q.fl===2?(pal.floor[4]||'#7fd0e6'):pal.floor[(q.fl?2:0)+odd]||pal.floor[odd]);
    fm.setColorAt(i,col);G.mtx.makeTranslation(q.c+.5,q.y,q.r+.5);fm.setMatrixAt(i,G.mtx);
  });
  if(fm.instanceColor)fm.instanceColor.needsUpdate=true;
  root.add(fm);G.floor=fm;G.floorRev=-1;G.floorAnim=false;
  // 牆、櫃子、家具：同一列連續的相同格子合併成一個長方塊
  const tg=gp(0,0,0);
  for(let r=0;r<h;r++){
    let c=0;
    while(c<w){
      const chh=L.base[r*w+c],lg=L.leg[chh];
      if(!lg.m||lg.m==='none'){c++;continue;}
      let c2=c;while(c2+1<w&&L.base[r*w+c2+1]===chh)c2++;
      run(L,lg,c,c2,r,tg);c=c2+1;
    }
  }
  // 影子帶：預設的陰影表面
  for(let r=0;r<h;r++){
    let c=0;
    while(c<w){
      if(!L.shade[r*w+c]||L.leg[L.base[r*w+c]].k==='shade'){c++;continue;}
      let c2=c;while(c2+1<w&&L.shade[r*w+c2+1]&&L.leg[L.base[r*w+c2+1]].k!=='shade')c2++;
      const s=flat(GEO.plane,MB('#140a26',0.42),(c+c2+1)/2,.013,r+.5);s.scale.set(c2-c+1,1,1);c=c2+1;
    }
  }
  // 湯／海
  G.liquid=null;
  if(pal.liquid){
    // 湯／水面：簡化平面＋緩慢流動的手繪漩渦，不做流體模擬
    const lt=paint('swirl').clone();lt.needsUpdate=true;lt.wrapS=lt.wrapT=T3.RepeatWrapping;lt.repeat.set((w+30)/3,(h+30)/3);
    G.liquid=add(GEO.box,new T3.MeshStandardMaterial({color:pal.liquid,map:lt,roughness:.55,transparent:true,opacity:.94}),w+30,.3,h+30,w/2,pal.liquidY,h/2);
    G.liquid.castShadow=false;G.ly=pal.liquidY;G.liqTex=lt;
  }
  // 地基：關卡外圍的底色
  const base=bx(w+60,.4,h+60,pal.fog,w/2,pal.liquid?-1.9:-.52,h/2);base.castShadow=false;
  G.buildWorld(L);
  if(def.build)def.build(B,L);
  G.cd=2.3;G.chh=.95;G.cl=.5;G.look=new T3.Vector3(L.def.start.x,.5,L.def.start.y);G.want=new T3.Vector3();G.lookp=new T3.Vector3();
  PH.S.camSnap=true;
};
function updFloor(L,dt){
  if(G.floorRev!==L.rev){
    G.floorRev=L.rev;
    for(const q of G.tiles){const k=W.kind(q.c,q.r);q.ty=k==='hazard'?-.8:-.15;if(q.ty!==q.y)G.floorAnim=true;}
  }
  if(G.floorAnim){
    let any=false;
    G.tiles.forEach(function(q,i){
      if(q.y===q.ty)return;
      const d=q.ty-q.y,st=dt*(d<0?0.9:1.6)*(1+((q.c*7+q.r*13)%5)*0.25);
      q.y=Math.abs(d)<=st?q.ty:q.y+Math.sign(d)*st;any=true;
      G.mtx.makeTranslation(q.c+.5,q.y,q.r+.5);G.floor.setMatrixAt(i,G.mtx);
    });
    G.floor.instanceMatrix.needsUpdate=true;G.floorAnim=any;
  }
  if(G.liquid){
    const pal=L.def.pal,tg=pal.liquidRise&&L.f[pal.liquidRise]?-.3:pal.liquidY;
    G.ly+=(tg-G.ly)*Math.min(1,dt*1.4);G.liquid.position.y=G.ly+Math.sin(G.t*1.3)*.015;
    if(G.liqTex){G.liqTex.offset.x=(G.liqTex.offset.x+dt*.018)%1;G.liqTex.offset.y=Math.sin(G.t*.4)*.04;}
  }
}

/* ---------- 鏡頭：貼在貓背後、略高；會被牆與家具擋住，不穿牆、不拉成俯瞰 ---------- */
function camBlock(x,y,z){
  if(y<0.07)return true;
  const b=W.camBox(Math.floor(x),Math.floor(z));
  return !!b&&y>b[0]-.05&&y<b[1]+.08;
}
function camRay(ax,ay,az,bx_,by,bz){
  const Lr=Math.hypot(bx_-ax,by-ay,bz-az),n=Math.max(1,Math.ceil(Lr/.07));
  for(let i=1;i<=n;i++){const t=i/n;if(camBlock(ax+(bx_-ax)*t,ay+(by-ay)*t,az+(bz-az)*t))return Math.max(.1,(i-2)/n);}
  return 1;
}
G.camSees=function(x,y,z){
  const cp=camera.position,dx=x-cp.x,dy=y-cp.y,dz=z-cp.z,Lr=Math.hypot(dx,dy,dz);
  camera.getWorldDirection(V3);
  if((dx*V3.x+dy*V3.y+dz*V3.z)/Math.max(.001,Lr)<.55)return false;
  return camRay(cp.x,cp.y,cp.z,x,y,z)>=1;
};
G.toScreen=function(x,y,z){
  V3.set(x,y,z).applyMatrix4(camera.matrixWorldInverse);const front=V3.z<-.05;V3.applyMatrix4(camera.projectionMatrix);
  return {x:(V3.x*.5+.5)*cw,y:(-V3.y*.5+.5)*ch,front:front};
};
// 原本的每幀係數是以 60fps 調的；換算成跟幀率無關，120／144Hz 螢幕上手感才一致
function ease(k60,dt){return 1-Math.pow(1-k60,Math.min(0.1,dt)*60);}
function updCamera(dt){
  const L=PH.L,P=PH.P,S=PH.S,F=PH.FORMS[P.form].cam;
  const snap=S.camSnap;S.camSnap=false;
  if(S.mode==='title'||S.mode==='ending'){
    const a=G.t*.12,cx=L.w/2-1,cz=L.h/2;
    camera.position.set(cx+Math.cos(a)*3.2,2.5,cz+Math.sin(a)*2.6);camera.lookAt(cx-Math.cos(a)*1.5,.6,cz-Math.sin(a)*1.5);
    sky.position.copy(camera.position);return;
  }
  if(S.mode==='cut'&&G.cut){
    const a=G.t*.5,q=G.cut;
    G.want.set(q.x+Math.cos(a)*2.7,1.5,q.y+Math.sin(a)*2.7);camera.position.lerp(G.want,snap?1:.08);
    G.look.lerp(G.lookp.set(q.x,.55,q.y),.15);camera.lookAt(G.look);sky.position.copy(camera.position);return;
  }
  const fx=Math.cos(S.yaw),fz=Math.sin(S.yaw),px=P.x,pz=P.y;
  const far=(PH.Boss&&PH.Boss.active)?1.45:1;
  const e8=ease(.08,dt);G.cd+=(F.d*far-G.cd)*e8;G.chh+=(F.h*far-G.chh)*e8;G.cl+=(F.l-G.cl)*e8;
  if(P.hidden&&P.hidden.t==='box'){
    // 紙箱裡：只能從縫往外看，掀蓋看得多也更暴露
    const ey=.34+P.lift*.16;
    G.want.set(px-fx*.1,ey,pz-fz*.1);G.lookp.set(px+fx*2,ey+S.pitch*1.4,pz+fz*2);
    camera.position.lerp(G.want,snap?1:ease(.35,dt));G.look.lerp(G.lookp,snap?1:ease(.45,dt));
  }else{
    const m=P.lean*.55,tx=px-fz*m,tz=pz+fx*m,ty=G.cl+.05+(P.fz||0);
    const d=G.cd*(1-Math.abs(P.lean)*.3),cyy=Math.max(.14,G.chh-S.pitch*d*.75+(P.fz||0));
    const k=camRay(tx,ty,tz,tx-fx*d,cyy,tz-fz*d);
    G.want.set(tx-fx*d*k,ty+(cyy-ty)*k,tz-fz*d*k);
    G.lookp.set(tx+fx*1.1,G.cl+S.pitch*1.9+(P.fz||0),tz+fz*1.1);
    camera.position.lerp(G.want,snap?1:ease(.28,dt));G.look.lerp(G.lookp,snap?1:ease(.32,dt));
  }
  if(G.shake>0.05){camera.position.x+=(Math.random()-.5)*G.shake*.012;camera.position.y+=(Math.random()-.5)*G.shake*.012;G.shake*=Math.pow(.02,dt);}
  camera.lookAt(G.look);
  sky.position.copy(camera.position);
}

/* ---------- 粒子、聲音圈 ---------- */
function updFx(dt){
  const pool=G.pool;
  for(let i=G.parts.length-1;i>=0;i--){const p=G.parts[i];p.a-=dt*1.1;p.vy-=6*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(p.y<.03){p.y=.03;p.vy*=-.3;}if(p.a<=0)G.parts.splice(i,1);}
  for(let i=0;i<pool.parts.length;i++){
    const m=pool.parts[i],p=G.parts[i];
    if(!p){m.visible=false;continue;}
    m.visible=true;m.position.set(p.x,p.y,p.z);const s=.025+p.a*.035;m.scale.set(s,s,s);m.material.color.set(p.c);
  }
  for(let i=G.rings.length-1;i>=0;i--){const r=G.rings[i];r.t+=dt;if(r.t>.9)G.rings.splice(i,1);}
  for(let i=0;i<pool.rings.length;i++){
    const m=pool.rings[i],r=G.rings[i];
    if(!r){m.visible=false;continue;}
    const k=r.t/.9,s=Math.max(.2,r.max*k);
    m.visible=true;m.position.set(r.x,.06,r.y);m.scale.set(s,s,1);m.material.color.set(r.c);m.material.opacity=(1-k)*.7;
  }
}

/* ---------- 2D 疊層：浮字、狗的狀態圖示、目標指示、畫縫模式 ---------- */
function icon(x,y,type,ch_,s){
  const c=ox;s=s||13;
  c.beginPath();
  if(type==='tri'){c.moveTo(x,y-s);c.lineTo(x+s,y+s*.8);c.lineTo(x-s,y+s*.8);}
  else if(type==='dia'){c.moveTo(x,y-s);c.lineTo(x+s,y);c.lineTo(x,y+s);c.lineTo(x-s,y);}
  else c.arc(x,y,s,0,6.3);
  c.closePath();c.fill();c.lineWidth=2.5;c.strokeStyle='#2b1b2e';c.stroke();
  c.fillStyle='#2b1b2e';c.font='800 '+Math.round(s*1.15)+'px '+FONT;c.textAlign='center';c.textBaseline='middle';c.fillText(ch_,x,y+(type==='tri'?s*.25:1));
}
const ICONS={chase:['tri','#ef5d50','!'],inspect:['tri','#ef5d50','嗅'],sus:['dia','#ffd23f','?'],search:['dia','#ffd23f','…'],stun:['cir','#ffffff','@'],
  sleep:['cir','#bfe0ff','Z'],seal:['dia','#ffd23f','封'],wipe:['cir','#7fd0e6','擦'],shield:['cir','#7fd0e6','盾'],spawn:['tri','#ef5d50','↓']};
function fishbone(x,y,s,col){
  const c=ox;c.strokeStyle=col;c.lineWidth=3;c.lineCap='round';
  c.beginPath();c.moveTo(x-s,y);c.lineTo(x+s*.8,y);
  for(let i=-1;i<=1;i++){c.moveTo(x+i*s*.45,y-s*.5);c.lineTo(x+i*s*.45,y+s*.5);}
  c.moveTo(x+s*.8,y);c.lineTo(x+s*1.25,y-s*.4);c.moveTo(x+s*.8,y);c.lineTo(x+s*1.25,y+s*.4);c.stroke();
  c.beginPath();c.arc(x-s*1.15,y,s*.28,0,6.3);c.fillStyle=col;c.fill();
}
function edge(p,m){
  if(!p.front){p.x=cw-p.x;p.y=ch+99;}
  p.off=p.x<m||p.x>cw-m||p.y<60||p.y>ch-100||!p.front;
  p.x=U.clamp(p.x,m,cw-m);p.y=U.clamp(p.y,64,ch-104);return p;
}
function drawOverlay(dt){
  const L=PH.L,P=PH.P,S=PH.S,SM=PH.Seams,c=ox;
  c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,cw,ch);
  if(G.flashT>0){G.flashT-=dt;c.globalAlpha=Math.max(0,G.flashT)*1.2;c.fillStyle=G.flashC;c.fillRect(0,0,cw,ch);c.globalAlpha=1;}
  if(S.mode==='title'||S.mode==='ending')return;
  // 浮字
  for(let i=G.txt.length-1;i>=0;i--){
    const t=G.txt[i];t.t+=dt;if(t.t>1.5){G.txt.splice(i,1);continue;}
    const p=G.toScreen(t.x,1.1+t.t*.7,t.y);if(!p.front)continue;
    c.globalAlpha=Math.min(1,(1.5-t.t)*2);c.font='800 17px '+FONT;c.textAlign='center';c.textBaseline='middle';
    c.lineWidth=4;c.strokeStyle='#2b1b2e';c.strokeText(t.s,p.x,p.y);c.fillStyle=t.c;c.fillText(t.s,p.x,p.y);c.globalAlpha=1;
  }
  // 狗的狀態（只有鏡頭真的看得到牠時才畫，不透牆）
  for(const d of L.dogs){
    if(!d.active)continue;
    const hy=d.K.heavy?1.25:d.kind==='corgi'?.95:1.2;
    if(!G.camSees(d.x,hy-.3,d.y))continue;
    const p=G.toScreen(d.x,hy+.25,d.y),ic=ICONS[PH.Dogs.icon(d)];
    if(ic){c.fillStyle=ic[1];icon(p.x,p.y-10,ic[0],ic[2],12);}
    if(d.meter>.05&&d.state!=='chase'&&d.state!=='pounce'&&d.stunT<=0){
      c.fillStyle='rgba(43,27,46,.8)';c.fillRect(p.x-22,p.y+6,44,7);c.fillStyle=d.meter>.7?'#ef5d50':'#ffd23f';c.fillRect(p.x-21,p.y+7,42*d.meter,5);
    }
    if(d.sleepy>.1&&d.stunT<=0){c.fillStyle='#8fc3b4';c.fillRect(p.x-21,p.y+15,42*Math.min(1,d.sleepy/2.5),4);}
  }
  // 目標指示（地圖罐的導航）
  const ob=PH.Game.obj;
  if(ob&&ob.x!=null&&PH.opt.hints&&S.mode==='play'&&!SM.draw){
    const p=edge(G.toScreen(ob.x,1.5,ob.y),26),bob=Math.sin(G.t*4)*4;
    c.fillStyle='#ffd23f';c.strokeStyle='#2b1b2e';c.lineWidth=2.5;
    if(p.off){
      const a=Math.atan2(p.y-ch/2,p.x-cw/2);c.save();c.translate(p.x,p.y);c.rotate(a);
      c.beginPath();c.moveTo(14,0);c.lineTo(-8,-10);c.lineTo(-8,10);c.closePath();c.fill();c.stroke();c.restore();
    }else{c.beginPath();c.moveTo(p.x,p.y+10+bob);c.lineTo(p.x-9,p.y-6+bob);c.lineTo(p.x+9,p.y-6+bob);c.closePath();c.fill();c.stroke();}
  }
  // 縫點的螢幕位置（畫縫模式的點選依據）
  SM.screen.length=0;
  if(SM.draw){
    const D=SM.draw;
    c.fillStyle='rgba(20,12,36,.28)';c.fillRect(0,0,cw,ch);
    for(const a of L.by.anchor){
      if(!a.found||(a.off&&L.f[a.off]))continue;
      const p=edge(G.toScreen(a.x,.55,a.y),30),start=SM.startable(a),bad=a.sealUntil||a.wipedUntil||a.sealing>0||!W.anchorOn(a);
      SM.screen.push({a:a,x:p.x,y:p.y,start:start});
      const pul=1+Math.sin(G.t*6)*.12,rad=(start?21:16)*(start&&!D.from?pul:1);
      c.beginPath();c.arc(p.x,p.y,rad,0,6.3);
      c.fillStyle=bad?'rgba(120,120,130,.85)':a===D.from?'#ffd23f':a===D.hover?(D.res&&D.res.ok?'#8fe3b4':'#ef5d50'):start?'rgba(127,208,230,.95)':'rgba(251,238,214,.9)';
      c.fill();c.lineWidth=3;c.strokeStyle='#2b1b2e';c.stroke();
      fishbone(p.x+1,p.y,9,'#2b1b2e');
      if(bad){c.strokeStyle='#ef5d50';c.lineWidth=4;c.beginPath();c.moveTo(p.x-12,p.y-12);c.lineTo(p.x+12,p.y+12);c.moveTo(p.x+12,p.y-12);c.lineTo(p.x-12,p.y+12);c.stroke();}
      c.font='800 13px '+FONT;c.textAlign='center';c.textBaseline='top';c.lineWidth=3;c.strokeStyle='#2b1b2e';
      c.strokeText(a.name,p.x,p.y+rad+3);c.fillStyle='#fbeed6';c.fillText(a.name,p.x,p.y+rad+3);
    }
    if(D.fresh){        // 進入模式時，起點已選好：把指標放到建議的終點（沒有的話放在起點）
      D.fresh=false;let b=null;
      const cs=SM.cands(D.from);let tgt=null;
      for(const x of cs){const ok=SM.check(D.from,x).ok;if(!tgt||(ok&&!tgt.ok))tgt={a:x,ok:ok};}
      for(const s of SM.screen){if(tgt&&s.a===tgt.a)b=s;}
      if(!b)for(const s of SM.screen)if(s.a===D.from)b=s;
      if(tgt){D.hover=tgt.a;D.res=SM.check(D.from,tgt.a);}
      if(b&&D.cx<0){D.cx=b.x;D.cy=b.y;if(PH.UI.setCursor)PH.UI.setCursor(b.x,b.y);}
    }
    if(D.from){
      let fp=null,hp=null;
      for(const s of SM.screen){if(s.a===D.from)fp=s;if(s.a===D.hover)hp=s;}
      if(fp){
        const ex=hp?hp.x:D.cx,ey=hp?hp.y:D.cy,ok=D.res&&D.res.ok;
        c.strokeStyle=hp?(ok?'#8fe3b4':'#ef5d50'):'#7fd0e6';c.lineWidth=5;c.setLineDash([10,7]);c.lineDashOffset=-G.t*40;
        c.beginPath();c.moveTo(fp.x,fp.y);c.lineTo(ex,ey);c.stroke();c.setLineDash([]);
        if(D.res){
          const tx=(fp.x+ex)/2,ty=(fp.y+ey)/2-16,s=ok?D.res.dist.toFixed(1)+' 公尺　消耗 '+D.res.cost+'　點一下確認':D.res.why;
          c.font='800 15px '+FONT;c.textAlign='center';c.textBaseline='middle';
          const wd=c.measureText(s).width+18;c.fillStyle=ok?'#8fe3b4':'#ef5d50';c.fillRect(U.clamp(tx-wd/2,6,cw-wd-6),ty-14,wd,28);
          c.fillStyle='#2b1b2e';c.fillText(s,U.clamp(tx,wd/2+6,cw-wd/2-6),ty+1);
        }
      }
    }
    // 貓掌指標
    if(D.cx>=0){c.fillStyle='#fbeed6';c.strokeStyle='#2b1b2e';c.lineWidth=2.5;c.beginPath();c.arc(D.cx,D.cy,7,0,6.3);c.fill();c.stroke();
      for(let i=-1;i<=1;i++){c.beginPath();c.arc(D.cx+i*7,D.cy-10+Math.abs(i)*3,3.4,0,6.3);c.fill();c.stroke();}}
    // 專注值
    const fk=P.focus/PH.CFG.seam.focusMax;c.fillStyle='rgba(43,27,46,.8)';c.fillRect(cw/2-71,ch-196,142,12);c.fillStyle=fk>0?'#7fd0e6':'#777';c.fillRect(cw/2-70,ch-195,140*fk,10);   // 實測：放在 ch-150 會被底部提示框壓住
    c.font='800 12px '+FONT;c.textAlign='center';c.textBaseline='bottom';c.fillStyle='#fbeed6';c.fillText(fk>0?'畫縫專注（時間變慢）':'專注用完，時間恢復正常',cw/2,ch-199);
  }
}
G.draw=function(dt){
  if(!G.ok||!PH.L||!PH.P)return;
  const L=PH.L;G.t+=dt;
  updFloor(L,dt);
  G.sync(L,PH.P,G.t,dt);
  for(const f of G.anim)f(G.t,dt);
  if(L.def.draw)L.def.draw(L,G.t);
  updCamera(dt);
  updFx(dt);
  if(G.moodAlarm){
    G.moodK+=((L.theft?1:0)-G.moodK)*Math.min(1,dt*.8);
    const pulse=PH.opt.flash?0:Math.sin(G.t*2.4)*.08;
    hemi.color.copy(G.moodBase).lerp(G.moodAlarm,U.clamp(G.moodK*(.32+pulse),0,1));
  }
  if(G.comp&&!PH.opt.lowfx&&!PH.mobile){
    try{G.comp.render(dt);}catch(e){G.comp=null;R3.render(scene,camera);}   // 後製出錯就退回一般繪製，不讓畫面黑掉
  }else R3.render(scene,camera);
  drawOverlay(dt);
  watchFps(dt);
};
G.setLow=function(){if(R3){R3.shadowMap.enabled=!PH.opt.lowfx;sun.castShadow=!PH.opt.lowfx;G.resize();}};
// 掉幀偵測：遊玩中連續幾秒平均低於約 28fps，自動切到「減少特效」（每次開遊戲最多一次）
const fw={t:0,n:0,done:false};
function watchFps(dt){
  if(fw.done||PH.opt.lowfx||PH.S.mode!=='play'||dt<=0)return;
  fw.t+=dt;fw.n++;
  if(fw.t<4)return;
  const avg=fw.t/fw.n;fw.t=0;fw.n=0;
  if(avg>1/28){
    fw.done=true;PH.opt.lowfx=true;G.setLow();PH.saveGame();
    const b=document.getElementById('o_lowfx');if(b)b.checked=true;
    PH.UI.say('畫面有點卡，已自動切換成「減少特效」。可以在設定裡關掉。',5);
  }
}
})();
