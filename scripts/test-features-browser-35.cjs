const fs=require('fs'),path=require('path'),assert=require('assert/strict'),ts=require('../apps/mobile/node_modules/typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,f);
const {chromium}=require('../tools/qa/node_modules/playwright'), M=require('../apps/mobile/src/product/model.ts'),W=require('../apps/mobile/src/product/workflows.ts');
const out=path.resolve('work/qa-results/features35');fs.mkdirSync(out,{recursive:true});let checks=0;
const ok=(v,label)=>{assert.ok(v,label);checks++};
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.PARTANT_QA_CHROME});try{
for(const width of [390,1440]){
let s=W.loginDemo(M.newPreviewStore(),'alex@example.test','','client',false);
s={...s,tickets:[{id:'approved-application',owner:s.account.id,kind:'Assistance',body:'Candidature coach : Enseigner le Pilates à Paris.',status:'resolved',response:'Votre projet est accepté. Préparez votre dossier.',application:'approved',decidedBy:'team-fixture',decidedAt:new Date().toISOString()}]};
const page=await browser.newPage({viewport:{width,height:950}});page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(seed=>localStorage.setItem('partant-native-preview-v1',JSON.stringify(seed)),s);
await page.goto((process.env.PARTANT_QA_URL||'http://127.0.0.1:8081')+'/?data=preview&surface=web');
await page.getByText(width < 1080 ? 'Mon espace' : s.account.name,{exact:true}).click();
await page.getByRole('button',{name:/Aide & mes demandes/}).click();
await page.getByRole('button',{name:'Préparer mon passage coach',exact:true}).click();
await page.getByRole('button',{name:'Confirmer et préparer mon dossier coach',exact:true}).waitFor();
ok((await page.locator('body').innerText()).includes('sans bascule vers l’espace client'),'explicit one-way conversion');
await page.screenshot({path:path.join(out,`application-${width}.png`)});
await page.getByRole('button',{name:'Confirmer et préparer mon dossier coach',exact:true}).click();
await page.getByText('Votre dossier coach.',{exact:false}).waitFor();
ok(!(await page.locator('body').innerText()).includes('Votre candidature est en cours.'),'no stale client page');
await page.screenshot({path:path.join(out,`dossier-${width}.png`)});
ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow');
await page.addScriptTag({path:path.resolve('tools/qa/node_modules/axe-core/axe.min.js')});
const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));ok(!violations.length,'dossier accessibility');
ok(!errors.length,'no browser exception');
await page.close();
}
console.log(`PASS ${checks} feature-35 mobile/desktop application transition and dossier checks.`);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
