const base=require('./auth-connected-19.cjs');
const control=exports.control={unlocked:false,enrolled:false,claimed:false,listCalls:0,lastPage:0,fail:false,verify:false,decisionRequests:[],decided:false};
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
const factor={id:'11111111-1111-4111-8111-111111111111',factor_type:'totp',status:'verified',friendly_name:'Partant'};
exports.fetch=async(input,init={})=>{
 const url=String(input.url??input),body=JSON.parse(init.body||'{}');
 if(url.includes('/auth/v1/factors')) {
  if(url.endsWith('/verify')) {control.verify=true;if(body.code!=='123456')return reply({message:'Invalid code'},422);control.unlocked=true;const r=await base.fetch('/auth/v1/verify',{body:'{}'});const d=await r.json();d.user.factors=[factor];return reply(d);}
  if(url.endsWith('/challenge'))return reply({id:'challenge-id',type:'totp',expires_at:Date.now()/1000+60});
  if(init.method==='DELETE')return reply({id:factor.id});
  control.enrolled=true;return reply({id:factor.id,type:'totp',totp:{secret:'JBSWY3DPEHPK3PXP',uri:'otpauth://totp/fixture',qr_code:'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>'}});
 }
 const r=await base.fetch(input,init);if(!url.includes('/functions/v1/product-api'))return r;
 const result=await r.json();if(!result.store.account)return reply(result);
 if(body.commands?.some(c=>c.name==='reviewPractice')){
  control.decisionRequests.push(body.requestId);
  control.decided=true;
  if(control.decisionRequests.length===1)return reply({error:'Réponse perdue après enregistrement de test.'},503);
  if(new Set(control.decisionRequests).size!==1)return reply({error:'Idempotence perdue'},400);
 }
 const store={...result.store,staff:control.unlocked,teamAccess:{role:'admin',unlocked:control.unlocked}};
 if(body.team){
  if(!control.unlocked)return reply({error:'MFA required'},403);
  if(control.fail)return reply({error:'Erreur de test : accès indisponible.'},503);
  const items=Array.from({length:12},(_,i)=>({id:`qa-${i}`,name:`Coach test ${i+1}`,area:'Paris',practices:['Running'],status:'pending',assignment:i===0&&control.claimed?'mine':'free'}));
  if(body.team.action==='list'){control.listCalls++;control.lastPage=body.team.page;const matches=items.filter(x=>x.name.toLowerCase().includes(body.team.query.toLowerCase()));return reply({items:matches.slice(body.team.page*10,body.team.page*10+10),page:body.team.page,total:matches.length});}
  if(body.team.action==='claim'){control.claimed=true;return reply({changed:true});}
  if(body.team.action==='release'){control.claimed=false;return reply({changed:true});}
  const template=store.extraCoaches[0],cfg=store.settings[template.id];
  store.extraCoaches=[{...template,id:body.team.coach,name:items.find(i=>i.id===body.team.coach).name}];const V=require('../../apps/mobile/src/product/verification.ts'),M=require('../../apps/mobile/src/product/model.ts');
  const v=V.toVerification(cfg.dossier,template,M.today());
  for(const p of v.practices)v.reviews[p]={status:control.decided?'correction':'pending',fingerprint:V.proofFingerprint(v,p),reason:'Test',at:new Date().toISOString()};
  store.settings={[body.team.coach]:{...cfg,dossier:{...cfg.dossier,verification:v,status:control.decided?'correction':'pending'}}};
 }
 return reply({...result,store});
};
