import {elevateQaTeam} from "./fixtures/team-mfa-37.mjs";
// Isolated QA accounts prepared by test-connected-api.mjs; no real customer mutations.
import fs from 'node:fs';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
const users=JSON.parse(fs.readFileSync('/private/tmp/partant-connected-qa.json','utf8'));assert(users.every(u=>u.email.startsWith('partant-qa-')&&u.email.endsWith('@example.invalid')));
const [coach,client,bob,team]=users;
const env=Object.fromEntries(fs.readFileSync('apps/mobile/.env','utf8').split('\n').filter(x=>x.includes('=')).map(x=>[x.slice(0,x.indexOf('=')),x.slice(x.indexOf('=')+1)]));
const base=env.EXPO_PUBLIC_SUPABASE_URL,apikey=env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
for(const u of users){const r=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey,'Content-Type':'application/json'},body:JSON.stringify({email:u.email,password:u.password})});assert(r.ok);u.token=(await r.json()).access_token;if(u.name==="team")u.token=await elevateQaTeam(u,base,apikey);}
let checks=0;const ok=(v,msg)=>{assert.ok(v,msg);checks++};
async function api(u,body={}){const r=await fetch(base+'/functions/v1/product-api',{method:'POST',headers:{apikey,'Content-Type':'application/json',Authorization:'Bearer '+u.token},body:JSON.stringify(body)});return {status:r.status,...await r.json()};}
async function command(u,name,...args){for(let n=0;n<4;n++){const current=await api(u);assert.equal(current.status,200);const result=await api(u,{version:current.version,requestId:randomUUID(),commands:[{name,args}]});if(result.status!==409)return result;}throw Error('Repeated revision conflict');}
async function pass(u,name,...args){const r=await command(u,name,...args);assert.equal(r.status,200,r.error);checks++;return r.store;}
const day=new Date(Date.now()+10*86400000).toISOString().slice(0,10);
let s=(await api(coach)).store,cfg=s.settings[coach.id];
s=await pass(coach,'saveSettings',coach.id,{...cfg,locations:{...cfg.locations,Domicile:{type:'Domicile',name:'Chez le client',address:'',instructions:'',sector:'Paris 11e Arrondissement',radius:3,travelFee:0,areaCenter:{label:'Paris 11e Arrondissement',latitude:0,longitude:0}}}});
ok(s.settings[coach.id].locations.Domicile.areaCenter.latitude>48,'Server ignores forged center');
s=await pass(coach,'saveOffer',{id:'qa-home-35',coach:coach.id,name:'Renforcement QA domicile',kind:'Individuel',duration:60,price:50,capacity:1,active:true,formats:['Domicile']});
s=await pass(coach,'saveSettings',coach.id,{...s.settings[coach.id],published:false,week:Array.from({length:7},()=>[]),exceptions:{[day]:[['09:00','12:00',['qa-home-35'],['Domicile']]]}});
s=await pass(coach,'publish',coach.id);ok(s.settings[coach.id].published,'Date-only profile published');
const draft={id:randomUUID(),coach:coach.id,offerId:'qa-home-35',day,time:'09:00',format:'Domicile',seats:1,price:50,goal:'QA',address:'Place Bellecour 69002 Lyon',addressCoordinates:{latitude:48.86,longitude:2.38}};
let r=await command(client,'reserve',draft);ok(r.status===400&&r.error.includes('hors de la zone'),'Remote out-of-zone rejected despite forged coordinates');
s=await pass(client,'reserve',{...draft,address:'2 Rue du Général Blaise 75011 Paris'});ok(s.bookings.some(b=>b.id===draft.id),'Nearby reservation confirmed');
r=await command(client,'reschedule',draft.id,day,'10:00','Place Bellecour 69002 Lyon');ok(r.status===400&&r.error.includes('hors de la zone'),'Remote change out of zone rejected');
s=await pass(client,'report',{kind:'Assistance',body:'QA feature 35 suspension',coach:coach.id});const ticket=s.tickets.find(t=>t.body==='QA feature 35 suspension');
await pass(team,'resolveTicket',ticket.id,'Suspension QA temporaire','Suspendre le profil');r=await command(coach,'publish',coach.id);ok(r.status===400&&r.error.includes('suspendu'),'Remote suspension prevents publication');
r=await command(coach,'liftSuspension',coach.id,'Tentative QA');ok([400,403].includes(r.status)&&r.error.includes('équipe'),'Coach cannot lift own suspension');
await pass(team,'liftSuspension',coach.id,'Fin du test QA');await pass(coach,'publish',coach.id);
s=(await api(bob)).store;
for(const b of s.bookings.filter(b=>b.clientId===bob.id&&b.status==='confirmed'))await pass(bob,'cancelSession',b.id,'Clôture QA avant candidature');
s=await pass(bob,'report',{kind:'Assistance',body:'Candidature coach : QA feature 35 passage contrôlé.'});const app=s.tickets.find(t=>t.body.startsWith('Candidature coach : QA feature 35'));
await pass(team,'resolveTicket',app.id,'Préparez votre dossier QA','Autoriser le passage coach');s=await pass(bob,'activateCoachRole',app.id);ok(s.account.role==='coach'&&!s.settings[bob.id].published&&s.settings[bob.id].dossier.status==='draft','Remote approved conversion starts unapproved dossier');
console.log(`PASS ${checks} deployed feature-35 radius, dates, suspension and coach conversion checks. QA accounts only.`);
