const C=document.getElementById('c'),X=C.getContext('2d'),W=960,H=540;C.width=W;C.height=H;
const sprite=(name)=>{const image=new Image();image.src='../assets/sprites/'+name+'.png';return image};
const SPRITES={
  ship:[1,2,3,4,5].map(i=>sprite('ship-'+i)),
  shipP2:[1,2,3,4].map(i=>sprite('ship-p2-'+i)),
  shot:sprite('shot-single'),
  shotGoldGlow:null,
  shotBlueGlow:null,
  controlPad:sprite('control-pad'),
  controlDpad:sprite('control-dpad'),
  controlFace:['a','b','x','y'].map(name=>sprite('control-'+name)),
  controlFrame:sprite('control-frame'),
  controlFrameFocus:sprite('control-frame-focus')
};
SPRITES.shot.addEventListener('load',()=>{
  const makeShotVariant=(blue)=>{
    const source=SPRITES.shot,pad=12,canvas=document.createElement('canvas');
    canvas.width=source.naturalWidth+pad*2;canvas.height=source.naturalHeight+pad*2;
    const ctx=canvas.getContext('2d');ctx.filter=blue?'hue-rotate(175deg) saturate(1.6) brightness(1.12)':'none';
    ctx.shadowColor=blue?'#55cfff':'#ffe08a';ctx.shadowBlur=14;ctx.drawImage(source,pad,pad);
    ctx.shadowBlur=0;ctx.drawImage(source,pad,pad);return canvas;
  };
  SPRITES.shotGoldGlow=makeShotVariant(false);SPRITES.shotBlueGlow=makeShotVariant(true);
});
const K={};
let lastInputDevice='auto';
let lastGamepadPlayer=0;
addEventListener('keydown',e=>{
  if(!e.repeat){lastInputDevice='keyboard';unlockMusic()}
  if(scene==='pause'&&e.code==='KeyH'&&!e.repeat){e.preventDefault();scene='cheats';menuCursor=0;return}
  if(!K[e.code])K[e.code]=2;
  if(e.code.startsWith('Arrow')||e.code==='Space')e.preventDefault();
});
addEventListener('keyup',e=>K[e.code]=0);
addEventListener('gamepadconnected',()=>{if(lastInputDevice==='auto')lastInputDevice='gamepad'});
addEventListener('gamepaddisconnected',()=>{if(lastInputDevice==='gamepad'&&!isControllerConnected())lastInputDevice='keyboard'});
const KEYS=[
  {u:'KeyW',d:'KeyS',l:'KeyA',r:'KeyD',f:'KeyJ',m:'KeyK',x:'KeyL'},
  {u:'ArrowUp',d:'ArrowDown',l:'ArrowLeft',r:'ArrowRight',f:'Comma',m:'Period',x:'Slash'}
];
const cl=(v,a,b)=>Math.max(a,Math.min(b,v));

let A;
const settings={volume:50,fps:60,quality:'high'};
const musicTracks={
  menu:new Audio('../assets/audio/menu.mp3'),
  normal:new Audio('../assets/audio/normal.mp3'),
  expert:new Audio('../assets/audio/especialista.m4a')
};
for(const track of Object.values(musicTracks)){track.loop=true;track.preload='auto';track.volume=settings.volume/100}
let activeMusicKey=null,musicUnlocked=false;
function musicKeyForScene(){
  if(['splash','mainmenu','modes','diff','codex','quit','win','lose'].includes(scene))return 'menu';
  if(scene==='settings'&&previousScene!=='pause')return 'menu';
  return hard?'expert':'normal';
}
function setMusicTrack(key,restart=false){
  const selected=musicTracks[key];if(!selected)return;
  Object.entries(musicTracks).forEach(([name,track])=>{if(name!==key)track.pause()});
  if(activeMusicKey===key&&!restart){selected.volume=settings.volume/100;return}
  activeMusicKey=key;
  if(restart){try{selected.currentTime=0}catch{}}
  selected.volume=settings.volume/100;
  if(musicUnlocked){const playback=selected.play();if(playback&&typeof playback.catch==='function')playback.catch(()=>{})}
}
function updateMusicForScene(){
  const volume=cl(settings.volume,0,100)/100;
  Object.values(musicTracks).forEach(track=>track.volume=volume);
  const wanted=musicKeyForScene();if(wanted!==activeMusicKey)setMusicTrack(wanted);
}
function unlockMusic(){
  if(musicUnlocked)return;musicUnlocked=true;updateMusicForScene();
  const selected=musicTracks[musicKeyForScene()];
  if(selected&&selected.paused){const playback=selected.play();if(playback&&typeof playback.catch==='function')playback.catch(()=>{})}
}
let settingsTab='general';
const GAMEPAD_DEFAULTS={up:12,down:13,left:14,right:15,fire:7,super:1,mode:2,confirm:0,pause:9,back:8};
function loadGamepadBindings(){
  try{const saved=JSON.parse(localStorage.getItem('snct-gamepad-bindings')||'null');return [0,1].map(i=>{const row={...GAMEPAD_DEFAULTS,...(saved?.[i]||{})};for(const action in GAMEPAD_DEFAULTS)if(!Number.isInteger(row[action])||row[action]<0||row[action]>31)row[action]=GAMEPAD_DEFAULTS[action];return row})}
  catch{return [{...GAMEPAD_DEFAULTS},{...GAMEPAD_DEFAULTS}]}
}
const gamepadBindings=loadGamepadBindings();
let controlPlayer=0,remapPending=null;
function initAudio(){
  if(!A){
    try{ A=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){}
  }
  if(A && A.state==='suspended') A.resume();
}

function snd(f,d=.08,ty='square',v=.04,s=0){
  if(settings.volume<=0)return;
  initAudio();if(!A)return;
  try{
    const o=A.createOscillator(),g=A.createGain(),n=A.currentTime;
    o.type=ty;o.frequency.setValueAtTime(f,n);
    if(s)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+s),n+d);
    g.gain.setValueAtTime(v*(settings.volume/100),n);
    g.gain.exponentialRampToValueAtTime(.001,n+d);
    o.connect(g);g.connect(A.destination);
    o.start();o.stop(n+d);
  }catch(e){}
}

let scene='splash',nP=1,P=[],B,bul=[],sh=[],pk=[],pt=[],asteroids=[],pwItems=[],flashR=0,flashW=0;
let t=0,shake=0,hs=0,tip='',tipT=0,hits=0,clock=0,tm=0,eclipse=0,combo=false,hard=1;
let isTouch = false;
let winnerText = '';
let finalBossTimeStr = '';
let previousScene='mainmenu',pauseCount=0,pauseCards=[],menuCursor=0,uiButtons=[],menuFocus='keyboard';
const cheatSettings={god:false,infiniteHealth:false,damageMultiplier:1};
const STAR_CARDS=[
  'Nancy Grace Roman: pioneira dos observatórios espaciais.',
  'O Hubble enxerga o universo acima da atmosfera terrestre.',
  'O telescópio Roman terá um campo de visão muito amplo.',
  'O coronógrafo bloqueia a luz de uma estrela distante.',
  'Microlentes gravitacionais podem revelar exoplanetas.',
  'A energia escura acelera a expansão do universo.',
  'A luz das estrelas leva tempo para chegar até nós.'
];
const BOSSES=[
  {name:'AG CARINAE · NEBULOSA VERMELHA',kind:'agRed',maxHp:150,rewardName:'AG Carinae · casca de gás',image:'agRed',context:'A estrela AG Carinae expeliu suas camadas externas em uma ou mais grandes erupções. A casca de gás e poeira ao redor mede cerca de cinco anos-luz.',credit:'NASA, ESA e STScI.',source:'https://science.nasa.gov/image-detail/ag-carinae-2/'},
  {name:'AG CARINAE · NEBULOSA COLORIDA',kind:'echo',maxHp:170,rewardName:'AG Carinae · composição colorida',image:'agColor',context:'Esta composição combina exposições de vários filtros do Hubble. As cores foram atribuídas a diferentes faixas de luz para destacar gás ionizado e poeira refletindo a luz da estrela.',credit:'NASA, ESA e STScI.',source:'https://science.nasa.gov/asset/hubble/ag-carinae/'},
  {name:'PILARES DA CRIAÇÃO',kind:'pillars',maxHp:185,rewardName:'Pilares da Criação · M16',image:'pillars',context:'Essas colunas de gás e poeira ficam na Nebulosa da Águia. Em regiões densas no interior dos pilares, novas estrelas estão se formando.',credit:'NASA, ESA e Hubble Heritage Team (STScI/AURA).',source:'https://science.nasa.gov/asset/hubble/2014-hubble-wfc3uvis-image-of-m16-cropped/'}
];
const REWARD_IMAGES={agRed:new Image(),pillars:new Image(),agColor:new Image()};
REWARD_IMAGES.agRed.src='../assets/rewards/ag-carinae-red.png';
REWARD_IMAGES.pillars.src='../assets/rewards/pillars-of-creation.png';
REWARD_IMAGES.agColor.src='../assets/rewards/ag-carinae-color.png';
const CODEX_IMAGES={nancy:new Image(),hubble:new Image(),roman:new Image()};
CODEX_IMAGES.nancy.src='../assets/codex/nancy-roman.jpg';
CODEX_IMAGES.hubble.src='../assets/codex/hubble-telescope.jpeg';
CODEX_IMAGES.roman.src='../assets/codex/roman-telescope.jpg';
const CODEX_ENTRIES=[
  {tab:'NANCY',title:'Nancy Grace Roman',subtitle:'PIONEIRA DA ASTRONOMIA ESPACIAL',paragraphs:['Nancy Grace Roman (1925–2018) foi uma astrônoma que defendeu a observação do universo acima da atmosfera.','Entrou na NASA em 1959 e, em 1960, tornou-se a primeira chefe de Astronomia da agência. Seu trabalho ajudou a viabilizar grandes observatórios espaciais como o Hubble.'],image:CODEX_IMAGES.nancy,credit:'Imagem local: ProjetoSnct/Nancy.jpg.'},
  {tab:'HUBBLE',title:'Telescópio Espacial Hubble',subtitle:'UM OBSERVATÓRIO ACIMA DA ATMOSFERA',paragraphs:['Lançado em 1990, o Hubble observa o universo sem a distorção da atmosfera terrestre.','Uma falha no espelho primário foi corrigida em 1993 com instrumentos ópticos corretivos, permitindo imagens nítidas que transformaram a astronomia.'],image:CODEX_IMAGES.hubble,credit:'Imagem local: ProjetoSnct/telescopioHubble.jpeg.'},
  {tab:'ROMAN',title:'Telescópio Espacial Nancy Grace Roman',subtitle:'UM CAMPO DE VISÃO AMPLO',paragraphs:['O observatório Roman leva o nome da cientista que ajudou a abrir caminho para a astronomia espacial.','Seu amplo campo de visão foi projetado para estudar energia escura, exoplanetas e a evolução do universo.'],image:CODEX_IMAGES.roman,credit:'Imagem local: ProjetoSnct/telescopio.jpg.'},
  {tab:'AG VERMELHA',title:'AG Carinae · nebulosa avermelhada',subtitle:'UMA ESTRELA MASSIVA E SUA CASCA',paragraphs:[BOSSES[0].context],image:REWARD_IMAGES.agRed,credit:BOSSES[0].credit},
  {tab:'AG COLORIDA',title:'AG Carinae · composição colorida',subtitle:'LUZ EM DIFERENTES FILTROS',paragraphs:[BOSSES[1].context],image:REWARD_IMAGES.agColor,credit:BOSSES[1].credit},
  {tab:'PILARES',title:'Pilares da Criação · M16',subtitle:'ESTRELAS EM FORMAÇÃO',paragraphs:[BOSSES[2].context],image:REWARD_IMAGES.pillars,credit:BOSSES[2].credit},
  {tab:'CORONÓGRAFO',title:'Coronógrafo',subtitle:'BLOQUEAR UMA ESTRELA PARA ENXERGAR AO REDOR',paragraphs:['Um coronógrafo usa máscaras e elementos ópticos para reduzir a luz intensa de uma estrela.','Com menos brilho direto, telescópios conseguem estudar objetos muito tênues próximos dela, como discos de poeira e alguns planetas.']},
  {tab:'MICROLENTES',title:'Microlentes gravitacionais',subtitle:'A GRAVIDADE COMO LENTE',paragraphs:['A gravidade de uma estrela em primeiro plano pode curvar e ampliar por um breve período a luz de uma estrela distante.','Um planeta orbitando a estrela-lente pode produzir uma pequena variação adicional, revelando mundos que seriam difíceis de observar diretamente.']},
  {tab:'ENERGIA',title:'Energia escura',subtitle:'A EXPANSÃO DO UNIVERSO',paragraphs:['Energia escura é o nome dado ao fenômeno ainda não explicado que está associado à expansão acelerada do universo.','Observatórios espaciais medem galáxias e supernovas ao longo do tempo para investigar como essa expansão mudou.']},
  {tab:'EXOPLANETAS',title:'Exoplanetas',subtitle:'MUNDOS ALÉM DO SISTEMA SOLAR',paragraphs:['Exoplanetas são planetas que orbitam estrelas diferentes do Sol.','Levantamentos por microlentes e observações diretas ajudam a descobrir esses mundos e comparar seus sistemas com o nosso.']},
  {tab:'LUZ ESTELAR',title:'A luz das estrelas',subtitle:'OBSERVAR É OLHAR PARA O PASSADO',paragraphs:['A luz leva tempo para atravessar o espaço. Por isso, a imagem de uma estrela distante mostra como ela era quando a luz iniciou a viagem.','Quanto mais distante o objeto, mais antiga é a luz que recebemos dele.']}
];
let codexPage=0;
let currentBossIndex=0,focusMinigame=null,captureAssisted=false,rewardNotice=null;

const stars=[];for(let i=0;i<110;i++)stars.push({x:Math.random()*W,y:Math.random()*H,z:Math.random()*2.5+.5});
const V=X.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*1.0);V.addColorStop(0,'rgba(0,0,0,0)');V.addColorStop(1,'rgba(8,4,20,.65)');

// Touch State
let joyTouchId = null;
const joyBase = {x: 130, y: H - 145, r: 72};
const joyStick = {x: 130, y: H - 145};
const touchBtns = {
  fire: {x: W - 110, y: H - 125, r: 48, label: 'TIRO', k: 'KeyJ'},
  mode: {x: W - 220, y: H - 175, r: 42, label: 'MODO', k: 'KeyK'},
  spec: {x: W - 110, y: H - 235, r: 42, label: 'ESPECIAL', k: 'KeyL'}
};
const touchState = {KeyW:0, KeyS:0, KeyA:0, KeyD:0, KeyJ:0, KeyK:0, KeyL:0, Enter:0};

function updateTouches(e){
  isTouch = true; initAudio();
  const rect = C.getBoundingClientRect();
  const scaleX = W / rect.width, scaleY = H / rect.height;
  const currentKeys = {KeyW:false, KeyS:false, KeyA:false, KeyD:false, KeyJ:false, KeyK:false, KeyL:false, Enter:false};
  let joyActive = false;

  for(let i=0; i<e.touches.length; i++){
    const touch = e.touches[i];
    const tx = (touch.clientX - rect.left) * scaleX;
    const ty = (touch.clientY - rect.top) * scaleY;

    if(touch.identifier === joyTouchId || (joyTouchId === null && tx < W * 0.45)){
      joyTouchId = touch.identifier; joyActive = true;
      const dx = tx - joyBase.x, dy = ty - joyBase.y, dist = Math.hypot(dx, dy), maxR = joyBase.r;
      if(dist > maxR){ joyStick.x = joyBase.x + (dx / dist) * maxR; joyStick.y = joyBase.y + (dy / dist) * maxR; }
      else { joyStick.x = tx; joyStick.y = ty; }
      if(dx < -14) currentKeys.KeyA = true;
      if(dx > 14) currentKeys.KeyD = true;
      if(dy < -14) currentKeys.KeyW = true;
      if(dy > 14) currentKeys.KeyS = true;
    } else if(tx >= W * 0.45){
      if(scene !== 'play') currentKeys.Enter = true;
      for(const bKey in touchBtns){
        const btn = touchBtns[bKey];
        if(Math.hypot(tx - btn.x, ty - btn.y) <= btn.r + 20) currentKeys[btn.k] = true;
      }
    }
  }
  if(!joyActive){ joyTouchId = null; joyStick.x = joyBase.x; joyStick.y = joyBase.y; }

  for(const k in currentKeys){
    const pressed = currentKeys[k];
    if(pressed){ if(!K[k]) K[k] = 2; else if(K[k] === 2) K[k] = 1; touchState[k] = 1; }
    else if(touchState[k]){ K[k] = 0; touchState[k] = 0; }
  }
}

