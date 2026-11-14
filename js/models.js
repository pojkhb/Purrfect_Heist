/* 模型：貓（五種形態）、狗（九種）、月亮總督、機關與物件。全部用簡單幾何體拼成軟陶玩具風。 */
(function(){
'use strict';
const PH=window.PH,U=PH.U,W=PH.World,G=PH.GFX,H=G.h,T3=H.T3;
const M=H.M,MB=H.MB,MT=H.MT,add=H.add,bx=H.bx,bl=H.bl,cy=H.cy,cn=H.cn,gp=H.gp,flat=H.flat,rb=H.rb,GEO=H.GEO;
const EB={},ES={};
const CANCOL={prologue:'#8fc3b4',kitchen:'#F6CD79',laundry:'#ff8f6a',museum:'#5a4a9a',market:'#ffd23f',moon:'#fff2c4',escape:'#fff2c4'};
function basic(c,op,addv){return new T3.MeshBasicMaterial({color:c,transparent:true,opacity:op==null?1:op,depthWrite:false,side:T3.DoubleSide,blending:addv?T3.AdditiveBlending:T3.NormalBlending});}
function tor(R,r,c,x,y,z,p){return add(new T3.TorusGeometry(R,r,6,12),c,1,1,1,x,y,z,p);}

function makeCan(p,col){
  const g=gp(0,0,0,p);
  cy(.13,.2,'#dfe6ec',0,.1,0,g);cy(.137,.1,col||'#3fa9e0',0,.1,0,g);bl(.05,.035,.03,'#ffffff',0,.1,.13,g);cy(.1,.02,'#f7fafc',0,.205,0,g);
  return g;
}
function fishboneMesh(p,mat,s){
  const g=gp(0,0,0,p);
  add(GEO.box,mat,.5*s,.05*s,.05*s,0,0,0,g);
  [-.14,0,.14].forEach(function(dx){add(GEO.box,mat,.05*s,.24*s,.05*s,dx*s,0,0,g);});
  add(GEO.ico,mat,.07*s,.07*s,.05*s,-.3*s,0,0,g);
  add(GEO.box,mat,.16*s,.045*s,.05*s,.3*s,.05*s,0,g).rotation.z=.7;add(GEO.box,mat,.16*s,.045*s,.05*s,.3*s,-.05*s,0,g).rotation.z=-.7;
  g.children.forEach(function(m){m.castShadow=false;m.receiveShadow=false;});
  return g;
}

/* ---------- 咪嚕 ---------- */
/* 咪嚕：奶油橘白小貓，像精緻的手作公仔。
   身體是一整條車床曲線（臀部→腰→胸→往上彎的脖子），頭是壓扁臉的球，毛色與斑紋畫在頂點色上；
   尾巴是每幀重算的連續彎管；外面一圈深色描邊（反向外殼），童話繪本感、也讓輪廓從背後一眼認得。 */
const CATC={OR:'#D99556',CR:'#F6E7CF',DK:'#b9733f',PK:'#e7a29a',EY:'#2b1b2e',LINE:'#2b1b2e'};
let CATG=null;
function sstep(a,b,v){const t=U.clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);}
function paintGeo(geo,fn){
  const p=geo.attributes.position,col=new Float32Array(p.count*3),c=new T3.Color();
  for(let i=0;i<p.count;i++){fn(p.getX(i),p.getY(i),p.getZ(i),c);col[i*3]=c.r;col[i*3+1]=c.g;col[i*3+2]=c.b;}
  geo.setAttribute('color',new T3.BufferAttribute(col,3));return geo;
}
// 描邊用的外殼：每個頂點沿法線往外推 w
function hullGeo(geo,w){
  const g=geo.clone(),p=g.attributes.position,n=g.attributes.normal;
  for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+n.getX(i)*w,p.getY(i)+n.getY(i)*w,p.getZ(i)+n.getZ(i)*w);
  if(g.attributes.color)g.deleteAttribute('color');
  return g;
}
function catGeo(){
  if(CATG)return CATG;
  const OR=new T3.Color(CATC.OR),CR=new T3.Color(CATC.CR),DK=new T3.Color(CATC.DK),W=.012;
  // 身體：沿長度方向的半徑剖面（尾端→臀→腰→胸→脖子）
  const prof=[[.001,-.31],[.08,-.3],[.14,-.27],[.172,-.21],[.18,-.14],[.168,-.06],[.152,.01],[.158,.08],[.165,.14],[.15,.21],[.118,.27],[.092,.31],[.06,.345],[.001,.36]].map(function(q){return new T3.Vector2(q[0],q[1]);});
  const body=new T3.LatheGeometry(prof,22,Math.PI/2);   // 接縫轉到肚子下面
  body.rotateZ(-Math.PI/2);body.scale(1,1,.9);
  const bp=body.attributes.position,pre=new Float32Array(bp.count);
  for(let i=0;i<bp.count;i++){const x=bp.getX(i),y=bp.getY(i);pre[i]=y;bp.setY(i,y+.24+(x>.06?(x-.06)*(x-.06)*1.6:0));}   // 前段往上彎成脖子
  body.computeVertexNormals();
  let k=0;
  paintGeo(body,function(x,y,z,c){
    const yy=pre[k++];c.copy(OR);
    c.lerp(CR,Math.max(sstep(-.04,-.11,yy),sstep(.12,.22,x)*sstep(.06,-.04,yy)));            // 肚子、胸口奶油色
    if(yy>.07)[-.17,-.07,.03].forEach(function(cx){c.lerp(DK,(1-sstep(.012,.026,Math.abs(x-cx)))*.85);});   // 背上三道斑紋
  });
  // 頭：臉稍微壓平，吻部與下巴奶油色、額頭三道細紋
  const head=new T3.SphereGeometry(1,28,20);head.scale(.2,.18,.205);
  const hp=head.attributes.position;for(let i=0;i<hp.count;i++){const x=hp.getX(i);if(x>.1)hp.setX(i,.1+(x-.1)*.8);}
  head.computeVertexNormals();
  paintGeo(head,function(x,y,z,c){
    c.copy(OR);c.lerp(CR,Math.max(sstep(.08,.15,x)*sstep(.0,-.05,y),sstep(-.1,-.15,y)));
    if(y>.11&&x>-.06&&x<.1){const az=Math.abs(z);c.lerp(DK,(az<.016||(az>.045&&az<.064))?.85:0);}
  });
  // 腿：粗短，腳掌奶油色
  const leg=new T3.LatheGeometry([[.001,-.155],[.04,-.152],[.058,-.138],[.06,-.118],[.05,-.095],[.046,-.05],[.05,0],[.052,.03],[.001,.05]].map(function(q){return new T3.Vector2(q[0],q[1]);}),14);
  leg.computeVertexNormals();
  paintGeo(leg,function(x,y,z,c){c.copy(OR).lerp(CR,sstep(-.09,-.115,y));});
  const ear=new T3.ConeGeometry(1,1,12);ear.scale(.035,.15,.075);ear.translate(0,.075,0);
  const earIn=new T3.ConeGeometry(1,1,10);earIn.scale(.012,.1,.05);earIn.translate(.022,.06,0);
  const wh=new T3.CylinderGeometry(.004,.0015,1,4);wh.rotateX(Math.PI/2);wh.translate(0,0,.5);   // 鬍鬚：沿 +z 長出去
  CATG={body:body,bodyH:hullGeo(body,W),head:head,headH:hullGeo(head,W),leg:leg,legH:hullGeo(leg,W),ear:ear,earH:hullGeo(ear,W*.8),earIn:earIn,wh:wh,ball:new T3.SphereGeometry(1,16,12)};
  return CATG;
}
// 連續彎管（尾巴）：S 段、每圈 R 個頂點，形狀每幀用 setTube 更新
function tubeGeo(S,R,colored){
  const n=(S+1)*(R+1),g=new T3.BufferGeometry(),idx=[];
  g.setAttribute('position',new T3.BufferAttribute(new Float32Array(n*3),3));
  g.setAttribute('normal',new T3.BufferAttribute(new Float32Array(n*3),3));
  for(let i=0;i<S;i++)for(let j=0;j<R;j++){const a=i*(R+1)+j,b=a+R+1,c=b+1,d=a+1;idx.push(a,d,b,b,d,c);}
  g.setIndex(idx);
  if(colored){
    const col=new Float32Array(n*3),OR=new T3.Color(CATC.OR),CR=new T3.Color(CATC.CR),c=new T3.Color();
    for(let i=0;i<=S;i++){c.copy(OR).lerp(CR,sstep(.72,.82,i/S));for(let j=0;j<=R;j++){const q=(i*(R+1)+j)*3;col[q]=c.r;col[q+1]=c.g;col[q+2]=c.b;}}
    g.setAttribute('color',new T3.BufferAttribute(col,3));
  }
  g.userData={S:S,R:R};return g;
}
const TV={t:new T3.Vector3(),n:new T3.Vector3(),b:new T3.Vector3(),z:new T3.Vector3(0,0,1)};
function setTube(g,pts,rad){
  const S=g.userData.S,R=g.userData.R,pa=g.attributes.position.array,na=g.attributes.normal.array,T=TV.t,N=TV.n,Bv=TV.b;
  for(let i=0;i<=S;i++){
    const p0=pts[Math.max(0,i-1)],p1=pts[Math.min(S,i+1)],p=pts[i];
    T.set(p1[0]-p0[0],p1[1]-p0[1],p1[2]-p0[2]).normalize();
    N.crossVectors(TV.z,T);if(N.lengthSq()<1e-6)N.set(0,1,0);N.normalize();Bv.crossVectors(T,N).normalize();
    for(let j=0;j<=R;j++){
      const th=j/R*6.2832,cs=Math.cos(th),sn=Math.sin(th),q=(i*(R+1)+j)*3;
      const dx=cs*N.x+sn*Bv.x,dy=cs*N.y+sn*Bv.y,dz=cs*N.z+sn*Bv.z;
      pa[q]=p[0]+dx*rad[i];pa[q+1]=p[1]+dy*rad[i];pa[q+2]=p[2]+dz*rad[i];na[q]=dx;na[q+1]=dy;na[q+2]=dz;
    }
  }
  g.attributes.position.needsUpdate=true;g.attributes.normal.needsUpdate=true;
}
function makeCat(L){
  const CG=catGeo(),o={},g=o.g=gp(),n=o.norm=gp(0,0,0,g),b=o.body=gp(0,0,0,n);
  const skin=new T3.MeshStandardMaterial({vertexColors:true,roughness:.88}),line=new T3.MeshBasicMaterial({color:CATC.LINE,side:T3.BackSide});
  const part=function(geo,hull,mat,p,x,y,z){const m=new T3.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.castShadow=true;m.receiveShadow=true;p.add(m);
    if(hull){const h=new T3.Mesh(hull,line);m.add(h);}return m;};
  part(CG.body,CG.bodyH,skin,b);
  [-1,0,1].forEach(function(s){const m=cn(.03,.08,CATC.CR,.3,.27-.03*Math.abs(s),s*.045,b);m.rotation.z=-2.3;m.castShadow=false;});   // 胸前毛束
  const h=o.head=gp(.3,.43,0,b);
  part(CG.head,CG.headH,skin,h);
  // 臉：大眼睛＋兩個高光、吻部兩團、下巴、粉紅鼻子、鬍鬚、腮紅
  const eyeM=new T3.MeshStandardMaterial({color:CATC.EY,roughness:.25}),hiM=new T3.MeshBasicMaterial({color:'#ffffff'}),crM=M(CATC.CR),pkM=M(CATC.PK);
  [-1,1].forEach(function(s){
    const e=new T3.Mesh(CG.ball,eyeM);e.scale.set(.026,.054,.042);e.position.set(.158,.028,s*.085);e.rotation.y=-s*.5;h.add(e);
    const h1=new T3.Mesh(CG.ball,hiM);h1.scale.setScalar(.011);h1.position.set(.18,.052,s*.075);h.add(h1);
    const h2=new T3.Mesh(CG.ball,hiM);h2.scale.setScalar(.005);h2.position.set(.18,.008,s*.096);h.add(h2);
    const mz=new T3.Mesh(CG.ball,crM);mz.scale.set(.045,.038,.042);mz.position.set(.162,-.058,s*.03);h.add(mz);
    const bl_=new T3.Mesh(CG.ball,MB(CATC.PK,.55));bl_.scale.set(.012,.022,.03);bl_.position.set(.13,-.045,s*.13);h.add(bl_);
    for(let k=-1;k<=1;k++){const w=new T3.Mesh(CG.wh,crM);w.scale.z=.15+(k===0?.02:0);w.position.set(.17,-.055+k*.012,s*.055);w.rotation.set(-s*k*.18,s>0?.3:Math.PI-.3,0);h.add(w);}
    const ep=gp(-.03,.13,s*.105,h);ep.rotation.x=s*.28;
    part(CG.ear,CG.earH,M(CATC.OR),ep);const ei=new T3.Mesh(CG.earIn,pkM);ep.add(ei);
    (o.ears=o.ears||[]).push(ep);
  });
  const ch=new T3.Mesh(CG.ball,crM);ch.scale.set(.034,.028,.038);ch.position.set(.14,-.095,0);h.add(ch);
  const ns=new T3.Mesh(CG.ball,pkM);ns.scale.set(.02,.015,.026);ns.position.set(.198,-.03,0);h.add(ns);
  // 腿：前腳掛在身體上（坐下時跟著撐直），後腳掛在根節點（坐下時往前折）
  o.legs=[];
  [[.15,.1,b],[.15,-.1,b],[-.16,.1,n],[-.16,-.1,n]].forEach(function(q,i){const l=gp(q[0],.15,q[1],q[2]);const m=part(CG.leg,CG.legH,skin,l);if(i>1)m.scale.set(1.18,1,1.18);o.legs.push(l);});
  // 尾巴：連續彎管＋同形狀但粗一圈的描邊管
  o.tail=gp(-.28,.27,0,b);
  o.tailG=tubeGeo(16,8,true);o.tailH=tubeGeo(16,8,false);
  const tm=new T3.Mesh(o.tailG,skin);tm.castShadow=true;tm.frustumCulled=false;o.tail.add(tm);
  const th=new T3.Mesh(o.tailH,line);th.frustumCulled=false;o.tail.add(th);
  o.tp=[];o.tr=[];o.trh=[];for(let i=0;i<=16;i++){o.tp.push([0,0,0]);o.tr.push(0);o.trh.push(0);}
  o.ta=.3;o.tc=.8;o.puff=1;o.still=0;o.sit=0;o.crouch=0;
  setCatTail(o,0,1);
  // 液體貓：一攤果凍，尾巴掛在邊上
  const q=o.liq=gp(0,0,0,g),lm=new T3.MeshStandardMaterial({color:'#e8a868',transparent:true,opacity:.84,roughness:.35});
  o.puddle=add(GEO.ico2,lm,.4,.08,.34,0,.07,0,q);add(GEO.ico2,lm,.17,.11,.17,.16,.13,0,q);
  [-1,1].forEach(function(s){add(GEO.cone,lm,.05,.09,.05,.13,.25,s*.09,q);bl(.022,.026,.02,'#2b1b2e',.29,.15,s*.06,q);});
  add(GEO.cyl,lm,.03,.2,.03,-.36,.1,.1,q).rotation.z=.9;
  // 影子貓：貼在地上的剪影，只有眼睛亮著
  const sh=o.shd=gp(0,0,0,g),sm=basic('#0d0716',.88);
  let m=flat(GEO.circ,sm,0,.02,0,sh);m.scale.set(.36,.24,1);m=flat(GEO.circ,sm,.3,.021,0,sh);m.scale.set(.19,.17,1);
  [-1,1].forEach(function(s){const e=flat(GEO.circ,sm,.36,.022,s*.13,sh);e.scale.set(.09,.06,1);const y=flat(GEO.circ,basic('#ffd23f',1),.38,.024,s*.07,sh);y.scale.set(.03,.04,1);});
  m=flat(GEO.plane,sm,-.5,.02,.06,sh);m.scale.set(.4,.06,1);m.rotation.z=.4;
  o.can=makeCan(g,CANCOL[L.id]);
  return o;
}

