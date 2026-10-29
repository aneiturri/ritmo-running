import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const storageKey='sb-qnthoswcdedufkgcnnlk-auth-token';
const savedSession={access_token:'unit-test-only',refresh_token:'unit-test-only',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'existing-runner',email:'runner@example.invalid'}};
function setup({storage=new Map(),delay=false}={}){
 const elements=new Map(),calls={clients:0,password:0,email:0,updates:0,scope:null},classes=new Set();let release,first=true;
 const el=()=>({value:'',innerHTML:'',textContent:'',disabled:false,style:{},classList:{toggle(){}},setAttribute(){},focus(){},append(){},click(){},showModal(){this.opened=true},close(){this.opened=false}});
 const document={hidden:false,body:{classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v)}},querySelector:s=>{if(!elements.has(s))elements.set(s,el());return elements.get(s)},querySelectorAll:()=>[],createElement:el,addEventListener(){}};
 const localStorage={getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
 const library={createClient(url,key,options){calls.clients++;calls.options=options;const auth={
  onAuthStateChange(){return {data:{subscription:{unsubscribe(){}}}}},
  async getSession(){if(calls.offline)return {data:{session:null},error:{message:'offline'}};if(delay&&first){first=false;await new Promise(r=>release=r)}return {data:{session:JSON.parse(storage.get(options.auth.storageKey)||'null')},error:null}},
  async signInWithPassword(){calls.password++;storage.set(options.auth.storageKey,JSON.stringify(savedSession));return {data:{session:savedSession},error:null}},
  async signInWithOtp(){calls.email++;return {error:{status:429,message:'email rate limit exceeded'}}},
  async updateUser(){calls.updates++;return {data:{user:savedSession.user},error:null}},
  async signOut(options){calls.scope=options.scope;storage.delete(storageKey);return {error:null}}
 };return {auth,from:()=>({select:async()=>({data:[],error:null})}),rpc:async()=>({data:[],error:null}),channel:()=>({on(){return this},subscribe(){return this}}),removeChannel:async()=>{}}}};
 const sandbox={document,localStorage,window:{supabase:library,addEventListener(){},scrollTo(){}},matchMedia:()=>({matches:false}),location:{protocol:'https:',origin:'https://aneiturri.github.io',pathname:'/ritmo-running/'},Intl,Date,Set,Blob,URL,console,setInterval(){},setTimeout(){},clearTimeout(){},confirm:()=>true};
 vm.createContext(sandbox);vm.runInContext(script,sandbox);
 return {run:s=>vm.runInContext(s,sandbox),elements,storage,calls,release:()=>release?.()};
}
const existingStore=new Map([[storageKey,JSON.stringify(savedSession)]]);
const existing=setup({storage:existingStore});await existing.run('connectCloud()');
assert.equal(existing.run('user.id'),'existing-runner');
assert.equal(existing.calls.options.auth.storageKey,storageKey,'Must preserve the existing Supabase storage key');
for(const flag of ['persistSession','autoRefreshToken','detectSessionInUrl'])assert.equal(existing.calls.options.auth[flag],true);
await existing.run('openLog(sessions[0].id)');assert.equal(existing.elements.get('#logdialog').opened,true);
assert.equal(existing.calls.email,0);assert.equal(existing.calls.password,0);
await existing.run('connectCloud()');await existing.run('connectCloud()');assert.equal(existing.calls.clients,1,'One auth client per page');
const reloaded=setup({storage:existingStore});await reloaded.run('connectCloud()');assert.equal(reloaded.run('user.id'),'existing-runner');assert.equal(reloaded.calls.email,0);
const slow=setup({storage:new Map([[storageKey,JSON.stringify(savedSession)]]),delay:true});
const editing=slow.run('openLog(sessions[0].id)');await new Promise(r=>setImmediate(r));slow.release();await editing;
assert.equal(slow.elements.get('#logdialog').opened,true,'Click during restore waits instead of opening login');assert.notEqual(slow.run('tab'),'settings');assert.equal(slow.calls.email,0);
existing.calls.offline=true;await existing.run('restoreSession()');assert.equal(existing.run('user.id'),'existing-runner','Network failures must not erase a recovered account');existing.calls.offline=false;
const password=setup();await password.run('connectCloud()');password.run("nav('settings')");
password.run("$('#passwordemail').value='runner@example.invalid';$('#password').value='unit-test-secret-password'");
await password.elements.get('#passwordlogin').onsubmit({preventDefault(){}});assert.equal(password.calls.password,1);assert.equal(password.calls.email,0);assert.equal(password.run('user.id'),'existing-runner');
assert.ok([...password.storage.values()].every(v=>!v.includes('unit-test-secret-password')),'Never store the password');
const passwordReload=setup({storage:password.storage});await passwordReload.run('connectCloud()');assert.equal(passwordReload.run('user.id'),'existing-runner');assert.equal(passwordReload.calls.password,0);
password.run('bindView()');await password.elements.get('#logout').onclick();assert.equal(password.calls.scope,'local','Signing out here must not sign out another device');
const limited=setup();await limited.run('connectCloud()');limited.run("nav('settings');$('#email').value='runner@example.invalid'");
await limited.elements.get('#loginform').onsubmit({preventDefault(){}});assert.equal(limited.calls.email,1);assert.equal(limited.elements.get('#loginbtn').disabled,true);
await limited.elements.get('#loginform').onsubmit({preventDefault(){}});assert.equal(limited.calls.email,1,'Do not repeatedly send after rate limit');
console.log('PASS: existing session migration, explicit persistent auth, slow restore, page reload, offline retention, one client, password login without email, no password storage, local-only sign-out and email rate-limit cooldown.');
