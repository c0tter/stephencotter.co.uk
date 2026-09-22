'use strict';
// Career copy reflects the supplied CV and subsequent user corrections.
const chapters = [
 {title:'Fast start',company:'NCC Group',date:'2014–2016',metric:'Promoted within the first year',body:'Joined as the first graduate hired in two years and earned a promotion within the first year, selling cybersecurity services to senior technical buyers.'},
 {title:'Clean sweep',company:'NCC Group',date:'2015/16',metric:'New Business Sales Person of the Year',body:'Named New Business Sales Person of the Year 2015/16 and the only person on the team to hit every KPI. Sold penetration testing, incident response and ISO 27001 services.'},
 {title:'Player one',company:'usecure',date:'2016–2019',metric:'Employee #1 · Founding Account Executive',body:'The company’s first salesperson, working alongside the CEO. Took security-awareness software to SMB, mid-market and enterprise buyers worldwide.'},
 {title:'Built from zero',company:'usecure',date:'2016–2019',metric:'Zero MRR → a team of 25',body:'Grew revenue from zero MRR. The revenue supported an investment round, and the company grew from two people to a team of 25 by the time I left.'},
 {title:'Beyond the close',company:'usecure',date:'2016–2019',metric:'Learned the whole revenue motion',body:'Taught myself marketing and demand generation while growing the company. Those skills became the foundation for my next role in growth leadership.'},
 {title:'Level up',company:'bant.io',date:'2019–2021',metric:'Account Executive → Head of Growth',body:'Joined as an Account Executive and was promoted to Head of Growth on the strength of the marketing skills developed at usecure. Owned the commercial funnel end to end.'},
 {title:'Four times the momentum',company:'bant.io',date:'2019–2021',metric:'4× monthly recurring revenue',body:'Quadrupled a stagnated MRR over two years and ran the systems, reporting and processes behind the commercial funnel. The company was acquired in 2021.'},
 {title:'Doors opened',company:'Synthesia · Partnerships',date:'2021–2023',metric:'Oracle Analytics + SAP',body:'Built the partnerships motion from nothing, landing Oracle Analytics and SAP after joining Synthesia at Series A.'},
 {title:'Opportunity unlocked',company:'Synthesia · Partnerships',date:'2021–2023',metric:'~$200K licensing deal',body:'Turned an API opportunity that arrived as a partnership conversation into a licensing deal of approximately $200K, while the API itself was a candidate for deprecation.'},
 {title:'The call-up',company:'Synthesia',date:'2023',metric:'Recruited into sales by a VP',body:'The licensing deal demonstrated what I could do commercially. A VP recruited me from partnerships into the sales team on the strength of that deal.'},
 {title:'Three-year streak',company:'Synthesia · Account Executive',date:'2023–2026',metric:'#1 on the team · three years running',body:'Highest-selling rep on the team for three consecutive years, delivering 137%, 125% and 120% of annual target across emerging, mid-market and enterprise accounts.'},
 {title:'All the way to close',company:'Synthesia · Account Executive',date:'2023–2026',metric:'Full enterprise sales cycles',body:'Owned deals from prospecting through security and IT review, procurement, legal and close. Worked across L&D, marketing, IT and executive stakeholders.'},
 {title:'Show, don’t tell',company:'Synthesia · Account Executive',date:'2023–2026',metric:'Technical demos, tailored to the buyer',body:'Ran my own technical demos end to end, shaped around each account’s stated problems rather than a canned script. My approach is to show the product doing the buyer’s job.'},
 {title:'Room to grow',company:'Synthesia · Account Executive',date:'2023–2026',metric:'From one use case to a platform',body:'Sold the product as it expanded from a single-use-case tool into a platform spanning video, an AI assistant and translation/localisation. Built experience in expansion and multi-product adoption.'},
 {title:'Through the growth stages',company:'Synthesia',date:'2021–2026',metric:'Series A → Series E',body:'Joined Synthesia at Series A and left at Series E. Progressed from building partnerships to leading my team in sales, gaining first-hand experience of selling through several stages of company growth.'}
];
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,total=chapters.length;
let W=960,H=440,ground=398,state='ready',unlocked=0,score=0,revealAll=false;
let pipes=[],bird={x:210,y:190,v:0},distance=0,last=0,clock=0;
let toastQueue=[],toastRemaining=0,toastActive=false;
const birdPixels=['.....kkkkkk.....','...kkyyyyyykk...','..kyyyyywwwwk...','.kyyyyywwwwwwk..','.kyyyyywwkwwwk..','kyyyyyywwkwwwk..','kyyyyyyywwwwwk..','kyyyyyyyyykkkkkk','.kyyyyyykkrrrrrk','..kyyyyyykkkkkk.','...kkoooookk....','.....kkkkk......'];
const palette={k:'#393629',y:'#f6cf42',w:'#fffced',r:'#e57940',o:'#eaaa32'};
function fit(){const r=canvas.getBoundingClientRect();W=Math.max(280,Math.round(r.width));H=Math.round(r.height);ground=H-42;canvas.width=W;canvas.height=H;ctx.imageSmoothingEnabled=false;bird.x=Math.round(W*.24);if(state==='playing')pause();if(state==='ready')bird.y=H*.44;}
new ResizeObserver(fit).observe(canvas);
function refresh(){
 $('score').textContent=score;$('count').textContent=`${unlocked} / ${total}`;
 $('journal-status').textContent=unlocked===total?`All ${total} earned. Keep flying for a higher score.`:`${unlocked} of ${total} trophies earned${revealAll?' · All highlights available':''}`;
 // Completion is earned through play; browsing stories does not unlock it.
 $('completion').hidden=unlocked<total;
 const openStories=new Set(Array.from($('milestones').querySelectorAll('details[open]')).map(d=>d.dataset.chapter));
 $('milestones').replaceChildren(...chapters.map((c,i)=>{const el=document.createElement('article'),earned=i<unlocked,visible=earned||revealAll;el.className='chapter '+(earned?'earned':visible?'available':'locked');el.innerHTML=`<div class="chapter-top"><span class="award-symbol" aria-hidden="true"></span><span class="num">${String(i+1).padStart(2,'0')} / ${earned?'EARNED':visible?'READ AHEAD':'TO COLLECT'}</span></div><h3>${c.title}</h3><p class="company">${c.company}<br>${c.date}</p>${visible?`<p class="achievement">${c.metric}</p><details data-chapter="${i}"${openStories.has(String(i))?' open':''}><summary>Read the story</summary><p>${c.body}</p></details>`:''}`;return el;}));
}
function overlay(label,title,copy,button){$('overlay-label').textContent=label;$('overlay-title').textContent=title;$('overlay-copy').textContent=copy;$('action').textContent=button;$('overlay-tip').textContent='SPACE, ↑ OR TAP TO FLAP';$('overlay').hidden=false;$('pause').disabled=true;$('action').focus({preventScroll:true});}
function resetRun(){score=0;pipes=[];bird={x:Math.round(W*.24),y:ground*.48,v:-90};addPipe(W+60);refresh();}
function addPipe(x){const gap=$('assist').checked?190:145;const center=ground*.49+Math.sin((score+pipes.length)*1.45)*Math.min(45,ground*.1);pipes.push({x,width:58,center,gap,passed:false});}
function play(){state='playing';$('overlay').hidden=true;$('pause').disabled=false;canvas.focus({preventScroll:true});last=performance.now();}
function pause(){if(state!=='playing')return;state='paused';overlay('ON PAUSE','Take your time.','The trophies and your place in the flight are saved.','Keep flying →');}
function flap(){if(state==='playing')bird.v=-230;}
function crash(){state='crashed';overlay(`${score} ${score===1?'PIPE':'PIPES'} · ${unlocked} / ${total} TROPHIES`,'One more go?',unlocked===total?'That’s the full collection. Get in touch below if you’d like to talk about your team.':`Your ${unlocked} ${unlocked===1?'trophy is':'trophies are'} safe. Keep collecting on your next flight.`,'Fly again →');}
function showNextToast(){if(toastActive||!toastQueue.length)return;const i=toastQueue.shift(),c=chapters[i];$('toast-label').textContent=`Trophy unlocked · ${i+1} / ${total}`;$('toast-title').textContent=c.title;$('toast-detail').textContent=c.metric;$('trophy-toast').classList.remove('leaving');$('trophy-toast').hidden=false;toastRemaining=3.4;toastActive=true;}
function advanceToast(dt){if(!toastActive){showNextToast();return;}toastRemaining-=dt;if(toastRemaining<=.25)$('trophy-toast').classList.add('leaving');if(toastRemaining<=0){$('trophy-toast').hidden=true;toastActive=false;showNextToast();}}
function award(){if(unlocked>=total)return;toastQueue.push(unlocked++);refresh();showNextToast();}
$('action').onclick=()=>{if(state!=='paused')resetRun();play();};
$('pause').onclick=pause;
$('read').onclick=()=>{if(state==='playing')pause();revealAll=true;refresh();$('milestones').querySelectorAll('details').forEach(d=>d.open=true);$('journal-title').scrollIntoView({behavior:reduced?'instant':'smooth',block:'start'});};
$('assist').onchange=()=>{for(const pipe of pipes)pipe.gap=$('assist').checked?190:145;};
canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.focus({preventScroll:true});flap();});
document.addEventListener('keydown',e=>{if(e.repeat)return;if((e.code==='Space'||e.code==='ArrowUp')&&e.target===canvas){e.preventDefault();flap();}if((e.code==='KeyP'||e.code==='Escape')&&state==='playing'){e.preventDefault();pause();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
// Reading the CV or opening a contact link should not cause an unattended crash.
document.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{if(state==='playing')pause();}));
function rect(x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));}
function cloud(x,y){rect(x,y,72,18,'#f8fff0');rect(x+13,y-12,43,14,'#f8fff0');rect(x+25,y-20,21,9,'#f8fff0');rect(x-9,y+10,88,9,'#f8fff0');}
function pipeDraw(p){const top=p.center-p.gap/2,bottom=p.center+p.gap/2;for(const [y,h] of [[-3,top+3],[bottom,ground-bottom]]){rect(p.x,y,p.width,h,'#354c26');rect(p.x+3,y,p.width-6,h,'#79ac43');rect(p.x+7,y,8,h,'#c1df77');rect(p.x+18,y,4,h,'#9ac65b');rect(p.x+p.width-11,y,8,h,'#537d31');}for(const y of [top-22,bottom]){rect(p.x-5,y,p.width+10,23,'#354c26');rect(p.x-2,y+3,p.width+4,16,'#83b84a');rect(p.x+2,y+3,9,16,'#c1df77');rect(p.x+p.width-7,y+3,7,16,'#537d31');}}
function drawBird(){ctx.save();ctx.translate(Math.round(bird.x),Math.round(bird.y));ctx.rotate(state==='playing'?Math.max(-.3,Math.min(.8,bird.v/650)):-.1);const size=2.4;for(let y=0;y<birdPixels.length;y++)for(let x=0;x<birdPixels[y].length;x++){const color=palette[birdPixels[y][x]];if(color)rect((x-8)*size,(y-6)*size,size,size,color);}const wing=state==='playing'&&Math.floor(clock*9)%2===0?3:0;rect(-16,wing,14,3,'#393629');rect(-18,3+wing,3,5,'#393629');rect(-15,3+wing,12,5,'#fff0a6');rect(-15,8+wing,12,3,'#393629');ctx.restore();}
function draw(){rect(0,0,W,H,'#d8eee6');const offset=reduced?0:distance;for(let i=-1;i<Math.ceil(W/230)+1;i++)cloud(i*230-(offset*.16%230)+50,55+(i%2)*35);
for(let i=-1;i<W/65+1;i++){let x=i*65-(offset*.28%65),h=30+((i+10)%4)*10;rect(x,ground-h-25,47,h+25,'#bbd6c5');rect(x+6,ground-h-31,35,7,'#bbd6c5');for(let j=0;j<3;j++)rect(x+8+j*11,ground-h-17,5,7,'#d7e9d7');}
for(let i=-1;i<W/55+1;i++){let x=i*55-(offset*.4%55);rect(x,ground-22,56,22,'#b1cd79');rect(x+8,ground-31,40,10,'#b1cd79');rect(x+18,ground-37,20,7,'#b1cd79');}
pipes.forEach(pipeDraw);rect(0,ground,W,4,'#3c542e');rect(0,ground+4,W,12,'#9cc554');for(let x=-(offset%20);x<W;x+=20){rect(x,ground+5,10,5,'#c5e286');rect(x+10,ground+10,10,5,'#6d9a3d');}rect(0,ground+16,W,H-ground-16,'#ebddb0');rect(0,ground+16,W,3,'#9c8f62');drawBird();}
function tick(now){const dt=Math.min((now-last)/1000||0,.035);last=now;advanceToast(dt);if(state==='playing'){clock+=dt;const speed=$('assist').checked?125:150;distance+=speed*dt;bird.v+=590*dt;bird.y+=bird.v*dt;for(const p of pipes)p.x-=speed*dt;if(!pipes.length||pipes[pipes.length-1].x<W-300)addPipe(W+30);const hit=bird.y-12<0||bird.y+12>ground||pipes.some(p=>bird.x+15>p.x-5&&bird.x-15<p.x+p.width+5&&(bird.y-11<p.center-p.gap/2||bird.y+11>p.center+p.gap/2));if(hit)crash();else{for(const p of pipes){if(!p.passed&&p.x+p.width+5<bird.x-15){p.passed=true;score++;award();$('score').textContent=score;}}pipes=pipes.filter(p=>p.x+p.width>-10);}}draw();requestAnimationFrame(tick);}
fit();refresh();requestAnimationFrame(tick);
