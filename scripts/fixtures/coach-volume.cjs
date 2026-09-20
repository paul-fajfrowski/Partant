// Synthetic UI workload. Never imports real accounts or calls a backend.
const fs = require('node:fs');
const ts = require('../../apps/mobile/node_modules/typescript');
require.extensions['.ts'] = (m,f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,f);
const M=require('../../apps/mobile/src/product/model.ts');
const W=require('../../apps/mobile/src/product/workflows.ts');
module.exports=function createVolumeScenario(){
 let s=W.loginDemo(M.newPreviewStore(),'thomas@example.test','Thomas','coach',false);
 // A unique coach identity also isolates message drafts from the regular demo.
 const coach={...s.account,id:'volume-coach',coachId:'0',email:'volume-coach@example.test'};
 const names=['Camille','Alex','Nina','Jules','Sarah','Hugo','Léa','Adam','Inès','Louis','Emma','Noé','Chloé','Gabriel','Zoé','Arthur','Manon','Raphaël','Clara','Paul','Louise','Sacha','Alice','Nathan','Lina','Maxime','Jeanne','Ethan','Mila','Antoine','Eva','Victor','Rose','Théo','Anna','Lucas'];
 const clients=names.map((name,i)=>({id:`volume-client-${i}`,name:`${name} ${['Martin','Bernard','Petit','Robert'][i%4]}`,email:`volume-client-${i}@example.test`,role:'client'}));
 const base={...s.bookings[0],coach:'0',offerId:'0:solo',serviceName:'Coaching individuel',kind:'Individuel',duration:60,seats:1,price:50,format:'Parc',address:'Parc des Buttes-Chaumont, Paris',changes:[]};
 const cfg=M.configFor(s,'0');
 s={...s,account:coach,identities:[coach,...clients],bookings:[],notices:[],messages:{},proposals:[],tickets:[],attempts:[],alerts:[],settings:{...s.settings,'0':{...cfg,dossier:{...cfg.dossier,status:'correction'}}},calendarStatus:{'0':{connected:true,updatedAt:Date.now()-9*86400000,error:'Connexion à renouveler · simulation'}}};
 const at=Date.now();
 const add=(id,event,b,stamp,read=true,extra={})=>s.notices.push({id,event,recipient:coach.id,booking:b?.id||'',body:event==='cancelled'?'Séance annulée par le client.':event==='message'?'Vous avez reçu un message.':event==='dossier'?'Votre dossier est à compléter.':'Événement de simulation.',createdAt:stamp,read,category:event==='booking'?'booking':'changes',...(b?{context:M.noticeContext(s,b)}:{}),...extra});
 for(let i=0;i<144;i++){
  const client=clients[i%36],day=M.addDays(M.today(),Math.floor(i/4)-33+(i>=132?3:0));
  const cancelled=i%6===0;
  const b={...base,id:`volume-booking-${i}`,clientId:client.id,clientName:client.name,day,time:['09:00','11:00','15:00','18:00'][i%4],status:cancelled?'cancelled':i<132?'completed':'confirmed'};
  s.bookings.push(b);
  const received=at-(42-i*40/144)*86400000;
  add(`volume-reservation-${i}`,'booking',b,received,i<132,{context:M.noticeContext(s,{...b,status:'confirmed'})});
  if(cancelled)add(`volume-cancelled-${i}`,'cancelled',b,received+86400000,i<120);
  if(i%4===1)add(`volume-change-${i}`,'rescheduled',b,received+43200000,i<128,{previous:M.noticeContext(s,{...b,time:'08:00'})});
  if(i<24)add(`volume-review-${i}`,'review',b,received+172800000,true);
 }
 for(let i=0;i<36;i++){
  const b=s.bookings[108+i],client=clients[i];
  for(let j=0;j<6;j++){
   const createdAt=at-(i+1)*3600000+j*60000,id=`volume-message-${i}-${j}`;
   const message={id,who:client.id,text:['Bonjour Thomas, une question pour notre séance.','On se retrouve à l’entrée du parc ?','Je viendrai avec ma gourde.','Est-ce qu’on garde le même programme ?','Merci pour les précisions.','À bientôt !'][j],createdAt,readBy:[client.id],context:M.noticeContext(s,b)};
   (s.messages[b.id]??=[]).push(message);
   add(`notice-${id}`,'message',b,createdAt,false,{messageId:id});
  }
 }
 add('volume-calendar','calendar',null,at-9*86400000,true);
 add('volume-dossier','dossier',null,at-12*86400000,true);
 s.notices.push({id:'volume-private',event:'booking',recipient:'another-coach',booking:'',body:'Confidentiel autre coach',read:false,createdAt:at});
 return {store:s,meta:{bookings:144,clients:36,notices:446,messages:216,weeks:6,generatedAt:new Date(at).toISOString()}};
};
