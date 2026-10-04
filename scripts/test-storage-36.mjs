// Development QA only. Existing isolated fixture users; never sends an e-mail.
import fs from 'node:fs';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
const users=JSON.parse(fs.readFileSync('/private/tmp/partant-connected-qa.json','utf8'));
assert(users.every(u=>u.email.startsWith('partant-qa-')&&u.email.endsWith('@example.invalid')));
const env=Object.fromEntries(fs.readFileSync('apps/mobile/.env','utf8').split('\n').filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
const base=env.EXPO_PUBLIC_SUPABASE_URL, apikey=env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const [owner,other]=users;
for(const u of [owner,other]){
 const r=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey,'Content-Type':'application/json'},body:JSON.stringify({email:u.email,password:u.password})});assert(r.ok);u.token=(await r.json()).access_token;
}
const key=`${owner.id}/qa36-${randomUUID()}.webp`,blob=Buffer.from('UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA','base64');
let checks=0;
const ok=(v,msg)=>{assert(v,msg);checks++};
async function storage(user,path,method='GET',body,mime){return fetch(base+'/storage/v1/'+path,{method,headers:{apikey,...(user?{Authorization:'Bearer '+user.token}:{}),...(mime?{'Content-Type':mime}:{})},body,signal:AbortSignal.timeout(30000)});}
try {
 let r=await storage(owner,'object/coach-documents/'+key,'POST',blob,'image/webp');ok(r.ok,'Owner can upload WebP document');
 r=await storage(owner,'object/authenticated/coach-documents/'+key);ok(r.ok,'Owner can read private WebP');
 r=await storage(other,'object/authenticated/coach-documents/'+key);ok(!r.ok,'Other account cannot read document');
 r=await storage(null,'object/public/coach-documents/'+key);ok(!r.ok,'Document is never publicly readable');
 r=await storage(owner,'object/coach-documents/'+key+'.html','POST',Buffer.from('<p>QA</p>'),'text/html');ok(!r.ok,'HTML document refused');
 r=await storage(owner,'object/coach-documents/'+key+'.large.webp','POST',Buffer.alloc(10*1024*1024+1),'image/webp');ok(!r.ok,'Oversize document refused');
 r=await storage(owner,'object/coach-documents/'+other.id+'/qa36-denied.webp','POST',blob,'image/webp');ok(!r.ok,'Writing another owner prefix refused');
 console.log(`PASS ${checks} live Storage checks (WebP, ownership, visibility, MIME and size)`);
} finally {
 const r=await storage(owner,'object/coach-documents','DELETE',JSON.stringify({prefixes:[key,key+'.html',key+'.large.webp']}),'application/json');
 assert(r.ok,'QA document cleanup succeeded');
}
