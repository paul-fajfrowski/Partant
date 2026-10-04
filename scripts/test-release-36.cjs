const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PARTANT_QA_PLAYWRIGHT||'../tools/qa/node_modules/playwright');
const ts=require('../apps/mobile/node_modules/typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,f);
const {coachAgendaPreview}=require('../apps/mobile/src/product/coachAgendaPreview.ts');
const root=path.resolve(__dirname,'..'),destination=path.join(root,'apps/web/dist-production');
assert(fs.existsSync(path.join(destination,'index.html')),'Build production first');
for(const file of fs.readdirSync(destination)) assert(!/^(simulation|recette|coach-volume|web)\.(html|js|json)$/.test(file),'No demo launcher in release');
assert(fs.readFileSync(path.join(destination,'_headers'),'utf8').includes("frame-ancestors 'self'"));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PARTANT_QA_CHROME});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.addInitScript(s=>localStorage.setItem('partant-native-preview-v1',JSON.stringify(s)),coachAgendaPreview());
  await page.route('**/functions/v1/product-api', route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:1,store:require('../apps/mobile/src/product/connectedDomain.ts').emptyConnected()})}));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.PARTANT_RELEASE_URL||'http://127.0.0.1:8099')+'/?data=preview&tools=connections&recette=coach-realiste-30');
  await page.getByText('Bienvenue chez Partant.',{exact:true}).waitFor();
  assert.equal(await page.getByTestId('desktop-agenda').count(),0,'Seeded demo coach cannot enter release');
  assert.equal(await page.getByText('Connexion au pilote',{exact:false}).count(),0,'Tool override ignored');
  assert.deepEqual(errors,[]);
  console.log('PASS production browser: demo URLs and seeded demo account ignored; connected welcome rendered; launchers removed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