// 依 o.ta（根部角度）、o.tc（捲曲）、o.puff（炸毛）、o.sit（坐下時繞到側邊）重算尾巴形狀
function setCatTail(o,t,sway){
  const S=16,seg=.42/S;let x=0,y=0;
  for(let i=0;i<=S;i++){
    const k=i/S;
    o.tp[i][0]=x;o.tp[i][1]=y;o.tp[i][2]=sway*Math.pow(k,1.5)*Math.sin(t*2.2-i*.3)*.08+o.sit*.2*k*k;
    const phi=o.ta+o.tc*k*k*2.2;x-=Math.cos(phi)*seg;y+=Math.sin(phi)*seg;
    const r=(.042-.014*k)*o.puff;o.tr[i]=i===S?.004:i===S-1?r*.7:r;o.trh[i]=o.tr[i]+.012;
  }
  setTube(o.tailG,o.tp,o.tr);setTube(o.tailH,o.tp,o.trh);
}

/* ---------- 狗 ---------- */
// 狗：方正的圓角方塊輪廓（對比貓的軟圓），表情認真但有點好笑
const DOGCOL={shiba:'#d98a4a',nose:'#a8703f',ear:'#8f98ab',poodle:'#f6eee2',captain:'#66708a',corgi:'#e0a35c',bulldog:'#858a94',sleepwalk:'#b9cdee',mop:'#d3c29a'};
function makeDog(kind){
  const cg=kind==='corgi',hv=kind==='bulldog'||kind==='captain',o={},g=o.g=gp(),b=o.body=gp(0,0,0,g),TN=DOGCOL[kind],CR='#F6E7CF',BK='#2b1b2e';
  const wd=hv?1.25:1;
  rb(cg?.84:.76,.46,.5*wd,.12,TN,0,.44,0,b);rb(.34,.36,.4*wd,.1,CR,.24,.38,0,b);
  const h=o.head=gp(.38,.76,0,b);
  rb(.42,.38,.42*wd,.1,TN,0,0,0,h);rb(.24,.15,.24,.05,CR,.2,-.08,0,h);
  rb(kind==='nose'?.14:.08,kind==='nose'?.1:.06,kind==='nose'?.15:.09,.025,kind==='nose'?'#e2748a':BK,.32,-.04,0,h);
  [-1,1].forEach(function(s){
    if(kind==='sleepwalk')bx(.02,.012,.06,BK,.21,.05,s*.095,h);else bl(.03,.036,.025,BK,.21,.05,s*.095,h);
    const brow=bx(.02,.025,.08,BK,.21,.1,s*.1,h);brow.rotation.x=s*.35;brow.castShadow=false;   // 認真的眉毛
    bl(.09,.08,.07,CR,.08,-.07,s*.15,h);
    if(kind==='ear')cn(.14,.46,TN,-.04,.34,s*.2,h);
    else if(kind==='poodle')bl(.12,.14,.1,'#ffffff',-.02,.1,s*.22,h);
    else if(kind==='bulldog')bl(.07,.05,.06,TN,-.02,.14,s*.19,h);
    else cn(cg?.1:.07,cg?.24:.15,TN,-.04,cg?.24:.19,s*.17,h);
  });
  if(cg){bl(.05,.12,.05,CR,.16,.08,0,h);tor(.17,.035,'#E77863',.3,.6,0,b).rotation.y=Math.PI/2;bl(.04,.04,.04,'#F3BC68',.42,.5,0,b);}
  else if(kind==='shiba'){
    // 毛線巡邏帽＋魚骨徽章（原創設計，不用任何既有制服配色）；手提燈只自發光，不加點光源
    cy(.15,.11,'#315C53',-.01,.24,0,h);cy(.155,.04,'#F1DFC0',-.01,.19,0,h);bl(.05,.05,.05,'#F1DFC0',-.01,.31,0,h);
    const f=H.fishMesh(h,M('#F3BC68'),.22);f.position.set(.165,.24,0);f.rotation.y=Math.PI/2;
    o.lamp=gp(.14,.34,.33*wd,b);cy(.012,.16,BK,0,.08,0,o.lamp);
    rb(.17,.04,.17,.015,'#5a3d24',0,.01,0,o.lamp);rb(.17,.04,.17,.015,'#5a3d24',0,-.14,0,o.lamp);
    add(GEO.box,M('#F3BC68',{emissive:'#F3BC68',emissiveIntensity:.9}),.12,.12,.12,0,-.065,0,o.lamp).castShadow=false;
  }
  else if(kind==='nose'){cn(.2,.16,'#7a4a2b',-.01,.24,0,h);bx(.2,.03,.3,'#5a3d24',.1,.17,0,h);}
  else if(kind==='poodle'){bl(.13,.12,.13,'#ffffff',-.02,.22,0,h);add(GEO.box,M('#ffd23f',{emissive:'#ffd23f',emissiveIntensity:1}),.1,.08,.14,.2,.2,0,h).castShadow=false;
    o.beam=new T3.Mesh(new T3.CylinderGeometry(.08,1.4,3.6,10,1,true),MB('#fff2c4',.13,true));o.beam.rotation.z=Math.PI/2+.25;o.beam.position.set(2.0,-.25,0);h.add(o.beam);}
  else if(kind==='captain'){cy(.2,.1,'#4a3a5c',-.01,.22,0,h);cy(.205,.035,'#F1DFC0',-.01,.18,0,h);bx(.2,.03,.36,'#4a3a5c',.14,.17,0,h);const f=H.fishMesh(h,M('#F3BC68'),.24);f.position.set(.2,.24,0);f.rotation.y=Math.PI/2;}
  else if(kind==='bulldog'){bx(.5,.12,.56,'#4a4f5a',0,.66,0,b);bx(.3,.1,.5,'#4a4f5a',-.2,.62,0,b);tor(.2,.045,'#2b1b2e',.3,.62,0,b).rotation.y=Math.PI/2;
    for(let i=0;i<5;i++)cn(.03,.08,'#dfe6ec',.3,.62+Math.cos(i*1.25)*.22,Math.sin(i*1.25)*.22,b);bl(.06,.03,.2,CR,.24,-.14,0,h);}
  else if(kind==='sleepwalk'){const c=cn(.15,.34,'#7fa0e6',-.03,.26,0,h);c.rotation.z=.5;bl(.05,.05,.05,'#ffffff',-.19,.38,0,h);}
  else if(kind==='mop'){for(let i=0;i<5;i++)bl(.09,.1,.09,TN,.1,.12,(i-2)*.08,h);o.mop=gp(.5,.3,.2,b);cy(.025,.9,'#7a4a2b',0,.2,0,o.mop).rotation.z=-.5;bl(.16,.06,.2,'#dff6ff',.25,-.26,0,o.mop);}
  o.legs=[];
  [[.22,.13*wd],[.22,-.13*wd],[-.22,.13*wd],[-.22,-.13*wd]].forEach(function(q){
    const l=gp(q[0],cg?.14:.26,q[1],g);if(cg)l.scale.y=.54;
    rb(.13,.26,.13,.04,TN,0,-.13,0,l);rb(.16,.06,.16,.025,CR,.015,-.24,0,l);o.legs.push(l);
  });
  o.tail=cg?bl(.07,.07,.07,CR,-.4,.5,0,b):kind==='poodle'?bl(.1,.1,.1,'#ffffff',-.42,.66,0,b):add(new T3.TorusGeometry(.1,.045,5,8,5),TN,1,1,1,-.36,.66,0,b);
  o.lid=gp(0,0,0,g);cy(.64,.07,'#b9c4cf',0,0,0,o.lid);cy(.5,.05,'#d5dde4',0,.05,0,o.lid);
  o.towel=bx(.5,.1,.5,'#ff5fa2',.38,1.0,0,b);
  // 封縫用的巨大膠帶捲（童話式誇張比例）
  o.tape=gp(.6,.7,0,b);tor(.2,.085,'#F3BC68',0,0,0,o.tape).rotation.y=Math.PI/2;tor(.11,.03,'#c9a24a',0,0,0,o.tape).rotation.y=Math.PI/2;
  bx(.04,.3,.2,'#F3BC68',.02,-.28,.06,o.tape).castShadow=false;
  if(hv||kind==='captain')g.scale.set(1.2,1.2,1.2);
  return o;
}
// 輔助模式：畫出狗的視線範圍（會被牆擋住）
function makeCone(){
  const n=20,pa=new T3.BufferAttribute(new Float32Array((n+2)*3),3),cg=new T3.BufferGeometry(),idx=[];
  cg.setAttribute('position',pa);for(let i=0;i<n;i++)idx.push(0,i+1,i+2);cg.setIndex(idx);
  const mesh=new T3.Mesh(cg,basic('#ffd23f',.28));mesh.frustumCulled=false;mesh.visible=false;G.cur.add(mesh);
  return {mesh:mesh,pa:pa,n:n};
}
function syncCone(c,d,P){
  const on=PH.opt.cone&&d.active&&d.K.vis>0&&d.stunT<=0&&d.state!=='sleep'&&d.state!=='lurk'&&d.spawnT<=0&&G.camSees(d.x,.8,d.y);
  c.mesh.visible=on;if(!on)return;
  const pa=c.pa,range=d.K.vis*PH.FORMS[P.form].vis*(d.busy?.3:1),half=d.K.cone;
  pa.setXYZ(0,d.x,.05,d.y);
  for(let i=0;i<=c.n;i++){
    const a=d.ang-half+2*half*i/c.n,cx=Math.cos(a),sy=Math.sin(a);let r=0;
    for(;r<range;r+=.25)if(W.hgt(Math.floor(d.x+cx*(r+.25)),Math.floor(d.y+sy*(r+.25)))>=.5)break;
    pa.setXYZ(i+1,d.x+cx*r,.05,d.y+sy*r);
  }
  pa.needsUpdate=true;
  c.mesh.material.color.set(d.state==='chase'?'#ef5d50':d.meter>.3?'#ff9646':'#ffd23f');
}

