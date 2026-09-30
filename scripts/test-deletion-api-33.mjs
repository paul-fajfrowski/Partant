// Run after test-connected-api against its isolated QA users only.
import fs from 'node:fs';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
const users=JSON.parse(fs.readFileSync('/private/tmp/partant-connected-qa.json'));
assert(users.every(u=>u.email.startsWith('partant-qa-')&&u.email.endsWith('@example.invalid')));
const env=Object.fromEntries(fs.readFileSync(new URL('../apps/mobile/.env',import.meta.url),'utf8').split('\n').filter(x=>x&&!x.startsWith('#')).map(x=>{const i=x.indexOf('=');return[x.slice(0,i),x.slice(i+1)]}));
const base=env.EXPO_PUBLIC_SUPABASE_URL,apikey=env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
let n=0;function ok(x,m){assert.ok(x,m);n++}
for(const u of users){const r=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey,'Content-Type':'application/json'},body:JSON.stringify({email:u.email,password:u.password})});assert(r.ok);u.token=(await r.json()).access_token;}
const [coach,client,,team]=users;
const headers=u=>({apikey,'Content-Type':'application/json',...(u?{Authorization:'Bearer '+u.token}:{})});
async function api(u,body={}){const r=await fetch(base+'/functions/v1/product-api',{method:'POST',headers:headers(u),body:JSON.stringify(body)});return{status:r.status,...await r.json()};}
async function command(u,name,...args){for(let i=0;i<5;i++){const s=await api(u);const r=await api(u,{version:s.version,requestId:randomUUID(),commands:[{name,args}]});if(r.status===409)continue;assert.equal(r.status,200,JSON.stringify(r));return r}throw Error('Repeated conflict')}
let s=(await api(coach)).store;
await command(coach,'saveSettings',coach.id,{...s.settings[coach.id],preparation:{provided:'PRIVATE_33',bring:'',meeting:'PRIVATE_33',weather:''},locations:Object.fromEntries(Object.entries(s.settings[coach.id].locations).map(([k,v])=>[k,{...v,instructions:'PRIVATE_33'}]))});
ok(!JSON.stringify((await api()).store).includes('PRIVATE_33'),'Public projection hides private instructions');
ok(JSON.stringify((await api(coach)).store).includes('PRIVATE_33'),'Owner retains own instructions');
const paths=[];
for(const bucket of ['coach-documents','coach-photos']){const file=coach.id+'/'+randomUUID()+(bucket==='coach-documents'?'.pdf':'.png');const r=await fetch(base+'/storage/v1/object/'+bucket+'/'+file,{method:'POST',headers:{...headers(coach),'Content-Type':bucket==='coach-documents'?'application/pdf':'image/png'},body:bucket==='coach-documents'?'%PDF-1.4\n% isolated erasure QA':Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lU8AAAAASUVORK5CYII=','base64')});ok(r.ok,'QA object uploaded '+bucket);paths.push({bucket,file});}
s=(await api(coach)).store;for(const b of s.bookings.filter(b=>b.coach===coach.id&&b.status==='confirmed'))await command(coach,'cancelSession',b.id,'Recette isolée suppression');
const deleted=await command(coach,'deleteAccount');ok(deleted.deleted&&deleted.deletionPending,'Deletion acknowledgement distinguishes access closure from cleanup');
const old=await api(coach);ok(old.status!==200||!old.store?.account,'Old session cannot access deleted account');
const upload=await fetch(base+'/storage/v1/object/coach-documents/'+coach.id+'/'+randomUUID()+'.pdf',{method:'POST',headers:{...headers(coach),'Content-Type':'application/pdf'},body:'%PDF-1.4'});ok(!upload.ok,'Old JWT cannot upload after tombstone');
for(const {bucket,file} of paths){let gone=false;for(let i=0;i<30;i++){const r=await fetch(base+'/storage/v1/object/authenticated/'+bucket+'/'+file,{headers:headers(team)});if(!r.ok){gone=true;break}await new Promise(r=>setTimeout(r,1000));}ok(gone,'Object physically removed '+bucket);}
ok(!JSON.stringify((await api(team)).store).includes('PRIVATE_33'),'Private preparation and locations erased from team projection');
fs.writeFileSync('/private/tmp/partant-deletion-33-actor.txt',coach.id,{mode:0o600});
console.log(`PASS ${n} deployed privacy, erasure, old JWT and Storage checks (isolated QA only).`);
