// Verifies that deployed commands reject DST gaps before committing a session.
import fs from 'node:fs';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
const users=JSON.parse(fs.readFileSync('/private/tmp/partant-connected-qa.json','utf8'));
assert(users.every(u=>u.email.startsWith('partant-qa-')&&u.email.endsWith('@example.invalid')));
const owner=users[0];
const env=Object.fromEntries(fs.readFileSync('apps/mobile/.env','utf8').split('\n').filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
const base=env.EXPO_PUBLIC_SUPABASE_URL,apikey=env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const auth=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey,'Content-Type':'application/json'},body:JSON.stringify({email:owner.email,password:owner.password})});assert(auth.ok);
const {access_token}=await auth.json();
async function api(body={}){const r=await fetch(base+'/functions/v1/product-api',{method:'POST',headers:{apikey,Authorization:'Bearer '+access_token,'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,...await r.json()};}
let checks=0;
const current=await api();assert.equal(current.status,200);
const group=current.store.offers.find(o=>o.coach===owner.id&&o.kind==='Groupe');assert(group);
const date='2027-03-28';assert(Date.parse(date)>Date.now(),'Move DST fixture to a future spring transition when this date expires');
for(const time of ['02:00','02:30','02:59']){
 const r=await api({version:current.version,requestId:randomUUID(),commands:[{name:'openGroup',args:[{id:randomUUID(),offer:group,day:date,time,format:'track',address:'QA'}]}]});
 assert.equal(r.status,400);assert.match(r.error,/date|heure/);checks++;
}
const after=await api();assert.equal(after.version,current.version);checks++;
console.log(`PASS ${checks} deployed DST checks; no invalid session persisted.`);