['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(evt => {
  addEventListener(evt, e => {
    e.preventDefault();
    if(evt==='touchstart'||evt==='touchmove')lastInputDevice='touch';
    if(scene==='play'&&rewardNotice){if(evt==='touchstart'&&e.touches.length)continueAfterReward();return}
    if(scene==='play'&&focusMinigame?.active){if(evt==='touchstart')K.Space=2;if(e.touches.length===0)K.Space=0;return}
    if(evt==='touchstart'&&e.touches.length&&scene!=='play'&&scene!=='intro'&&scene!=='ready'){
      const touch=e.touches[0];handlePointer(touch.clientX,touch.clientY);return;
    }
    if(e.touches.length === 0){
      joyTouchId = null; joyStick.x = joyBase.x; joyStick.y = joyBase.y;
      for(const k in touchState){ if(touchState[k]){ K[k] = 0; touchState[k] = 0; } }
    } else { updateTouches(e); }
  }, {passive: false});
});

function addScore(p, basePoints, reason){
  if(!p) return;
  const pts = Math.floor(basePoints * p.multiplier);
  p.score += pts;
}

function updateCombo(p, hitSuccess){
  if(hitSuccess){
    p.streak++;
    if(p.streak >= 9) p.multiplier = 3.0;
    else if(p.streak >= 6) p.multiplier = 2.0;
    else if(p.streak >= 3) p.multiplier = 1.5;
  } else {
    p.streak = 0;
    p.multiplier = 1.0;
  }
}

function fmtTime(sec){
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return (m > 0 ? m + 'm ' : '') + s + 's';
}

function start(n,h){
  hard=h; nP=n; P=[];
  currentBossIndex=0;focusMinigame=null;captureAssisted=false;rewardNotice=null;
  pauseCount=0;pauseCards=[];cheatSettings.god=false;cheatSettings.infiniteHealth=false;cheatSettings.damageMultiplier=1;
  const numPlayers = (n === 3) ? 2 : n; // Mode 3 = Versus
  for(let i=0;i<numPlayers;i++){
    P.push({
      i, x:110, y:H/2+(numPlayers>1?(i?70:-70):0), tilt:0, hp:4, mode:0, cd:0, inv:0, ex:0, alive:1,
      col:i?'#4fd8c4':'#ff9a47', boost:0, shield:0, score:0, streak:0, multiplier:1.0
    });
  }
  createBoss(currentBossIndex);
  bul=[];sh=[];pk=[];pt=[];asteroids=[];pwItems=[];hits=0;clock=0;eclipse=0;winnerText='';finalBossTimeStr='';scene='intro';
  setMusicTrack(h?'expert':'normal',true);
}

function createBoss(index){
  const data=BOSSES[index];
  const coopScale=nP===2?1.8:1;
  const hp=Math.round(data.maxHp*coopScale*(hard?1.08:1));
  B={x:W-210,y:H/2,r:data.kind==='pillars'?100:92,hp,max:hp,t:0,ph:1,c1:1.5,c2:1,c3:2,c4:2,c5:3.5,spin:0,stun:0,hit:0,open:0,index,kind:data.kind,koAwarded:false};
}

function pauseGame(){
  if(scene!=='play')return;
  pauseCards.push(STAR_CARDS[pauseCount%STAR_CARDS.length]);pauseCount++;
  scene='pause';menuCursor=0;
}

function resumeGame(){scene=previousScene==='settings'?'pause':'play';menuCursor=0}

function restartStage(){
  start(nP,hard);
  P.forEach(p=>p.hp=5);
  scene='intro';menuCursor=0;
}

function beginFocusMinigame(){
  if(focusMinigame||rewardNotice)return;
  bul=[];pk=[];asteroids=[];pwItems=[];sh=[];
  focusMinigame={time:0,limit:18,progress:0,focusY:H*.52,velocity:0,targetY:H*.52,zoneHeight:76,active:true};
  captureAssisted=false;scene='play';
}

function finishFocus(assisted=false){
  if(!focusMinigame||rewardNotice)return;
  captureAssisted=assisted;focusMinigame.progress=100;focusMinigame.active=false;
  finalBossTimeStr=fmtTime(clock);flashW=.18;
  // Dois cliques curtos dão a sensação de disparo de uma câmera.
  snd(1450,.035,'square',.075,-950);setTimeout(()=>snd(780,.075,'triangle',.055,-470),55);
  rewardNotice={};
}

function stepFocus(dt){
  if(!focusMinigame?.active)return;
  const f=focusMinigame;f.time+=dt;clock+=dt;
  stars.forEach(s=>{s.x-=s.z*22*dt;if(s.x<0){s.x=W;s.y=Math.random()*H}});
  if(B){B.t+=dt;B.y=H/2+Math.sin(B.t*.9)*150}
  const top=158,bottom=404,half=f.zoneHeight/2;
  // Segurar acelera a faixa para cima; ao soltar, a gravidade a acelera para baixo.
  const thrusting=K.Space>0||P.some(p=>inp(p,'f',1));
  f.velocity=cl(f.velocity+(thrusting?-820:620)*dt,-380,380);
  f.focusY+=f.velocity*dt;
  if(f.focusY<top+half){f.focusY=top+half;f.velocity=Math.max(0,f.velocity)}
  if(f.focusY>bottom-half){f.focusY=bottom-half;f.velocity=-Math.abs(f.velocity)*.38}
  const usable=bottom-top-f.zoneHeight;
  f.targetY=top+half+usable*(.5+.36*Math.sin(f.time*.92)+.09*Math.sin(f.time*.41+1.2));
  const aligned=Math.abs(f.focusY-f.targetY)<half-7;
  f.progress=cl(f.progress+(aligned?25:-5.5)*dt,0,100);
  if(f.progress>=100){finishFocus(false);return}
  if(f.time>=f.limit)finishFocus(true);
}

function continueAfterReward(){
  if(!rewardNotice)return;
  focusMinigame=null;rewardNotice=null;uiButtons=[];
  if(currentBossIndex<BOSSES.length-1){
    currentBossIndex++;createBoss(currentBossIndex);
    bul=[];sh=[];pk=[];asteroids=[];pwItems=[];pt=[];combo=false;hs=0;
    P.forEach(p=>{p.hp=p.alive?Math.min(5,p.hp+1):2;p.alive=1;p.inv=1.6;p.x=110;p.y=H/2+(P.length>1?(p.i?70:-70):0)});
    cheatSettings.god=false;cheatSettings.infiniteHealth=false;cheatSettings.damageMultiplier=1;
    scene='ready';tm=1.8;menuCursor=0;return;
  }
  scene='win';
  if(nP===3){
    const p1Score=P[0]?P[0].score:0,p2Score=P[1]?P[1].score:0;
    winnerText=p1Score>p2Score?'JOGADOR 1 VENCEU!':p2Score>p1Score?'JOGADOR 2 VENCEU!':'EMPATE HISTÓRICO!';
  }
}

function drawMenuButton(id,label,x,y,w,h,selected=false,small=false){
  X.save();
  const radius=Math.min(14,h*.28);
  const pulse=.5+.5*Math.sin(t*3.2);
  X.beginPath();X.moveTo(x+radius,y);X.arcTo(x+w,y,x+w,y+h,radius);X.arcTo(x+w,y+h,x,y+h,radius);X.arcTo(x,y+h,x,y,radius);X.arcTo(x,y,x+w,y,radius);X.closePath();
  X.fillStyle=selected?`rgba(51,112,151,${.38+.1*pulse})`:'rgba(10,16,37,.74)';
  if(selected){X.shadowColor='#61d8ff';X.shadowBlur=8+5*pulse}
  X.fill();X.shadowBlur=0;X.strokeStyle=selected?'#8ce8ff':'rgba(177,207,232,.48)';X.lineWidth=selected?2:1.5;X.stroke();
  if(selected&&menuFocus==='keyboard'){
    X.globalAlpha=.48+.16*pulse;X.strokeStyle='#fff2c7';X.lineWidth=1;X.setLineDash([4,4]);
    X.strokeRect(x+5,y+5,w-10,h-10);X.setLineDash([]);X.globalAlpha=1;
  } else if(selected){
    X.globalAlpha=.24+.12*pulse;X.strokeStyle='#fff';X.lineWidth=1;X.beginPath();X.moveTo(x+radius,y+2);X.lineTo(x+w-radius,y+2);X.stroke();
    X.globalAlpha=.9;X.fillStyle='#8ce8ff';X.fillRect(x+5,y+radius,3,h-radius*2);X.globalAlpha=1;
  }
  X.fillStyle=selected?'#fff3d3':'#d9e5f5';X.font=(small?'600 16px':'600 19px')+' system-ui,Segoe UI,sans-serif';X.textAlign='center';X.textBaseline='middle';X.fillText(label,x+w/2,y+h/2);
  if(selected){X.fillStyle='#ffb15c';X.beginPath();X.arc(x+18,y+h/2,3.5,0,Math.PI*2);X.fill()}
  X.restore();
  uiButtons.push({id,x,y,w,h});
}

function drawSlider(id,label,value,x,y,w){
  T(label,x,y-12,16,'#efe2c2');
  X.fillStyle='rgba(255,255,255,.2)';X.fillRect(x,y,w,12);
  X.fillStyle='#ffb15c';X.fillRect(x,y,w*value/100,12);
  X.strokeStyle='#efe2c2';X.lineWidth=2;X.strokeRect(x,y,w,12);
  X.fillStyle='#fff';X.beginPath();X.arc(x+w*value/100,y+6,10,0,Math.PI*2);X.fill();X.stroke();
  T(value+'%',x+w+34,y+12,15,'#efe2c2','left');
  uiButtons.push({id,x:x-8,y:y-20,w:w+56,h:42,type:'slider',trackX:x,trackW:w});
}

function activateButton(id){
  if(!id)return;
  if(id==='reward:continue'){continueAfterReward();return}
  if(id==='main:play'){scene='modes';menuCursor=0;return}
  if(id==='main:codex'){scene='codex';menuCursor=0;return}
  if(id==='main:settings'){previousScene='mainmenu';scene='settings';menuCursor=0;return}
  if(id==='main:quit'){scene='quit';menuCursor=0;return}
  if(id==='mode:solo'){nP=1;scene='diff';menuCursor=0;return}
  if(id==='mode:coop'){nP=2;scene='diff';menuCursor=0;return}
  if(id==='mode:versus'){nP=3;scene='diff';menuCursor=0;return}
  if(id==='diff:normal'){start(nP,0);return}
  if(id==='diff:expert'){start(nP,1);return}
  if(id==='back:main'){scene='mainmenu';menuCursor=0;return}
  if(id==='back:modes'){scene='modes';menuCursor=0;return}
  if(id==='back:pause'){scene='pause';menuCursor=0;return}
  if(id==='pause:resume'){scene='play';menuCursor=0;return}
  if(id==='pause:restart'){restartStage();return}
  if(id==='pause:settings'){previousScene='pause';scene='settings';menuCursor=0;return}
  if(id==='pause:main'){scene='mainmenu';menuCursor=0;return}
  if(id==='settings:back'){remapPending=null;scene=previousScene;menuCursor=0;return}
  if(id==='settings:tab:general'){remapPending=null;settingsTab='general';menuCursor=0;return}
  if(id==='settings:tab:controller'){remapPending=null;settingsTab='controller';menuCursor=1;return}
  if(id.startsWith('settings:player:')){remapPending=null;controlPlayer=Number(id.split(':')[2]);menuCursor=2+controlPlayer;return}
  if(id.startsWith('settings:bind:')){const [, ,player,action]=id.split(':');remapPending={player:Number(player),action};return}
  if(id==='settings:controls:reset'){gamepadBindings[controlPlayer]={...GAMEPAD_DEFAULTS};saveGamepadBindings();remapPending=null;return}
  if(id==='settings:volume')return;
  if(id.startsWith('settings:fps:')){settings.fps=Number(id.split(':')[2]);return}
  if(id==='settings:quality'){settings.quality=settings.quality==='high'?'low':'high';return}
  if(id==='cheat:god'){cheatSettings.god=!cheatSettings.god;return}
  if(id==='cheat:health'){cheatSettings.infiniteHealth=!cheatSettings.infiniteHealth;return}
  if(id.startsWith('cheat:damage:')){cheatSettings.damageMultiplier=Number(id.split(':')[2]);return}
  if(id==='cheat:close'){scene='pause';menuCursor=0;return}
  if(id==='quit:return'){scene='splash';menuCursor=0;return}
  if(id.startsWith('codex:tab:')){codexPage=cl(Number(id.split(':')[2]),0,CODEX_ENTRIES.length-1);return}
  if(id.startsWith('codex:page:')){codexPage=cl(Number(id.split(':')[2]),0,CODEX_ENTRIES.length-1);return}
  if(id==='codex:back'){scene='mainmenu';menuCursor=0;return}
}

function moveMenuFocus(direction){
  if(!uiButtons.length)return menuCursor;
  const current=uiButtons[menuCursor];if(!current)return menuCursor;
  const cx=current.x+current.w/2,cy=current.y+current.h/2,horizontal=direction==='left'||direction==='right';
  const sign=(direction==='left'||direction==='up')?-1:1;
  let candidates=uiButtons.map((b,i)=>({b,i,x:b.x+b.w/2,y:b.y+b.h/2})).filter(v=>v.i!==menuCursor&&((horizontal? v.x-cx:v.y-cy)*sign>1));
  if(!candidates.length){
    if(horizontal)return menuCursor;
    const other=uiButtons.map((b,i)=>({b,i,x:b.x+b.w/2,y:b.y+b.h/2})).filter(v=>v.i!==menuCursor);
    if(!other.length)return menuCursor;
    const edge=direction==='up'?Math.max(...other.map(v=>v.y)):Math.min(...other.map(v=>v.y));
    candidates=other.filter(v=>Math.abs(v.y-edge)<1);
  }
  candidates.sort((a,b)=>{
    const ap=horizontal?Math.abs(a.x-cx):Math.abs(a.y-cy),bp=horizontal?Math.abs(b.x-cx):Math.abs(b.y-cy);
    const as=horizontal?Math.abs(a.y-cy):Math.abs(a.x-cx),bs=horizontal?Math.abs(b.y-cy):Math.abs(b.x-cx);
    return ap+as*1.45-(bp+bs*1.45);
  });
  return candidates[0]?.i??menuCursor;
}

function handlePointer(clientX,clientY){
  const rect=C.getBoundingClientRect(),x=(clientX-rect.left)*W/rect.width,y=(clientY-rect.top)*H/rect.height;
  menuFocus='pointer';
  if(scene==='splash'){scene='mainmenu';menuCursor=0;return}
  for(let i=uiButtons.length-1;i>=0;i--){const b=uiButtons[i];if(x<b.x||x>b.x+b.w||y<b.y||y>b.y+b.h)continue;
    menuCursor=i;snd(680,.055,'triangle',.025,150);
    if(b.type==='slider')settings.volume=Math.round(cl((x-b.trackX)/b.trackW*100,0,100));else activateButton(b.id);
    return;
  }
}
C.addEventListener('click',e=>handlePointer(e.clientX,e.clientY));
C.addEventListener('pointerdown',()=>{unlockMusic();if(scene==='play'&&focusMinigame?.active)K.Space=2});
addEventListener('pointerup',()=>{if(focusMinigame?.active)K.Space=0});
C.addEventListener('mousemove',e=>{
  const rect=C.getBoundingClientRect(),x=(e.clientX-rect.left)*W/rect.width,y=(e.clientY-rect.top)*H/rect.height;
  for(let i=uiButtons.length-1;i>=0;i--){const b=uiButtons[i];if(x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h){menuCursor=i;menuFocus='pointer';break}}
});

function inp(p,k,held){
  const s = (nP===1) ? [0,1] : [p.i];
  return s.some(j=>{const c=KEYS[j][k];return held?K[c]>0:K[c]==2}) ||
         (nP===1&&k==='f'&&held&&K.Space>0) ||
         (p.i===0&&k==='f'&&held&&K.Space>0) ||
         (p.i===1&&k==='f'&&held&&(K.Numpad0>0||K.KeyM>0)) ||
         (p.i===1&&k==='m'&&!held&&(K.NumpadDecimal>0||K.Period>0)) ||
         (p.i===1&&k==='x'&&!held&&(K.Enter>0||K.ShiftRight>0));
}