/* ---------- 月亮總督 ---------- */
G.makeBoss=function(){
  const o={},g=o.g=gp(),b=o.body=gp(0,0,0,g),TN='#c9b08a',CR='#fff1dc',BK='#2b1b2e',NV='#2a3170';
  bl(1.0,.75,.72,TN,0,1.25,0,b);bl(.55,.55,.6,CR,.55,1.0,0,b);bx(1.3,.5,1.3,NV,-.1,1.55,0,b);
  [-1,1].forEach(function(s){bx(.4,.12,.3,'#ffd23f',.2,1.86,s*.6,b);});
  const h=o.head=gp(1.05,2.15,0,b);
  bl(.6,.55,.6,TN,0,0,0,h);bl(.36,.25,.36,CR,.46,-.2,0,h);bl(.11,.09,.12,BK,.8,-.12,0,h);
  [-1,1].forEach(function(s){bl(.08,.1,.07,BK,.48,.14,s*.26,h);cn(.2,.42,TN,-.1,.52,s*.46,h);bl(.24,.22,.2,CR,.22,-.2,s*.42,h);});
  o.helm=gp(0,0,0,h);
  add(GEO.ico2,new T3.MeshStandardMaterial({color:'#bfe0ff',transparent:true,opacity:.28,roughness:.1,depthWrite:false}),.82,.8,.82,.05,.05,0,o.helm).castShadow=false;
  tor(.72,.07,'#ffd23f',.05,-.38,0,o.helm).rotation.x=Math.PI/2;
  o.lamp=add(GEO.box,new T3.MeshStandardMaterial({color:'#fff2c4',emissive:'#fff2c4',emissiveIntensity:.4}),.2,.14,.4,.68,.52,0,o.helm);
  o.frost=add(GEO.ico2,new T3.MeshStandardMaterial({color:'#eefaff',transparent:true,opacity:.86,roughness:.6,flatShading:true}),.86,.84,.86,.05,.05,0,h);o.frost.castShadow=false;
  o.legs=[];
  [[.6,.42],[.6,-.42],[-.6,.42],[-.6,-.42]].forEach(function(q){const l=gp(q[0],.75,q[1],g);cy(.19,.75,TN,0,-.37,0,l);bl(.23,.12,.26,CR,.04,-.7,0,l);o.legs.push(l);});
  const t=o.tail=gp(-.95,1.5,0,b);o.seg=[];
  for(let i=0;i<6;i++){const s=bl(.2-i*.018,.2-i*.018,.2-i*.018,i===5?CR:TN,-i*.3,i*.12,0,t);o.seg.push(s);}
  o.fish=add(GEO.ico,new T3.MeshStandardMaterial({color:'#7fd0e6',emissive:'#7fd0e6',emissiveIntensity:.9,flatShading:true}),.32,.2,.06,-1.75,.9,0,t);
  o.gun=gp(.9,1.0,.75,b);bx(.5,.2,.2,'#5a6a8a',0,0,0,o.gun);tor(.14,.06,'#ffd23f',-.1,.16,0,o.gun);
  o.fish.visible=false;o.frost.visible=false;
  return o;
};
function makeTele(){
  const T={arrow:[],arc:[],disc:[],quad:[],sector:[],ring:[],mark:[],line:[]};
  const mk=function(geo,n,list){for(let i=0;i<n;i++){const g=gp(),m=new T3.Mesh(geo,basic('#fff',.4));m.rotation.x=Math.PI/2;g.add(m);g.visible=false;g.userData.m=m;list.push(g);}};
  mk(GEO.plane,2,T.arrow);mk(GEO.arc,1,T.arc);mk(GEO.circ,8,T.disc);mk(GEO.quad,4,T.quad);mk(GEO.sec60,6,T.sector);mk(GEO.ring,3,T.ring);mk(GEO.ring,3,T.mark);mk(GEO.plane,2,T.line);
  return T;
}
function syncTele(T,L,t){
  for(const k in T)for(const g of T[k])g.visible=false;
  const B=PH.Boss;if(!B.active)return;
  const C=L.def.boss,used={};
  for(const s of B.gfx){
    const i=used[s.t]=(used[s.t]||0),list=T[s.t];if(!list||i>=list.length)continue;used[s.t]++;
    const g=list[i],m=g.userData.m;g.visible=true;m.material.color.set(s.col||'#fff');m.material.opacity=s.a==null?.45:s.a;
    g.rotation.y=0;g.position.set(0,.04+i*.002,0);m.position.set(0,0,0);
    switch(s.t){
      case 'arrow':g.position.set(s.x,.05,s.y);g.rotation.y=-s.a;m.scale.set(s.len,1.5,1);m.position.set(s.len/2,0,0);m.material.opacity=.25+.45*(s.k||0);break;
      case 'arc':g.position.set(s.x,.05,s.y);g.rotation.y=-s.a;m.scale.set(s.r,s.r,1);m.material.opacity=.2+.4*(s.k||0);break;
      case 'disc':g.position.set(s.x,.045+i*.003,s.y);m.scale.set(s.r,s.r,1);break;
      case 'quad':g.position.set(C.c[0],.04,C.c[1]);g.rotation.y=-s.q*Math.PI/2;m.scale.set(C.R,C.R,1);break;
      case 'sector':g.position.set(C.c[0],.04,C.c[1]);g.rotation.y=-(s.i*1.0472+s.off);m.scale.set(C.R,C.R,1);break;
      case 'ring':g.position.set(s.x,.04,s.y);m.scale.set(s.r+.7,s.r+.7,1);break;
      case 'mark':{const p=.7+Math.sin(t*8)*.15;g.position.set(s.x,.06,s.y);m.scale.set(p,p,1);m.material.opacity=.9;break;}
      case 'line':{const len=Math.hypot(s.x1-s.x0,s.y1-s.y0);g.position.set(s.x0,.05,s.y0);g.rotation.y=-Math.atan2(s.y1-s.y0,s.x1-s.x0);m.scale.set(len,.5,1);m.position.set(len/2,0,0);m.material.opacity=.35+Math.sin(t*5)*.15;break;}
    }
  }
}

