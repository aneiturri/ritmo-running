import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(code);
const elements=new Map();
function element(){return {value:'',innerHTML:'',textContent:'',style:{},classList:{toggle(){}},setAttribute(){},focus(){},append(){},click(){},showModal(){},close(){}}}
const storage=new Map();
const bodyClasses=new Set();
const sandbox={document:{body:{classList:{add:x=>bodyClasses.add(x),remove:x=>bodyClasses.delete(x),contains:x=>bodyClasses.has(x)}},querySelector:s=>{if(!elements.has(s))elements.set(s,element());return elements.get(s)},querySelectorAll:()=>[],createElement:element,addEventListener(){}},matchMedia:()=>({matches:true}),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Intl,Date,Set,console,window:{addEventListener(){},scrollTo(){}},location:{protocol:'file:',origin:'null',pathname:'/index.html'},setInterval(){},setTimeout(){},clearTimeout(){},confirm:()=>true,Blob,URL};
vm.createContext(sandbox);vm.runInContext(code,sandbox);
function run(s){return vm.runInContext(s,sandbox)}
assert.equal(run('weeks.length'),22);assert.equal(run('sessions.length'),158);
assert.equal(run('new Set(sessions.map(s=>s.date)).size'),158);
assert.equal(run('new Set(sessions.map(s=>s.id)).size'),158);
assert.equal(run("sessions.at(0).date"),'2026-10-29');assert.equal(run("sessions.at(-1).date"),'2027-04-04');
assert.equal(run("sessions.filter(s=>s.type==='race').length"),3);
assert.equal(run("sessions.find(s=>s.date==='2026-12-31').km"),7.9);
assert.equal(run("sessions.find(s=>s.date==='2027-02-14').km"),10);
assert.equal(run("sessions.find(s=>s.date==='2027-04-04').km"),21.1);
assert.equal(run("sessions.filter(s=>s.type==='long'&&weekday(s.date)!=='Mié').length"),0);
assert.equal(run("sessions.filter(s=>s.type==='padel'&&s.time!=='19:00').length"),0);
assert.equal(run("sessions.filter(s=>['Sáb','Dom'].includes(weekday(s.date))&&!['rest','race'].includes(s.type)).length"),0);
for(const page of ['renderHome','renderPlan','renderRaces','renderProgress','renderCoach','renderSettings'])assert.ok(run(page+'()').length>1000);
for(let i=0;i<22;i++)assert.ok(run(`selectedWeek=${i};renderPlan()`).includes('Semana '+(i+1)));
assert.ok(run("renderProgress().includes('No hay kilómetros ni marcas de ejemplo')"));
const id=run('sessions[0].id');
run(`records[${JSON.stringify(id)}]={status:'done',km:5,minutes:30,rpe:4,notes:'<img src=x onerror=alert(1)>',updated_at:new Date().toISOString()}`);
assert.ok(run("renderProgress().includes('&lt;img')"));assert.ok(run("renderProgress().includes('6:00')"));
assert.ok(run(`validRecord(${JSON.stringify(id)},records[${JSON.stringify(id)}])`));
assert.equal(run(`validRecord(${JSON.stringify(id)},{...records[${JSON.stringify(id)}],km:-1})`),false);
// Offline queue: each edit is retained until server accepts it, and a newer
// edit made while a write is in-flight must stay in the queue.
run(`user={id:'test-user'};records={};pending={};`);
const sample={status:'done',km:5,minutes:30,rpe:4,notes:'test',updated_at:new Date().toISOString()};
sandbox.sample=sample;sandbox.id=id;
run(`records[id]=sample;pending[id]=sample;sb={from:()=>({select:async()=>({data:[],error:null})}),rpc:async()=>({data:null,error:{message:'offline'}})};`);
await run('syncCloud(false)');assert.equal(run('Object.keys(pending).length'),1);
assert.ok(run("syncMessage.includes('pendientes')"));
run(`sb.rpc=async()=>({data:[{session_id:id,user_id:user.id,...sample,client_updated_at:sample.updated_at}],error:null});`);
await run('syncCloud(false)');assert.equal(run('Object.keys(pending).length'),0);
run(`pending[id]=sample;sb.rpc=async()=>{pending[id]={...sample,notes:'new edit',updated_at:new Date(Date.now()+1000).toISOString()};return {data:[{session_id:id,...sample}],error:null}};`);
await run('syncCloud(false)');assert.equal(run('pending[id].notes'),'new edit');
const audit=run('JSON.stringify(weeks.map(w=>({week:w.n,start:w.start,phase:w.phase,km:weekSessions(w).filter(isRun).reduce((a,s)=>a+s.km,0)})),null,2)');
assert.equal((html.match(/data-tab="/g)||[]).length,6,'All six navigation tabs remain visible');
assert.ok(html.includes('<nav class="bottom-nav"'));
assert.ok(!html.includes('<aside class="sidebar"'));
assert.ok(html.includes('<title>Ritmo · Tu siguiente meta</title>'));

console.log('PASS: 158 dated sessions, 22 weeks, race dates, weekday constraints, 6 views, escaped notes, validation, offline queue and in-flight edits.');