function boom(x,y,col,n){if(settings.quality==='low')n=Math.ceil(n*.5);for(let i=0;i<n;i++){const a=Math.random()*6.283,s=60+Math.random()*260;pt.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.5,col,r:2+Math.random()*3})}}

function hurt(p){
  if(cheatSettings.god||cheatSettings.infiniteHealth){p.hp=Math.max(3,p.hp);p.inv=1.6;boom(p.x,p.y,'#ffd34d',8);return}
  if(p.shield > 0){ p.shield = 0; boom(p.x, p.y, '#ffd34d', 20); snd(300, .2, 'sine', .08, -100); addScore(p, 150, 'Bloqueio'); return; }
  p.hp--; p.inv=1.6; hits++; shake=14; flashR=0.35; hs=.07; snd(90,.3,'sawtooth',.09,-40); boom(p.x,p.y,'#ff5a4d',18);
  
  // Penalidade de dano (-150 pts e reseta combo)
  p.score = Math.max(0, p.score - 150);
  updateCombo(p, false);

  if(p.hp<=0){p.alive=0;boom(p.x,p.y,p.col,40)}
}

function upP(p,dt){
  if(!p.alive)return;
  const dx=(inp(p,'r',1)?1:0)-(inp(p,'l',1)?1:0),dy=(inp(p,'d',1)?1:0)-(inp(p,'u',1)?1:0),l=Math.hypot(dx,dy)||1;
  const targetTilt = dy * 0.12;
  p.tilt += (targetTilt - p.tilt) * Math.min(1, dt * 8);
  p.x=cl(p.x+dx/l*330*dt,30,560);p.y=cl(p.y+dy/l*330*dt,30,H-30);
  p.cd-=dt;p.inv-=dt;p.boost=Math.max(0,p.boost-dt);p.shield=Math.max(0,p.shield-dt);

  if(inp(p,'m',0)){p.mode^=1;tip=p.mode?'ROMAN: campo amplo, 100 vezes o do Hubble. Cobre mais área.':'HUBBLE: campo estreito. Tiro forte e preciso.';tipT=3;snd(p.mode?520:320,.1,'triangle',.06,200)}
  
  const fireCD = p.boost > 0 ? (p.mode==0?.05:.08) : (p.mode==0?.09:.14);
  if(inp(p,'f',1)&&p.cd<=0){
    if(p.mode==0){
      sh.push({x:p.x+24,y:p.y,vx:950,vy:0,d:combo?3:2,m:0,pCol:p.col,pOwner:p});
      p.cd=fireCD;snd(700,.05,'square',.02);
    }else{
      [-.2,0,.2].forEach(a=>sh.push({x:p.x+20,y:p.y,vx:820*Math.cos(a),vy:820*Math.sin(a),d:combo?1.2:.7,m:1,pCol:p.col,pOwner:p}));
      p.cd=fireCD;snd(480,.06,'sawtooth',.015);
    }
  }
  if(inp(p,'x',0)&&p.ex>=5){
    p.ex=0;eclipse=1.6;B.stun=1.6;bul=[];asteroids=[];B.hp-=40;shake=18;flashW=0.4;snd(110,.6,'sawtooth',.1,-60);
    addScore(p, 500, 'Coronógrafo');
    updateCombo(p, true);
    tip='CORONÓGRAFO: bloqueia a luz da estrela para revelar o que está ao redor.';tipT=3.5;
  }
}

function tgt(){
  const aliveP = P.filter(p=>p.alive);
  if(!aliveP.length) return 0;
  let p = aliveP[Math.random()*aliveP.length|0];
  return Math.atan2(p.y-B.y,p.x-B.x);
}

function upB(dt){
  B.t+=dt;B.y=H/2+Math.sin(B.t*.9)*150;B.hit-=dt;B.stun-=dt;B.open-=dt;
  const f=B.hp/B.max,ph=hard?(f>.66?1:f>.33?2:3):1;
  if(ph!=B.ph){B.ph=ph;tip=ph==2?'O alvo está reagindo!':'Última etapa: mantenha o foco e continue atirando.';tipT=3;shake=10}
  if(B.stun>0)return;
  B.c1-=dt;B.c2-=dt;B.c3-=dt;B.c4-=dt;B.c5-=dt;
  const tint=B.kind==='pillars'?'#ffc879':B.kind==='echo'?'#ff8092':B.kind==='agRed'?'#ff6b52':'#c8b8ff',cadence=hard?1:1.32;
  if(B.c1<=0){
    if(B.kind==='pillars'){
      const aim=Math.atan2((P.find(p=>p.alive)||P[0]).y-B.y,(P.find(p=>p.alive)||P[0]).x-B.x);
      for(let i=0;i<7;i++){const a=aim+(i-3)*.15;bul.push({x:B.x,y:B.y,vx:Math.cos(a)*190,vy:Math.sin(a)*190,r:7,col:tint})}
    }else{
      const n=B.kind==='echo'?(ph===3?12:8):(ph===3?14:9),o=Math.random()*6,sp=B.kind==='echo'?135:145+ph*10;
      for(let i=0;i<n;i++){const a=o+i/n*6.283;bul.push({x:B.x,y:B.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,r:7,col:tint})}
    }
    B.c1=(B.kind==='pillars'?2.55:B.kind==='echo'?2.35:2.2)*cadence;B.open=.4;snd(180,.2,'sawtooth',.05,-80)
  }
  if(B.c2<=0){const a=tgt(),spread=B.kind==='echo'?[-.13,0,.13]:B.kind==='pillars'?[-.09,.09]:ph==3?[-.18,0,.18]:[0];spread.forEach(d=>bul.push({x:B.x-40,y:B.y,vx:Math.cos(a+d)*235,vy:Math.sin(a+d)*235,r:6,col:tint}));B.c2=(B.kind==='pillars'?1.45:.95)*cadence}
  if(ph>=2&&B.c3<=0){B.spin+=.5;bul.push({x:B.x,y:B.y,vx:Math.cos(B.spin*3.1)*200,vy:Math.sin(B.spin*3.1)*200,r:6});B.c3=.11}
  if(B.c4<=0){pk.push({x:B.x-70,y:B.y+(Math.random()-.5)*120,vx:-150,vy:(Math.random()-.5)*60,r:12});B.c4=2.6}
  if(B.c5<=0){
    asteroids.push({x:W+30,y:40+Math.random()*(H-80),vx:-180-Math.random()*100,vy:(Math.random()-.5)*40,r:14+Math.random()*10,hp:2});
    B.c5=(2.8+Math.random()*1.5)*cadence;
  }
}

function step(dt){
  updateMusicForScene();
  shake=Math.max(0,shake-60*dt);if(tipT>0)tipT-=dt;
  flashR=Math.max(0,flashR-dt);flashW=Math.max(0,flashW-dt);

  const upPressed=K.ArrowUp===2||K.KeyW===2,downPressed=K.ArrowDown===2||K.KeyS===2;
  if(scene==='splash'){
    if(Object.values(K).some(value=>value===2)){scene='mainmenu';menuCursor=0}
    return;
  }
  if(['mainmenu','modes','diff','settings','pause','cheats','codex','quit'].includes(scene)){
    if(scene==='settings'&&settingsTab==='controller'&&remapPending&&K.Escape===2){remapPending=null;return}
    if(scene==='pause'&&K.Escape===2){scene='play';return}
    if(scene==='cheats'&&K.Escape===2){scene='pause';menuCursor=0;return}
    if(scene==='modes'&&K.Escape===2){activateButton('back:main');return}
    if(scene==='diff'&&K.Escape===2){activateButton('back:modes');return}
    if(scene==='codex'&&(K.Escape===2||K.Backspace===2)){activateButton('codex:back');return}
    if(scene==='quit'&&K.Escape===2){activateButton('quit:return');return}
    if(scene==='settings'&&K.Escape===2){activateButton('settings:back');return}
    const oldCursor=menuCursor;
    const leftPressed=K.ArrowLeft===2||K.KeyA===2,rightPressed=K.ArrowRight===2||K.KeyD===2;
    if(scene==='mainmenu'){
      if(upPressed&&uiButtons.length)menuCursor=(menuCursor-1+uiButtons.length)%uiButtons.length;
      if(downPressed&&uiButtons.length)menuCursor=(menuCursor+1)%uiButtons.length;
    }else{
      const sliderFocused=scene==='settings'&&uiButtons[menuCursor]?.type==='slider';
      if(leftPressed&&!sliderFocused)menuCursor=moveMenuFocus('left');
      else if(rightPressed&&!sliderFocused)menuCursor=moveMenuFocus('right');
      else if(upPressed)menuCursor=moveMenuFocus('up');
      else if(downPressed)menuCursor=moveMenuFocus('down');
    }
    if(upPressed||downPressed||((leftPressed||rightPressed)&&scene!=='mainmenu')||K.Enter===2||K.Space===2)menuFocus='keyboard';
    if(menuCursor!==oldCursor)snd(560,.045,'triangle',.018,100);
    if(scene==='settings'&&settingsTab==='general'&&uiButtons[menuCursor]?.id==='settings:volume'){
      if(K.ArrowLeft===2||K.KeyA===2)settings.volume=cl(settings.volume-5,0,100);
      if(K.ArrowRight===2||K.KeyD===2)settings.volume=cl(settings.volume+5,0,100);
    }
    if((K.Enter===2||K.Space===2)&&uiButtons.length)activateButton(uiButtons[menuCursor]?.id);
    if(scene==='diff'){
      if(K.Digit1===2||K.Numpad1===2||K.KeyN===2)activateButton('diff:normal');
      if(K.Digit2===2||K.Numpad2===2||K.KeyE===2)activateButton('diff:expert');
    }
    if(scene==='modes'){
      if(K.Digit1===2||K.Numpad1===2)activateButton('mode:solo');
      if(K.Digit2===2||K.Numpad2===2||K.KeyE===2)activateButton('mode:coop');
      if(K.Digit3===2||K.Numpad3===2||K.KeyV===2)activateButton('mode:versus');
    }
    return;
  }
  if(scene==='play'&&K.Escape===2){pauseGame();return}
  if(scene==='play'&&focusMinigame?.active){stepFocus(dt);return}
  if(scene==='play'&&rewardNotice){
    if(K.Enter===2)continueAfterReward();
    return;
  }

  const dist = eclipse > 0 ? 3.5 : 1.0;
  stars.forEach(s=>{
    s.x-=s.z*22*dist*dt;
    if(eclipse>0) s.y += Math.sin(t*8 + s.x*0.03)*1.2;
    if(s.x<0){s.x=W;s.y=Math.random()*H}
  });

  pt.forEach(p=>{p.x+=p.vx*p.life*dt*2;p.y+=p.vy*p.life*dt*2;p.life-=dt});pt=pt.filter(p=>p.life>0);

  if(scene=='intro'){if(K.Enter==2||K.Space==2){scene='ready';tm=1.5;snd(440,.15,'triangle',.06)}return}
  if(scene=='ready'){tm-=dt;if(tm<=0){scene='play';snd(880,.25,'square',.05)}return}
  if(scene=='win'||scene=='lose'){if(K.Enter==2||K.Space==2||K.Escape==2)scene='mainmenu';return}
  if(hs>0){hs-=dt;return}

  clock+=dt;eclipse=Math.max(0,eclipse-dt);
  combo=P.length>1&&P.every(p=>p.alive)&&Math.abs(P[0].y-P[1].y)<46;
  P.forEach(p=>upP(p,dt));upB(dt);

  bul.forEach(b=>{b.x+=b.vx*dt;b.y+=b.vy*dt});
  bul=bul.filter(b=>b.x>-20&&b.x<W+20&&b.y>-20&&b.y<H+20);

  asteroids.forEach(a=>{a.x+=a.vx*dt;a.y+=a.vy*dt});
  asteroids=asteroids.filter(a=>a.x>-40);

  pk.forEach(o=>{o.x+=o.vx*dt;o.y+=o.vy*dt});pk=pk.filter(o=>o.x>-30);

  pwItems.forEach(pw=>{pw.x+=pw.vx*dt;pw.y+=pw.vy*dt});
  pwItems=pwItems.filter(pw=>{pw.x>-30});

  P.forEach(p=>{
    if(!p.alive||p.inv>0)return;
    const b=bul.find(b=>Math.hypot(b.x-p.x,b.y-p.y)<b.r+7);
    if(b){bul=bul.filter(q=>q!==b);hurt(p)}
    const ast=asteroids.find(a=>Math.hypot(a.x-p.x,a.y-p.y)<a.r+12);
    if(ast){asteroids=asteroids.filter(q=>q!==ast);hurt(p)}
  });

  pwItems=pwItems.filter(pw=>{
    const p=P.find(p=>p.alive&&Math.hypot(pw.x-p.x,pw.y-p.y)<pw.r+18);
    if(p){
      addScore(p, 150, 'PowerUp');
      if(pw.type==='spec'){ p.boost=6.0; tip='ESPECTRÔMETRO: Velocidade de disparo ultra-rápida!'; tipT=3; snd(600,.2,'triangle',.08,200); }
      else if(pw.type==='grav'){ p.shield=8.0; tip='MICROLENTE GRAVITACIONAL: Campo de força protetor ativado!'; tipT=3; snd(500,.25,'sine',.08,300); }
      else if(pw.type==='solar'){ p.hp=Math.min(5, p.hp+1); tip='PAINEL SOLAR: Energia e vida restauradas (+1 ♥)!'; tipT=3; snd(800,.3,'sine',.08,400); }
      boom(pw.x, pw.y, pw.col, 15);
      return false;
    }
    return true;
  });

  pk=pk.filter(o=>{
    const p=P.find(p=>p.alive&&Math.hypot(o.x-p.x,o.y-p.y)<o.r+16);
    if(p){
      p.ex=Math.min(5,p.ex+1); addScore(p, 100, 'Orbe'); snd(900,.12,'sine',.06,300); boom(o.x,o.y,'#ff7ad9',10); return false;
    }
    return true;
  });

  sh=sh.filter(s=>{
    s.x+=s.vx*dt;s.y+=s.vy*dt;
    if(s.x>W+30||s.y<-20||s.y>H+20)return false;

    const ast=asteroids.find(a=>Math.hypot(s.x-a.x,s.y-a.y)<a.r+6);
    if(ast){
      ast.hp-=cheatSettings.god?999999:s.d*cheatSettings.damageMultiplier;
      boom(s.x,s.y,'#c2a67e',4);
      if(s.pOwner){ addScore(s.pOwner, 50, 'Acerto Asteroide'); updateCombo(s.pOwner, true); }
      if(ast.hp<=0){
        asteroids=asteroids.filter(q=>q!==ast);
        boom(ast.x,ast.y,'#e6c89c',16);
        snd(220,.15,'sawtooth',.06,-50);
        if(s.pOwner){ addScore(s.pOwner, 200, 'Asteroide Destruído'); }
        if(Math.random()<0.45){
          const types=['spec','grav','solar'], cols=['#4fd8c4','#ffd34d','#4dff88'];
          const idx=Math.floor(Math.random()*types.length);
          pwItems.push({x:ast.x,y:ast.y,vx:-80,vy:0,r:10,type:types[idx],col:cols[idx]});
        }
      }
      return false;
    }

    if(Math.hypot(s.x-B.x,s.y-B.y)<B.r+4){
      const damage = cheatSettings.god?999999:s.d*cheatSettings.damageMultiplier*(B.stun>0?2:1);
      B.hp -= damage; B.hit=.06;
      boom(s.x,s.y,'#ffe08a',combo?5:2);
      if(combo) flashW = 0.08;

      if(s.pOwner){
        addScore(s.pOwner, 100, 'Dano Chefão');
        updateCombo(s.pOwner, true);
      }

      if(B.hp<=0 && s.pOwner && !B.koAwarded){
        // K.O. Bonus de +2000 pontos para quem der o golpe final
        addScore(s.pOwner, 2000, 'K.O. Bonus');B.koAwarded=true;
      }
      return false;
    }
    return true;
  });

  if(B.hp<=0){
    beginFocusMinigame();shake=20;snd(60,.8,'sawtooth',.12,-30);
  }
  else if(P.every(p=>!p.alive)){
    scene='lose'; snd(70,.7,'sawtooth',.1,-30);
    finalBossTimeStr = fmtTime(clock);
    if(nP === 3){
      const p1Score = P[0] ? P[0].score : 0;
      const p2Score = P[1] ? P[1].score : 0;
      if(p1Score > p2Score) winnerText = 'JOGADOR 1 VENCEU POR PONTOS!';
      else if(p2Score > p1Score) winnerText = 'JOGADOR 2 VENCEU POR PONTOS!';
      else winnerText = 'AMBOS FORAM DERROTADOS!';
    }
  }
}