/* ---------- 物件：建立 ---------- */
EB.box=function(e){
  // 皺皺的紙箱：紙纖維貼圖、幾道折痕、蓋子不完全對齊
  const g=e.g=gp(e.x,0,e.y),CB=MT('#d29a62','plaster'),CD=MT('#b98250','plaster');
  bx(.86,.5,.05,CB,0,.25,.405,g);bx(.86,.5,.05,CB,0,.25,-.405,g);bx(.05,.5,.8,CB,.405,.25,0,g);bx(.05,.5,.8,CB,-.405,.25,0,g);bx(.8,.04,.8,'#5a3d24',0,.03,0,g);
  [[.2,.43,.6],[-.25,.433,-.5],[.05,-.433,.4]].forEach(function(q){const c=bx(.02,.36,.01,'#9a6a40',q[0],.26,q[1],g);c.rotation.z=q[2];c.castShadow=false;});
  bx(.6,.06,.012,'#c9a07a',0,.42,.432,g).castShadow=false;   // 膠帶殘痕
  e.lids=[1,-1].map(function(s){const l=gp(0,.5,s*.4,g);const m=bx(.86,.03,.4,CD,0,0,-s*.2,l);m.rotation.y=s*.04;l.userData.s=s;return l;});
  if(e.safe){[.435,-.435].forEach(function(z){const f=fishboneMesh(g,M('#ffffff'),.6);f.position.set(0,.27,z);});}
  if(e.finish){e.ring=flat(GEO.ring,basic('#ffd23f',.7),0,.03,0,g);e.ring.scale.set(.85,.85,1);}
  // 每個紙箱用自己的材質，擋在鏡頭和貓之間時可以單獨變透明
  g.traverse(function(m){if(m.isMesh){m.material=m.material.clone();m.material.transparent=true;}});e.fade=1;
  const p=e.peek=gp(0,0,0,g);
  bl(.2,.12,.2,'#f6a23c',0,.47,0,p);
  [-1,1].forEach(function(s){cn(.065,.13,'#f6a23c',s*.1,.6,-.02,p);bl(.03,.035,.02,'#ffd23f',s*.075,.5,.185,p);});
};
/* 貓縫的視覺身份：像被貓爪抓開的柔軟布料裂口，不是科幻傳送門。
   五種狀態靠「造型」區分，不只靠顏色：
   可連接＝浮著的魚骨＋地上一圈縫線虛線；預覽＝兩點之間拉起一條針腳線；
   啟用＝直立的深色布料裂口＋十字縫線邊＋魚骨記號；施工封鎖＝膠帶慢慢貼上＋施工三角牌；已封鎖＝整個 X 膠帶＋禁止牌。 */
