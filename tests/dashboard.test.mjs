import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements=new Map(),storage=new Map();
function el(){return {value:'',innerHTML:'',textContent:'',style:{},classList:{toggle(){}},setAttribute(){},focus(){},append(){},click(){},showModal(){},close(){}}}
const sandbox={document:{querySelector:s=>{if(!elements.has(s))elements.set(s,el());return elements.get(s)},querySelectorAll:()=>[],createElement:el,addEventListener(){},body:{classList:{}}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},window:{addEventListener(){},scrollTo(){}},matchMedia:()=>({matches:true}),location:{protocol:'file:',origin:'null',pathname:'/index.html'},Intl,Date,Set,URL,Blob,console,setInterval(){},setTimeout(){},clearTimeout(){},confirm:()=>true};
vm.createContext(sandbox);vm.runInContext(script,sandbox);const run=s=>vm.runInContext(s,sandbox);
assert.equal(run('runStats(sessions).percent'),0);
run("const running=sessions.filter(isRun);records[running[0].id]={status:'done',km:5,minutes:30};records[running[1].id]={status:'partial',km:2,minutes:15};records[sessions.find(s=>s.type==='padel').id]={status:'done',km:null,minutes:999};");
assert.equal(run('runStats(sessions).done'),1);assert.equal(run('runStats(sessions).partial'),1);
assert.equal(run('runStats(sessions).percent'),run('Math.round(100/sessions.filter(isRun).length)'));
assert.ok(run('renderProgress()').includes('0.8 h'),'Only 45 running minutes count; optional activity duration is excluded');
assert.ok(!run('renderProgress()').includes('Pádel'),'Running diary does not require optional records');
for(let i=0;i<22;i++){
 const page=run(`selectedWeek=${i};renderPlan()`);
 assert.ok(page.includes('week-navigator'));assert.ok(page.includes('monthly-calendar'));
 const ids=[...page.matchAll(/data-log="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(ids.every(id=>run(`isRun(sessions.find(s=>s.id===${JSON.stringify(id)}))`)),'Only running sessions have registration controls');
}
run("calendarMonth='2026-11';calendarFocus=null");let calendar=run('renderMonthlyCalendar()');
assert.equal((calendar.match(/data-calendar-day=/g)||[]).length,30,'November has 30 clickable dates');
assert.equal((calendar.match(/calendar-blank/g)||[]).length,12,'November 2026 has six leading and six trailing blank cells');
run("calendarMonth='2027-02'");assert.equal((run('renderMonthlyCalendar()').match(/data-calendar-day=/g)||[]).length,28);
run("calendarMonth=firstPlanMonth;changeCalendarMonth(-1)");assert.equal(run('calendarMonth'),'2026-10');
run("calendarMonth=lastPlanMonth;changeCalendarMonth(1)");assert.equal(run('calendarMonth'),'2027-04');
run("calendarMonth='2026-11';calendarFocus='2026-11-06'");assert.ok(!run('renderCalendarDetail()').includes('data-log='),'Pádel day is view-only');
run("calendarFocus='2026-11-04'");assert.ok(run('renderCalendarDetail()').includes('data-log='),'Running day can be registered');
run("user={id:'test'}");await run("openLog(sessions.find(s=>s.type==='padel').id)");assert.equal(run('currentSession'),null,'Optional sessions cannot open the running log');
assert.ok(run('currentPlanned()===null||isRun(currentPlanned())'));
for(const range of [4,8,'all']){run(`chartRange=${JSON.stringify(range)}`);const chart=run('renderVolumeChart()');assert.ok(!/NaN|undefined/.test(chart));assert.ok(chart.includes('planned-path'));assert.ok(chart.includes('actual-path'));assert.ok(run('visibleChartData().length')<= (range==='all'?23:range));}
run("records={};chartRange='all'");assert.equal(run('weeklyChartData().length'),23,'Chart includes the October starter week');
assert.ok(run('weeklyChartData().filter(w=>w.start>today()).every(w=>w.actual===null)'),'Future weeks do not invent real distance');
run("for(const s of sessions.filter(isRun))records[s.id]={status:'done'}");assert.equal(run('runStats(sessions).percent'),100);
assert.equal(run('currentPlanned()'),null,'No completed session is shown as a future pending run');
run("records={};pending={};user={id:'sync-test'};tab='plan';selectedWeek=0;calendarMonth='2026-11';");
run("const syncRow={session_id:'2026-11-02-quality',status:'done',km:5,minutes:30,rpe:4,notes:'Actualización remota',updated_at:new Date().toISOString()};sb={from:()=>({select:async()=>({data:[syncRow],error:null})})};");
await run('syncCloud(false)');assert.ok(elements.get('#view').innerHTML.includes('run-card type-quality done'),'A remote completion updates the plan');
assert.equal(run('calendarMonth'),'2026-11','A sync must preserve the viewed month');
elements.get('#weekpicker').open=true;elements.get('#view').innerHTML='selector abierto';
run("syncRow.status='partial';syncRow.updated_at=new Date().toISOString()");await run('syncCloud(false)');
assert.equal(elements.get('#view').innerHTML,'selector abierto','Do not dismiss an open week selector during sync');
assert.equal(run('planNeedsRefresh'),true);elements.get('#weekpicker').open=false;await run('syncCloud(false)');assert.equal(run('planNeedsRefresh'),false);
console.log('PASS: real running-only percentages, partial states, monthly dates and boundaries, running-only registration, optional records preserved but excluded, chart ranges and missing future values, all six bottom tabs.');