function T(s,x,y,sz,col,al,f){X.font=f&&f.includes('px')?f:sz+'px '+(f||'Bungee,Impact,sans-serif');X.textAlign=al||'left';X.fillStyle=col||'#efe2c2';X.fillText(s,x,y)}
function WR(s,x,y,w,lh,sz,col){X.font=sz+'px Georgia,serif';X.fillStyle=col||'#efe2c2';X.textAlign='left';let l='';for(const wd of s.split(' ')){const t2=l+wd+' ';if(X.measureText(t2).width>w&&l){X.fillText(l,x,y);y+=lh;l=wd+' '}else l=t2}X.fillText(l,x,y);return y+lh}

let backgroundCache=null,sunCache=null,grainCache=null;
function getBackgroundCache(){
  if(backgroundCache)return backgroundCache;
  backgroundCache=document.createElement('canvas');backgroundCache.width=W;backgroundCache.height=H;
  const c=backgroundCache.getContext('2d'),g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#1b1440');g.addColorStop(1,'#3a1f52');c.fillStyle=g;c.fillRect(0,0,W,H);
  [[200,120,260,'rgba(255,138,61,.14)'],[760,420,300,'rgba(79,216,196,.12)']].forEach(n=>{
    const r=c.createRadialGradient(n[0],n[1],0,n[0],n[1],n[2]);r.addColorStop(0,n[3]);r.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=r;c.fillRect(0,0,W,H);
  });
  return backgroundCache;
}

function getSunCache(){
  if(sunCache)return sunCache;
  sunCache=document.createElement('canvas');sunCache.width=840;sunCache.height=840;
  const c=sunCache.getContext('2d'),cx=420,cy=420,r=270;
  const halo=c.createRadialGradient(cx,cy,r*.48,cx,cy,r+145);
  halo.addColorStop(0,'rgba(255,198,104,.22)');halo.addColorStop(.62,'rgba(255,151,67,.13)');halo.addColorStop(1,'rgba(255,121,52,0)');
  c.fillStyle=halo;c.fillRect(0,0,840,840);
  const surface=c.createRadialGradient(cx-82,cy-104,14,cx,cy,r);
  surface.addColorStop(0,'#ffe2a0');surface.addColorStop(.32,'#f8bd70');surface.addColorStop(.74,'#e99754');surface.addColorStop(1,'#bf6544');
  c.fillStyle=surface;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.fill();
  c.save();c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.clip();
  const prominences=[[-145,-180,46,19],[-36,-228,34,12],[112,-183,52,16],[188,-93,34,12],[-207,-72,30,12]];
  prominences.forEach((spot,i)=>{c.globalAlpha=.13;c.fillStyle=i%2?'#fff0bd':'#a94f3a';c.beginPath();c.ellipse(cx+spot[0],cy+spot[1],spot[2],spot[3],-.28,0,Math.PI*2);c.fill()});
  c.globalAlpha=.12;c.strokeStyle='#fff2cb';c.lineWidth=8;
  for(let i=0;i<5;i++){const y=cy-r+55+i*34;c.beginPath();c.moveTo(cx-r,y);c.bezierCurveTo(cx-r*.35,y-17,cx+r*.22,y+15,cx+r,y-7);c.stroke()}
  c.restore();
  c.strokeStyle='rgba(255,224,160,.55)';c.lineWidth=2;c.beginPath();c.arc(cx,cy,r-2,0,Math.PI*2);c.stroke();
  c.strokeStyle='#1d1a2e';c.lineWidth=5;c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();
  return sunCache;
}

function getGrainCache(){
  if(grainCache)return grainCache;
  grainCache=document.createElement('canvas');grainCache.width=W;grainCache.height=H;
  const c=grainCache.getContext('2d');
  for(let i=0;i<50;i++){c.fillStyle=Math.random()<.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.12)';c.fillRect(Math.random()*W,Math.random()*H,2,2)}
  return grainCache;
}

function drawSun(){
  const sx=180,sy=H+150,r=270;
  X.drawImage(getSunCache(),sx-420,sy-420);
  X.save();X.translate(sx,sy);
  const rayCount=settings.quality==='high'?32:10;
  for(let i=0;i<rayCount;i++){
    const a=i*Math.PI*2/rayCount+t*.018;
    const wave=Math.sin(t*1.8+i*1.91),inner=r+8+wave*2,outer=r+13+((i%4===0)?12:5)+wave*4;
    X.globalAlpha=.18+((i%3)*.035);X.strokeStyle=i%2?'#ffbd64':'#ffe0a0';X.lineWidth=i%4===0?2.5:1.2;
    X.beginPath();X.moveTo(Math.cos(a)*inner,Math.sin(a)*inner);X.lineTo(Math.cos(a)*outer,Math.sin(a)*outer);X.stroke();
  }
  X.restore();
}

function bg(){
  X.drawImage(getBackgroundCache(),0,0);
  drawSun();
  stars.forEach((s,i)=>{if(settings.quality==='low'&&i%2)return;X.fillStyle='rgba(255,244,214,'+(.3+s.z*.25)+')';X.fillRect(s.x,s.y,s.z,s.z)});
}

function ship(p){
  X.save();X.translate(p.x,p.y);if(p.inv>0&&((p.inv*20)|0)%2)X.globalAlpha=.35;
  if(p.shield > 0){
    X.strokeStyle='#ffd34d';X.lineWidth=3;X.beginPath();X.arc(0,0,28+Math.sin(t*10)*2,0,7);X.stroke();
    X.fillStyle='rgba(255,211,77,0.15)';X.fill();
  }

  // O modo escolhe o telescópio: Hubble no modo estreito, Roman no campo amplo.
  const shipFrames=p.mode===1?SPRITES.shipP2:SPRITES.ship;
  const frame=shipFrames[Math.floor(t*12)%shipFrames.length];
  if(frame.complete&&frame.naturalWidth){
    // Durante o Foco Final, alinha o telescópio ao mesmo rumo do feixe de captura.
    const heading=focusMinigame?.active&&B?Math.atan2(B.y-p.y,B.x-p.x):(p.tilt||0);
    // O sprite Roman veio voltado para a esquerda; espelhar após a rotação conserva a direção.
    X.rotate(heading);
    if(p.mode===1)X.scale(-1,1);
    const scale=Math.min(74/frame.naturalWidth,64/frame.naturalHeight);
    const sw=frame.naturalWidth*scale,sh=frame.naturalHeight*scale;
    X.drawImage(frame,-sw/2,-sh/2,sw,sh);
    X.restore();return;
  }
  X.rotate(p.tilt||0);

  const flame=25+Math.sin(t*24+p.i*2)*7;
  const engine=X.createLinearGradient(-18,0,-18-flame,0);engine.addColorStop(0,'#fff2b0');engine.addColorStop(.35,p.boost>0?'#8be8ff':'#ffb347');engine.addColorStop(1,'rgba(255,90,70,0)');
  X.fillStyle=engine;X.beginPath();X.moveTo(-17,-5);X.quadraticCurveTo(-19,-2,-18-flame,Math.sin(t*30+p.i)*2);X.quadraticCurveTo(-19,3,-17,5);X.closePath();X.fill();
  X.fillStyle='rgba(255,248,203,.85)';X.beginPath();X.ellipse(-18-flame*.34,0,3,1.5+Math.sin(t*28+p.i)*.5,0,0,Math.PI*2);X.fill();

  X.lineWidth=3;X.strokeStyle='#1d1a2e';
  const w=p.mode?24:9;X.fillStyle='#3a6ea5';
  X.fillRect(-8,-12-w,14,w);X.strokeRect(-8,-12-w,14,w);X.fillRect(-8,12,14,w);X.strokeRect(-8,12,14,w);
  X.fillStyle=p.boost>0?'#8be8ff':p.col;X.beginPath();X.moveTo(28,0);X.lineTo(-18,-13);X.lineTo(-10,0);X.lineTo(-18,13);X.closePath();X.fill();X.stroke();
  X.fillStyle='#efe2c2';X.fillRect(-6,-6,24,12);X.strokeRect(-6,-6,24,12);
  X.fillStyle='#ffd34d';X.beginPath();X.ellipse(6,0,7,3.2,0,0,Math.PI*2);X.fill();
  X.fillStyle='rgba(255,255,255,.72)';X.fillRect(1,-1,13,1.5);
  X.restore();
}

function drawProjectile(s){
  const wide=s.m===1;
  const image=wide?SPRITES.shotBlueGlow:SPRITES.shotGoldGlow,source=SPRITES.shot;
  if(image&&source.naturalWidth){
    X.save();X.translate(s.x,s.y);X.rotate(Math.atan2(s.vy,s.vx)+Math.PI/2);
    const scaleX=14/source.naturalWidth,scaleY=44/source.naturalHeight,pad=12;
    X.drawImage(image,-7-pad*scaleX,-22-pad*scaleY,image.width*scaleX,image.height*scaleY);
    X.restore();return;
  }
  const length=wide?20:(combo?44:36), height=wide?7:(combo?11:8), glow=combo?'#ffea78':(wide?'#8be8ff':'#ffe08a');
  X.save();X.translate(s.x,s.y);X.globalCompositeOperation='lighter';X.shadowColor=glow;X.shadowBlur=12+Math.sin(t*18+s.x*.03)*3;
  const trail=X.createLinearGradient(-length,0,4,0);trail.addColorStop(0,'rgba(255,255,255,0)');trail.addColorStop(.45,glow);trail.addColorStop(1,'#fffdf0');
  X.fillStyle=trail;X.beginPath();X.moveTo(-length,-height*.34);X.quadraticCurveTo(-length*.55,0,-length,height*.34);X.lineTo(1,height*.42);X.lineTo(5,0);X.lineTo(1,-height*.42);X.closePath();X.fill();
  X.globalCompositeOperation='source-over';X.fillStyle='#fffdf0';X.beginPath();X.ellipse(-length*.2,0,length*.25,Math.max(1,height*.16),0,0,Math.PI*2);X.fill();
  X.restore();
}

function drawB(){
  if(!B)return;
  X.save();X.translate(B.x,B.y);
  X.filter=hard?(B.ph==1?'blur(7px)':B.ph==2?'blur(3.5px)':'none'):'blur('+(7*Math.max(0,(B.hp/B.max-.1)/.9)).toFixed(1)+'px)';
  if(B.kind==='pillars'){
    X.filter='none';
    const halo=X.createRadialGradient(0,0,14,0,0,B.r*1.6);halo.addColorStop(0,'rgba(109,196,255,.46)');halo.addColorStop(.52,'rgba(104,103,219,.22)');halo.addColorStop(1,'rgba(95,202,220,0)');X.fillStyle=halo;X.beginPath();X.arc(0,0,B.r*1.6,0,Math.PI*2);X.fill();
    const pillars=[
      {pts:[[-67,76],[-66,18],[-75,-5],[-68,-33],[-56,-49],[-53,-69],[-39,-59],[-31,-43],[-29,-11],[-19,13],[-23,76]],colors:['#463d61','#765173','#a16e61','#96c4d2']},
      {pts:[[-23,78],[-20,19],[-29,-2],[-24,-37],[-16,-57],[-8,-88],[2,-69],[8,-42],[14,-25],[11,6],[22,32],[19,78]],colors:['#3d4266','#635c88','#9a717b','#b5d6dc']},
      {pts:[[22,78],[26,31],[19,8],[28,-13],[31,-42],[43,-62],[53,-49],[55,-26],[67,-5],[62,24],[69,78]],colors:['#463c60','#695478','#a16d67','#91c5d1']}
    ];
    pillars.forEach((pillar,i)=>{
      X.beginPath();pillar.pts.forEach(([px,py],j)=>j?X.lineTo(px,py):X.moveTo(px,py));X.closePath();
      const grad=X.createLinearGradient(-20,72,10,-80);grad.addColorStop(0,pillar.colors[0]);grad.addColorStop(.38,pillar.colors[1]);grad.addColorStop(.72,pillar.colors[2]);grad.addColorStop(1,pillar.colors[3]);
      X.fillStyle=B.hit>0?'#fff':grad;X.shadowColor='#76dfff';X.shadowBlur=13;X.fill();X.shadowBlur=0;
      X.strokeStyle='rgba(187,235,255,.76)';X.lineWidth=2;X.stroke();
      // Veios iluminados e nós estelares sugerem gás e poeira em colapso.
      X.strokeStyle=`rgba(156,225,255,${.48+i*.08})`;X.lineWidth=3;X.beginPath();X.moveTo(pillar.pts[2][0]+4,pillar.pts[2][1]+18);X.bezierCurveTo(pillar.pts[2][0]-5,-10,pillar.pts[1][0]+7,22,pillar.pts[0][0]+8,65);X.stroke();
      const knot=X.createRadialGradient(pillar.pts[4][0],pillar.pts[4][1],1,pillar.pts[4][0],pillar.pts[4][1],20);knot.addColorStop(0,'rgba(255,240,194,.88)');knot.addColorStop(1,'rgba(255,170,130,0)');X.fillStyle=knot;X.beginPath();X.arc(pillar.pts[4][0],pillar.pts[4][1],20,0,Math.PI*2);X.fill();
    });
    for(let i=0;i<7;i++){const x=-86+(i*29)%174,y=-72+(i*47)%148;X.fillStyle=`rgba(220,244,255,${.35+.45*((i%3)/2)})`;X.beginPath();X.arc(x,y,1.2+(i%2),0,Math.PI*2);X.fill()}
    drawBossEclipse();X.restore();return;
  }
  if(B.kind==='agRed'||B.kind==='echo'){
    X.filter='none';
    const colorBoss=B.kind==='echo',pulse=.5+.5*Math.sin(B.t*1.7),red=colorBoss?'255,94,91':'245,72,59',blue=colorBoss?'73,169,255':'255,124,84';
    X.globalCompositeOperation='lighter';
    const halo=X.createRadialGradient(0,0,12,0,0,B.r*1.65);
    halo.addColorStop(0,`rgba(${red},${.14+.1*pulse})`);halo.addColorStop(.34,`rgba(${red},.34)`);halo.addColorStop(.65,`rgba(${blue},${colorBoss ? .24 : .1})`);halo.addColorStop(1,'rgba(255,115,80,0)');
    X.fillStyle=halo;X.beginPath();X.arc(0,0,B.r*1.65,0,Math.PI*2);X.fill();
    const photo=REWARD_IMAGES[colorBoss?'agColor':'agRed'],photoRadius=B.r*1.18;
    if(photo.complete&&photo.naturalWidth){
      X.save();X.beginPath();X.arc(0,0,photoRadius,0,Math.PI*2);X.clip();X.globalAlpha=.78;
      X.drawImage(photo,-photoRadius,-photoRadius,photoRadius*2,photoRadius*2);X.restore();
      X.strokeStyle=colorBoss?'rgba(133,216,255,.78)':'rgba(255,175,141,.8)';X.lineWidth=2;X.beginPath();X.arc(0,0,photoRadius,0,Math.PI*2);X.stroke();
    }
    // Nuvens irregulares dão volume de gás à casca estelar, em vez de formar um aro geométrico perfeito.
    const clouds=colorBoss?[
      [-64,-19,47,25,'rgba(66,151,255,.28)'],[-30,45,58,27,'rgba(244,72,89,.3)'],[42,36,51,28,'rgba(80,190,255,.27)'],[66,-28,42,23,'rgba(255,109,94,.26)'],[2,-57,66,24,'rgba(225,86,133,.24)']
    ]:[
      [-61,-28,48,30,'rgba(255,80,58,.3)'],[-35,43,58,25,'rgba(190,45,59,.31)'],[35,55,56,24,'rgba(255,130,74,.25)'],[68,-18,41,30,'rgba(218,54,73,.29)'],[4,-63,67,22,'rgba(255,103,73,.25)']
    ];
    clouds.forEach(([x,y,rx,ry,col],i)=>{const cloud=X.createRadialGradient(x,y,2,x,y,rx);cloud.addColorStop(0,col);cloud.addColorStop(1,'rgba(30,28,64,0)');X.fillStyle=cloud;X.beginPath();X.ellipse(x+Math.sin(B.t*.35+i)*3,y,rx,ry,Math.sin(i*2)*.15,0,Math.PI*2);X.fill()});
    const shellColor=colorBoss?'rgba(114,197,255,.72)':'rgba(255,147,112,.76)';
    for(let i=0;i<5;i++){
      const wobble=Math.sin(B.t*.55+i*1.7)*.035,rx=B.r*(.65+i*.18),ry=B.r*(.44+i*.16);
      X.strokeStyle=i%2?`rgba(${red},${.3+i*.035})`:shellColor;X.lineWidth=2+i%2;X.shadowColor=colorBoss?'#71c7ff':'#ff725f';X.shadowBlur=7+i*2;
      X.beginPath();X.ellipse(Math.sin(B.t*.3+i)*5,Math.cos(B.t*.25+i)*4,rx,ry,wobble,Math.PI*.08+i*.09,Math.PI*1.94+i*.09);X.stroke();X.shadowBlur=0;
    }
    // AG Carinae luminosa no centro, com raios finos de difração.
    const star=X.createRadialGradient(-6,-7,1,0,0,31);star.addColorStop(0,'#fff');star.addColorStop(.18,'#fff9d9');star.addColorStop(.42,colorBoss?'#bdeeff':'#ffe2b8');star.addColorStop(1,'rgba(255,176,120,0)');
    X.fillStyle=star;X.beginPath();X.arc(0,0,31,0,Math.PI*2);X.fill();
    X.strokeStyle='rgba(255,250,227,.82)';X.lineWidth=1.5;X.beginPath();X.moveTo(-39,0);X.lineTo(39,0);X.moveTo(0,-39);X.lineTo(0,39);X.stroke();
    X.globalCompositeOperation='source-over';
    drawBossEclipse();X.restore();return;
  }
  X.filter='none';
  const fallback=X.createRadialGradient(-8,-8,1,0,0,B.r);fallback.addColorStop(0,'#fff');fallback.addColorStop(.15,'#fff0bd');fallback.addColorStop(.36,'#ff865f');fallback.addColorStop(1,'rgba(150,49,89,0)');
  X.fillStyle=fallback;X.beginPath();X.arc(0,0,B.r,0,Math.PI*2);X.fill();
  X.strokeStyle='rgba(255,199,160,.65)';X.lineWidth=3;X.beginPath();X.ellipse(0,0,B.r*.92,B.r*.54,Math.sin(B.t*.3)*.1,0,Math.PI*2);X.stroke();
  drawBossEclipse();
  X.restore();
}