const SEAM={mint:'#86E0C2',cream:'#F1DFC0',fab:'#24183a',fab2:'#3d2c5c',tape:'#F3BC68',coral:'#E77863'};
let TRI=null;
EB.anchor=function(e){
  const g=e.g=gp(e.x,0,e.y);
  e.mat=new T3.MeshBasicMaterial({color:SEAM.cream});
  e.glyph=fishboneMesh(g,e.mat,.62);e.glyph.position.y=.5;
  // 地上的縫線圈（虛線）
  e.st=gp(0,.035,0,g);e.stM=basic(SEAM.mint,.6);
  for(let i=0;i<12;i++){const a=i/12*6.283,m=add(GEO.box,e.stM,.13,.012,.035,Math.cos(a)*.42,0,Math.sin(a)*.42,e.st);m.rotation.y=-a+Math.PI/2;m.castShadow=false;m.receiveShadow=false;}
  // 直立的布料裂口（面向鏡頭）
  e.tear=gp(0,.6,0,g);e.tear.visible=false;
  e.fab=new T3.Mesh(GEO.circ,basic(SEAM.fab,.95));e.tear.add(e.fab);
  e.fab2=new T3.Mesh(GEO.circ,basic(SEAM.fab2,.85));e.fab2.position.z=.006;e.tear.add(e.fab2);
  e.dots=[];for(let i=0;i<6;i++){const d=new T3.Mesh(GEO.circ,basic(i%2?SEAM.mint:'#F6CD79',.9));d.position.z=.012;e.tear.add(d);e.dots.push(d);}
  e.sti=[];for(let i=0;i<16;i++){const m=add(GEO.box,basic(SEAM.mint,1),.085,.022,.02,0,0,.016,e.tear);m.castShadow=false;e.sti.push(m);}
  e.fish=[];for(let i=0;i<3;i++){const f=fishboneMesh(e.tear,basic(SEAM.cream,1),.38);e.fish.push(f);}
  e.zip=add(GEO.box,M(SEAM.tape),.07,.1,.04,0,0,.02,e.tear);e.zip.castShadow=false;
  // 封縫：膠帶（施工中慢慢貼上）、施工三角牌、禁止牌
  e.tape=gp(0,.55,0,g);
  [.62,-.62].forEach(function(r){const s=gp(0,0,0,e.tape);s.rotation.z=r;add(GEO.box,M(SEAM.tape),1.0,.16,.04,0,0,0,s).castShadow=false;
    for(let k=-2;k<=2;k++)add(GEO.box,M(SEAM.coral),.07,.165,.045,k*.2,0,0,s).castShadow=false;});
  if(!TRI)TRI=new T3.CircleGeometry(1,3);
  e.warn=gp(0,1.15,0,g);const tri=new T3.Mesh(TRI,basic(SEAM.tape,1));tri.rotation.z=Math.PI/2;tri.scale.setScalar(.2);e.warn.add(tri);
  const ex=add(GEO.box,basic(SEAM.coral,1),.03,.1,.01,0,.01,.01,e.warn);ex.castShadow=false;add(GEO.box,basic(SEAM.coral,1),.03,.03,.01,0,-.07,.01,e.warn).castShadow=false;
  e.ban=gp(0,1.15,0,g);const bd=new T3.Mesh(GEO.circ,basic(SEAM.cream,1));bd.scale.setScalar(.2);e.ban.add(bd);
  const br=new T3.Mesh(GEO.ring,basic(SEAM.coral,1));br.scale.setScalar(.22);br.position.z=.005;e.ban.add(br);
  const sl=add(GEO.box,basic(SEAM.coral,1),.4,.05,.01,0,0,.01,e.ban);sl.rotation.z=.75;sl.castShadow=false;
  // 被拖把擦掉：濕答答的水滴
  e.wet=gp(0,0,0,g);for(let i=0;i<3;i++){const d=add(GEO.ico,basic('#9fd8f0',.8),.05,.07,.05,Math.cos(i*2.1)*.3,.08,Math.sin(i*2.1)*.3,e.wet);d.castShadow=false;}
  e.closeT=0;e.wasEnd=false;
};
EB.ped=function(e,L){
  const g=e.g=gp(e.x,0,e.y);let y0=W.hgt(Math.floor(e.x),Math.floor(e.y));
  if(y0<.1){cy(.3,.5,'#c9a24a',0,.25,0,g);cy(.36,.06,'#ffd23f',0,.52,0,g);y0=.55;}
  e.can=makeCan(g,CANCOL[L.id]);e.can.position.y=y0+.02;e.can.scale.setScalar(1.6);
  // 主罐是畫面焦點：暖金光暈＋一圈慢慢轉的亮點（只有主罐、有效貓縫和重要互動物會發光）
  e.halo=flat(GEO.circ,basic('#F6CD79',.32,true),0,y0+.03,0,g);e.halo.scale.set(.55,.55,1);
  e.spark=gp(0,y0+.45,0,g);for(let i=0;i<5;i++){const a=i*1.2566,m=add(GEO.ico,M('#F6CD79',{emissive:'#F6CD79',emissiveIntensity:1}),.025,.025,.025,Math.cos(a)*.32,Math.sin(i*2.1)*.06,Math.sin(a)*.32,e.spark);m.castShadow=false;}
  e.dome=add(GEO.ico2,new T3.MeshStandardMaterial({color:'#bfe0ff',transparent:true,opacity:.35,roughness:.1,depthWrite:false}),.36,.42,.36,0,y0+.22,0,g);e.dome.castShadow=false;
};
EB.sw=function(e){
  const g=e.g=gp(e.x,0,e.y),m=e.model||'lever';
  if(m==='oldcan'){cy(.12,.1,'#c9d3dc',0,.05,0,g);cy(.125,.05,'#ff6f61',0,.05,0,g);cy(.11,.015,'#e8eef3',.1,.14,0,g).rotation.z=-.9;bl(.05,.02,.03,'#7fd0e6',0,.11,0,g);}
  else if(m==='lever'){bx(.34,.14,.34,'#5a3d24',0,.07,0,g);e.arm=gp(0,.14,0,g);cy(.035,.55,'#fbeed6',0,.27,0,e.arm);bx(.24,.04,.04,'#fbeed6',0,.36,0,e.arm);bx(.2,.04,.04,'#fbeed6',0,.26,0,e.arm);bl(.08,.08,.08,'#ef5d50',0,.58,0,e.arm);}
  else if(m==='crank'){cy(.07,.75,'#e58f4e',0,.375,0,g);e.arm=fishboneMesh(g,M('#ffffff'),1);e.arm.position.y=.8;}
  else if(m==='button'){bx(.4,.2,.4,'#5a6a8a',0,.1,0,g);e.arm=cy(.13,.08,'#ef5d50',0,.24,0,g);}
  else if(m==='gear'){e.arm=tor(.3,.09,'#ffd23f',0,.42,0,g);bx(.5,.08,.08,'#c9a24a',0,0,0,e.arm);bx(.08,.5,.08,'#c9a24a',0,0,0,e.arm);}
  else if(m==='valve'){cy(.06,.6,'#7fd0e6',0,.3,0,g);e.arm=tor(.2,.05,'#ef5d50',0,.62,0,g);e.arm.rotation.x=Math.PI/2;}
  else if(m==='proj'){bx(.5,.4,.4,'#3b2f6b',0,.55,0,g);const c=cn(.2,.3,'#7fd0e6',.32,.55,0,g);c.rotation.z=Math.PI/2;cy(.04,.36,'#2b1b2e',0,.18,0,g);}
  e.gl=flat(GEO.ring,basic('#ffd23f',.7),0,.03,0,g);e.gl.scale.set(.5,.5,1);
};
EB.push=function(e){
  const g=e.g=gp(e.px,0,e.py),m=e.model;
  if(m==='bread'){bx(.86,.42,.62,'#d98c45',0,.21,0,g);bl(.44,.2,.32,'#eaa95a',0,.44,0,g);}
  else if(m==='bottle'){cy(.4,.9,'#7fd0e6',0,.45,0,g);cy(.2,.25,'#3fa9e0',0,1.02,0,g);cy(.24,.1,'#ffffff',0,1.2,0,g);bx(.5,.36,.03,'#ffffff',0,.5,.4,g);const f=fishboneMesh(g,new T3.MeshBasicMaterial({color:'#7fd0e6'}),.6);f.position.set(.42,.5,.3);}
  else if(m==='board'){bx(.9,1.9,.14,'#2a2140',0,.95,0,g);bx(.96,.08,.2,'#c9a24a',0,1.92,0,g);bx(.96,.1,.5,'#c9a24a',0,.05,0,g);}
  else if(m==='label'){bx(.96,1.6,.2,'#e98fb0',0,.8,0,g);bx(.7,.5,.22,'#fff6e3',0,.9,0,g);bx(.98,.08,.3,'#ffd23f',0,1.6,0,g);}
  else bx(.9,e.h||1,.9,'#b98250',0,(e.h||1)/2,0,g);
};
EB.plate=function(e){
  const g=e.g=gp(e.x,0,e.y);e.disc=cy(e.r||.9,.08,e.by==='dog'?'#8a93a8':'#ffd23f',0,.04,0,g);cy((e.r||.9)*.7,.04,'#fff6e3',0,.09,0,g);
  e.rg=flat(GEO.ring,basic('#ffd23f',.6),0,.03,0,g);e.rg.scale.set((e.r||.9)+.15,(e.r||.9)+.15,1);
};
EB.pipe=function(e){
  e.g=gp();
  [e.a,e.b].forEach(function(q){const t=tor(.3,.07,'#7fd0e6',q[0],.08,q[1],e.g);t.rotation.x=Math.PI/2;const d=flat(GEO.circ,basic('#0d0716',.85),q[0],.03,q[1],e.g);d.scale.set(.28,.28,1);});
};
EB.towel=function(e){
  e.g=gp();e.tw=gp(e.x,1.2,e.y,e.g);bx(.7,.5,.06,'#ff5fa2',0,0,0,e.tw);bx(.72,.08,.07,'#ffffff',0,.12,0,e.tw);bx(.72,.08,.07,'#ffffff',0,-.12,0,e.tw);
  e.rg=flat(GEO.ring,basic('#ff5fa2',.75),e.dx,.05,e.dy,e.g);e.rg.scale.set(1.1,1.1,1);
};
EB.soap=function(e){
  e.g=gp();const s=bx(.34,.1,.22,'#e98fb0',e.x,.05,e.y,e.g);s.rotation.y=.4;bl(.06,.06,.06,'#ffffff',e.x+.1,.14,e.y,e.g);
  const b=gp(e.bx,0,e.by,e.g);bx(.9,.06,.9,'#b98250',0,.03,0,b);[[.45,0,.06,.9],[-.45,0,.06,.9],[0,.45,.9,.06],[0,-.45,.9,.06]].forEach(function(q){bx(q[2],.4,q[3],'#e0b070',q[0],.2,q[1],b);});
};
EB.toy=function(e){e.g=gp(e.x,0,e.y);bl(.15,.15,.15,'#ff5fa2',0,.15,0,e.g);bl(.05,.05,.05,'#ffffff',.08,.24,.05,e.g);};
EB.knock=function(e){e.g=gp(e.x,1.05,e.y);cy(.11,.24,'#ff6f61',0,.12,0,e.g);cy(.115,.05,'#fff6e3',0,.26,0,e.g);};
function itemModel(e){
  const g=gp(0,0,0,e.g),k=e.kind;
  if(k==='smallcan'){const c=makeCan(g,'#8fc3b4');c.scale.setScalar(.85);}
  else if(k==='ticket'){bx(.36,.22,.03,'#ffd23f',0,.2,0,g);const f=fishboneMesh(g,new T3.MeshBasicMaterial({color:'#2b1b2e'}),.5);f.position.set(0,.2,.02);}
  else if(k==='collect'){add(GEO.rock,M('#ffd23f',{emissive:'#ffb000',emissiveIntensity:.5}),.16,.16,.06,0,.25,0,g);}
  else if(k==='bowl'){cy(.2,.1,'#e98fb0',0,.05,0,g);cy(.15,.02,'#2b1b2e',0,.1,0,g);}
  else if(k==='flavor'){const c=makeCan(g,'#ef5d50');cy(.14,.03,'#ffd23f',0,.13,0,c);cy(.14,.03,'#7fd0e6',0,.07,0,c);}
  else if(k==='key'){const f=fishboneMesh(g,M('#ffffff'),.9);f.position.y=.25;}
  else if(k==='furball'){bl(.15,.14,.15,'#b9a08a',0,.16,0,g);bl(.04,.04,.04,'#8a7460',.1,.25,.04,g);}
  else if(k==='sticker'){add(GEO.ico,M('#7fd0e6',{emissive:'#7fd0e6',emissiveIntensity:.6}),.2,.12,.03,0,.25,0,g);}
  else if(k==='fish'){bl(.2,.05,.08,'#b9773c',0,.12,0,g);cn(.06,.1,'#b9773c',-.22,.12,0,g).rotation.z=-Math.PI/2;}
  e.gm=g;e.gk=k;
}
EB.item=function(e){e.g=gp(e.x,0,e.y);itemModel(e);e.sh=flat(GEO.circ,basic('#ffd23f',.25,true),0,.02,0,e.g);e.sh.scale.set(.3,.3,1);};
EB.light=function(e){
  e.g=gp();bx(.3,.2,.3,'#2b1b2e',e.mx,2.9,e.my,e.g).castShadow=false;
  e.head=add(GEO.box,M('#fff2c4',{emissive:'#fff2c4',emissiveIntensity:1}),.2,.12,.2,e.mx,2.76,e.my,e.g);e.head.castShadow=false;
  e.disc=flat(GEO.circ,basic('#fff2c4',.34,true),0,.04,0,e.g);e.disc.scale.set(e.r,e.r,1);
  e.col=new T3.Mesh(new T3.CylinderGeometry(e.r*.25,e.r,2.7,14,1,true),basic('#fff2c4',.07,true));e.g.add(e.col);
};
EB.mover=function(e){
  const g=e.g=gp(e.x,0,e.y),m=e.model;
  if(m==='plate'){cy(.62,.06,'#ffffff',0,.0,0,g);cy(.44,.02,'#dcebf3',0,.035,0,g);}
  else if(m==='saucer'){cy(.62,.06,'#bfe9f2',0,0,0,g);cy(.44,.02,'#ffffff',0,.035,0,g);}
  else if(m==='toast'){bx(1.1,.1,1.0,'#c98440',0,-.02,0,g);bx(.96,.1,.86,'#f6d595',0,.02,0,g);}
  else if(m==='sock'){bx(1.1,.14,.8,'#ff8fa3',0,0,0,g);bl(.36,.12,.4,'#ff8fa3',.55,0,0,g);bx(.2,.16,.82,'#ffffff',-.5,0,0,g);}
  else if(m==='lidboat'){cy(.66,.07,'#b9c4cf',0,0,0,g);cy(.5,.05,'#d5dde4',0,.05,0,g);bl(.07,.05,.07,'#2b1b2e',0,.1,0,g);}
  else if(m==='bus'){
    bx(1.5,.7,.9,'#ffd23f',0,.55,0,g);bx(1.4,.3,.84,'#fff6e3',0,1.0,0,g);bx(1.52,.08,.92,'#ef5d50',0,.34,0,g);
    [-.45,0,.45].forEach(function(dx){bx(.3,.22,.92,'#7fd0e6',dx,1.0,0,g);});
    [[.5,.4],[.5,-.4],[-.5,.4],[-.5,-.4]].forEach(function(q){cy(.16,.1,'#2b1b2e',q[0],.16,q[1],g).rotation.x=Math.PI/2;});
    add(GEO.box,M('#fff2c4',{emissive:'#fff2c4',emissiveIntensity:.8}),.05,.12,.2,.76,.5,.25,g);
  }
};
EB.wind=function(e){
  e.g=gp();e.pad=flat(GEO.ring,basic('#dff6ff',.7),e.from[0],.04,e.from[1],e.g);e.pad.scale.set(.6,.6,1);
  e.bub=[];for(let i=0;i<4;i++){const m=new T3.Mesh(GEO.ico2,new T3.MeshStandardMaterial({color:'#dff6ff',transparent:true,opacity:.35,roughness:.1,depthWrite:false}));e.g.add(m);e.bub.push(m);}
};
EB.plant=function(e){
  const g=e.g=gp(e.x,0,e.y);cy(.3,.4,'#b9773c',0,.2,0,g);cy(.34,.07,'#d98c45',0,.42,0,g);
  e.lv=gp(0,.45,0,g);for(let i=0;i<6;i++){const c=cn(.16,.7,i%2?'#3f9f5a':'#5bc470',Math.cos(i*1.05)*.14,.3,Math.sin(i*1.05)*.14,e.lv);c.rotation.z=Math.cos(i*1.05)*-.4;c.rotation.x=Math.sin(i*1.05)*.4;}
  e.eyes=gp(0,.62,0,g);[-1,1].forEach(function(s){bl(.03,.035,.02,'#ffd23f',s*.07,0,.2,e.eyes);});
};
EB.gate=function(e,L){
  const g=e.g=gp(),m=e.model||'door',h=e.h==null?1.4:e.h;e.ak=e.closed?0:1;e.haz=e.k==='hazard';
  e.tiles.forEach(function(q,i){
    const c=q[0],r=q[1],s=gp(c+.5,0,r+.5,g),w=L.w;
    const horiz=L.leg[L.base[r*w+c-1]].k==='solid'&&L.leg[L.base[r*w+c+1]].k==='solid';
    const slab=function(col,th,hh){return horiz?bx(1,hh||h,th,col,0,(hh||h)/2,0,s):bx(th,hh||h,1,col,0,(hh||h)/2,0,s);};
    if(m==='lid'){const d=cy(.66,.1,'#b9c4cf',0,.68,0,s);d.rotation.z=Math.PI/2;const d2=cy(.5,.12,'#d5dde4',0,.68,0,s);d2.rotation.z=Math.PI/2;bx(.3,h,1,'#8a93a8',0,h/2,0,s);}
    else if(m==='mug'){cy(.45,.62,'#fff6e3',0,.75,0,s);cy(.455,.12,'#ff5fa2',0,.8,0,s);const t=tor(.26,.07,'#fff6e3',0,.24,0,s);t.rotation.y=Math.PI/2;}
    else if(m==='shutter'){slab('#8a93a8',.2);for(let k=0;k<4;k++)slab('#6f7a94',.24,.06).position.y=.4+k*.5;}
    else if(m==='sponge'){bx(.96,h,.96,'#ffd23f',0,h/2,0,s);for(let k=0;k<7;k++)bl(.09,.09,.09,'#d9a520',((k*37)%7-3)*.12,.3+((k*53)%9)*.2,.47*(k%2?1:-1),s);}
    else if(m==='rail'){cy(.05,h,'#c9a24a',horiz?-.45:0,h/2,horiz?0:-.45,s);cy(.05,h,'#c9a24a',horiz?.45:0,h/2,horiz?0:.45,s);slab('#8a2f3f',.07,.08).position.y=h-.06;}
    else if(m==='tape'){cy(.05,h,'#2b1b2e',-.45,h/2,0,s);cy(.05,h,'#2b1b2e',.45,h/2,0,s);bx(1,.12,.03,'#ffd23f',0,h-.1,0,s);for(let k=0;k<3;k++)bx(.12,.12,.035,'#2b1b2e',-.33+k*.33,h-.1,0,s);}
    else if(m==='panel'){slab('#f3ead2',.1);const p=horiz?bx(.6,.08,.12,'#ef5d50',0,h*.7,0,s):bx(.12,.08,.6,'#ef5d50',0,h*.7,0,s);p.castShadow=false;slab('#c9a24a',.16,.1);}
    else if(m==='shydoor'){slab('#e98fb0',.18);[-1,1].forEach(function(sg){const b=horiz?bl(.1,.07,.02,'#ef5d50',sg*.24,h*.5,.1,s):bl(.02,.07,.1,'#ef5d50',-.1,h*.5,sg*.24,s);b.castShadow=false;
      const ey=horiz?bx(.1,.025,.02,'#2b1b2e',sg*.2,h*.62,.1,s):bx(.02,.025,.1,'#2b1b2e',-.1,h*.62,sg*.2,s);ey.castShadow=false;});}
    else if(m==='stall'){bx(.96,.7,.9,'#b98250',0,.35,0,s);bx(1.02,.1,1.0,i%2?'#3d8a7a':'#F1DFC0',0,h+.5,0,s);bx(1.02,.1,1.0,i%2?'#F1DFC0':'#3d8a7a',0,h+.62,0,s).scale.x=.6;cy(.04,h+.5,'#7a4a2b',-.44,(h+.5)/2,-.4,s);cy(.04,h+.5,'#7a4a2b',.44,(h+.5)/2,-.4,s);bl(.14,.14,.14,'#ff8f5a',-.2,.8,0,s);bl(.14,.14,.14,'#8fc3b4',.2,.8,.1,s);}
    else if(m==='socks'){bx(1,.1,.8,['#ff8fa3','#ffd23f','#8fc3b4'][i%3],0,-.03,0,s);bx(.16,.11,.82,'#ffffff',-.3,-.03,0,s);}
    else if(m==='plank'||m==='bridge'){bx(.96,.08,.96,'#b98250',0,-.03,0,s);bx(.96,.09,.1,'#7a4a2b',0,-.03,.3,s);bx(.96,.09,.1,'#7a4a2b',0,-.03,-.3,s);}
    else if(m==='spoon'){bx(1,.08,.5,'#dfe6ec',0,-.02,0,s);if(i===e.tiles.length-1)bl(.5,.1,.42,'#eef3f7',.3,0,0,s);}
    else if(m==='gate'){slab('#6f7a94',.3);slab('#ffd23f',.34,.16).position.y=h*.5;}
    else slab('#7a4a2b',.16);
  });
};
EB.exit=function(e){
  const g=e.g=gp(e.x,0,e.y);
  e.ring=flat(GEO.ring,basic('#8fe3b4',.8),0,.04,0,g);e.ring.scale.set(.7,.7,1);
  e.beam=new T3.Mesh(new T3.CylinderGeometry(.5,.6,3,14,1,true),basic('#8fe3b4',.12,true));e.beam.position.y=1.5;g.add(e.beam);
};
EB.bell=function(e){const g=e.g=gp(e.x,0,e.y);cn(.09,.14,'#ffd23f',0,.1,0,g);bl(.035,.035,.035,'#c9a24a',0,.03,0,g);};
EB.door=function(e){
  const g=e.g=gp(e.x,0,e.y);g.rotation.y=e.ry||0;
  bx(.08,1.0,1.0,'#7a4a2b',0,.5,0,g).castShadow=false;bx(.1,.76,.8,'#b98250',.02,.42,0,g).castShadow=false;bx(.08,.3,.9,'#2f5fd0',.01,1.2,0,g).castShadow=false;
  e.bulbM=new T3.MeshBasicMaterial({color:'#5a3d24'});add(GEO.ico,e.bulbM,.1,.1,.1,.08,1.55,0,g).castShadow=false;
};
EB.chute=function(e){
  const g=e.g=gp(e.x,0,e.y);const a=Math.atan2(e.to[1]-e.y,e.to[0]-e.x);g.rotation.y=-a;
  bx(1.6,.06,.7,'#7fd0e6',.9,.05,0,g);bx(1.6,.14,.06,'#3fa9e0',.9,.1,.36,g);bx(1.6,.14,.06,'#3fa9e0',.9,.1,-.36,g);
};

