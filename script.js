const KEY='borrowhub-v2',DAY=864e5;
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const off=n=>ymd(new Date(Date.now()+n*DAY));
const fmt=s=>new Date(s+'T00:00').toLocaleDateString('en',{month:'short',day:'numeric',year:'numeric'});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ini=n=>n.split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase();
const $=id=>document.getElementById(id);

function seed(){return{
 items:[{id:1,name:'Laptop',icon:'💻',cat:'Computer equipment',total:10},{id:2,name:'Projector',icon:'📽️',cat:'Presentation equipment',total:5},{id:3,name:'Digital Camera',icon:'📷',cat:'Photography equipment',total:3},{id:4,name:'Microphone',icon:'🎤',cat:'Audio equipment',total:6},{id:5,name:'Extension Cord',icon:'🔌',cat:'Electrical',total:12}],
 people:[{id:'BH-001',name:'Juan Dela Cruz',email:'juan@email.com'},{id:'BH-002',name:'Maria Santos',email:'maria@email.com'},{id:'BH-003',name:'Pedro Reyes',email:'pedro@email.com'},{id:'BH-004',name:'Ana Lopez',email:'ana@email.com'}],
 tx:[{id:1001,who:'BH-001',item:1,qty:2,out:off(-2),due:off(4),ret:null},{id:1002,who:'BH-002',item:2,qty:1,out:off(-3),due:off(2),ret:off(-1)},{id:1003,who:'BH-003',item:3,qty:1,out:off(-6),due:off(-2),ret:null},{id:1004,who:'BH-004',item:4,qty:2,out:off(-9),due:off(-4),ret:null},{id:1005,who:'BH-001',item:5,qty:3,out:off(-12),due:off(-5),ret:off(-5)},{id:1006,who:'BH-002',item:1,qty:1,out:off(-1),due:off(1),ret:null}]}}
let S;
function load(){try{const r=localStorage.getItem(KEY);if(r)return JSON.parse(r)}catch(e){}return seed()}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}

const item=id=>S.items.find(i=>i.id==id),person=id=>S.people.find(p=>p.id==id);
const status=t=>t.ret?'returned':(t.due<ymd(new Date())?'overdue':'borrowed');
const daysLate=t=>Math.round((new Date(ymd(new Date())+'T00:00')-new Date(t.due+'T00:00'))/DAY);
const out=i=>S.tx.filter(t=>!t.ret&&t.item==i.id).reduce((a,t)=>a+t.qty,0);
const avail=i=>i.total-out(i);
const badge=s=>`<span class="badge b-${s}">${s[0].toUpperCase()+s.slice(1)}</span>`;
const who=n=>`<div class="who2"><div class="av" style="width:32px;height:32px;font-size:11px">${ini(n)}</div>${esc(n)}</div>`;

function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('show'),2600)}

const titles={dashboard:['Dashboard','Welcome back to BorrowHub'],items:['Items','Manage inventory'],borrowers:['Members','Manage registered members'],transactions:['Loans','Borrowing and returning history']};
function show(p){
 document.querySelectorAll('.page').forEach(e=>e.classList.toggle('on',e.id===p));
 document.querySelectorAll('.nav[data-p]').forEach(e=>e.classList.toggle('on',e.dataset.p===p));
 $('title').textContent=titles[p][0];$('sub').textContent=titles[p][1];
}