function drawBossEclipse(){if(eclipse>0){X.fillStyle='#000';X.beginPath();X.arc(0,0,B.r+4,0,7);X.fill();X.strokeStyle='rgba(255,226,160,'+Math.min(1,eclipse)+')';X.lineWidth=12;X.beginPath();X.arc(0,0,B.r+10+(1.6-eclipse)*50,0,7);X.stroke()}}

function drawCaptureBeams(){
  if(!focusMinigame?.active||!B)return;
  const strength=cl(focusMinigame.progress/100,0,1);
  X.save();X.globalCompositeOperation='lighter';
  P.forEach(p=>{
    if(!p.alive)return;
    const angle=Math.atan2(B.y-p.y,B.x-p.x),noseX=p.x+Math.cos(angle)*30,noseY=p.y+Math.sin(angle)*30;
    const endX=B.x-Math.cos(angle)*(B.r*.72),endY=B.y-Math.sin(angle)*(B.r*.72);
    const width=22+strength*92;
    const ux=Math.cos(angle+Math.PI/2),uy=Math.sin(angle+Math.PI/2);
    const gradient=X.createLinearGradient(noseX,noseY,endX,endY);
    gradient.addColorStop(0,`rgba(135,229,255,${.08+strength*.12})`);
    gradient.addColorStop(.55,`rgba(160,224,255,${.12+strength*.2})`);
    gradient.addColorStop(1,`rgba(255,239,190,${.16+strength*.42})`);
    X.fillStyle=gradient;X.beginPath();X.moveTo(noseX,noseY);X.lineTo(endX+ux*width,endY+uy*width);X.lineTo(endX-ux*width,endY-uy*width);X.closePath();X.fill();
    X.globalAlpha=.25+strength*.58;X.strokeStyle=strength>.68?'#fff2c4':'#9beaff';X.lineWidth=2+strength*3;X.shadowColor='#9beaff';X.shadowBlur=7+strength*24;
    X.beginPath();X.moveTo(noseX,noseY);X.lineTo(endX,endY);X.stroke();X.shadowBlur=0;X.globalAlpha=1;
  });
  const pulse=14+strength*24+Math.sin(t*7)*3,halo=X.createRadialGradient(B.x,B.y,2,B.x,B.y,pulse*3.2);
  halo.addColorStop(0,`rgba(255,247,210,${.08+strength*.36})`);halo.addColorStop(1,'rgba(139,232,255,0)');
  X.fillStyle=halo;X.beginPath();X.arc(B.x,B.y,pulse*3.2,0,Math.PI*2);X.fill();X.restore();
}

function renderWorldObjects(){
  if(scene!=='win')drawB();
  drawCaptureBeams();

  asteroids.forEach(a=>{
    X.fillStyle='#8c7355';X.strokeStyle='#1d1a2e';X.lineWidth=3;
    X.beginPath();X.arc(a.x,a.y,a.r,0,7);X.fill();X.stroke();
    X.fillStyle='#69533a';X.beginPath();X.arc(a.x-3,a.y-3,a.r*0.4,0,7);X.fill();
  });

  pwItems.forEach(pw=>{
    X.fillStyle=pw.col;X.strokeStyle='#fff';X.lineWidth=2.5;
    X.beginPath();X.arc(pw.x,pw.y,pw.r+Math.sin(t*8)*2,0,7);X.fill();X.stroke();
    T(pw.type==='spec'?'S':pw.type==='grav'?'G':'♥',pw.x,pw.y+4,11,'#1d1a2e','center','Georgia,serif');
  });

  pk.forEach(o=>{X.fillStyle='#ff7ad9';X.strokeStyle='#fff';X.lineWidth=3;X.beginPath();X.arc(o.x,o.y,o.r+Math.sin(t*10)*2,0,7);X.fill();X.stroke()});
  bul.forEach(b=>{X.fillStyle=b.col||'#fff3c4';X.strokeStyle='#1d1a2e';X.lineWidth=2.5;X.beginPath();X.arc(b.x,b.y,b.r,0,7);X.fill();X.stroke()});

  sh.forEach(drawProjectile);

  P.forEach(p=>{if(p.alive)ship(p)});
}

function drawTouchOverlay(){
  if(!isTouch)return;
  X.save();
  X.globalAlpha = 0.3; X.lineWidth = 4; X.strokeStyle = '#efe2c2'; X.fillStyle = 'rgba(239,226,194,0.08)';
  X.beginPath(); X.arc(joyBase.x, joyBase.y, joyBase.r, 0, Math.PI * 2); X.fill(); X.stroke();

  X.globalAlpha = 0.65; X.fillStyle = '#8be8ff'; X.strokeStyle = '#efe2c2'; X.lineWidth = 3;
  X.beginPath(); X.arc(joyStick.x, joyStick.y, 28, 0, Math.PI * 2); X.fill(); X.stroke();

  for(const bKey in touchBtns){
    const btn = touchBtns[bKey]; const isPressed = touchState[btn.k];
    X.globalAlpha = isPressed ? 0.75 : 0.38; X.fillStyle = isPressed ? '#ff9a47' : 'rgba(20,12,40,0.6)';
    X.strokeStyle = '#efe2c2'; X.lineWidth = 3.5;
    X.beginPath(); X.arc(btn.x, btn.y, btn.r, 0, Math.PI * 2); X.fill(); X.stroke();
    X.globalAlpha = 0.95; T(btn.label, btn.x, btn.y + 5, Math.floor(btn.r * 0.32), '#efe2c2', 'center');
  }
  X.restore();
}

function draw(){
  X.setTransform(1,0,0,1,0,0); X.clearRect(0,0,W,H);
  X.save(); if(shake>0) X.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);

  bg();
  if(['intro','ready','play','pause','cheats'].includes(scene)||(scene==='settings'&&previousScene==='pause')){
    renderWorldObjects();
  }
  pt.forEach(p=>{X.fillStyle=p.col;X.globalAlpha=cl(p.life*2,0,1);X.fillRect(p.x,p.y,p.r,p.r)});X.globalAlpha=1;

  X.restore();

  if(flashR>0){X.fillStyle='rgba(255,60,60,'+flashR+')';X.fillRect(0,0,W,H);}
  if(flashW>0){X.fillStyle='rgba(255,255,255,'+flashW+')';X.fillRect(0,0,W,H);}

  X.fillStyle=V;X.fillRect(0,0,W,H);
  if(settings.quality==='high')X.drawImage(getGrainCache(),0,0);
  
  uiButtons=[];
  hud();
  if((scene==='play'||scene==='intro')&&!focusMinigame?.active&&!rewardNotice) drawTouchOverlay();
}

function roundedPanelPath(x,y,w,h,r){X.beginPath();X.moveTo(x+r,y);X.arcTo(x+w,y,x+w,y+h,r);X.arcTo(x+w,y+h,x,y+h,r);X.arcTo(x,y+h,x,y,r);X.arcTo(x,y,x+w,y,r);X.closePath()}
function panel(x=W*.055,y=H*.09,w=W*.89,h=H*.82,fill='rgba(7,12,31,.82)'){
  X.save();roundedPanelPath(x,y,w,h,22);
  const gradient=X.createLinearGradient(x,y,x+w,y+h);gradient.addColorStop(0,'rgba(12,24,50,.22)');gradient.addColorStop(1,'rgba(32,18,57,.10)');
  X.fillStyle=fill;X.fill();X.fillStyle=gradient;X.fill();
  X.strokeStyle='rgba(139,205,237,.42)';X.lineWidth=1.5;X.stroke();
  roundedPanelPath(x+6,y+6,w-12,h-12,17);X.strokeStyle='rgba(194,220,241,.07)';X.lineWidth=1;X.stroke();
  X.strokeStyle='rgba(255,177,92,.72)';X.lineWidth=3;X.beginPath();X.moveTo(x+28,y+2);X.lineTo(x+120,y+2);X.stroke();
  X.globalAlpha=.38;X.fillStyle='#8be8ff';X.fillRect(x+w-29,y+20,3,3);X.fillRect(x+w-20,y+20,3,3);X.globalAlpha=1;X.restore();
}

function drawMenuBackdrop(){
  X.fillStyle='rgba(7,8,25,.34)';X.fillRect(0,0,W,H);
  const haze=X.createLinearGradient(0,0,W,H);haze.addColorStop(0,'rgba(31,30,78,.15)');haze.addColorStop(.58,'rgba(11,15,43,.1)');haze.addColorStop(1,'rgba(79,50,118,.25)');X.fillStyle=haze;X.fillRect(0,0,W,H);
}

function drawStarEmblem(x,y,r){
  X.save();X.translate(x,y);X.rotate(t*.035);
  const glow=X.createRadialGradient(0,0,2,0,0,r*1.5);glow.addColorStop(0,'rgba(255,230,166,.26)');glow.addColorStop(.42,'rgba(116,210,255,.12)');glow.addColorStop(1,'rgba(116,210,255,0)');
  X.fillStyle=glow;X.beginPath();X.arc(0,0,r*1.5,0,Math.PI*2);X.fill();
  X.strokeStyle='rgba(139,232,255,.38)';X.lineWidth=1.5;X.beginPath();X.ellipse(0,0,r,r*.43,-.36,0,Math.PI*2);X.stroke();
  X.strokeStyle='rgba(255,177,92,.28)';X.beginPath();X.ellipse(0,0,r*.72,r*1.02,.46,0,Math.PI*2);X.stroke();
  X.rotate(-t*.035);X.shadowColor='#fff0bc';X.shadowBlur=12;X.fillStyle='#fff4d0';X.beginPath();
  for(let i=0;i<8;i++){const a=-Math.PI/2+i*Math.PI/4,rr=i%2?r*.14:r*.32,px=Math.cos(a)*rr,py=Math.sin(a)*rr;i?X.lineTo(px,py):X.moveTo(px,py)}
  X.closePath();X.fill();X.shadowBlur=0;X.restore();
}

function activeControllerPlayer(){return getController(lastGamepadPlayer)?.connected?lastGamepadPlayer:getControllerPads().findIndex(gp=>gp?.connected)}
function useGamepadHints(){return isControllerConnected()&&(lastInputDevice==='gamepad'||lastInputDevice==='auto')}
function controllerActionName(action){const player=activeControllerPlayer();return player<0?'':gamepadButtonName(gamepadBindings[player][action],getController(player))}
function focusControlText(){
  const count=connectedControllerCount();
  if(lastInputDevice==='touch')return 'TOQUE E SEGURE: SUBIR';
  if(!useGamepadHints()||!count)return 'SEGURE ESPAÇO: SUBIR';
  const labels=[];
  for(let i=0;i<2;i++)if(getController(i)?.connected)labels.push(gamepadButtonName(gamepadBindings[i].fire,getController(i)));
  return `SEGURE ${labels.join(' / ')}: SUBIR`;
}
function continueControlText(){if(lastInputDevice==='touch')return 'TOQUE PARA SEGUIR';return useGamepadHints()?`${controllerActionName('confirm')} PARA SEGUIR`:'ENTER PARA SEGUIR'}

function drawSplash(){
  T('ROMAN',W/2,H*.37,112,'#ffb15c','center');
  T('GUARDIÃ DAS ESTRELAS',W/2,H*.46,25,'#efe2c2','center');
  drawStarEmblem(W*.78,H*.34,55);
  const alpha=.58+.42*(.5+.5*Math.sin(t*1.15));
  X.globalAlpha=alpha;T(lastInputDevice==='touch'?'TOQUE PARA JOGAR':useGamepadHints()?'APERTE UM BOTÃO PARA JOGAR':'APERTE UMA TECLA PARA JOGAR',W/2,H*.73,22,'#8be8ff','center');X.globalAlpha=1;
}

function drawMainMenu(){
  T('SNCT · ARCADE ESPACIAL',W*.09,H*.16,14,'#8ce8ff','left','600 14px system-ui,sans-serif');
  T('ROMAN',W*.09,H*.28,78,'#ffb15c','left');T('GUARDIÃ DAS ESTRELAS',W*.09,H*.34,19,'#efe2c2','left','600 19px system-ui,sans-serif');
  X.fillStyle='rgba(205,218,244,.78)';X.font='15px system-ui,sans-serif';X.textAlign='left';X.fillText('Defenda a ciência. Enfrente AG Carinae',W*.09,H*.405);X.fillText('e chegue aos Pilares da Criação.',W*.09,H*.445);
  const x=W*.09,y=H*.49,w=Math.min(W*.38,370),h=Math.min(H*.092,50),gap=H*.018;
  const labels=[['main:play','JOGAR'],['main:codex','CODEX'],['main:settings','CONFIGURAÇÕES'],['main:quit','SAIR DO JOGO']];
  labels.forEach((b,i)=>drawMenuButton(b[0],b[1],x,y+i*(h+gap),w,h,i===menuCursor));
  const ix=W*.57,iy=H*.15,iw=W*.34,ih=H*.68;
  panel(ix,iy,iw,ih,'rgba(5,9,24,.56)');
  drawStarEmblem(ix+iw/2,iy+ih*.34,Math.min(76,W*.08));
  T('CAMPANHA ESTELAR',ix+iw/2,iy+ih*.62,20,'#ffe08a','center','700 20px system-ui,sans-serif');
  T('Três encontros. Três registros do Hubble.',ix+iw/2,iy+ih*.69,14,'#d5e2f7','center','14px system-ui,sans-serif');
  T('Encontre o foco e revele cada imagem.',ix+iw/2,iy+ih*.75,14,'#8be8ff','center','14px system-ui,sans-serif');
  T('VERSÃO 4.0',W*.09,H*.94,12,'#a9b6d2','left','600 12px system-ui,sans-serif');
}

function drawModes(){
  panel();T('ESCOLHA O MODO',W/2,H*.22,36,'#ffb15c','center');
  const buttons=[['mode:solo','SOLO · 1 JOGADOR'],['mode:coop','CO-OP · 2 JOGADORES'],['mode:versus','VERSUS · 2 JOGADORES']];
  const bw=W*.5,bh=54,bx=(W-bw)/2,by=H*.31,gap=H*.12;
  buttons.forEach((b,i)=>drawMenuButton(b[0],b[1],bx,by+i*gap,bw,bh,i===menuCursor));
  drawMenuButton('back:main','VOLTAR',W*.39,H*.80,W*.22,42,menuCursor===3,true);
}

