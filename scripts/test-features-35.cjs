const fs=require('node:fs'), assert=require('node:assert/strict'), ts=require('../apps/mobile/node_modules/typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,f);
const M=require('../apps/mobile/src/product/model.ts'), W=require('../apps/mobile/src/product/workflows.ts'), D=require('../apps/mobile/src/product/connectedDomain.ts'), G=require('../apps/mobile/src/product/geoPolicy.ts'), Msg=require('../apps/mobile/src/product/messaging.ts');
const {resolveGeo}=require('../supabase/functions/_shared/geoResolver.ts');
M.setDemoClock((Date.parse('2026-09-30T06:00:00Z')-Date.now())/3600000);
let checks=0; const ok=(v,msg)=>{assert.ok(v,msg); checks++}, fails=(fn,re)=>{assert.throws(fn,re);checks++};
const coach={id:'11111111-1111-4111-8111-111111111111',email:'coach@example.test'},client={id:'22222222-2222-4222-8222-222222222222',email:'client@example.test'},team={id:'33333333-3333-4333-8333-333333333333',email:'team@example.test',staff:true};
const paris={label:'Paris 11e',latitude:48.86,longitude:2.38},near={label:'2 Rue du Général Blaise 75011 Paris',latitude:48.861,longitude:2.382},far={label:'Place Bellecour 69002 Lyon',latitude:45.758,longitude:4.832};
const geo={[paris.label]:paris,[near.label]:near,[far.label]:far};
const cmd=(s,actor,name,...args)=>D.applyCommand(s,actor,{name,args},geo);
function fixture(){let s=D.emptyConnected(); for(const [actor,role] of [[coach,'coach'],[client,'client'],[team,'client']])s=D.register(s,actor,role,role);
s=cmd(s,coach,'saveCoach',coach.id,{name:'Coach Test',bio:'Accompagnement personnalisé',cert:'BPJEPS test',sport:'Musculation',tags:[],years:5,area:'Paris 11e'});
let cfg=M.configFor(s,coach.id);s=cmd(s,coach,'saveSettings',coach.id,{...cfg,weeklyConfigured:true,payoutReady:true,locations:{Domicile:{type:'Domicile',name:'Chez le client',address:'',instructions:'',sector:paris.label,radius:3,travelFee:10},gym:{type:'Salle de musculation',name:'Salle test',address:near.label,instructions:'',coordinates:near}},week:Array.from({length:7},()=>[['09:00','12:00',null,['gym','Domicile']]]),dossier:{...cfg.dossier,status:'pending',documents:['id','diploma','card','insurance'],expires:'2027-09-30'}});
s=cmd(s,coach,'saveOffer',{id:'solo',coach:coach.id,name:'Renforcement',kind:'Individuel',duration:60,price:50,capacity:1,active:true,formats:['gym','Domicile']});s=cmd(s,team,'reviewDossier',coach.id,'approved','Dossier fictif revu.');return cmd(s,coach,'publish',coach.id);}
const booking=(patch={})=>({id:'b1',coach:coach.id,offerId:'solo',day:'2026-10-02',time:'09:00',format:'gym',seats:1,price:50,goal:'',address:near.label,...patch});
{
let s=fixture();s=cmd(s,client,'reserve',booking());s=cmd(s,client,'report',{kind:'Assistance',body:'Signalement fictif',coach:coach.id});let id=s.tickets.at(-1).id;
fails(()=>cmd(s,client,'resolveTicket',id,'Suspension','Suspendre le profil'),/équipe/);
s=cmd(s,team,'resolveTicket',id,'Suspension motivée','Suspendre le profil');ok(M.configFor(s,coach.id).suspension.active,'persistent suspension');
fails(()=>cmd(s,coach,'publish',coach.id),/suspendu/);
fails(()=>cmd(s,coach,'saveSettings',coach.id,{...M.configFor(s,coach.id),suspension:{active:false},published:true}),/suspendu/);
ok(M.slotsFor(M.allCoaches(s)[0],'2026-10-03',s,s.offers[0]).length===0,'no suspended slot');
fails(()=>cmd(s,client,'reserve',booking({id:'b2',day:'2026-10-03'})),/disponible/);
ok(s.bookings[0].status==='confirmed','existing booking preserved');ok(!D.project(s).extraCoaches.length,'hidden public profile');
fails(()=>cmd(s,coach,'liftSuspension',coach.id,'ok'),/équipe/);fails(()=>cmd(s,team,'liftSuspension',coach.id,''),/motivée/);
s=cmd(s,team,'liftSuspension',coach.id,'Vérification terminée');ok(!M.configFor(s,coach.id).published,'no automatic republication');ok(M.configFor(s,coach.id).suspension.history.length===2,'audited suspension history');s=cmd(s,coach,'publish',coach.id);ok(M.configFor(s,coach.id).published,'manual publication after lifting');
}
{
let s=fixture(); const home=booking({format:'Domicile',price:60});
fails(()=>D.applyCommand(s,client,{name:'reserve',args:[home]}),/adresse proposée/);
fails(()=>D.applyCommand(s,client,{name:'reserve',args:[{...home,address:far.label,addressCoordinates:near}]}),/adresse proposée/);
fails(()=>cmd(s,client,'reserve',{...home,address:far.label}),/hors de la zone/);
s=cmd(s,client,'reserve',home);ok(s.bookings[0].status==='confirmed','valid nearby address');
fails(()=>cmd(s,client,'reschedule','b1','2026-10-03','09:00',far.label),/hors de la zone/);
fails(()=>cmd(s,coach,'addProposal','b1',{day:'2026-10-03',time:'09:00',address:far.label},'Autre lieu'),/hors de la zone/);
s=cmd(s,coach,'addProposal','b1',{day:'2026-10-03',time:'09:00',address:near.label},'Autre horaire');s=cmd(s,client,'answerProposal',s.proposals.at(-1).id,'accepted');ok(s.bookings[0].day==='2026-10-03','valid reschedule proposal');
const cfg=M.configFor(s,coach.id);s=cmd(s,coach,'saveSettings',coach.id,{...cfg,locations:{...cfg.locations,Domicile:{...cfg.locations.Domicile,areaCenter:far}}});ok(M.configFor(s,coach.id).locations.Domicile.areaCenter.latitude===paris.latitude,'ignores forged home center');
ok(G.geoQueries(s,{name:'reschedule',args:['b1','2026-10-04','09:00',near.label]},team.id).length===0,'unauthorized lookup does not disclose private address to provider');
}
{
let s=fixture();s=cmd(s,coach,'publish',coach.id);s=cmd(s,coach,'saveSettings',coach.id,{...M.configFor(s,coach.id),week:Array.from({length:7},()=>[]),exceptions:{'2026-10-02':[['09:00','12:00',['solo'],['gym']]]}});s=cmd(s,coach,'publish',coach.id);ok(M.configFor(s,coach.id).published,'date-only publication');
s=cmd(s,coach,'publish',coach.id);s=cmd(s,coach,'saveSettings',coach.id,{...M.configFor(s,coach.id),exceptions:{'2026-09-29':[['09:00','12:00',null,['gym']]]}});fails(()=>cmd(s,coach,'publish',coach.id),/créneau réservable/);
s=cmd(s,coach,'saveSettings',coach.id,{...M.configFor(s,coach.id),exceptions:{'2026-10-02':[['09:00','09:30',null,['gym']]]}});fails(()=>cmd(s,coach,'publish',coach.id),/créneau réservable/);
s=cmd(s,coach,'saveSettings',coach.id,{...M.configFor(s,coach.id),exceptions:{'2027-01-01':[['09:00','12:00',null,['gym']]]}});fails(()=>cmd(s,coach,'publish',coach.id),/créneau réservable/);
}
{
let s=fixture();let duo={...s.offers[0],id:'duo',kind:'Duo',capacity:2,price:70};s=cmd(s,coach,'saveOffer',duo);
const a={id:'a',owner:client.id,active:true,coach:coach.id,sport:'Tout',day:'2026-10-02',from:'09:00',to:'12:00',budget:70,seats:2,groupOnly:false,format:'Tous',seen:[]};
let matches=W.alertMatches(s,a);ok(matches.length===3 && matches.every(x=>x.offer.id==='duo'),'duo alert');ok(matches.every(x=>x.price===70&&x.format==='gym'),'total price and selected place');ok(W.alertMatches(s,{...a,format:'Domicile'}).length===0,'travel fee counted');ok(W.alertMatches(s,{...a,format:'Domicile',budget:80}).every(x=>x.price===80),'home quote correct');ok(W.alertMatches(s,{...a,groupOnly:true}).length===0,'group-only excludes duo');ok(W.alertMatches(s,{...a,budget:69}).length===0,'budget respected');
const local={...a,coach:'',area:{...paris,radius:5}};ok(W.alertMatches(s,local).length===3,'local nearby slots');ok(!W.alertMatches(s,{...local,area:{...far,radius:5}}).length,'distant physical results excluded');ok(!W.alertMatches(s,{...a,coach:''}).length,'legacy global alert not worldwide');
fails(()=>cmd(s,client,'alert',{...a,coach:''}),/secteur/);s=cmd(s,client,'alert',{...local,area:{...paris,latitude:0,longitude:0,radius:5}});ok(s.alerts[0].area.latitude===paris.latitude,'server resolves alert center');
const noPoint={...s,settings:{...s.settings,[coach.id]:{...M.configFor(s,coach.id),locations:{gym:{...M.configFor(s,coach.id).locations.gym,coordinates:undefined}}}}};ok(!W.alertMatches(noPoint,{...local,format:'Salle de musculation'}).length,'unknown geography not silently nearby');
}
{
let s=fixture();s=cmd(s,client,'reserve',booking());s=cmd(s,client,'report',{kind:'Assistance',body:'Candidature coach : Je souhaite enseigner le Pilates.'});let id=s.tickets.at(-1).id;
fails(()=>cmd(s,client,'activateCoachRole',id),/approuvée/);fails(()=>cmd(s,client,'resolveTicket',id,'Oui','Autoriser le passage coach'),/équipe/);
ok(W.resolveTicket(D.project(s,team),id,'Bienvenue','Autoriser le passage coach').tickets.some(t=>t.application==='approved'),'staff UI works with private projected identities');s=cmd(s,team,'resolveTicket',id,'Bienvenue, préparez votre dossier.','Autoriser le passage coach');ok(s.identities.find(a=>a.id===client.id).role==='client','staff does not switch role');fails(()=>cmd(s,coach,'activateCoachRole',id),/approuvée/);fails(()=>cmd(s,client,'activateCoachRole',id),/séances client/);
s=cmd(s,client,'cancelSession','b1','Passage professionnel');s=cmd(s,client,'activateCoachRole',id);let projected=D.project(s,client);ok(projected.account.role==='coach','client confirms conversion');ok(!M.configFor(s,client.id).published,'new professional unpublished');ok(M.configFor(s,client.id).dossier.status==='draft','dossier required');ok(projected.bookings.length===1,'client history preserved');ok(Msg.conversations(projected)[0].name==='Coach Test','historical conversation counterpart correct');fails(()=>cmd(s,client,'activateCoachRole',id),/approuvée/);fails(()=>cmd(s,client,'publish',client.id),/profil|dossier/);ok(s.tickets.find(t=>t.id===id).application==='activated','decision completion tracked');
}
(async()=>{
const feature=(label,type='housenumber',score=.9)=>({type:'Feature',properties:{label,type,score},geometry:{type:'Point',coordinates:[2.38,48.86]}});
const fake=features=>async()=>({ok:true,json:async()=>({features})});
const p=await resolveGeo(near.label,true,fake([feature(near.label)]));ok(p.latitude===48.86,'provider resolution');
for(const [query,street,features] of [['Paris',true,[feature('Paris','municipality')]],['Rue inconnue',true,[feature('Rue A','street',.9),feature('Rue B','street',.88)]],['Non reconnu',false,[]]]){await assert.rejects(()=>resolveGeo(query,street,fake(features)),/imprécise/);checks++;}
await assert.rejects(()=>resolveGeo(near.label,true,async()=>{throw Error('offline')}),/momentanément indisponible/);checks++;
console.log(`PASS ${checks} feature-35 suspension, home radius, dated availability, alerts, coach application and resolver checks.`);
})().catch(e=>{console.error(e);process.exitCode=1});
