// Report upstream advisories, fail for anything outside the documented, tested mitigations.
const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const approved=new Set(['GHSA-vfj7-8cjw-p6xm','GHSA-86w9-cpqp-85rv']);
let failed=false;
for(const dir of ['apps/mobile','tools/qa','services/calendar']) {
 const r=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['audit','--json'],{cwd:path.join(root,dir),encoding:'utf8',timeout:60000,maxBuffer:8*1024*1024});
 let report;try{report=JSON.parse(r.stdout)}catch{throw Error(`Dependency audit unavailable: ${dir}`)}
 if(report.error || r.error || !report.vulnerabilities) throw Error(`Dependency audit unavailable: ${dir}`);
 const advisories=[...new Map(Object.values(report.vulnerabilities).flatMap(v=>v.via).filter(v=>v&&typeof v==='object').map(v=>[v.url,v])).values()];
 for(const a of advisories) {
   const id=a.url.split('/').pop(), mitigated=dir==='apps/mobile'&&approved.has(id);
   console.log(`${mitigated?'MITIGATED (upstream still flagged)':'UNREVIEWED'} ${dir} ${id} ${a.severity}`);
   if(!mitigated)failed=true;
 }
 console.log(`${dir}: ${advisories.length} root advisory/advisories`);
}
// Exact-source patches and behavioral tests must be present, not just an allowlist.
require('../apps/mobile/scripts/patch-audit-36.cjs');
const test=spawnSync(process.execPath,['--no-experimental-strip-types',path.join(__dirname,'test-hardening-36.cjs')],{cwd:root,stdio:'inherit'});
if(test.status!==0)failed=true;
process.exitCode=failed?1:0;