function drawDiff(){
  panel();T('ESCOLHA A DIFICULDADE',W/2,H*.24,34,'#ffb15c','center');
  drawMenuButton('diff:normal','NORMAL',W*.28,H*.39,W*.44,58,menuCursor===0);
  drawMenuButton('diff:expert','ESPECIALISTA',W*.28,H*.56,W*.44,58,menuCursor===1);
  drawMenuButton('back:modes','VOLTAR',W*.39,H*.78,W*.22,42,menuCursor===2,true);
}

function drawImageContained(img,x,y,w,h){
  if(!img||!img.complete||!img.naturalWidth)return false;
  const scale=Math.min(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*scale,dh=img.naturalHeight*scale;
  X.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);return true;
}


function drawControlFrame(x,y,w,h,focused=false){
  const image=focused?SPRITES.controlFrameFocus:SPRITES.controlFrame;
  if(image&&image.complete&&image.naturalWidth)X.drawImage(image,x,y,w,h);
}
function drawGenericGamepad(x,y,w,h){
  const scale=Math.min(w/240,h/130),dw=240*scale,dh=130*scale;
  X.save();X.translate(x+(w-dw)/2,y+(h-dh)/2);X.scale(scale,scale);
  X.beginPath();X.moveTo(48,19);X.bezierCurveTo(66,7,91,11,112,14);X.bezierCurveTo(132,11,160,10,179,18);X.bezierCurveTo(199,18,211,32,217,51);X.lineTo(231,90);X.bezierCurveTo(238,112,219,128,202,115);X.lineTo(169,82);X.lineTo(72,82);X.lineTo(39,115);X.bezierCurveTo(22,128,4,112,11,90);X.lineTo(24,50);X.bezierCurveTo(29,34,35,24,48,19);X.closePath();
  const body=X.createLinearGradient(0,12,0,120);body.addColorStop(0,'#f5fcff');body.addColorStop(1,'#c8e1e8');X.fillStyle=body;X.strokeStyle='#205768';X.lineWidth=3;X.fill();X.stroke();
  [[76,49],[151,56]].forEach(([cx,cy])=>{X.fillStyle='rgba(102,153,166,.16)';X.beginPath();X.arc(cx,cy,18,0,Math.PI*2);X.fill();X.strokeStyle='#75aebb';X.lineWidth=2;X.stroke();X.fillStyle='#d8edf1';X.beginPath();X.arc(cx,cy,12,0,Math.PI*2);X.fill();X.strokeStyle='#205768';X.lineWidth=2;X.stroke()});
  X.fillStyle='#d9f0f4';X.strokeStyle='#205768';X.lineWidth=2;roundedPanelPath(37,43,36,12,3);X.fill();X.stroke();roundedPanelPath(49,31,12,36,3);X.fill();X.stroke();
  [[190,39],[203,53],[177,53],[190,67]].forEach(([cx,cy])=>{X.fillStyle='#e8f7f9';X.strokeStyle='#498594';X.lineWidth=2;X.beginPath();X.arc(cx,cy,7,0,Math.PI*2);X.fill();X.stroke()});
  X.fillStyle='rgba(62,124,138,.22)';X.strokeStyle='#75aebb';X.lineWidth=1.5;X.beginPath();X.ellipse(120,30,11,4,0,0,Math.PI*2);X.fill();X.stroke();
  X.restore();
}
function drawControllerIllustration(x,y,w,h,pad=null,forceController=false){
  X.save();roundedPanelPath(x,y,w,h,10);
  X.fillStyle='rgba(6,12,31,.72)';X.fill();
  X.strokeStyle='rgba(139,232,255,.32)';X.lineWidth=1;X.stroke();
  const showController=forceController||!!pad?.connected;
  if(showController){
    const xboxArt=!!pad?.connected&&controllerFamily(pad)==='xbox';
    if(xboxArt&&SPRITES.controlPad.complete&&SPRITES.controlPad.naturalWidth)drawImageContained(SPRITES.controlPad,x+7,y+4,w-14,h-23);
    else drawGenericGamepad(x+7,y+4,w-14,h-23);
    const name=pad?.connected?'CONTROLE '+controllerFamily(pad).toUpperCase():'MODELO GENÉRICO';
    T(name,x+w/2,y+h-7,10,'#cfeeff','center','700 10px system-ui,sans-serif');
  }else if(lastInputDevice==='touch'){
    const phoneW=Math.min(w*.28,35),phoneH=Math.min(h*.62,56),px=x+(w-phoneW)/2,py=y+8;
    roundedPanelPath(px,py,phoneW,phoneH,6);X.fillStyle='rgba(139,232,255,.16)';X.fill();X.strokeStyle='#8be8ff';X.lineWidth=1.5;X.stroke();
    X.fillStyle='#ffe08a';X.beginPath();X.arc(px+phoneW/2,py+phoneH*.55,5,0,Math.PI*2);X.fill();
    T('TOQUE',x+w/2,y+h-7,10,'#cfeeff','center','700 10px system-ui,sans-serif');
  }else{
    const keySize=Math.min(w*.17,24),gap=5,startX=x+w/2-keySize*1.5,topY=y+9;
    [['W',1,0],['A',0,1],['S',1,1],['D',2,1]].forEach(([label,col,row])=>{
      const kx=startX+col*(keySize+gap),ky=topY+row*(keySize+gap);
      roundedPanelPath(kx,ky,keySize,keySize,4);X.fillStyle='rgba(139,232,255,.17)';X.fill();X.strokeStyle='rgba(139,232,255,.72)';X.lineWidth=1;X.stroke();
      T(label,kx+keySize/2,ky+keySize*.68,11,'#eaf7ff','center','700 11px system-ui,sans-serif');
    });
    T('TECLADO',x+w/2,y+h-7,10,'#cfeeff','center','700 10px system-ui,sans-serif');
  }
  X.restore();
}
function drawControlRemapButton(id,label,binding,pad,x,y,w,h,selected,waiting){
  const pulse=.5+.5*Math.sin(t*3.2),radius=Math.min(10,h*.28);
  X.save();roundedPanelPath(x,y,w,h,radius);
  X.fillStyle=waiting?'rgba(115,82,37,.72)':selected?'rgba(36,92,126,.72)':'rgba(8,15,34,.82)';
  X.fill();
  X.strokeStyle=waiting?'#ffe08a':selected?'#8ce8ff':'rgba(177,207,232,.52)';
  X.lineWidth=selected||waiting?2:1.2;
  if(selected||waiting){X.shadowColor=waiting?'#ffcf66':'#61d8ff';X.shadowBlur=(selected||waiting)?5+4*pulse:0}
  X.stroke();X.shadowBlur=0;
  if(selected||waiting){X.fillStyle=waiting?'#ffcf66':'#8ce8ff';X.fillRect(x+5,y+7,3,h-14)}
  const padRight=9,iconSize=Math.min(21,h-8),showFace=!!pad?.connected&&controllerFamily(pad)==='xbox'&&Number.isInteger(binding)&&binding>=0&&binding<4;
  const value=waiting?'AGUARDANDO…':gamepadButtonName(binding,pad);
  X.textAlign='left';X.textBaseline='middle';X.fillStyle=waiting?'#ffe08a':selected?'#fff2d4':'#d9e5f5';
  let valueWidth=showFace?iconSize+padRight+2:Math.max(58,X.measureText(value).width+padRight);
  const available=w-18-valueWidth-8;
  const labelSize=cl(12.5*(available/164),10,12.5);
  X.font='700 '+labelSize+'px system-ui,sans-serif';
  X.fillText(label,x+13,y+h/2,Math.max(30,available));
  if(showFace){
    const icon=SPRITES.controlFace[binding];
    if(icon&&icon.complete&&icon.naturalWidth)drawImageContained(icon,x+w-iconSize-padRight,y+(h-iconSize)/2,iconSize,iconSize);
  }else{
    X.font='700 11px system-ui,sans-serif';X.textAlign='right';
    X.fillStyle=waiting?'#ffe08a':'#8be8ff';X.fillText(value,x+w-padRight,y+h/2,Math.max(42,valueWidth));
  }
  X.restore();uiButtons.push({id,x,y,w,h});
}
function introMovementText(player){
  const assigned=nP===1&&player===0&&!getController(0)?.connected&&getController(1)?.connected?1:player;
  const pad=getController(assigned);
  if(pad?.connected&&useGamepadHints())return '↑ ↓ ← → / ANALÓGICO';
  if(lastInputDevice==='touch')return player===0?'↑ ↓ ← → / WASD / TOQUE':'↑ ↓ ← → / TOQUE';
  return player===0?'↑ ↓ ← → / WASD':'↑ ↓ ← →';
}
function drawPhaseIntro(){
  panel();
  T('BRIEFING DE MISSÃO',W*.09,H*.135,13,'#8be8ff','left','700 13px system-ui,sans-serif');
  T('BOSS '+(currentBossIndex+1)+' / '+BOSSES.length+' · '+BOSSES[currentBossIndex].name,W*.09,H*.195,23,'#ffb15c','left','700 23px system-ui,sans-serif');

  const portraitX=W*.09,portraitY=H*.255,portraitW=W*.215,portraitH=H*.31;
  X.save();roundedPanelPath(portraitX,portraitY,portraitW,portraitH,12);X.fillStyle='rgba(5,10,27,.82)';X.fill();X.strokeStyle='rgba(139,232,255,.56)';X.lineWidth=1.5;X.stroke();
  if(!drawImageContained(CODEX_IMAGES.nancy,portraitX+6,portraitY+6,portraitW-12,portraitH-12))T('NANCY GRACE ROMAN',portraitX+portraitW/2,portraitY+portraitH/2,11,'#cbd7ed','center','700 11px system-ui,sans-serif');
  X.restore();

  const textX=W*.34,textW=W*.55;
  T('RELATÓRIO',textX,H*.255,12,'#ffe08a','left','700 12px system-ui,sans-serif');
  const primary=nP===3
    ?'“Bem-vindos ao Modo Versus na mesma tela! Vocês jogam juntos na mesma arena como no Co-op, mas a pontuação é individual. Quem somar mais pontos destruindo asteroides, acertando o chefe e conseguindo o K.O. Bonus de 2.000 pontos será o vencedor!”'
    :(currentBossIndex===0
      ?'“Aqui é Nancy Grace Roman. Em 1960 virei a primeira astrônoma-chefe da NASA e lutei por telescópios no espaço. Agora o Hubble observa AG Carinae, uma estrela envolta por uma enorme casca de gás. Ajude o satélite a registrar essa imagem!”'
      :'“Novo sinal detectado! Enfrente o alvo e prepare o satélite. Depois da batalha, o Foco Final acontece aqui mesmo na arena.”');
  let storyY=WR(primary,textX,H*.29,textW,H*.043,16,'#efe2c2')+4;
  const focusHint=useGamepadHints()
    ?'No Foco Final, segure '+controllerActionName('fire')+' para subir a faixa; solte para descer.'
    :lastInputDevice==='touch'
      ?'No Foco Final, toque e segure para subir a faixa; solte para descer.'
      :'No Foco Final, segure Espaço para subir a faixa; solte para descer.';
  const supplementary='Campanha com três bosses: AG Carinae em sua nebulosa vermelha, AG Carinae em sua composição colorida e, no final, os Pilares da Criação. '+focusHint+' Mantenha a estrela dentro da faixa.';
  T('OBJETIVO E CAPTURA',textX,storyY,11,'#ff9ad9','left','700 11px system-ui,sans-serif');
  WR(supplementary,textX,storyY+H*.026,textW,H*.038,13,'#ff9ad9');

  const playerOne=nP===1&&!getController(0)?.connected&&getController(1)?.connected?1:0;
  const guidePlayer=nP>1&&!getController(0)?.connected&&getController(1)?.connected?1:playerOne;
  const pad=getController(guidePlayer);
  const cardX=W*.73,cardY=H*.69,cardW=W*.18,cardH=H*.17;
  drawControllerIllustration(cardX,cardY,cardW,cardH,useGamepadHints()?pad:null,false);

  const guideX=W*.09,guideW=W*.24,guideY=H*.59;
  T(nP===1?'COMANDOS DO PILOTO':'COMANDOS DOS JOGADORES',guideX,guideY,10,'#8be8ff','left','700 10px system-ui,sans-serif');
  if(nP===1){
    const g=playerControlGuide(0),step=H*.032,firstY=guideY+31;
    T('Mover: '+introMovementText(0),guideX,firstY,10,'#8be8ff','left','600 10px system-ui,sans-serif');
    T('Atirar: '+g.fire,guideX,firstY+step,10,'#8be8ff','left','600 10px system-ui,sans-serif');
    T('Trocar Hubble/Roman: '+g.mode,guideX,firstY+step*2,10,'#8be8ff','left','600 10px system-ui,sans-serif');
    T('Super: '+g.super,guideX,firstY+step*3,10,'#8be8ff','left','600 10px system-ui,sans-serif');
  }else{
    const g1=playerControlGuide(0),g2=playerControlGuide(1);
    let y=guideY+15;
    y=WR('P1 (Laranja): Mover '+introMovementText(0)+' · Atirar '+g1.fire+' · Trocar '+g1.mode+' · Super '+g1.super,guideX,y,guideW,11,9,'#ff9a47')+2;
    y=WR('P2 (Verde): Mover '+introMovementText(1)+' · Atirar '+g2.fire+' · Trocar '+g2.mode+' · Super '+g2.super,guideX,y,guideW,11,9,'#4fd8c4')+1;
    WR('Pontos: Dano +100 | Asteroide +200 | K.O. Bonus +2000 | Combo (1.5x, 2x, 3x)',guideX,y,guideW,11,9,'#ffd34d');
  }
  T(useGamepadHints()?controllerActionName('confirm')+' / '+controllerActionName('pause')+' PARA COMEÇAR':lastInputDevice==='touch'?'TOQUE PARA COMEÇAR':'ENTER PARA COMEÇAR',W/2,H-72,20,'#ffe08a','center','700 20px system-ui,sans-serif');
}

