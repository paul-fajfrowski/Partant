// Run after test-connected-api.mjs. Only isolated QA accounts are used.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const users = JSON.parse(fs.readFileSync('/private/tmp/partant-connected-qa.json'));
assert.ok(users.every(u => /^partant-qa-.*@example\.invalid$/.test(u.email)));
const env = Object.fromEntries(fs.readFileSync('apps/mobile/.env','utf8').split('\n').filter(x => x && !x.startsWith('#')).map(x => [x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
const base = env.EXPO_PUBLIC_SUPABASE_URL, apikey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const sessionFile='/private/tmp/partant-journey-web-session.json';
let H, checks=0;
const ok=(v,msg)=>{assert.ok(v,msg);checks++;};
async function sessionFor(u){const r=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey,'Content-Type':'application/json'},body:JSON.stringify({email:u.email,password:u.password})});const s=await r.json();assert.ok(s.access_token,'QA session');return s;}
async function read(s){const r=await fetch(base+'/functions/v1/product-api',{method:'POST',headers:{apikey,Authorization:'Bearer '+s.access_token,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,200);return (await r.json()).store;}
async function open(s){if(H)H.close();fs.writeFileSync(sessionFile,JSON.stringify({key:`sb-${new URL(base).hostname.split('.')[0]}-auth-token`,session:s}),{mode:0o600});process.env.PARTANT_QA_SESSION=sessionFile;process.env.PARTANT_QA_URL='http://127.0.0.1:8081/?data=connected';delete require.cache[require.resolve('./native-web-harness.cjs')];H=require('./native-web-harness.cjs');}
async function until(fn,label){for(let i=0;i<100;i++){if(await fn())return;await H.wait();}throw Error(label+'\n'+H.d.body.textContent.slice(-1500));}
(async()=>{
 try{
  const client=await sessionFor(users[1]),coach=await sessionFor(users[0]);
  const initial=await read(client), profile=initial.extraCoaches.find(c=>c.id===users[0].id);
  assert.ok(profile,'QA coach is published');
  await open(client);
  await until(()=>H.d.body.textContent.includes('On bouge quand ?'),'Client home');
  await H.click('Demain');
  await until(()=>H.d.body.textContent.includes(profile.name),'Coach discovery');
  await H.click('Voir le profil de '+profile.name);
  await H.click('Séance QA · 50 €');
  await H.click('Choisir mon créneau');
  ok(H.d.body.textContent.includes('Un moment pour vous.'),'Live booking setup reached');
  await H.click('Continuer');
  ok(H.d.body.textContent.includes('Vous y êtes presque.'),'Live checkout reached');
  await H.click('Confirmer ma réservation de test');
  await until(()=>H.d.body.textContent.includes('Vous êtes partant.'),'Server booking confirmation');
  const current=await read(client), booking=current.bookings.find(b=>!initial.bookings.some(old=>old.id===b.id));
  ok(!!booking && booking.price===50,'UI booking persisted once at correct price');
  ok(current.bookings.length===initial.bookings.length+1,'One UI confirmation creates one booking');
  await H.click('Voir ma séance');
  ok(H.d.body.textContent.includes('Modifier ma séance'),'Booking detail manageable');
  // Verify the second actor receives the same booking before opening its interface.
  const coachState=await read(coach);
  ok(coachState.bookings.some(b=>b.id===booking.id),'Coach receives client booking');
  ok(coachState.notices.some(n=>n.booking===booking.id),'Coach receives booking notice');
  ok(H.errors.length===0,'Client has no runtime errors');
  await open(coach);
  await until(()=>H.d.body.textContent.includes('Agenda'),'Coach home');
  const label=[...H.d.querySelectorAll('[role="button"]')].map(e=>e.getAttribute('aria-label')).find(x=>x && /notification/i.test(x));
  await H.click(label || 'Notifications');
  await until(()=>H.d.body.textContent.includes('Vos notifications'),'Coach notification inbox');
  const notice=coachState.notices.find(n=>n.booking===booking.id && n.kind==='booking') || coachState.notices.find(n=>n.booking===booking.id);
  ok(H.d.body.textContent.includes(notice.body),'Booking notification rendered in coach inbox');
  const notices=[...H.d.querySelectorAll('[role="button"]')].filter(e=>e.textContent.startsWith(notice.body));
  notices.at(-1).click();await H.wait();
  await until(()=>H.d.body.textContent.includes(booking.time),'Notification opens booking detail');
  await until(async()=> (await read(coach)).notices.find(n=>n.id===notice.id)?.read,'Read notice persists');
  ok(true,'Coach opens the booking and marks its notice as read');
  ok(H.errors.length===0,'Coach has no runtime errors');
  console.log(`PASS ${checks} connected client/coach journey DOM checks with deployed Supabase. No real payment or visual validation.`);
 } finally {if(H)H.close();fs.rmSync(sessionFile,{force:true});}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
