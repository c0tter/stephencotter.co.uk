'use strict';
const chapters = [
  {
    "company": "NCC Group",
    "date": "2014–2016",
    "metric": "Starting in cybersecurity",
    "body": "I sold cybersecurity services to technical buyers and earned a promotion in my first year."
  },
  {
    "company": "NCC Group",
    "date": "2015/16",
    "metric": "Making my mark",
    "body": "I hit every KPI and won New Business Sales Person of the Year."
  },
  {
    "company": "usecure",
    "date": "2016–2019",
    "metric": "Taking the startup leap",
    "body": "I joined as the first employee and salesperson, working alongside the CEO."
  },
  {
    "company": "usecure",
    "date": "2016–2019",
    "metric": "Building from zero",
    "body": "I grew revenue from zero, helping support an investment round as the team grew from two to 25."
  },
  {
    "company": "bant.io",
    "date": "2019–2021",
    "metric": "Moving beyond sales",
    "body": "The marketing skills I developed at usecure helped me move from Account Executive to Head of Growth."
  },
  {
    "company": "bant.io",
    "date": "2019–2021",
    "metric": "Turning growth around",
    "body": "With responsibility for the whole commercial funnel, I quadrupled monthly recurring revenue in two years."
  },
  {
    "company": "Synthesia",
    "date": "2021–2023",
    "metric": "Opening new doors",
    "body": "I joined at Series A and built partnerships with Oracle Analytics and SAP."
  },
  {
    "company": "Synthesia",
    "date": "2021–2023",
    "metric": "A deal that changed my role",
    "body": "I closed a ~$200K licensing deal from partnerships. A VP then recruited me into sales."
  },
  {
    "company": "Synthesia",
    "date": "2023–2026",
    "metric": "Finding my stride",
    "body": "I became my team’s top-selling rep three years running: 137%, 125% and 120% of annual target."
  }
];
const $ = id => document.getElementById(id);
const canvas = $('game'), ctx = canvas.getContext('2d');
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = motionPreference.matches;
const total = chapters.length, H = 440, ground = H - 42, STEP = 1 / 120;
let W = 960, state = 'ready', unlocked = 0, score = 0;
let pipes = [], bird = {x: 210, y: ground * .48, v: 0}, particles = [];
let distance = 0, clock = 0, flightElapsed = 0, spawnIn = 0;
let runGoal = total, runStart = 0, finishX = 0, finishRemaining = 0, resumeState = 'playing';
let raf = null, last = 0, accumulator = 0;
let soundEnabled = false, audioContext = null;
const birdPixels = ['.....kkkkkk.....','...kkyyyyyykk...','..kyyyyywwwwk...','.kyyyyywwwwwwk..','.kyyyyywwkwwwk..','kyyyyyywwkwwwk..','kyyyyyyywwwwwk..','kyyyyyyyyykkkkkk','.kyyyyyykkrrrrrk','..kyyyyyykkkkkk.','...kkoooookk....','.....kkkkk......'];
const palette = {k:'#393629', y:'#f6cf42', w:'#fffced', r:'#e57940', o:'#eaaa32'};
const active = () => state === 'playing' || state === 'finishing';
function stopLoop() {
  if (raf !== null) cancelAnimationFrame(raf);
  raf = null; accumulator = 0;
}
function startLoop() {
  stopLoop(); last = performance.now(); raf = requestAnimationFrame(tick);
}
function refresh() {
  $('score').textContent = score;
  $('count').textContent = `${unlocked} / ${total}`;
}
function overlay(label, title, copy, button, focus = true) {
  $('overlay-label').textContent = label; $('overlay-title').textContent = title;
  $('overlay-copy').textContent = copy; $('action').textContent = button;
  $('overlay-tip').textContent = state === 'crashed' ? 'R TO RETRY · YOUR PROGRESS IS SAVED' : 'Full CV available to download';
  $('finish-contact').hidden = state !== 'complete';
  $('overlay').hidden = false; $('ready-hint').hidden = true;
  $('pause').disabled = true; canvas.tabIndex = -1;
  if (focus) (state === 'complete' ? $('finish-contact') : $('action')).focus({preventScroll:true});
}
function fit() {
  const width = Math.max(240, Math.round(canvas.getBoundingClientRect().width));
  if (width === W && canvas.width === W && canvas.height === H) return;
  const previousX = bird.x;
  W = width; canvas.width = W; canvas.height = H; ctx.imageSmoothingEnabled = false;
  bird.x = Math.round(W * .24);
  // Keep obstacles out of the bird on resize, without granting extra trophies.
  let nextX = bird.x + 190;
  for (const p of pipes) {
    if (p.passed) p.x = -p.width - 20;
    else { p.x = Math.max(nextX, p.x + bird.x - previousX); nextX = p.x + 580.5; }
  }
  bird.y = ground * .48; bird.v = 0;
  if (active()) pause(false);
  draw();
}
function gapSize(index) { return $('assist').checked ? (index < 3 ? 235 : 205) : 175; }
function addPipe(x) {
  const index = score + pipes.filter(p => !p.passed).length;
  pipes.push({x, width:58, center:ground*.49 + Math.sin(index*1.45)*(index<3?18:36), gap:gapSize(index), index, passed:false});
}
function arm() {
  stopLoop(); state = 'armed'; $('overlay').hidden = true;
  $('ready-hint').hidden = false; $('pause').disabled = true; canvas.tabIndex = 0;
  canvas.focus({preventScroll:true}); draw();
}
function restart() {
  const replay = unlocked === total;
  if (replay) flightElapsed = 0;
  score = 0; runStart = replay ? 0 : unlocked; runGoal = total - runStart;
  pipes = []; particles = []; spawnIn = 4.3;
  bird = {x:Math.round(W*.24), y:ground*.48, v:0};
  resumeState = 'playing'; state = 'armed';
  addPipe(bird.x + 330); refresh();
  $('arcade').scrollIntoView({block:'start', behavior:'instant'});
  arm();
}
function flap() {
  if (state === 'armed') {
    state = 'playing'; $('ready-hint').hidden = true; $('pause').disabled = false;
    bird.v = -230; startLoop();
  } else if (state === 'playing') bird.v = -230;
}
function pause(focus = true) {
  if (!active()) return;
  resumeState = state; state = 'paused'; stopLoop();
  overlay('ON PAUSE', 'Take your time.', 'Your flight is safe. Resume when you’re ready.', 'Resume flight →', focus);
  draw();
}
function resume() {
  if (resumeState === 'finishing') {
    state = 'finishing'; $('overlay').hidden = true; $('pause').disabled = false;
    canvas.tabIndex = 0; canvas.focus({preventScroll:true}); startLoop();
  } else arm();
}
function crash() {
  state = 'crashed'; stopLoop();
  overlay(`${unlocked} / ${total} CHAPTERS DISCOVERED`, 'Straight back in?', 'Your place in the story is saved. Pick up where you left off.', 'Retry →');
}
function beginFinish() {
  state = 'finishing'; pipes = []; bird.v = 0;
  finishX = W + 30; finishRemaining = 1.2;
}
function finish() {
  state = 'complete'; stopLoop(); refresh();
  overlay(`${total} CHAPTERS · ${Math.round(flightElapsed)}s FLYING`, 'That’s my story so far.', 'If my experience sounds useful to your team, let’s talk.', 'Play again →');
}
function chime() {
  if (!soundEnabled || !audioContext || audioContext.state !== 'running') return;
  const t = audioContext.currentTime;
  [659.25,830.61,987.77].forEach((hz,i) => {
    const tone = audioContext.createOscillator(), gain = audioContext.createGain();
    tone.type='sine'; tone.frequency.value=hz; gain.gain.setValueAtTime(0,t+i*.085);
    gain.gain.linearRampToValueAtTime(.045,t+i*.085+.012);
    gain.gain.exponentialRampToValueAtTime(.001,t+i*.085+.23);
    tone.connect(gain); gain.connect(audioContext.destination); tone.start(t+i*.085); tone.stop(t+i*.085+.25);
  });
}
function burst() {
  if (reduced) return;
  for(let i=0;i<12;i++) { const a=i*Math.PI/6; particles.push({x:bird.x+18,y:bird.y,vx:Math.cos(a)*65,vy:Math.sin(a)*65,life:.5}); }
}
function award() {
  const index = runStart + score - 1;
  if (index < 0 || index >= total) return;
  const c = chapters[index], earned = index >= unlocked;
  unlocked = Math.max(unlocked, index+1);
  $('toast-label').textContent = `${index+1} / ${total} · ${c.company} · ${c.date}`;
  $('toast-title').textContent = c.metric;
  $('toast-detail').textContent = c.body;
  $('trophy-toast').hidden = false; $('dock-caption').hidden = true;
  if (!reduced && $('trophy-toast').animate) $('trophy-toast').animate([{opacity:.3,transform:'translateX(12px)'},{opacity:1,transform:'translateX(0)'}], {duration:220});
  refresh(); chime();
}
$('action').onclick = () => state === 'paused' ? resume() : restart();
$('pause').onclick = () => pause();
$('assist').onchange = () => { pause(false); for(const p of pipes) p.gap=gapSize(p.index); draw(); };
$('sound').onclick = async () => {
  pause(false); soundEnabled = !soundEnabled;
  if(soundEnabled) {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if(!Audio) throw Error('Audio unavailable');
      audioContext = audioContext || new Audio(); await audioContext.resume();
    } catch { soundEnabled=false; $('sound').textContent='Sound unavailable'; $('sound').setAttribute('aria-pressed','false'); return; }
  }
  $('sound').textContent=soundEnabled?'Sound on':'Sound off';
  $('sound').setAttribute('aria-pressed',String(soundEnabled));
  if(soundEnabled) chime();
};
canvas.addEventListener('pointerdown', e => { e.preventDefault(); canvas.focus({preventScroll:true}); flap(); });
document.addEventListener('keydown', e => {
  if(e.repeat) return;
  if((e.code==='Space'||e.code==='ArrowUp') && e.target===canvas) {e.preventDefault(); flap();}
  if(e.code==='KeyR' && state==='crashed' && !e.target.matches('input,textarea,[contenteditable="true"]')) {e.preventDefault(); restart();}
  if((e.code==='KeyP'||e.code==='Escape') && active()) {e.preventDefault(); pause();}
});
document.addEventListener('focusin', e => { if(e.target!==canvas) pause(false); });
document.addEventListener('pointerdown', e => { if(e.target!==canvas) pause(false); }, true);
document.addEventListener('visibilitychange', () => { if(document.hidden) pause(false); });
window.addEventListener('blur', () => pause(false));
document.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>pause(false)));
new IntersectionObserver(entries => { if(entries[0].intersectionRatio < .85) pause(false); }, {threshold:[0,.85,1]}).observe(canvas);
new ResizeObserver(fit).observe(canvas);
motionPreference.addEventListener('change', e => { reduced=e.matches; if(reduced) particles=[]; draw(); });
$('copy-email').onclick = async () => {
  const email='stephencotter1990@gmail.com';
  try {
    await navigator.clipboard.writeText(email);
    $('copy-status').textContent='Email address copied.';
  } catch {
    // Local-file browsers may deny Clipboard API access. Provide a selected field.
    $('copy-fallback').hidden=false; $('copy-fallback').value=email;
    $('copy-fallback').focus(); $('copy-fallback').select();
    $('copy-status').textContent='Press Ctrl+C (or Command+C) to copy the selected address.';
  }
};
function step(dt) {
  clock+=dt; flightElapsed+=dt; distance+=135*dt;
  for(const p of particles) {p.x+=p.vx*dt; p.y+=p.vy*dt; p.life-=dt;}
  particles=particles.filter(p=>p.life>0);
  if(state==='finishing') {
    finishRemaining-=dt; finishX=bird.x+(W+30-bird.x)*Math.max(0,finishRemaining/1.2);
    bird.y+=(ground*.48-bird.y)*Math.min(1,dt*3);
    if(finishRemaining<=0) finish();
    return;
  }
  bird.v+=590*dt; bird.y+=bird.v*dt;
  for(const p of pipes) p.x-=135*dt;
  spawnIn-=dt;
  if(spawnIn<=0 && score+pipes.filter(p=>!p.passed).length<runGoal) {
    const latest=pipes[pipes.length-1]; addPipe(latest ? latest.x+580.5 : bird.x+330); spawnIn+=4.3;
  }
  const hit=bird.y-12<0 || bird.y+12>ground || pipes.some(p=>bird.x+15>p.x-5 && bird.x-15<p.x+p.width+5 && (bird.y-11<p.center-p.gap/2 || bird.y+11>p.center+p.gap/2));
  if(hit) {crash(); return;}
  for(const p of pipes) if(!p.passed && p.x+p.width+5<bird.x-15) {p.passed=true;score++;burst();award();}
  pipes=pipes.filter(p=>p.x+p.width>-10);
  if(score>=runGoal) beginFinish();
}
function tick(now) {
  raf=null;
  if(!active()) return;
  const elapsed=Math.max(0,(now-last)/1000); last=now;
  // A suspended tab or severe stall pauses safely instead of teleporting the bird.
  if(elapsed>.25) {pause(false); return;}
  accumulator+=elapsed;
  while(accumulator>=STEP && active()) {accumulator-=STEP; step(STEP);}
  draw();
  if(active()) raf=requestAnimationFrame(tick);
}
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function cloud(x,y){rect(x,y,72,18,'#f8fff0');rect(x+13,y-12,43,14,'#f8fff0');rect(x+25,y-20,21,9,'#f8fff0');rect(x-9,y+10,88,9,'#f8fff0');}
function pipeDraw(p){const top=p.center-p.gap/2,bottom=p.center+p.gap/2;for(const [y,h] of [[-3,top+3],[bottom,ground-bottom]]){rect(p.x,y,p.width,h,'#354c26');rect(p.x+3,y,p.width-6,h,'#79ac43');rect(p.x+7,y,8,h,'#c1df77');rect(p.x+18,y,4,h,'#9ac65b');rect(p.x+p.width-11,y,8,h,'#537d31');}for(const y of [top-22,bottom]){rect(p.x-5,y,p.width+10,23,'#354c26');rect(p.x-2,y+3,p.width+4,16,'#83b84a');rect(p.x+2,y+3,9,16,'#c1df77');rect(p.x+p.width-7,y+3,7,16,'#537d31');}}
function drawBird(){ctx.save();ctx.translate(Math.round(bird.x),Math.round(bird.y));ctx.rotate(state==='playing'?Math.max(-.3,Math.min(.8,bird.v/650)):-.1);const size=2.4;for(let y=0;y<birdPixels.length;y++)for(let x=0;x<birdPixels[y].length;x++){const color=palette[birdPixels[y][x]];if(color)rect((x-8)*size,(y-6)*size,size,size,color);}const wing=state==='playing'&&Math.floor(clock*9)%2===0?3:0;rect(-16,wing,14,3,'#393629');rect(-18,3+wing,3,5,'#393629');rect(-15,3+wing,12,5,'#fff0a6');rect(-15,8+wing,12,3,'#393629');ctx.restore();}
function draw(){rect(0,0,W,H,'#d8eee6');const offset=reduced?0:distance;for(let i=-1;i<Math.ceil(W/230)+1;i++)cloud(i*230-(offset*.16%230)+50,55+(i%2)*35);
for(let i=-1;i<W/65+1;i++){let x=i*65-(offset*.28%65),h=30+((i+10)%4)*10;rect(x,ground-h-25,47,h+25,'#bbd6c5');rect(x+6,ground-h-31,35,7,'#bbd6c5');for(let j=0;j<3;j++)rect(x+8+j*11,ground-h-17,5,7,'#d7e9d7');}
for(let i=-1;i<W/55+1;i++){let x=i*55-(offset*.4%55);rect(x,ground-22,56,22,'#b1cd79');rect(x+8,ground-31,40,10,'#b1cd79');rect(x+18,ground-37,20,7,'#b1cd79');}
pipes.forEach(pipeDraw);if(state==='finishing'||(state==='paused'&&resumeState==='finishing')){rect(finishX,35,4,ground-35,'#393629');for(let y=40;y<112;y+=12)for(let x=0;x<48;x+=12)rect(finishX+x,y,12,12,((x+y-40)/12)%2?'#fffced':'#393629');}rect(0,ground,W,4,'#3c542e');rect(0,ground+4,W,12,'#9cc554');for(let x=-(offset%20);x<W;x+=20){rect(x,ground+5,10,5,'#c5e286');rect(x+10,ground+10,10,5,'#6d9a3d');}rect(0,ground+16,W,H-ground-16,'#ebddb0');rect(0,ground+16,W,3,'#9c8f62');drawBird();for(const p of particles){ctx.globalAlpha=p.life*2;rect(p.x,p.y,4,4,'#fff0a6');}ctx.globalAlpha=1;}


fit(); refresh(); draw();