function drawCodex(){
  const entry=CODEX_ENTRIES[codexPage]||CODEX_ENTRIES[0];
  panel();
  T('ARQUIVOS DA NASA · CODEX',W*.09,H*.16,25,'#ffb15c','left','700 25px system-ui,sans-serif');
  T((codexPage+1)+' / '+CODEX_ENTRIES.length,W*.89,H*.16,12,'#a9b6d2','right','600 12px system-ui,sans-serif');
  const columns=6,tabW=W*.126,tabGap=W*.012,tabH=32,tabTop=H*.205;
  CODEX_ENTRIES.forEach((item,i)=>{
    const row=Math.floor(i/columns),first=row*columns,count=Math.min(columns,CODEX_ENTRIES.length-first),col=i%columns;
    const rowW=count*tabW+(count-1)*tabGap,x=(W-rowW)/2+col*(tabW+tabGap),y=tabTop+row*H*.066,index=uiButtons.length;
    drawMenuButton('codex:tab:'+i,item.tab,x,y,tabW,tabH,menuCursor===index,true);
    if(i===codexPage){X.fillStyle='#ffb15c';X.fillRect(x+tabW*.12,y+tabH-3,tabW*.76,2)}
  });
  const hasImage=!!entry.image,imageX=W*.095,imageY=H*.37,imageW=W*.30,imageH=H*.42;
  const textX=hasImage?W*.43:W*.12,textW=hasImage?W*.45:W*.76;
  if(hasImage){
    X.save();roundedPanelPath(imageX,imageY,imageW,imageH,12);X.fillStyle='rgba(4,8,22,.82)';X.fill();X.strokeStyle='rgba(139,232,255,.48)';X.lineWidth=1.5;X.stroke();
    if(!drawImageContained(entry.image,imageX+8,imageY+8,imageW-16,imageH-16)){T('CARREGANDO IMAGEM',imageX+imageW/2,imageY+imageH/2,12,'#a9b6d2','center','600 12px system-ui,sans-serif')}
    X.restore();
  }
  T(entry.title,textX,H*.405,22,'#ffe08a','left','700 22px system-ui,sans-serif');
  T(entry.subtitle,textX,H*.45,11,'#8be8ff','left','600 11px system-ui,sans-serif');
  let textY=H*.49;const bodySize=cl(W*.017,14,16),lineHeight=bodySize*1.42;
  entry.paragraphs.forEach(paragraph=>{textY=WR(paragraph,textX,textY,textW,lineHeight,bodySize,'#d5e2f7')+7});
  if(entry.credit)T(entry.credit,textX,H*.79,10,'#a9b6d2','left','600 10px system-ui,sans-serif');
  const dotY=H*.855,spacing=23,dotStart=W/2-(CODEX_ENTRIES.length-1)*spacing/2;
  CODEX_ENTRIES.forEach((item,i)=>{
    const x=dotStart+i*spacing,index=uiButtons.length,active=i===codexPage,focused=menuCursor===index;
    X.save();if(active){X.shadowColor='#ffb15c';X.shadowBlur=9}
    X.fillStyle=active?'#ffb15c':'rgba(213,226,247,.48)';X.beginPath();X.arc(x,dotY,active?4.8:3.1,0,Math.PI*2);X.fill();X.shadowBlur=0;
    if(focused){X.strokeStyle=menuFocus==='keyboard'?'#fff2c7':'#8be8ff';X.lineWidth=1.4;if(menuFocus==='keyboard')X.setLineDash([2,2]);X.strokeRect(x-9,dotY-9,18,18);X.setLineDash([])}
    X.restore();uiButtons.push({id:'codex:page:'+i,x:x-11,y:dotY-11,w:22,h:22});
  });
  const backIndex=uiButtons.length;
  drawMenuButton('codex:back','VOLTAR',W*.77,H*.83,W*.14,34,menuCursor===backIndex,true);
}
function drawSettings(){
  if(previousScene==='pause')X.fillStyle='rgba(10,8,25,.72)',X.fillRect(0,0,W,H);
  panel();T('CONFIGURAÇÕES',W/2,H*.17,34,'#ffb15c','center');
  drawMenuButton('settings:tab:general','GERAL',W*.27,H*.21,W*.22,36,settingsTab==='general'||menuCursor===0,true);
  drawMenuButton('settings:tab:controller','CONTROLE',W*.51,H*.21,W*.22,36,settingsTab==='controller'||menuCursor===1,true);
  if(settingsTab==='controller'){
    const pad=getController(controlPlayer),bindings=gamepadBindings[controlPlayer];
    drawMenuButton('settings:player:0','PLAYER 1',W*.27,H*.285,W*.22,34,controlPlayer===0||menuCursor===2,true);
    drawMenuButton('settings:player:1','PLAYER 2',W*.51,H*.285,W*.22,34,controlPlayer===1||menuCursor===3,true);

    T('VISUALIZAÇÃO DO CONTROLE',W*.17,H*.345,10,'#8be8ff','center','700 10px system-ui,sans-serif');
    drawControllerIllustration(W*.075,H*.365,W*.19,H*.235,pad,true);
    if(SPRITES.controlDpad.complete&&SPRITES.controlDpad.naturalWidth)drawImageContained(SPRITES.controlDpad,W*.095,H*.608,29,28);
    T('DIRECIONAL',W*.14,H*.644,9,'#cbd7ed','left','700 9px system-ui,sans-serif');
    const statusX=W*.075,statusY=H*.68,statusW=W*.19,statusH=H*.095;
    drawControlFrame(statusX,statusY,statusW,statusH,!!remapPending&&remapPending.player===controlPlayer);
    const waitingForInput=remapPending?.player===controlPlayer;
    const connected=!!pad;
    T(connected?'CONTROLE '+(controlPlayer+1)+' CONECTADO · '+controllerFamily(pad).toUpperCase():'CONECTE O CONTROLE '+(controlPlayer+1),statusX+statusW/2,statusY+statusH*.48,9,connected?'#8be8ff':'#a9b6d2','center','700 9px system-ui,sans-serif');

    const actions=[['up','MOVER ↑'],['down','MOVER ↓'],['left','MOVER ←'],['right','MOVER →'],['fire','DISPARO'],['super','SUPER'],['mode','TROCAR TELESCÓPIO'],['confirm','CONFIRMAR'],['pause','PAUSAR'],['back','VOLTAR']];
    const layout={up:[0,0],down:[1,0],left:[0,1],right:[1,1],fire:[0,2],super:[1,2],mode:[0,3],confirm:[1,3],pause:[0,4],back:[1,4]};
    const colX=[W*.285,W*.615],actionY=H*.41,rowStep=H*.065,buttonW=W*.30,buttonH=30;
    T('MOVIMENTO',W*.60,H*.385,10,'#8be8ff','center','700 10px system-ui,sans-serif');
    T('AÇÕES DA MISSÃO',W*.60,H*.565,10,'#ffcf8a','center','700 10px system-ui,sans-serif');
    actions.forEach(([action,label],i)=>{
      const pos=layout[action],col=pos[0],row=pos[1],x=colX[col],y=row<2?actionY+row*rowStep:H*.59+(row-2)*rowStep;
      const waiting=remapPending?.player===controlPlayer&&remapPending.action===action;
      drawControlRemapButton('settings:bind:'+controlPlayer+':'+action,label,bindings[action],pad,x,y,buttonW,buttonH,menuCursor===4+i,waiting);
    });
    T(waitingForInput?'PRESSIONE O BOTÃO DESEJADO · ESC CANCELA':'SELECIONE UMA AÇÃO PARA REMAPEAR · ANALÓGICO ESQUERDO MANTIDO',W*.60,H*.80,10,waitingForInput?'#ffe08a':'#cbd7ed','center','600 10px system-ui,sans-serif');
    drawMenuButton('settings:controls:reset','PADRÕES',W*.20,H*.83,W*.25,36,menuCursor===14,true);
    drawMenuButton('settings:back','VOLTAR',W*.55,H*.83,W*.25,36,menuCursor===15,true);
    return;
  }
  drawSlider('settings:volume','VOLUME',settings.volume,W*.32,H*.34,W*.36);
  T('LIMITE DE FPS',W/2,H*.42,17,'#cbd7ed','center','600 17px system-ui,sans-serif');
  const fpsOptions=[[30,'30'],[60,'60'],[120,'120'],[144,'144'],[165,'165'],[0,'SEM LIMITE']];
  roundedPanelPath(W*.14,H*.445,W*.72,H*.22,12);X.fillStyle='rgba(5,10,26,.24)';X.fill();X.strokeStyle='rgba(139,232,255,.14)';X.lineWidth=1;X.stroke();
  fpsOptions.forEach(([value,label],i)=>{const col=i%3,row=Math.floor(i/3),bx=W*.16+col*W*.23,by=H*.46+row*H*.105;drawMenuButton('settings:fps:'+value,label,bx,by,W*.20,42,settings.fps===value||menuCursor===i+3,true)});
  T('Máximo escolhido: '+(settings.fps===0?'sem limite':settings.fps+' FPS'),W/2,H*.69,14,'#a9b6d2','center','14px system-ui,sans-serif');
  drawMenuButton('settings:quality','GRÁFICOS: '+(settings.quality==='high'?'ALTO':'ECONÔMICO'),W*.29,H*.73,W*.42,42,menuCursor===9,true);
  drawMenuButton('settings:back','VOLTAR',W*.39,H*.83,W*.22,38,menuCursor===10,true);
}
function drawPause(){
  X.fillStyle='rgba(8,6,22,.46)';X.fillRect(0,0,W,H);
  panel(W*.055,H*.13,W*.89,H*.80,'rgba(7,12,31,.54)');
  T('ROMAN: GUARDIÃ DAS ESTRELAS',W/2,H*.18,25,'#ffb15c','center','700 25px system-ui,sans-serif');
  T('PAUSADO',W/2,H*.235,18,'#cbd7ed','center','600 18px system-ui,sans-serif');
  X.strokeStyle='rgba(139,232,255,.22)';X.lineWidth=1;X.beginPath();X.moveTo(W*.12,H*.265);X.lineTo(W*.88,H*.265);X.stroke();

  const buttons=[['pause:resume','RETOMAR'],['pause:restart','REINICIAR FASE'],['pause:settings','CONFIGURAÇÕES'],['pause:main','MENU PRINCIPAL']];
  const bw=W*.34,bh=44,bx=[W*.13,W*.53],by=[H*.29,H*.395];
  buttons.forEach((b,i)=>drawMenuButton(b[0],b[1],bx[i%2],by[Math.floor(i/2)],bw,bh,i===menuCursor,true));

  X.strokeStyle='rgba(139,232,255,.24)';X.lineWidth=1;X.beginPath();X.moveTo(W*.12,H*.50);X.lineTo(W*.88,H*.50);X.stroke();
  X.strokeStyle='rgba(139,232,255,.15)';X.beginPath();X.moveTo(W*.64,H*.545);X.lineTo(W*.64,H*.84);X.stroke();

  T('VIDAS',W*.14,H*.565,16,'#ffd34d','left','700 16px system-ui,sans-serif');
  P.forEach((p,i)=>T('P'+(i+1)+': '+(cheatSettings.god||cheatSettings.infiniteHealth?'∞':'♥'.repeat(Math.max(0,p.hp))),W*(.27+i*.23),H*.565,16,p.col,'left','700 16px system-ui,sans-serif'));
  T('CARTAS ESTELARES · '+pauseCards.length,W*.14,H*.655,15,'#ffd34d','left','700 15px system-ui,sans-serif');
  pauseCards.slice(-3).forEach((card,i)=>WR(card,W*.14,H*.70+i*21,W*.47,16,11,'#efe2c2'));

  const activePad=getController(activeControllerPlayer());
  drawControllerIllustration(W*.69,H*.535,W*.20,H*.225,activePad,!!activePad?.connected);
  const deviceLabel=activePad?.connected?'CONTROLES ATIVOS · '+controllerFamily(activePad).toUpperCase():lastInputDevice==='touch'?'CONTROLES POR TOQUE':'CONTROLES DE TECLADO';
  drawControlFrame(W*.685,H*.765,W*.21,H*.12,false);
  T(deviceLabel,W*.79,H*.825,9,'#cfeeff','center','700 9px system-ui,sans-serif');

  T(useGamepadHints()?('DIRECIONAL / ANALÓGICO: NAVEGAR · '+controllerActionName('confirm')+': SELECIONAR · '+controllerActionName('pause')+': RETOMAR'):lastInputDevice==='touch'?'TOQUE NAS OPÇÕES PARA SELECIONAR':'WASD / SETAS NAVEGAR · ENTER SELECIONAR · ESC RETOMAR',W/2,H*.91,10,'#a9b6d2','center','600 10px system-ui,sans-serif');
}
function drawCheats(){
  X.fillStyle='rgba(8,6,22,.84)';X.fillRect(0,0,W,H);panel();
  T('AJUSTES DE FASE',W/2,H*.20,27,'#ffb15c','center');
  drawMenuButton('cheat:god','GOD MODE: '+(cheatSettings.god?'ON':'OFF'),W*.28,H*.28,W*.44,44,menuCursor===0,true);
  drawMenuButton('cheat:health','VIDA INFINITA: '+(cheatSettings.infiniteHealth?'ON':'OFF'),W*.28,H*.40,W*.44,44,menuCursor===1,true);
  T('DANO',W/2,H*.55,15,'#cbd7ed','center','600 15px system-ui,sans-serif');
  [1,2,4,8,16].forEach((v,i)=>drawMenuButton('cheat:damage:'+v,v+'X',W*.105+i*W*.158,H*.58,W*.145,40,cheatSettings.damageMultiplier===v||menuCursor===i+2,true));
  drawMenuButton('cheat:close','VOLTAR',W*.39,H*.76,W*.22,42,menuCursor===7,true);
}

function drawQuit(){
  panel();T('ATÉ A PRÓXIMA',W/2,195,42,'#ffb15c','center');
  T('Feche esta aba para sair do jogo.',W/2,254,19,'#efe2c2','center','Georgia,serif');
  drawMenuButton('quit:return','VOLTAR AO INÍCIO',350,337,260,52,menuCursor===0,true);
}

function drawFocusMinigame(){
  const f=focusMinigame;if(!f?.active)return;
  const px=12,py=82,pw=180,ph=430,trackX=px+32,trackY=158,trackH=246,trackW=42,half=f.zoneHeight/2;
  const aligned=Math.abs(f.focusY-f.targetY)<half-7;
  X.save();roundedPanelPath(px,py,pw,ph,15);X.fillStyle='rgba(5,10,28,.88)';X.fill();X.strokeStyle='rgba(139,232,255,.7)';X.lineWidth=1.5;X.stroke();
  T('FOCO FINAL',px+pw/2,py+28,18,'#ffb15c','center','700 18px system-ui,sans-serif');
  T('ESTABILIZE A CAPTURA',px+pw/2,py+49,10,'#b8cee5','center','600 10px system-ui,sans-serif');
  // A faixa verde ganha velocidade quando o botão fica pressionado e cai ao soltá-lo.
  X.fillStyle='rgba(4,10,23,.86)';X.fillRect(trackX,trackY,trackW,trackH);X.strokeStyle='rgba(214,232,250,.82)';X.lineWidth=2;X.strokeRect(trackX,trackY,trackW,trackH);
  const zoneY=cl(f.focusY-half,trackY,trackY+trackH-f.zoneHeight);
  X.fillStyle=aligned?'rgba(116,255,165,.88)':'rgba(88,222,158,.76)';X.shadowColor='#6fffaa';X.shadowBlur=aligned?15:7;X.fillRect(trackX+3,zoneY,trackW-6,f.zoneHeight);X.shadowBlur=0;
  X.strokeStyle='rgba(220,255,230,.9)';X.lineWidth=1.5;X.strokeRect(trackX+3,zoneY,trackW-6,f.zoneHeight);
  const starGlow=X.createRadialGradient(trackX+trackW/2,f.targetY,1,trackX+trackW/2,f.targetY,25);starGlow.addColorStop(0,'#fff');starGlow.addColorStop(.28,'#ffe08a');starGlow.addColorStop(1,'rgba(255,176,92,0)');X.fillStyle=starGlow;X.beginPath();X.arc(trackX+trackW/2,f.targetY,25,0,Math.PI*2);X.fill();
  X.fillStyle='#fff2bd';X.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?5:11,sx=trackX+trackW/2+Math.cos(a)*r,sy=f.targetY+Math.sin(a)*r;i?X.lineTo(sx,sy):X.moveTo(sx,sy)}X.closePath();X.fill();
  const meterX=px+105,meterW=22;X.fillStyle='rgba(215,226,245,.14)';X.fillRect(meterX,trackY,meterW,trackH);X.fillStyle='#8be8ff';X.fillRect(meterX,trackY+trackH*(1-f.progress/100),meterW,trackH*f.progress/100);X.strokeStyle='#d5e2f7';X.lineWidth=1.5;X.strokeRect(meterX,trackY,meterW,trackH);
  T('CAPTURA',meterX+meterW/2,trackY-10,10,'#d5e2f7','center','600 10px system-ui,sans-serif');
  T(Math.floor(f.progress)+'%',meterX+meterW/2,trackY+trackH+20,14,'#ffe08a','center','700 14px system-ui,sans-serif');
  X.strokeStyle='rgba(139,232,255,.18)';X.lineWidth=1;X.beginPath();X.moveTo(px+18,py+356);X.lineTo(px+pw-18,py+356);X.stroke();
  const controlHint=focusControlText();X.font='700 12px system-ui,sans-serif';
  const controlFont=Math.min(12,12*(pw-24)/Math.max(1,X.measureText(controlHint).width));
  T(controlHint,px+pw/2,py+376,controlFont,'#ffe08a','center',`700 ${controlFont}px system-ui,sans-serif`);
  T('SOLTE: DESCER',px+pw/2,py+396,11,'#c7d5e9','center','600 11px system-ui,sans-serif');
  T('TEMPO '+Math.max(0,Math.ceil(f.limit-f.time))+'s',px+pw/2,py+417,11,'#ffb79c','center','600 11px system-ui,sans-serif');
  X.restore();
}