function render(){
 const act=S.tx.filter(t=>!t.ret),over=act.filter(t=>status(t)==='overdue');
 const total=S.items.reduce((a,i)=>a+i.total,0),bor=act.reduce((a,t)=>a+t.qty,0);
 $('stats').innerHTML=[['Total items',total,'📦',''],['Available',total-bor,'✓','ok'],['Borrowed',bor,'↗',''],['Overdue',over.length,'!','bad']].map(([l,v,i,c])=>`<div class="card stat ${c}"><div><span>${l}</span><h2>${v}</h2></div><div class="ic">${i}</div></div>`).join('');
 const nb=$('navOver');nb.hidden=!over.length;nb.textContent=over.length;
 const soon=ymd(new Date(Date.now()+2*DAY));
 const need=act.filter(t=>t.due<=soon).sort((a,b)=>a.due.localeCompare(b.due));
 $('attn').innerHTML=need.length?need.map(t=>{const s=status(t);return`<tr><td>${who(person(t.who).name)}</td><td>${esc(item(t.item).name)} ×${t.qty}</td><td>${fmt(t.due)}${s==='overdue'?`<span class="late">${daysLate(t)} day(s) late</span>`:''}</td><td>${badge(s)}</td><td><button class="btn sm ghost" data-r="${t.id}">Mark returned</button></td></tr>`}).join(''):'<tr><td colspan="5" class="empty">Nothing overdue or due soon. Nice work.</td></tr>';
 renderItems();
 $('people').innerHTML=S.people.map(p=>{const n=act.filter(t=>t.who===p.id).length,o=over.some(t=>t.who===p.id);return`<tr><td>${who(p.name)}</td><td>${esc(p.id)}</td><td>${esc(p.email)}</td><td>${n}</td><td>${badge(o?'overdue':'returned').replace(/>(Overdue|Returned)</,o?'>Has overdue<':'>Good standing<')}</td></tr>`}).join('');
 renderTx();renderSite();
}
function renderItems(){
 const q=$('iq').value.toLowerCase();
 const l=S.items.filter(i=>i.name.toLowerCase().includes(q));
 $('itemGrid').innerHTML=l.length?l.map(i=>{const a=avail(i);return`<div class="card item"><div class="pic">${i.icon}</div><h3>${esc(i.name)}</h3><p>${esc(i.cat)}</p><div class="row"><span>Available</span><strong>${a} / ${i.total}</strong></div><div class="meter"><div style="width:${a/i.total*100}%"></div></div><button class="btn" data-b="${i.id}" ${a?'':'disabled'}>${a?'Borrow':'None available'}</button></div>`}).join(''):'<div class="empty">No items match your search.</div>';
}
function renderTx(){
 const q=$('tq').value.toLowerCase(),f=$('ts').value;
 const l=S.tx.slice().reverse().filter(t=>(!f||status(t)===f)&&(person(t.who).name+' '+item(t.item).name).toLowerCase().includes(q));
 $('txs').innerHTML=l.length?l.map(t=>{const s=status(t);return`<tr><td>#BH-${t.id}</td><td>${who(person(t.who).name)}</td><td>${esc(item(t.item).name)}</td><td>${t.qty}</td><td>${fmt(t.out)}</td><td>${fmt(t.due)}${s==='overdue'?`<span class="late">${daysLate(t)} day(s) late</span>`:''}</td><td>${badge(s)}</td><td>${t.ret?'':`<button class="btn sm ghost" data-r="${t.id}">Mark returned</button>`}</td></tr>`}).join(''):'<tr><td colspan="8" class="empty">No transactions match.</td></tr>';
}