/* ---------- 物件：每幀同步 ---------- */
ES.box=function(e,L,P,t,dt){
  // 實測：鏡頭在紙箱裡時只看得到紙箱內壁 → 躲在裡面時不畫紙箱本體（畫面上下的紙板縫由介面層負責）
  const inside=P.hidden===e&&PH.S.mode!=='cut';e.peek.visible=false;
  const lift=inside?P.lift:0;e.lids.forEach(function(l){l.rotation.x=l.userData.s*(-.2-lift*1.1)*(inside?1:.15);});
  if(e.ring){e.ring.visible=P.hasCan;e.ring.scale.setScalar(.85+Math.sin(G.t*4)*.06);}
  e.g.rotation.y=inside?-PH.S.yaw+Math.PI/2:0;
  // 實測：出紙箱後，紙箱剛好擋在鏡頭與貓之間、佔掉半個畫面 → 這時讓它變半透明
  let tgt=inside?0:1;
  if(!inside&&G.camera){
    const cp=G.camera.position,ax=cp.x,az=cp.z,bx_=P.x,bz=P.y,dx=bx_-ax,dz=bz-az,l2=dx*dx+dz*dz||1;
    const k=U.clamp(((e.x-ax)*dx+(e.y-az)*dz)/l2,0,1),qx=ax+dx*k,qz=az+dz*k;
    if(k<.98&&Math.hypot(e.x-qx,e.y-qz)<.75)tgt=.22;
  }
  e.fade=inside?0:e.fade+(tgt-e.fade)*Math.min(1,(dt||.016)*8);
  const op=e.fade,dw=op>.95;
  e.g.traverse(function(m){if(m.isMesh&&m.material.transparent&&m.parent!==e.peek&&m!==e.ring){m.material.opacity=op;m.material.depthWrite=dw;m.visible=op>.02;}});
};
ES.anchor=function(e,L,P,t,dt){
  const SM=PH.Seams,s=SM.seam,isEnd=!!s&&(s.a===e||s.b===e),D=SM.draw;
  e.g.position.set(e.x,0,e.y);
  e.g.visible=!!e.found&&!(e.off&&L.f[e.off]);if(!e.g.visible)return;
  const sealed=!!e.sealUntil,sealing=!sealed&&e.sealing>0,wiped=!!e.wipedUntil,off=!W.anchorOn(e);
  const preview=!!D&&(D.from===e||D.hover===e);
  if(e.wasEnd&&!isEnd)e.closeT=.45;e.wasEnd=isEnd;   // 合起來：像布料重新縫合
  e.closeT=Math.max(0,e.closeT-(dt||0));
  // 魚骨：狀態不同，高度、大小、轉速都不同
  const dim=sealed||wiped||off;
  e.mat.color.set(isEnd||preview?SEAM.mint:dim?'#7c7c8c':SEAM.cream);
  e.glyph.position.y=(sealed?.3:.5)+(dim?0:Math.sin(t*2+e.x)*.04)+(preview?.08:0);
  e.glyph.rotation.y=dim?0:t*(preview?2.4:.8);e.glyph.scale.setScalar(preview?1.3:dim?.8:1);
  // 地上縫線圈
  e.st.visible=!sealed&&!sealing&&!wiped;
  if(e.st.visible){e.st.rotation.y=t*(preview?2:.4);e.st.scale.setScalar(preview?1.15:1);e.stM.opacity=off?.2:preview?.95:.45+Math.sin(t*3)*.12;}
  // 布料裂口
  const show=isEnd||e.closeT>0;e.tear.visible=show;
  if(show){
    e.tear.rotation.y=-PH.S.yaw-Math.PI/2;
    let k=1,wob=0,zip=false;
    if(isEnd&&s.state==='build'){k=s.t/PH.CFG.seam.build;wob=(1-k)*.25;zip=true;}   // 建立時像拉開拉鍊，表面皺起
    else if(!isEnd)k=e.closeT/.45;
    const sx=.36*Math.sqrt(k)*(1+Math.sin(t*38)*wob),sy=.62*k,fade=isEnd?Math.min(1,s.life/2):k;
    e.fab.scale.set(sx,sy,1);e.fab2.scale.set(sx*.68,sy*.78,1);e.fab.material.opacity=.55+.4*fade;
    e.tear.rotation.z=Math.sin(t*30)*wob*.3;
    e.dots.forEach(function(d,i){const a=i*2.4+t*.4,r=.5+(i%3)*.12;d.position.set(Math.cos(a)*sx*r*.6,Math.sin(a)*sy*r*.6,.012);d.scale.setScalar(.018+(i%2)*.01);});
    const n=e.sti.length;
    e.sti.forEach(function(m,i){const a=i/n*6.283;m.position.set(Math.cos(a)*sx*1.02,Math.sin(a)*sy*1.02,.016);m.rotation.z=a+(i%2?.7:-.7)+(isEnd?0:(1-k)*1.2);});
    e.fish.forEach(function(f,i){const a=Math.PI/2+i*2.094;f.position.set(Math.cos(a)*(sx+.1),Math.sin(a)*(sy+.08),.02);f.rotation.z=a;f.visible=k>.6;});
    e.zip.visible=zip;if(zip)e.zip.position.set(sx*.9,sy-2*sy*k,.02);
  }
  // 封縫
  e.tape.visible=sealed||sealing;
  if(e.tape.visible){const k=sealed?1:Math.max(.08,e.sealing);e.tape.scale.set(k,1,1);e.tape.rotation.y=-PH.S.yaw-Math.PI/2;}
  e.warn.visible=sealing;e.ban.visible=sealed;
  if(sealing){e.warn.rotation.y=-PH.S.yaw-Math.PI/2;e.warn.position.y=1.15+Math.sin(t*6)*.03;}
  if(sealed){e.ban.rotation.y=-PH.S.yaw-Math.PI/2;}
  e.wet.visible=wiped&&!sealed;if(e.wet.visible)e.wet.children.forEach(function(d,i){d.position.y=.08+Math.abs(Math.sin(t*3+i))*.06;});
};
ES.ped=function(e,L,P,t){
  e.can.visible=!e.taken;e.halo.visible=!e.taken;e.can.rotation.y=t*.8;
  if(e.spark){e.spark.visible=!e.taken;e.spark.rotation.y=-t*.6;}
  e.dome.visible=!e.taken&&((!!e.need&&!L.f[e.need])||(!!e.tickets&&P.tickets<e.tickets));
};
ES.sw=function(e,L,P,t){
  const vis=!(e.show&&!L.f[e.show])&&!(e.done&&(e.model==='oldcan'));e.g.visible=vis;if(!vis)return;
  const ready=(!e.done||e.repeat)&&(!e.need||L.f[e.need]),holding=P.holdId==='sw'+e.id&&P.holdT>0;
  e.gl.visible=ready;if(ready)e.gl.scale.setScalar(.5+Math.sin(t*5)*.06);
  if(!e.arm)return;
  const m=e.model||'lever';
  if(m==='lever')e.arm.rotation.z=e.done?1.0:holding?-.5+P.holdT*1.6:-.5;
  else if(m==='crank'){if(holding||L.f[e.flag])e.arm.rotation.z=holding?t*8:.6;}
  else if(m==='gear')e.arm.rotation.z=e.done?t*1.5:holding?t*4:.3;
  else if(m==='valve')e.arm.rotation.z=holding?t*6:0;
  else if(m==='button')e.arm.position.y=holding||e.done?.2:.24;
};
ES.push=function(e){e.g.position.set(e.px,0,e.py);if(e.anim>0)e.g.rotation.z=Math.sin(G.t*30)*.02;else e.g.rotation.z=0;};
ES.plate=function(e,L){const vis=!e.need||!!L.f[e.need];e.g.visible=vis;e.disc.position.y=e.done?.0:.04;e.rg.visible=!e.done;if(!e.done)e.rg.material.opacity=.4+Math.sin(G.t*4)*.2;};
ES.pipe=function(e,L){e.g.visible=!(e.show&&!L.f[e.show]);};
ES.towel=function(e){
  e.rg.visible=!e.used;
  if(e.used){e.tw.visible=false;return;}
  if(e.fall>0){const k=1-e.fall/.45;e.tw.position.set(U.lerp(e.x,e.dx,k),U.lerp(1.2,.6,k),U.lerp(e.y,e.dy,k));e.tw.rotation.x=k*1.5;}
  else{e.tw.position.set(e.x,1.2,e.y);e.tw.rotation.x=0;}
};
ES.toy=function(e){e.g.position.set(e.x,0,e.y);if(e.rolling)e.g.rotation.z-=.3;};
ES.knock=function(e){
  if(!e.used){e.g.position.set(e.x,1.05,e.y);e.g.rotation.z=0;return;}
  const k=e.fall>0?1-e.fall/.45:1;e.g.position.set(U.lerp(e.x,e.fx,k),U.lerp(1.05,.02,k*k),U.lerp(e.y,e.fy,k));e.g.rotation.z=k*1.5;
};
ES.item=function(e,L,P,t){
  e.g.visible=!e.taken;if(e.taken)return;
  if(e.gk!==e.kind){e.g.remove(e.gm);const cur=G.cur;G.cur=e.g;itemModel(e);G.cur=cur;}
  e.gm.position.y=.12+Math.sin(t*2.4+e.x)*.06;e.gm.rotation.y=t*1.2;
};
ES.light=function(e){
  e.disc.visible=e.col.visible=e.active;e.head.visible=e.active||e.warn&&Math.sin(G.t*20)>0;
  if(e.active){e.disc.position.set(e.sx,.04,e.sy);e.col.position.set(e.sx,1.35,e.sy);}
};
ES.mover=function(e){e.g.visible=!!e.present;e.g.position.set(e.x,e.model==='bus'?0:-.03+Math.sin(G.t*2+e.x)*.012,e.y);if(e.model==='bus'&&e.dx)e.g.rotation.y=e.dx>0?0:Math.PI;};
ES.wind=function(e,L,P,t){
  e.pad.material.opacity=e.blow?.9:e.warn?(.4+Math.sin(t*14)*.3):.25;
  e.bub.forEach(function(m,i){
    m.visible=e.blow;if(!e.blow)return;
    const k=((t*.5+i*.25)%1);m.position.set(U.lerp(e.from[0],e.to[0],k),.5+Math.sin(k*Math.PI)*1.2,U.lerp(e.from[1],e.to[1],k));const s=.22+i*.04;m.scale.set(s,s,s);
  });
};
ES.plant=function(e,L,P,t){const ins=P.hidden===e;e.eyes.visible=ins;e.lv.rotation.z=ins?Math.sin(t*3)*.05:0;};
ES.gate=function(e,L,P,t,dt){
  const tg=e.closed?0:1,h=e.h==null?1.4:e.h;
  e.ak+=U.clamp(tg-e.ak,-dt*2.2,dt*2.2);
  if(e.haz){e.g.position.y=-(1-e.ak)*.7;e.g.visible=e.ak>.02;}          // 橋：開啟時浮上來
  else{e.g.position.y=-e.ak*(h+1.4);e.g.visible=e.ak<.98&&!(e.warn&&Math.sin(t*22)>0.3);}   // 門：開啟時沉下去；快關上前會閃
};
ES.exit=function(e,L,P,t){
  const on=PH.S.practice&&(!e.need||!!L.f[e.need]);e.g.visible=PH.S.practice;
  e.ring.material.color.set(on?'#8fe3b4':'#888');e.beam.visible=on;e.ring.scale.setScalar(.7+Math.sin(t*4)*.05);
};
ES.door=function(e){e.bulbM.color.set(e.openT>0&&Math.sin(G.t*18)>0?'#ef5d50':'#5a3d24');};

