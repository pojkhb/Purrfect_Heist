/* 關卡資料（體驗關）：喵喵訓練營
   一條直線走到底的教學關，每一站教一件事：移動與紙箱 → 迷你貓 → 貓縫 → 巨大貓 → 液體貓 → 影子貓 → 狗與輕腳、道具 → 喵聲投射 → 偷罐回箱。
   所有形態與喵聲投射在這一關都「借你用」（allForms），不會寫進存檔；畫縫不扣奇妙值（free）。 */
(function(){
'use strict';
const PH=window.PH,U=PH.U,W=PH.World;

PH.defLevel({
  id:'training',title:'體驗關',name:'喵喵訓練營',size:[55,10],next:null,
  trial:true,allForms:true,free:true,tutorial:true,maxAlert:1,coreR:99,
  canName:'訓練罐',cpTheft:[46.5,7.5],
  // 美術：寵物店感的粉嫩配色，白天、亮、沒有壓迫感
  pal:{sky:'#ffd9e8',sky2:'#bfe6ff',fog:'#ffe9f1',fogNear:22,fogFar:70,wall:'#f7c6d6',trim:'#7ec8e3',cap:'#fff0dc',
    floor:['#eccfa4','#e3c193','#c4e2d4','#b6d9ca'],block:'#ff9fbd',top:'#fff0dc',wallTex:'plaster',floorTex:'plank'},   // 實測：太接近白色會被輝光整片洗掉
  mood:{hemi:['#ffffff','#ffc8dc',0.78],sun:['#fff4e0',0.42,[18,16,-4]],amb:'#ffe0ec',ambI:0.3},
  ops:[
    ['.',1,3,5,7],                 // A 出生房：紙箱、移動、喵
    ['c',6,5,6,5],                 // 只有迷你貓鑽得過的小洞
    ['.',7,2,11,8],                // B 貓縫
    ['C',12,2,12,8],               // 擋路的矮櫃（看得到對面，過不去）
    ['.',13,2,18,8],               // C 巨大貓
    ['.',19,5,19,5],['.',19,3,19,3],   // 被大木箱堵住的門、木箱推進去的凹槽
    ['.',20,4,25,8],               // D 液體貓
    ['.',27,2,33,8],               // E 影子貓
    ['%',34,2,34,8],               // 光柵欄：只有影子過得去
    ['.',35,2,44,8],               // F 狗、輕腳、紙箱、玩具、道具
    ['.',45,5,45,5],               // 通往 G 的門
    ['.',46,2,53,8],               // G 喵聲投射、偷罐、回箱
    ['C',49,2,49,4]                // G 罐台旁的矮櫃：擋住鬥牛犬看罐台的視線
  ],
  shade:[[31,2,37,8]],
  start:{x:2.5,y:5.5,box:'home',yaw:0},
  ents:[
    {t:'box',id:'home',x:2.5,y:5.5,safe:1},
    // B：貓縫
    {t:'anchor',id:'T1a',x:11.4,y:5.5,pair:'T1b',name:'訓練縫 A'},
    {t:'anchor',id:'T1b',x:13.6,y:5.5,pair:'T1a',name:'訓練縫 B'},
    // C：巨大貓推木箱
    {t:'push',id:'crate',slots:[[19,5],[19,3]],form:'giant',h:1.3,model:'crate',label:'推開大木箱'},
    {t:'item',id:'sc_t1',x:17.5,y:7.5,kind:'smallcan',name:'普通小罐'},
    // D → E：液體貓流過水管
    {t:'pipe',id:'tpipe',a:[24.5,6.5],b:[27.5,6.5]},
    // E：影子貓穿光柵欄，探照燈會把影子逼出來
    {t:'light',id:'tspot',mx:32.5,my:2.2,pts:[[32.5,2.8],[32.5,7.6]],r:1.0,period:7,detect:false},
    // F：狗區
    {t:'box',id:'fbox',x:38.5,y:2.5,safe:1},
    {t:'toy',id:'ball',x:39.5,y:6.5},
    {t:'item',id:'i_furball_t',x:36.5,y:7.5,kind:'furball'},
    // G：喵聲投射、罐台、終點紙箱
    {t:'ped',id:'ped',x:47.5,y:2.5,fx:47.5,fy:3.45,hold:0.6,label:'抱走訓練罐'},
    {t:'box',id:'goal',x:47.5,y:7.5,safe:1,finish:1},
    {t:'item',id:'sc_t2',x:44.5,y:2.5,kind:'smallcan',name:'普通小罐'},
    // 每一站的檢查點與說明
    {t:'zone',id:'zB',rect:[7,2,11,8],cp:['B',8,5.5],say:'第 2 站：貓縫。走到發光的魚骨縫線旁點一下（或按 F），再點矮櫃對面的縫點，就會拉開一道貓縫。走到縫口點一下鑽過去。'},
    {t:'zone',id:'zC',rect:[13,2,18,8],cp:['C',14.5,5.5],say:'第 3 站：巨大貓（3）。變大後推得動重物、壓得下踏板，但腳步很吵、也很顯眼。把東邊的大木箱推開。'},
    {t:'zone',id:'zD',rect:[20,4,25,8],cp:['D',21,6],say:'第 4 站：液體貓（4）。可以流進水管與窄口。走到水管口點一下流進去。'},
    {t:'zone',id:'zE',rect:[27,2,33,8],cp:['E',28.5,6.5],say:'第 5 站：影子貓（5）。只能在地上的深色陰影裡變身、移動，穿得過光柵欄。燈光照到會被逼回原形——等燈掃過去再走。'},
    {t:'zone',id:'zF',rect:[38,2,44,8],cp:['F',36.5,5.5],say:'第 6 站：狗。狗只會看前方的扇形，聽得到腳步聲。按住 Shift（或「輕腳」）走路沒有聲音；被看到就躲進紙箱。踢玩具、喵一聲都能把牠引開。'},
    {t:'zone',id:'zG',rect:[43,2,44.99,8],cp:['G',43.5,5.5],say:'第 7 站：喵聲投射。門後的鬥牛犬盯著門口。站在門外，按住空白鍵瞄準房間深處（東邊），放開——聲音會從那裡冒出來，牠會過去查看。'}
  ],
  dogs:[
    {id:'pup',kind:'shiba',x:41.5,y:3,route:[[41.5,3,1],[41.5,7.5,1]]},
    {id:'bull',kind:'bulldog',x:48.5,y:5.5,post:1,face:Math.PI,route:[[48.5,5.5]]}
  ],
  openCut:['咪嚕抱著訓練罐，鑽回紙箱。','罐子裡是一張貼紙：「訓練完成！今晚整座宇宙的罐罐都在等你。」','體驗關裡的形態都是借你的——正式冒險要一關一關把罐罐帶回紙箱，才會真正解鎖。'],
  update:function(L){
    const P=PH.P;
    if(!L.T.h0){L.T.h0=1;PH.UI.say('歡迎來到喵喵訓練營！這一關把所有能力都借給你。先點一下（或按 E）離開紙箱。',8);}
    if(!L.T.h1&&!P.hidden&&P.x<6){L.T.h1=1;PH.UI.say('第 1 站：WASD 移動，滑鼠轉視角（先點一下畫面）。空白鍵喵一聲。東牆角有個小洞——按 2 變成迷你貓鑽過去。',9);}
    if(!L.T.h2&&L.E.crate.slot===1){L.T.h2=1;PH.UI.say('木箱推開了！巨大貓很耗奇妙值，按 1 變回普通貓會慢慢回復。',6);}
    if(!L.T.h3&&P.form==='shadow'){L.T.h3=1;PH.UI.say('變成影子了！影子貓摸不到機關，也抱不了罐罐。穿過光柵欄後走出陰影會自動變回來。',7);}
    if(!L.T.h4&&L.theft){L.T.h4=1;PH.UI.say('拿到了！罐罐不見，狗會過來查看罐台。快抱著罐罐鑽進南邊的終點紙箱。',7);}
  },
  objective:function(L){
    const P=PH.P;
    if(L.theft)return {t:'抱著訓練罐鑽進終點紙箱',x:47.5,y:7.5};
    if(P.x<6.5){
      if(P.hidden)return {t:'點一下（或按 E）離開紙箱',x:2.5,y:5.5};
      return {t:P.form==='mini'?'鑽過東邊的小洞':'按 2 變迷你貓，鑽過東邊牆角的小洞',x:6.5,y:5.5};
    }
    if(P.x<12)return {t:Seamy(L)?'走到縫口點一下，鑽過去':'在縫點旁點一下，再點矮櫃對面的縫點',x:11.4,y:5.5};
    if(P.x<20)return L.E.crate.slot===0?{t:P.form==='giant'?'推開東邊的大木箱':'按 3 變巨大貓，推開大木箱',x:19.5,y:5.5}:{t:'穿過木箱原本擋住的門',x:20.5,y:5.5};
    if(P.x<26.5)return {t:P.form==='liquid'?'走到水管口，流進去':'按 4 變液體貓，流進東邊的水管',x:24.5,y:6.5};
    if(P.x<34.5)return {t:P.form==='shadow'?'等燈掃過，穿過東邊的光柵欄':'走進地上的深色陰影，按 5 變影子貓',x:P.form==='shadow'?34.5:31.5,y:5.5};
    if(P.x<43)return {t:P.form==='shadow'?'走出陰影，或按 1 變回普通貓':'輕腳（Shift）繞過柴柴，到東邊的門',x:43.5,y:5.5};
    if(P.x<46)return {t:'按住空白鍵瞄準房間深處，放開投射喵聲',x:52,y:6.5};
    return {t:'趁鬥牛犬去查看，抱走罐台上的訓練罐',x:47.5,y:3};
  },
  build:function(B,L){
    const PINK='#ff8fb1',CREAM='#fff6e8',SKY='#7ec8e3',INK='#5a3a5c';
    B.sign('① 移動・紙箱',3,2.3,3.06,0,2.2,.45,PINK,CREAM);
    B.sign('② 貓縫',9,2.4,2.06,0,1.6,.45,SKY,CREAM);
    B.sign('③ 巨大貓',15.5,2.4,2.06,0,1.8,.45,'#f6b35a',CREAM);
    B.sign('④ 液體貓',22.5,2.2,4.06,0,1.8,.45,'#5fb3c9',CREAM);
    B.sign('⑤ 影子貓',30,2.4,2.06,0,1.8,.45,INK,'#ffd23f');
    B.sign('⑥ 狗與輕腳',40,2.4,2.06,0,2.2,.45,'#8fc3b4',CREAM);
    B.sign('⑦ 喵聲投射',50.5,2.4,2.06,0,2.2,.45,'#c79bf0',CREAM);
    // 小洞口的提示箭頭、貓掌地貼
    [[4,5.5],[5,5.5],[9.8,5.5],[16.5,5.5],[22.8,6.5],[29.5,5.5]].forEach(function(q){B.rug(q[0],q[1],.22,'#ffffff','#ffb3c8');});
    B.lantern(3,1.9,4,'#ffcf7a');B.lantern(15.5,2.2,4.5,'#ffcf7a');B.lantern(40,2.2,4,'#ffcf7a');B.lantern(49.5,2.2,6,'#ffcf7a');
    B.bunting(1,3.05,5.9,3.05,2.6);B.bunting(7,2.05,18.9,2.05,2.9);B.bunting(35,2.05,53.9,2.05,2.9);
    B.herb(1.4,0,7.4,1);B.herb(7.4,0,8.4,1);B.herb(25.4,0,4.4,1);B.herb(53.4,0,8.4,1);
    B.motes(27,5,54,8,3,40,'#ffd2e4','petal');
  },
  checks:[
    {name:'普通貓出不了出生房',form:'normal',from:[2.5,5.5],to:[8.5,5.5],expect:false},
    {name:'迷你貓鑽得過小洞',form:'mini',from:[2.5,5.5],to:[8.5,5.5],expect:true},
    {name:'矮櫃擋住 B→C',form:'mini',from:[8.5,5.5],to:[14.5,5.5],expect:false},
    {name:'木箱擋住 C→D',form:'normal',from:[14.5,5.5],to:[21.5,5.5],expect:false},
    {name:'推開木箱後 C→D 可通行',slots:{crate:1},form:'normal',from:[14.5,5.5],to:[21.5,5.5],expect:true},
    {name:'D 走不到 E',slots:{crate:1},form:'mini',from:[21.5,5.5],to:[28.5,5.5],expect:false},
    {name:'普通貓過不了光柵欄',form:'mini',from:[28.5,5.5],to:[40.5,5.5],expect:false},
    {name:'影子貓穿過光柵欄',form:'shadow',from:[32.5,5.5],to:[36.5,5.5],expect:true},
    {name:'F 走得到罐台與終點紙箱',form:'normal',from:[36.5,5.5],to:[47.5,7.5],expect:true}
  ]
});
function Seamy(L){return !!(PH.Seams&&PH.Seams.seam);}
})();
