const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('../apps/mobile/node_modules/typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,f);
const M=require('../apps/mobile/src/product/model.ts'),W=require('../apps/mobile/src/product/workflows.ts');
const {chromium}=require(process.env.PARTANT_QA_PLAYWRIGHT||'../tools/qa/node_modules/playwright');
const base=process.env.PARTANT_QA_URL||'http://127.0.0.1:8081',out=process.env.PARTANT_QA_SCREENSHOTS||'work/product38/screens';fs.mkdirSync(out,{recursive:true});
let checks=0;const ok=(v,l)=>{assert.ok(v,l);checks++};
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.PARTANT_QA_CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 try {
  for(const width of [390,1440]) {
   const seed=W.loginDemo(M.newPreviewStore(),'alex@example.test','','client',false),day=M.addDays(M.today(),1);
   const original=seed.offers.find(o=>o.coach==='0'&&o.kind==='Individuel');
   seed.coachOverrides={...seed.coachOverrides,'0':{sport:'Musculation',disciplines:['Musculation','Running']}};
   seed.offers=[{...original,id:'test-strength',name:'Musculation audit',discipline:'Musculation',price:50},{...original,id:'test-running',name:'Running audit',discipline:'Running',price:45},...seed.offers.filter(o=>o.coach!=='0')];
   const cfg=M.configFor(seed,'0');seed.settings={...seed.settings,'0':{...cfg,weeklyConfigured:true,week:Array.from({length:7},()=>[]),exceptions:{[day]:[['09:00','20:00']]},published:true,notice:0,locations:{...cfg.locations,Domicile:{type:'Domicile',name:'Chez le client',sector:'Paris 11e',radius:3,travelFee:20}}}};
   const p=await b.newPage({viewport:{width,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(12000);
   await p.addInitScript(s=>{if(!localStorage.getItem('qa38-seeded')){localStorage.setItem('partant-native-preview-v1',JSON.stringify(s));localStorage.setItem('qa38-seeded','1');}},seed);
   await p.goto(base+'/?data=preview&surface=web');
   const button=n=>p.getByRole('button',{name:n,exact:true});
   await p.getByPlaceholder('Un sport, un coach, un quartier').fill('Thomas Martin');
   await button('Voir le profil de Thomas Martin').first().waitFor();
   ok((await p.locator('body').innerText()).includes('Running audit'),'Named coach tomorrow appears in flexible discovery');
   await button('Aujourd’hui').click();await p.getByText('Aucun résultat pour « Thomas Martin »',{exact:true}).waitFor();
   ok(await button(M.dayLabel(day)).count()>0,'Alternative dates retain named query');
   await button('Prochainement').click();await button('Running').click();
   ok(!(await p.locator('body').innerText()).includes('Musculation audit'),'Running results exclude strength offering');
   await button('Voir le profil de Thomas Martin').first().click();
   await p.waitForURL(u=>u.searchParams.get('view')==='profile');
   ok(new URL(p.url()).searchParams.get('offer')==='test-running','Matching offer in shareable profile route');
   const url=p.url();await p.reload();await button('Partager ce profil').waitFor();
   ok(new URL(p.url()).searchParams.get('date')===day,'Profile selected date retained on reload');
   await p.goBack();await button('Filtres').waitFor();
   ok(new URL(p.url()).searchParams.get('q')==='Thomas Martin','Browser Back returns to same search');
   await p.goForward();await button('Partager ce profil').waitFor();
   await button('Retour').click();await button('Filtres').waitFor();
   ok(new URL(p.url()).searchParams.get('view')==='explore','In-app back cooperates with browser history');
   await button('Tout').click();await button('Filtres').click();
   const slider=p.getByRole('slider',{name:'Budget maximum par séance'});await slider.focus();await slider.press('Home');for(let i=0;i<6;i++)await slider.press('ArrowRight');
   await button('Lieu de la séance : Tous').click();await p.getByRole('radio',{name:'Domicile',exact:true}).click();await button('Voir les coachs').click();
   await p.getByText('Aucun résultat pour « Thomas Martin »',{exact:true}).waitFor();
   ok(!(await p.locator('body').innerText()).includes('Tout compris'),'No misleading all-inclusive base price');
   // A fresh tab starts at the same destination, without requiring a preceding click.
   await p.goto(url);await button('Partager ce profil').waitFor();
   await p.screenshot({path:path.join(out,`product38-profile-${width}.png`),fullPage:true});
   ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No profile horizontal overflow');
   await p.goto(base+'/?data=preview&surface=web&view=config&section=schedule');await button('Filtres').waitFor();await p.waitForURL(u=>u.searchParams.get('view')==='explore');
   ok(new URL(p.url()).searchParams.get('view')==='explore','Client cannot navigate into coach configuration');
   await p.goto(base+'/?data=preview&surface=web&view=bookingDetail&booking=not-owned');
   await p.waitForTimeout(400);ok(!(await p.locator('body').innerText()).includes('Annuler ma séance'),'Unknown private booking has no write action');
   ok(errors.length===0,'No browser exception: '+errors.join(';'));await p.close();
  }
 }finally{await b.close();}
 console.log(`PASS ${checks} product 38 browser checks (390 and 1440 px)`);
})().catch(e=>{console.error(e);process.exitCode=1});