/* ---------- 建立整個世界 ---------- */
G.buildWorld=function(L){
  for(const e of L.ents){const f=EB[e.t];if(f)f(e,L);}
  G.cat=makeCat(L);G.catS=1;
  G.dogm=L.dogs.map(function(d){const m=makeDog(d.kind);m.cone=makeCone();return m;});
  G.dropcan=makeCan(null,CANCOL[L.id]);
  G.decoy=gp();bl(.2,.16,.16,'#b9a08a',0,.18,0,G.decoy);bl(.12,.11,.12,'#b9a08a',.2,.3,0,G.decoy);[-1,1].forEach(function(s){cn(.05,.1,'#b9a08a',.2,.42,s*.07,G.decoy);});
  G.lure=gp();bl(.2,.05,.08,'#b9773c',0,.06,0,G.lure);
  G.aim=flat(GEO.ring,basic('#ffd23f',.9),0,.06,0);G.aimDot=flat(GEO.circ,basic('#ffd23f',.5),0,.055,0);G.aimDot.scale.set(.25,.25,1);
  // 畫縫預覽：兩個縫點之間拉起的針腳線（合法＝薄荷青直針腳；不合法＝珊瑚紅叉叉）
  G.thread=[];G.threadM=basic(SEAM.mint,.95);
  for(let i=0;i<16;i++){const m=add(GEO.box,G.threadM,.16,.03,.03,0,0,0);m.castShadow=false;m.visible=false;G.thread.push(m);}
  // 特效池
  G.pool={parts:[],rings:[]};
  for(let i=0;i<70;i++){const m=new T3.Mesh(GEO.ico,new T3.MeshBasicMaterial({color:'#ffffff'}));m.visible=false;G.cur.add(m);G.pool.parts.push(m);}
  for(let i=0;i<10;i++){const m=flat(GEO.ring,basic('#ffffff',.6),0,.06,0);m.visible=false;G.pool.rings.push(m);}
  // BOSS 場地
  G.boss=null;
  if(L.def.boss){
    const C=L.def.boss;
    G.boss=G.makeBoss();G.boss.g.visible=false;G.tele=makeTele();
    G.plate=gp(C.plate[0],0,C.plate[1]);cy(.12,.3,'#5a6a8a',0,.15,0,G.plate);
    G.plateM=gp(0,.3,0,G.plate);add(GEO.box,M('#dff6ff',{emissive:'#bfe0ff',emissiveIntensity:.4,roughness:.1}),.14,1.8,2.2,0,.9,0,G.plateM);bx(.18,.12,2.3,'#ffd23f',0,1.84,0,G.plateM);bx(.18,.12,2.3,'#ffd23f',0,.02,0,G.plateM);
    const rr=flat(GEO.ring,basic('#8fe3b4',.6),C.rest[0],.03,C.rest[1]);rr.scale.set(C.rest[2],C.rest[2],1);
    const rd=flat(GEO.circ,basic('#8fe3b4',.14),C.rest[0],.025,C.rest[1]);rd.scale.set(C.rest[2],C.rest[2],1);
    G.locks=[-1,0,1].map(function(i){const m=add(GEO.box,new T3.MeshStandardMaterial({color:'#ef5d50',emissive:'#ef5d50',emissiveIntensity:.5,flatShading:true}),.34,.4,.2,15.5+i*.7,2.0,4.5);m.castShadow=false;return m;});
    G.frostBeam=null;
  }
};