/* forms */
let onSave=null;
function openForm(title,sub,fields,label,fn){
 $('mt').textContent=title;$('mp').textContent=sub;$('ok').textContent=label;$('err').textContent='';
 $('fields').innerHTML=fields.map(f=>`<label for="f_${f.id}">${f.label}</label>`+(f.opts?`<select id="f_${f.id}"><option value="">Select…</option>${f.opts.map(o=>`<option value="${esc(o[0])}" ${String(o[0])===String(f.val)?'selected':''}>${esc(o[1])}</option>`).join('')}</select>`:f.area?`<textarea id="f_${f.id}" rows="2" placeholder="Optional"></textarea>`:`<input id="f_${f.id}" type="${f.type||'text'}" value="${f.val??''}" ${f.min?`min="${f.min}"`:''}>`)).join('');
 onSave=()=>{const v={};fields.forEach(f=>v[f.id]=$('f_'+f.id).value.trim());return fn(v)};
 $('modal').classList.add('show');const first=$('fields').querySelector('input,select');first&&first.focus();
}
const close=()=>$('modal').classList.remove('show');
$('cancel').onclick=close;
$('modal').addEventListener('click',e=>{if(e.target===$('modal'))close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
$('form').addEventListener('submit',e=>{e.preventDefault();const m=onSave();if(m)$('err').textContent=m;else{close();save();render()}});

function borrowForm(itemId){
 openForm('Borrow item','Create a new borrowing transaction',[
  {id:'who',label:'Borrower',opts:S.people.map(p=>[p.id,p.name])},
  {id:'item',label:'Item',opts:S.items.map(i=>[i.id,`${i.name} (${avail(i)} available)`]),val:itemId},
  {id:'qty',label:'Quantity',type:'number',val:1,min:1},
  {id:'due',label:'Due date',type:'date',val:off(7),min:ymd(new Date())},
  {id:'note',label:'Notes',area:1}],'Confirm borrowing',v=>{
  if(!v.who||!v.item||!v.due)return'Choose a borrower, an item and a due date.';
  const it=item(v.item),q=parseInt(v.qty,10);
  if(!(q>=1))return'Quantity must be at least 1.';
  if(q>avail(it))return`Only ${avail(it)} ${it.name}(s) available. Lower the quantity.`;
  if(v.due<ymd(new Date()))return'Due date cannot be in the past.';
  S.tx.push({id:Math.max(1000,...S.tx.map(t=>t.id))+1,who:v.who,item:+v.item,qty:q,out:ymd(new Date()),due:v.due,ret:null});
  toast(`${person(v.who).name} borrowed ${q} × ${it.name}`);});
}
function itemForm(){openForm('Add item','Add equipment to the inventory',[{id:'name',label:'Item name'},{id:'icon',label:'Emoji icon',val:'📦'},{id:'cat',label:'Category'},{id:'total',label:'Total quantity',type:'number',val:1,min:1}],'Save item',v=>{
 if(!v.name)return'Enter an item name.';if(S.items.some(i=>i.name.toLowerCase()===v.name.toLowerCase()))return'That item already exists.';
 const n=parseInt(v.total,10);if(!(n>=1))return'Total quantity must be at least 1.';
 S.items.push({id:Math.max(0,...S.items.map(i=>i.id))+1,name:v.name,icon:v.icon||'📦',cat:v.cat||'General',total:n});toast(`${v.name} added to inventory`);});}
function personForm(){openForm('Add borrower','Register a new borrower',[{id:'name',label:'Full name'},{id:'email',label:'Email',type:'email'}],'Save borrower',v=>{
 if(!v.name)return'Enter the borrower’s name.';if(!/^\S+@\S+\.\S+$/.test(v.email))return'Enter a valid email address.';
 const id='BH-'+String(S.people.length+1).padStart(3,'0');S.people.push({id,name:v.name,email:v.email});toast(`${v.name} registered as ${id}`);});}


let curCat='All';
function renderSite(){
 $('latest').innerHTML=S.tx.slice(-4).reverse().map(t=>`<li><strong>${esc(person(t.who).name.split(' ')[0])}</strong> borrowed “${esc(item(t.item).name)}”<small>${fmt(t.out)}</small></li>`).join('');
 const cats=['All',...new Set(S.items.map(i=>i.cat))];
 $('chips').innerHTML=cats.map(c=>`<button class="chip ${c===curCat?'on':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
 const q=$('cq').value.toLowerCase(),l=S.items.filter(i=>(curCat==='All'||i.cat===curCat)&&i.name.toLowerCase().includes(q));
 $('cat').innerHTML=l.length?l.map(i=>{const a=avail(i);return`<div class="card item"><div class="pic">${i.icon}</div><h3>${esc(i.name)}</h3><p>${esc(i.cat)}</p><div class="row"><span>${a?'Available':'On loan'}</span><strong>${a} / ${i.total}</strong></div><div class="meter"><div style="width:${a/i.total*100}%"></div></div><button class="btn" data-rv="${i.id}" ${a?'':'disabled'}>${a?'Borrow':'Not available'}</button></div>`}).join(''):'<div class="empty">Nothing matches your search.</div>';
}
function reserveForm(id){const it=item(id);openForm('Borrow '+it.name,'Tell us who you are and when you will return it',[
 {id:'name',label:'Your name'},{id:'email',label:'Email',type:'email'},{id:'qty',label:'Quantity',type:'number',val:1,min:1},{id:'due',label:'Return by',type:'date',val:off(7),min:ymd(new Date())}],'Confirm',v=>{
 if(!v.name)return'Enter your name.';if(!/^\S+@\S+\.\S+$/.test(v.email))return'Enter a valid email address.';
 const q=parseInt(v.qty,10);if(!(q>=1))return'Quantity must be at least 1.';if(q>avail(it))return`Only ${avail(it)} available. Lower the quantity.`;
 if(!v.due||v.due<ymd(new Date()))return'Choose a return date from today onward.';
 let p=S.people.find(x=>x.email.toLowerCase()===v.email.toLowerCase());
 if(!p){p={id:'BH-'+String(S.people.length+1).padStart(3,'0'),name:v.name,email:v.email};S.people.push(p)}
 S.tx.push({id:Math.max(1000,...S.tx.map(t=>t.id))+1,who:p.id,item:it.id,qty:q,out:ymd(new Date()),due:v.due,ret:null});
 toast(`Done. Bring ${it.name} back by ${fmt(v.due)}`);});}
$('cq').oninput=renderSite;
/* events */
document.addEventListener('click',e=>{
 const t=e.target.closest('button');if(!t)return;
 if(t.dataset.p)show(t.dataset.p);
 if(t.dataset.go){document.body.classList.toggle('auth',t.dataset.go==='1');window.scrollTo(0,0);if(t.dataset.go==='1')$('u').focus()}
 if(t.dataset.rv)reserveForm(t.dataset.rv);
 if(t.dataset.cat){curCat=t.dataset.cat;renderSite()}
 if(t.dataset.a==='borrow')borrowForm();
 if(t.dataset.a==='item')itemForm();
 if(t.dataset.a==='person')personForm();
 if(t.dataset.b)borrowForm(t.dataset.b);
 if(t.dataset.r){const x=S.tx.find(y=>y.id==t.dataset.r);x.ret=ymd(new Date());save();render();toast(`${item(x.item).name} returned by ${person(x.who).name}`)}
});
$('iq').oninput=renderItems;$('tq').oninput=renderTx;$('ts').onchange=renderTx;
$('resetBtn').onclick=()=>{S=seed();save();render();toast('Demo data restored')};
$('csv').onclick=()=>{
 const rows=[['ID','Borrower','Item','Qty','Borrowed','Due','Returned','Status'],...S.tx.map(t=>['BH-'+t.id,person(t.who).name,item(t.item).name,t.qty,t.out,t.due,t.ret||'',status(t)])];
 const b=new Blob([rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')],{type:'text/csv'});
 const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='borrowhub-transactions.csv';a.click();
};
const USERS={admin:'admin123'};
function enter(u){document.body.classList.remove('auth');document.body.classList.add('in');try{sessionStorage.setItem('bh-user',u)}catch(e){}show('dashboard');window.scrollTo(0,0)}
$('lf').addEventListener('submit',e=>{e.preventDefault();const u=$('u').value.trim().toLowerCase(),p=$('pw').value;
 if(!u||!p){$('lerr').textContent='Enter your username and password.';return}
 if(USERS[u]!==p){$('lerr').textContent='Incorrect username or password. Try again.';$('pw').value='';$('pw').focus();return}
 $('lerr').textContent='';$('lf').reset();enter(u);toast('Signed in as Admin')});
$('tg').onclick=()=>{const h=$('pw').type==='password';$('pw').type=h?'text':'password';$('tg').textContent=h?'Hide':'Show'};
$('logout').onclick=()=>{document.body.classList.remove('in');try{sessionStorage.removeItem('bh-user')}catch(e){}$('u').focus()};
S=load();render();
let su=null;try{su=sessionStorage.getItem('bh-user')}catch(e){}
if(su&&USERS[su])enter(su);