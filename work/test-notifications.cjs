const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('outputs/partant.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map(),listeners={};const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',open:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},focus(){},showModal(){this.open=true},close(){this.open=false},scrollTop:0,scrollIntoView(){}});return nodes.get(id)};
class TestData{constructor(f){this.data=f.fields||{}}get(k){return this.data[k]??null}getAll(k){let v=this.get(k);return v===null?[]:Array.isArray(v)?v:[v]}has(k){return this.get(k)!==null}entries(){return Object.entries(this.data)[Symbol.iterator]()}}
let memory={"partant-runtime":JSON.stringify({mode:"demo",clock:"2026-09-14T06:00:00Z"})};const ctx=vm.createContext({document:{getElementById:node,addEventListener(t,fn){(listeners[t]??=[]).push(fn)},querySelectorAll(){return []}},localStorage:{getItem(k){return memory[k]||null},setItem(k,v){memory[k]=v},removeItem(k){delete memory[k]}},setTimeout(){},clearTimeout(){},console,Date,Blob,URL,FormData:TestData});
vm.runInContext(script,ctx);let count=0;const run=x=>vm.runInContext(x,ctx);const equal=(a,b,n)=>{assert.deepEqual(a,b,n);count++};const submit=(id,fields,dataset={})=>listeners.submit.forEach(fn=>fn({target:{id,fields,dataset},preventDefault(){}}));

equal(run('identity.events.length'),0);
run("activateAccount('coach-0');cfg.weeklyConfigured=true;persist();activateAccount('client-alex');startBooking(0,'18:00',1);doPay()");
equal(run('identity.events.length'),1);equal(run('identity.events[0].recipient'),'coach-0');equal(run('identity.events[0].kind'),'booked');
run("state.selectedBooking=state.bookings[0].id;state.screen='detail';state.rescheduleChoice={day:2,time:'19:00'};act('confirm-reschedule')");
equal(run('state.bookings[0].day'),2);equal(run('identity.events.length'),2);
equal(run('identity.events[1].before.time'),'18:00');equal(run('identity.events[1].after.time'),'19:00');
run('persist();persist();render()');equal(run('identity.events.length'),2,'No duplicate event when saving unrelated data');
run("activateAccount('coach-1')");equal(run('unreadNotifications().length'),0);
run("activateAccount('coach-0')");equal(run('unreadNotifications().length'),2);equal(run('notificationBanner().includes(\'Avant :\')'),true);
run("act('notification-open',{id:identity.events[1].id})");equal(run('identity.events[1].read'),true);equal(run('unreadNotifications().length'),1);equal(run('state.coachDay'),2);
run("cfg.notifications.changes=false;persist();activateAccount('client-alex');state.selectedBooking=state.bookings[0].id;state.screen='detail';state.rescheduleChoice={day:3,time:'18:00'};act('confirm-reschedule');activateAccount('coach-0')");
equal(run('myNotifications().length'),3);equal(run('unreadNotifications().length'),1,'Muted changes stay in history without adding a badge');
run("cfg.notifications.changes=true;act('notifications-read')");equal(run('unreadNotifications().length'),0);
run("state.bookings[0].status='cancelled';state.bookings[0].cancelledBy='coach';state.bookings[0].refund=50;persist()");
equal(run('identity.events.at(-1).recipient'),'client-alex');equal(run('identity.events.at(-1).kind'),'cancelled');
run("activateAccount('client-alex');act('notification-open',{id:identity.events.at(-1).id})");equal(run('state.screen'),'detail');equal(run('identity.events.at(-1).read'),true);
run('persist()');const reloadContext=vm.createContext({...ctx});vm.runInContext(script,reloadContext);const reload=x=>vm.runInContext(x,reloadContext);
equal(reload('identity.events.length'),4);equal(reload('identity.events.at(-1).read'),true);
// Upgrading an existing prototype does not generate fictitious historical alerts.
const old=JSON.parse(memory['partant-identities']);delete old.events;delete old.eventSnapshots;delete old.eventSequence;memory['partant-identities']=JSON.stringify(old);
const migrated=vm.createContext({...ctx});vm.runInContext(script,migrated);vm.runInContext('persist()',migrated);equal(vm.runInContext('identity.events.length',migrated),0);
run('resetIdentityDemo()');equal(run('identity.events.length'),0);
console.log(`PASS ${count} notification checks: creation, reschedule details, deduplication, recipient isolation, read state, preferences, cancellation, persistence and migration.`);