function drawRewardNotice(){
  const data=BOSSES[currentBossIndex],img=REWARD_IMAGES[data.image];
  const boxW=Math.min(W*.90,864),boxH=Math.min(H*.90,486),x=(W-boxW)/2,y=(H-boxH)/2,pad=boxW*.04;
  X.fillStyle='rgba(4,5,18,.76)';X.fillRect(0,0,W,H);
  X.save();roundedPanelPath(x,y,boxW,boxH,20);X.fillStyle='rgba(5,10,28,.97)';X.fill();X.strokeStyle='rgba(139,232,255,.78)';X.lineWidth=2;X.stroke();
  X.strokeStyle='rgba(255,177,92,.72)';X.lineWidth=3;X.beginPath();X.moveTo(x+pad,y+2);X.lineTo(x+pad+92,y+2);X.stroke();
  T('CAPTURA REGISTRADA · FASE '+(currentBossIndex+1)+' / '+BOSSES.length,x+pad,y+38,13,'#8be8ff','left','600 13px system-ui,sans-serif');
  const imageX=x+pad,imageY=y+76,imageW=boxW*.39,imageH=boxH*.60;
  X.fillStyle='#070a18';X.fillRect(imageX,imageY,imageW,imageH);X.strokeStyle='rgba(139,232,255,.68)';X.lineWidth=1.5;X.strokeRect(imageX,imageY,imageW,imageH);
  if(!drawImageContained(img,imageX+7,imageY+7,imageW-14,imageH-14)){T('IMAGEM INDISPONÍVEL',imageX+imageW/2,imageY+imageH/2,12,'#a9b6d2','center','600 12px system-ui,sans-serif')}
  const textX=imageX+imageW+pad*.72,textW=x+boxW-pad-textX;
  T(data.rewardName,textX,y+108,cl(boxW*.027,18,24),'#ffe08a','left','700 '+cl(boxW*.027,18,24)+'px system-ui,sans-serif');
  const bodySize=cl(boxW*.018,13,17),bodyBottom=WR(data.context,textX,y+141,textW,bodySize*1.45,bodySize,'#d5e2f7');
  const detailY=Math.max(y+boxH*.68,Math.min(bodyBottom+18,y+boxH-112));
  T(captureAssisted?'FOCO ESTABILIZADO AUTOMATICAMENTE':'IMAGEM REGISTRADA COM FOCO ESTÁVEL',textX,detailY,11,'#8be8ff','left','600 11px system-ui,sans-serif');
  T('Crédito: '+data.credit,textX,detailY+23,10,'#a9b6d2','left','600 10px system-ui,sans-serif');
  X.restore();
  const buttonW=Math.min(boxW*.52,420),buttonH=42;
  drawMenuButton('reward:continue',continueControlText(),W/2-buttonW/2,y+boxH-buttonH-14,buttonW,buttonH,true,true);
}
function drawPlayerHudCard(p,i,focusLayout=false){
  const color=p.col||'#8be8ff',player='P'+(i+1),health=p.alive?'♥'.repeat(Math.max(0,p.hp)):'✖';
  const assignedPad=nP===1&&i===0&&!getController(0)?.connected&&getController(1)?.connected?getController(1):getController(i);
  const score='PTS: '+p.score+' · '+p.multiplier.toFixed(1)+'x';
  if(focusLayout){
    const x=202,y=10+i*52,w=152,h=48;
    X.save();roundedPanelPath(x,y,w,h,7);X.fillStyle='rgba(5,10,28,.92)';X.fill();X.strokeStyle=color;X.lineWidth=1.4;X.stroke();
    X.fillStyle=color;X.fillRect(x+5,y+7,2,h-14);
    T(player,x+10,y+13,10,color,'left','700 10px system-ui,sans-serif');
    X.font='12px Georgia,serif';X.textAlign='left';X.fillStyle=p.alive?'#ff5a6a':'#8a8492';X.fillText(health,x+31,y+14);
    T(assignedPad?.connected?'PAD':lastInputDevice==='touch'?'TOQUE':'TECLADO',x+114,y+13,7,'#a9b6d2','left','700 7px system-ui,sans-serif');
    T(score,x+8,y+27,8,'#ffd34d','left','700 8px system-ui,sans-serif');
    T(p.mode?'ROMAN':'HUBBLE',x+8,y+42,8,'#efe2c2','left','700 8px system-ui,sans-serif');
    T('SUP',x+47,y+42,7,'#cbd7ed','left','700 7px system-ui,sans-serif');
    for(let k=0;k<5;k++){X.fillStyle=k<p.ex?'#ff7ad9':'rgba(255,255,255,.20)';X.fillRect(x+66+k*6,y+36,5,5)}
    if(p.boost>0)T('BOOST',x+92,y+42,7,'#8be8ff','left','700 7px system-ui,sans-serif');
    if(p.shield>0)T('SHIELD',x+117,y+42,7,'#ffd34d','left','700 7px system-ui,sans-serif');
    X.restore();return;
  }
  const x=14,y=10+i*53,w=332,h=48;
  X.save();roundedPanelPath(x,y,w,h,8);X.fillStyle='rgba(5,10,28,.72)';X.fill();X.strokeStyle='rgba(139,232,255,.18)';X.lineWidth=1;X.stroke();
  X.fillStyle=color;X.fillRect(x+1,y+8,3,h-16);
  T('JOGADOR '+(i+1)+' · '+player,x+10,y+17,10,color,'left','700 10px system-ui,sans-serif');
  X.font='17px Georgia,serif';X.textAlign='left';X.fillStyle=p.alive?'#ff5a6a':'#8a8492';X.fillText(health,x+100,y+18);
  T(score,x+178,y+17,10,'#ffd34d','left','700 10px system-ui,sans-serif');
  T('SUPER',x+10,y+39,8,'#cbd7ed','left','700 8px system-ui,sans-serif');
  for(let k=0;k<5;k++){X.fillStyle=k<p.ex?'#ff7ad9':'rgba(255,255,255,.20)';X.fillRect(x+49+k*10,y+33,8,6)}
  T(p.mode?'ROMAN':'HUBBLE',x+105,y+39,10,'#efe2c2','left','700 10px system-ui,sans-serif');
  if(p.boost>0)T('SPEED',x+177,y+39,8,'#8be8ff','left','700 8px system-ui,sans-serif');
  if(p.shield>0)T('SHIELD',x+232,y+39,8,'#ffd34d','left','700 8px system-ui,sans-serif');
  const inputBadge=assignedPad?.connected?'CONTROLE':lastInputDevice==='touch'?'TOQUE':'TECLADO';
  T(inputBadge,x+278,y+39,7,'#a9b6d2','left','700 7px system-ui,sans-serif');
  X.restore();
}
function hud(){
  if(['splash','mainmenu','modes','diff','codex','quit'].includes(scene)||(scene==='settings'&&previousScene==='mainmenu'))drawMenuBackdrop();
  if(scene==='splash'){drawSplash();return}
  if(scene==='mainmenu'){drawMainMenu();return}
  if(scene==='modes'){drawModes();return}
  if(scene==='diff'){drawDiff();return}
  if(scene==='codex'){drawCodex();return}
  if(scene==='settings'){drawSettings();return}
  if(scene==='pause'){drawPause();return}
  if(scene==='cheats'){drawCheats();return}
  if(scene==='quit'){drawQuit();return}
  if(scene=='intro'){drawPhaseIntro();return}
  if(scene=='ready'){T('ALVO '+(currentBossIndex+1)+' / '+BOSSES.length,W/2,H*.34,20,'#8be8ff','center','600 20px system-ui,sans-serif');T(BOSSES[currentBossIndex].name,W/2,H*.47,33,'#ffe08a','center');if(tm<.8)T('OBSERVAR!',W/2,H*.63,55,'#ff9a47','center');return}
  
  // Cartões identificados mantêm os dados de cada piloto agrupados.
  const focusHudLayout=!!focusMinigame?.active;
  P.forEach((p,i)=>drawPlayerHudCard(p,i,focusHudLayout));

  if(combo)T('ALINHADOS! TIRO COMBINADO DE ALTO DANO',W/2,H-60,18,'#8be8ff','center');
  const bw=380,bx=W/2-bw/2+70;X.fillStyle='rgba(0,0,0,.5)';X.fillRect(bx,16,bw,14);X.fillStyle='#ff9a47';X.fillRect(bx,16,bw*cl(B.hp/B.max,0,1),14);X.strokeStyle='#efe2c2';X.lineWidth=2;X.strokeRect(bx,16,bw,14);
  T(BOSSES[currentBossIndex].name+' · BOSS '+(currentBossIndex+1)+' / '+BOSSES.length+' · '+(hard?'ESPECIALISTA':'NORMAL'),bx,46,13,'#efe2c2');
  if(tipT>0&&scene=='play'){X.globalAlpha=cl(tipT,0,1);X.font='17px Georgia,serif';X.textAlign='center';X.fillStyle='#ffe08a';X.fillText(tip,W/2,H-28);X.globalAlpha=1}
  if(focusMinigame?.active)drawFocusMinigame();
  if(rewardNotice)drawRewardNotice();

  if(scene=='win'||scene=='lose'){
    panel();
    if(nP === 3){
      T('RESULTADO DO MODO VERSUS',W/2,105,32,'#ffb15c','center');
      T(winnerText,W/2,145,26,'#8be8ff','center');
      T('Tempo de Batalha: ' + finalBossTimeStr, W/2, 180, 18, '#efe2c2', 'center');
      T('PLACAR FINAL DA ARENA:',W/2,215,18,'#ffd34d','center');
      T('Jogador 1 (Laranja): '+(P[0]?P[0].score:0)+' PONTOS',W/2,250,20,'#ff9a47','center');
      T('Jogador 2 (Verde): '+(P[1]?P[1].score:0)+' PONTOS',W/2,285,20,'#4fd8c4','center');
      T(useGamepadHints()?controllerActionName('confirm')+' PARA VOLTAR AO MENU':lastInputDevice==='touch'?'TOQUE PARA VOLTAR AO MENU':'ENTER PARA VOLTAR AO MENU',W/2,H-70,20,'#ffe08a','center');
      drawMenuButton('back:main','MENU PRINCIPAL',370,H-52,220,38,false,true);
    } else {
      T(scene==='win'?'IMAGEM NÍTIDA!':'IMAGEM BORRADA…',W/2,110,40,scene==='win'?'#ffb15c':'#ff5a6a','center');
      const g=hits==0&&clock<80?'S':hits<=2?'A':'B';
      T('Nota '+g+' · Pontuação Total: '+(P[0]?P[0].score:0),W/2,155,24,'#8be8ff','center');
      T('Tempo de Batalha: ' + finalBossTimeStr, W/2, 190, 18, '#ffd34d', 'center');
      let y=WR('Carta Estelar: O telescópio Roman investiga a energia escura e exoplanetas com um campo de visão 100 vezes maior que o Hubble.',100,225,W-200,22,16);
      T(useGamepadHints()?controllerActionName('confirm')+' PARA VOLTAR':lastInputDevice==='touch'?'TOQUE PARA VOLTAR':'ENTER PARA VOLTAR',W/2,H-70,20,'#ffe08a','center');
      drawMenuButton('back:main','MENU PRINCIPAL',370,H-52,220,38,false,true);
    }
  }
}

let gpPrev=[{},{}],gpMenuPrev={Enter:false,Escape:false},remapGuard=[null,null];
function getControllerPads(){try{return navigator.getGamepads?Array.from(navigator.getGamepads()):[]}catch{return []}}
function getController(player){const pad=getControllerPads()[player];return pad?.connected?pad:null}
function isControllerConnected(){return getControllerPads().some(gp=>gp?.connected)}
function connectedControllerCount(){return getControllerPads().filter(gp=>gp?.connected).length}
function playerControlGuide(player){
  const assignedPlayer=nP===1&&player===0&&!getController(0)?.connected&&getController(1)?.connected?1:player;
  const pad=getController(assignedPlayer);
  if(pad?.connected&&useGamepadHints())return {move:'ANALÓGICO ESQUERDO / DIRECIONAL',fire:gamepadButtonName(gamepadBindings[assignedPlayer].fire,pad),mode:gamepadButtonName(gamepadBindings[assignedPlayer].mode,pad),super:gamepadButtonName(gamepadBindings[assignedPlayer].super,pad)};
  if(lastInputDevice==='touch')return {move:'TOQUE / ANALÓGICO NA TELA',fire:'BOTÃO TIRO',mode:'BOTÃO MODO',super:'BOTÃO ESPECIAL'};
  return {move:player===0?'WASD / SETAS / TOQUE':'SETAS',fire:player===0?'J / ESPAÇO':'VÍRGULA / NUMPAD 0',mode:player===0?'K':'PONTO / NUMPAD .',super:player===0?'L':'ENTER'};
}
function controllerFamily(gp){
  const id=(gp?.id||'').toLowerCase();
  if(/playstation|sony|dualshock|dualsense|054c/.test(id))return 'playstation';
  if(/nintendo|switch|joy.con|057e/.test(id))return 'switch';
  if(/xbox|microsoft|045e/.test(id))return 'xbox';
  return 'generic';
}
function gamepadButtonName(index,gp){
  const family=controllerFamily(gp),names={
    xbox:['A','B','X','Y','LB','RB','LT','RT','VIEW','START','LS','RS','↑','↓','←','→'],
    playstation:['×','○','□','△','L1','R1','L2','R2','SHARE','OPTIONS','L3','R3','↑','↓','←','→'],
    switch:['B','A','Y','X','L','R','ZL','ZR','−','+','L3','R3','↑','↓','←','→'],
    generic:Array.from({length:16},(_,i)=>`BOTÃO ${i+1}`)
  };
  return names[family][index]||`BOTÃO ${index+1}`;
}
function saveGamepadBindings(){try{localStorage.setItem('snct-gamepad-bindings',JSON.stringify(gamepadBindings))}catch{}}
function pollGP(){
  const pads=getControllerPads();
  let confirmPressed=false,pausePressed=false;
  for(let i=0;i<2;i++){
    const gp=pads[i];if(!gp||!gp.connected){for(const code in gpPrev[i])if(gpPrev[i][code])K[code]=0;gpPrev[i]={};remapGuard[i]=null;continue}
    const setK=(c,p)=>{const pr=gpPrev[i][c];if(p&&!pr)K[c]=2;else if(p&&pr){if(K[c]!=2)K[c]=1}else if(!p&&pr)K[c]=0;gpPrev[i][c]=p;};
    const k=KEYS[i],b=gp.buttons,B=x=>b[x]&&b[x].pressed,ax=gp.axes,A=(x,d)=>ax[x]!==undefined&&(d<0?ax[x]<-0.4:ax[x]>0.4);
    let pressedButton=-1;
    for(let j=0;j<b.length;j++){const key='raw'+j,pressed=!!b[j]?.pressed;if(pressed&&!gpPrev[i][key])pressedButton=j;gpPrev[i][key]=pressed}
    if(pressedButton>=0||ax.some(value=>Math.abs(value)>.35)){lastInputDevice='gamepad';lastGamepadPlayer=i;unlockMusic()}
    if(remapGuard[i]!==null){if(B(remapGuard[i]))continue;remapGuard[i]=null}
    let remappingThisPad=scene==='settings'&&settingsTab==='controller'&&remapPending?.player===i;
    if(remappingThisPad&&pressedButton>=0){gamepadBindings[i][remapPending.action]=pressedButton;saveGamepadBindings();remapGuard[i]=pressedButton;remapPending=null}
    if(remappingThisPad)continue;
    setK(k.u,B(gamepadBindings[i].up)||A(1,-1));setK(k.d,B(gamepadBindings[i].down)||A(1,1));setK(k.l,B(gamepadBindings[i].left)||A(0,-1));setK(k.r,B(gamepadBindings[i].right)||A(0,1));
    setK(k.f,B(gamepadBindings[i].fire));setK(k.m,B(gamepadBindings[i].mode));setK(k.x,B(gamepadBindings[i].super));
    const canConfirm=scene!=='play'||!!rewardNotice;
    confirmPressed=confirmPressed||(canConfirm&&B(gamepadBindings[i].confirm));
    pausePressed=pausePressed||((scene==='play'||scene==='pause')&&(B(gamepadBindings[i].pause)||B(gamepadBindings[i].back)))||(scene!=='mainmenu'&&scene!=='play'&&scene!=='pause'&&B(gamepadBindings[i].back));
  }
  const setMenuK=(key,pressed)=>{const was=gpMenuPrev[key];if(pressed&&!was)K[key]=2;else if(pressed&&was&&K[key]!==2)K[key]=1;else if(!pressed&&was)K[key]=0;gpMenuPrev[key]=pressed};
  setMenuK('Enter',confirmPressed);setMenuK('Escape',pausePressed);
}

let last=performance.now(),lastRendered=last;
function loop(n){
  requestAnimationFrame(loop);
  const interval=settings.fps===0?0:1000/settings.fps;
  if(interval&&n-lastRendered<interval-.5)return;
  const dt=Math.min(.05,(n-last)/1000);last=n;lastRendered=n;t+=dt;
  pollGP();step(dt);draw();for(const k in K)if(K[k]===2)K[k]=1;
}
requestAnimationFrame(loop);
