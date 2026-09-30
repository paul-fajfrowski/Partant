// Deterministic local/CI suite: fixtures only, no privileged remote writes.
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),qa=path.join(root,'tools/qa/node_modules');
const out=process.env.PARTANT_QA_OUTPUT||path.join(root,'work/qa-results');fs.mkdirSync(out,{recursive:true});
const env={...process.env,PARTANT_QA_JSDOM:process.env.PARTANT_QA_JSDOM||path.join(qa,'jsdom'),PARTANT_QA_PLAYWRIGHT:process.env.PARTANT_QA_PLAYWRIGHT||path.join(qa,'playwright'),PARTANT_QA_AXE:process.env.PARTANT_QA_AXE||path.join(qa,'axe-core/axe.min.js')};
const browser=process.argv.includes('--browser');
const names=browser?['test-agenda-density-30','test-availability-editor-31','test-back-layers-32','test-documents-browser-28','test-range-browser-29','test-webapp-27','test-keyboard-responsive-33','test-notification-browser-33','test-experience-browser-34','test-features-browser-35']:require('./qa-suites.json');
const priority=["test-coach-volume","test-notification-paging","test-google-integration"];
const rank=name=>priority.includes(name)?priority.indexOf(name):priority.length;
if(!browser) names.sort((a,b)=>rank(a)-rank(b));
const cases=names.map(name=>({name}));
if(!browser) cases.push({name:'test-privacy-25',suffix:'coach',extra:{PARTANT_QA_ROLE:'coach'}});
let failed=0;const results=[];
for(const c of cases){const start=Date.now();const r=spawnSync(process.execPath,['--no-experimental-strip-types',path.join(__dirname,c.name+'.cjs')],{cwd:root,env:{...env,...c.extra},encoding:'utf8',timeout:180000,maxBuffer:10*1024*1024});const log=(r.stdout||'')+(r.stderr||'');const name=c.name+(c.suffix?'-'+c.suffix:'');fs.writeFileSync(path.join(out,name+'.log'),log);const pass=r.status===0&&!r.error;if(!pass)failed++;results.push({name,pass,seconds:Math.round((Date.now()-start)/100)/10,error:r.error?.message,summary:log.split('\n').filter(l=>l.startsWith('PASS '))});console.log((pass?'PASS ':'FAIL ')+name);if(!pass&&process.argv.includes('--fail-fast'))break;}
fs.writeFileSync(path.join(out,browser?'browser.json':'unit-dom.json'),JSON.stringify(results,null,2));
console.log(`${results.length-failed}/${results.length} suites passed. Reports: ${out}`);process.exitCode=failed?1:0;
