// Audit visuel et axe sur des fixtures locales. Ne crée aucun compte serveur.
// Export web requis ; dépendances QA externes Playwright et axe-core.
const fs=require('node:fs'),ts=require('../apps/mobile/node_modules/typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,f);
const {chromium}=require(process.env.PARTANT_QA_PLAYWRIGHT || 'playwright');
const M=require('../apps/mobile/src/product/model.ts'),W=require('../apps/mobile/src/product/workflows.ts'),{coachAgendaPreview}=require('../apps/mobile/src/product/coachAgendaPreview.ts');
const out=process.env.PARTANT_AUDIT_OUTPUT || require('node:os').tmpdir()+'/partant-ui-audit';fs.mkdirSync(out,{recursive:true});let results=[];
(async()=>{const b=await chromium.launch({headless:true,...(process.env.PARTANT_QA_CHROME ? {executablePath:process.env.PARTANT_QA_CHROME} : {})});try{
for(const width of [320,390,820,1440]){
 for(const role of ['client','coach']){
 const c=await b.newContext({viewport:{width,height:960}});let seed=role==='coach'?coachAgendaPreview():W.loginDemo(M.newPreviewStore(),'alex@example.test','','client',false);
 await c.addInitScript(s=>localStorage.setItem('partant-native-preview-v1',JSON.stringify(s)),seed);
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.PARTANT_QA_URL || 'http://127.0.0.1:8081/').replace(/\?.*$/, '')+'?data=preview');await p.getByRole('button',{name:role==='coach'?(width<1080?'Configurer':'Disponibilités'):'Filtres',exact:true}).waitFor();
 async function inspect(name){await p.waitForTimeout(450);await p.addScriptTag({path:process.env.PARTANT_QA_AXE || require.resolve('axe-core/axe.min.js')});
 const a=await p.evaluate(async()=>{const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return {lang:document.documentElement.lang,overflow:document.documentElement.scrollWidth>innerWidth+1,violations:r.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,count:v.nodes.length,examples:v.nodes.slice(0,2).map(n=>({html:n.html,summary:n.failureSummary}))}))}});
 const targetCount=await p.evaluate(()=>[...document.querySelectorAll('[role="button"],[role="tab"]')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&r.top<innerHeight&&(r.width<44||r.height<44)}).length);
 await p.screenshot({path:`${out}/${role}-${name}-${width}.png`});results.push({role,width,name,...a,targetsUnder44:targetCount,errors:[...errors]});}
 await inspect('home');
 if(role==='coach'){
 await p.getByRole('button',{name:width<1080?'Configurer':'Disponibilités',exact:true}).click();await p.getByRole('button',{name:'Configurer lundi',exact:true}).click();await inspect('availability');
 await p.getByRole('button',{name:'Modifier la plage 09:00–11:00',exact:true}).click();await inspect('editor');
 }else{
 await p.getByRole('button',{name:'Filtres',exact:true}).click();await inspect('filters');
 }
 await c.close();
 }
}
console.log(results.map(r=>({role:r.role,width:r.width,screen:r.name,overflow:r.overflow,violations:r.violations.map(v=>v.id+':'+v.count),errors:r.errors})));fs.writeFileSync(out+'/ui-audit.json',JSON.stringify(results,null,2));
if(results.some(r=>r.overflow||r.violations.length||r.errors.length)) process.exitCode=1;
}finally{await b.close()}})().catch(e=>{console.error(e);process.exitCode=1});