/* ---------- 每幀同步角色 ---------- */
function syncCat(L,P,t,dt){
  const c=G.cat,S=PH.S,F=PH.FORMS[P.form];
  let vis=!P.hidden&&!P.pipe&&S.mode!=='title'&&S.mode!=='ending';
  if(P.grace>0&&S.mode==='play'&&Math.sin(t*26)>.4)vis=false;
  if(S.mode==='cut'&&G.cutCat)vis=true;
  c.g.visible=vis;if(!vis)return;
  c.g.position.set(P.x,(P.fz||0),P.y);c.g.rotation.y=-P.face;
  // 實測：窄處鏡頭被牆推到貼著貓時，整個畫面變成貓的後腦 → 太近就先不畫貓
  if(G.camera&&S.mode==='play'){const cp=G.camera.position;if(Math.hypot(cp.x-P.x,cp.y-.35*G.catS,cp.z-P.y)<.42*G.catS+.12){c.g.visible=false;return;}}
  const big=P.form==='mini'||P.form==='giant'||P.form==='normal';
  G.catS+=((big?F.scale:1)-G.catS)*Math.min(1,dt*9);
  let sq=1;if(P.warp){const w=P.warp;sq=w.t<.32?Math.max(.05,1-w.t/.32):Math.min(1,(w.t-.32)/.3);}
  c.norm.visible=big;c.liq.visible=P.form==='liquid';c.shd.visible=P.form==='shadow';
  c.norm.scale.set(G.catS*sq,G.catS*(2-sq),G.catS*sq);
  c.liq.scale.set(sq,1,sq);c.shd.scale.set(sq,1,sq);
  if(P.form==='liquid'){const wv=Math.sin(t*6)*.05;c.puddle.scale.set(.4+wv,.08,.34-wv);}
  const mv=P.moving?1:0,fq=P.form==='mini'?20:P.form==='giant'?9:14,sw=Math.sin(t*fq)*.6*mv,ez=Math.min(1,dt*8);
  const alert=PH.Dogs.any(['chase','pounce','bark']),sus=!alert&&PH.Dogs.any(['sus','inv','search','look']);
  // 姿勢：停下來一陣子會坐下；起疑、被追或輕腳時壓低身體
  c.still=mv||alert||P.sneak||P.holdId||P.aim?0:c.still+dt;
  c.sit+=((c.still>1.4?1:0)-c.sit)*Math.min(1,dt*(c.still>1.4?3:10));
  c.crouch+=((alert||sus||P.sneak?1:0)-c.crouch)*ez;
  const th=.38*c.sit,cs=Math.cos(th),sn=Math.sin(th),px=-.2,py=.1;   // 以臀部後下方為支點往後坐
  const bob=Math.abs(Math.sin(t*fq))*.02*mv,dip=-.05*c.crouch;
  c.body.rotation.set(P.lean*.25,0,th+Math.sin(t*fq)*.03*mv);
  c.body.position.set(px-(px*cs-py*sn),py-(px*sn+py*cs)+bob+dip,0);
  c.head.rotation.set(0,-P.lean*.6,-th*.8+Math.sin(t*fq+1)*.03*mv+(alert?.1:0));
  const legS=1-.33*c.crouch;
  c.legs[0].rotation.z=sw-th;c.legs[1].rotation.z=-sw-th;c.legs[0].scale.y=c.legs[1].scale.y=legS+.82*c.sit;   // 前腳：坐下時撐直
  c.legs[2].rotation.z=-sw+1.15*c.sit;c.legs[3].rotation.z=sw+1.15*c.sit;c.legs[2].scale.y=c.legs[3].scale.y=legS;   // 後腳：坐下時往前折
  // 尾巴：走路翹高捲成問號、輕腳壓低、被追炸毛、坐下時繞到身體側邊
  const ta=alert?1.0:P.sneak?-.35:mv?.75:c.sit>.5?-.15:.3+Math.sin(t*1.7)*.12,tc=alert?.15:P.sneak?.15:mv?.6:.85+Math.sin(t*2.3)*.15;
  c.ta+=(ta-c.ta)*ez;c.tc+=(tc-c.tc)*ez;c.puff+=((alert?1.45:1)-c.puff)*Math.min(1,dt*10);
  setCatTail(c,t,mv?.6:1);
  // 耳朵：起疑時轉向、被追和輕腳時往後貼，停著偶爾抖一下
  const twitch=!mv&&!alert&&Math.sin(t*.9)>.97?Math.sin(t*40)*.25:0;
  c.ears.forEach(function(e,i){const tgt=alert?.85:P.sneak?.55:sus?.3:twitch*(i?1:-1);e.rotation.z+=(tgt-e.rotation.z)*Math.min(1,dt*12);});
  c.can.visible=P.hasCan;
  if(P.hasCan){const s=big?Math.max(.45,G.catS):1;c.can.scale.setScalar(s);c.can.position.set(-.04*s,big?.46*G.catS:.14,0);}
}
function syncDogs(L,P,t,dt){
  L.dogs.forEach(function(d,i){
    const m=G.dogm[i];if(!m)return;
    m.g.visible=d.active;syncCone(m.cone,d,P);if(!d.active)return;
    const onSoup=W.kind(Math.floor(d.x),Math.floor(d.y))==='hazard';
    m.g.position.set(d.x,onSoup?.05:0,d.y);m.g.rotation.y=-d.ang;
    const sc=(d.K.heavy||d.K.sleeper?1.2:1)*(d.spawnT>0?Math.max(.1,1-d.spawnT/1.3):1);m.g.scale.setScalar(sc);
    const sw=d.moving?Math.sin(t*13+i)*.6:0;
    m.legs[0].rotation.z=sw;m.legs[3].rotation.z=sw;m.legs[1].rotation.z=-sw;m.legs[2].rotation.z=-sw;
    const sleep=d.state==='sleep'||(d.stunT>0&&d.stunKind==='sleepy');
    let by=d.moving?Math.abs(Math.sin(t*13+i))*.03:0,lean=0;
    if(sleep){by=-.2+Math.sin(t*1.6)*.03;lean=-.35;}
    else if(d.state==='pounce'&&d.ph===0){by=-.1;lean=.25;}
    else if(d.state==='bark'){lean=-.3;}
    else if(d.busy){lean=.4;}
    m.body.position.y=by;m.head.rotation.z=lean+(d.state==='look'||d.state==='inv'?Math.sin(t*9)*.08:0);
    m.body.rotation.z=d.stunT>0&&d.stunKind==='slip'?1.3:0;
    m.towel.visible=d.stunT>0&&d.stunKind==='towel';
    m.tape.visible=d.state==='seal';
    m.lid.visible=onSoup;
    if(m.beam)m.beam.visible=!sleep&&d.stunT<=0;
    if(m.mop)m.mop.rotation.y=d.state==='wipe'&&d.busy?Math.sin(t*10)*.5:0;
    if(m.lamp)m.lamp.rotation.x=d.moving?Math.sin(t*13+i)*.25:Math.sin(t*1.5)*.05;
  });
}
function syncBoss(L,P,t,dt){
  const o=G.boss,B=PH.Boss;if(!o)return;
  o.g.visible=B.active;
  G.plateM.rotation.y=U.lerp(G.plateM.rotation.y,L.f.lever1ready?.9:0,.1);
  G.locks.forEach(function(m,i){const open=B.locks[i];m.material.color.set(open?'#8fe3b4':'#ef5d50');m.material.emissive.set(open?'#8fe3b4':'#ef5d50');m.position.y=2.0+(open?.3:0)+Math.sin(t*2+i)*.03;m.visible=B.active;});
  syncTele(G.tele,L,t);
  if(!B.active)return;
  o.g.position.set(B.x,0,B.y);o.g.rotation.y=-B.ang;
  const st=B.state,walking=st==='walk'||st==='idle'||st==='ring'||st==='dash';
  const sw=walking?Math.sin(t*9)*.4:0;
  o.legs[0].rotation.z=sw;o.legs[3].rotation.z=sw;o.legs[1].rotation.z=-sw;o.legs[2].rotation.z=-sw;
  let by=0,hz=0;
  if(st==='tele'&&B.move==='pounce'){by=-.35;hz=.2;}
  else if(st==='tele'&&B.move==='sniff'){hz=-.5;}
  else if(st==='tele'&&(B.move==='shock'||B.move==='stomp')){by=.25+Math.sin(t*20)*.03;}
  else if(st==='stun'||st==='dizzy'){hz=Math.sin(t*6)*.3;by=-.2;}
  else if(st==='yield'){by=-.45;hz=-.15;}
  o.body.position.y+=(by-o.body.position.y)*.2;o.head.rotation.z=hz;
  o.tail.rotation.z=st==='tele'&&B.move==='tail'?.9:Math.sin(t*3)*.15;o.tail.rotation.y=st==='spin'||st==='ring'?Math.sin(t*10)*.5:0;
  o.fish.visible=!!L.f.fish;o.frost.visible=B.frostT>0;
  o.helm.visible=st!=='yield';o.gun.visible=st==='tele'&&B.move==='tape';
  o.lamp.material.emissiveIntensity=(st==='sweep'||(st==='tele'&&B.move==='sweep'))?2:.4;
}
G.sync=function(L,P,t,dt){
  for(const e of L.ents){const f=ES[e.t];if(f&&e.g)f(e,L,P,t,dt);}
  syncCat(L,P,t,dt);syncDogs(L,P,t,dt);syncBoss(L,P,t,dt);
  G.dropcan.visible=!!L.can;if(L.can){G.dropcan.position.set(L.can.x,Math.abs(Math.sin(t*5))*.03,L.can.y);G.dropcan.rotation.z=L.def.trouble==='walk'?Math.sin(t*8)*.15:0;}
  G.decoy.visible=!!L.decoy;if(L.decoy){G.decoy.position.set(L.decoy.x,0,L.decoy.y);G.decoy.rotation.y=-Math.atan2(L.decoy.vy,L.decoy.vx);}
  G.lure.visible=!!L.lure;if(L.lure)G.lure.position.set(L.lure.x,0,L.lure.y);
  const D=PH.Seams.draw,th=!!D&&!!D.from&&!!D.hover,n=G.thread.length;
  if(th){
    const A=D.from,Bn=D.hover,ok=!!D.res&&D.res.ok,ang=Math.atan2(Bn.y-A.y,Bn.x-A.x);
    G.threadM.color.set(ok?SEAM.mint:SEAM.coral);
    G.thread.forEach(function(m,i){
      const k=(i+.5)/n,x=U.lerp(A.x,Bn.x,k),z=U.lerp(A.y,Bn.y,k),y=.5+Math.sin(k*Math.PI)*.45+Math.sin(t*6+i)*.02;
      m.visible=i%2===0||ok;m.position.set(x,y,z);m.rotation.set(0,-ang,ok?0:(i%4?.8:-.8));
    });
  }else G.thread.forEach(function(m){m.visible=false;});
  const a=P.aim;G.aim.visible=G.aimDot.visible=!!a;
  if(a){const s=.5+Math.sin(t*8)*.08;G.aim.position.set(a.x,.06,a.y);G.aim.scale.set(s,s,1);G.aimDot.position.set(a.x,.055,a.y);}
};
})();
