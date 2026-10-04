const fs = require('node:fs'), assert = require('node:assert/strict');
const ts = require('../apps/mobile/node_modules/typescript');
require.extensions['.ts'] = (m,f) => m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,f);
const M = require('../apps/mobile/src/product/model.ts');
let checks=0;
function ok(value, label) { assert.ok(value,label); checks++; }
for (const [day,time] of [['2027-03-28','02:00'],['2027-03-28','02:59'],['2026-02-30','10:00'],['invalid','10:00'],['2026-10-25','24:00']])
  ok(Number.isNaN(M.instant(day,time)), `Reject invalid Paris time ${day} ${time}`);
for(const [day,time,iso] of [
 ['2027-03-28','01:30','2027-03-28T00:30:00.000Z'],
 ['2027-03-28','03:30','2027-03-28T01:30:00.000Z'],
 ['2026-10-25','02:30','2026-10-25T01:30:00.000Z'],
 ['2026-10-25','03:30','2026-10-25T02:30:00.000Z'],
 ['2026-07-01','12:00','2026-07-01T10:00:00.000Z']])
  ok(new Date(M.instant(day,time)).toISOString() === iso, `Stable instant ${day} ${time}`);
ok(!M.validSessionTime('2027-03-28','01:30',120),'Spring crossing cannot sell 120 minutes as 60');
ok(!M.validSessionTime('2026-10-25','01:30',120),'Autumn crossing cannot sell 120 minutes as 180');
ok(M.validSessionTime('2026-10-25','02:30',60),'Later repeated hour has correct elapsed duration');
ok(M.validSessionTime('2026-10-24','23:00',60),'Midnight endpoint supported');
ok(M.instant('2027-03-29','00:00')-M.instant('2027-03-28','00:00')===23*3600000,'Spring calendar day = 23 hours');
ok(M.instant('2026-10-26','00:00')-M.instant('2026-10-25','00:00')===25*3600000,'Autumn calendar day = 25 hours');
// Recurrence skips impossible starts without throwing or shifting a coach's time.
const W=require('../apps/mobile/src/product/workflows.ts');
const store=W.loginDemo(M.newPreviewStore(),'thomas@example.test','','coach',false);
const coach=M.allCoaches(store).find(c=>c.id==='0'), offer=store.offers.find(o=>o.coach==='0'&&o.kind==='Individuel');
store.settings ??= {};
store.settings['0']={...M.configFor(store,'0'),published:true,horizon:365,notice:0,exceptions:{'2027-03-28':[['01:00','05:00',[offer.id]]]},weeklyConfigured:true};
M.setDemoClock((Date.parse('2027-03-27T10:00:00Z')-Date.now())/3600000);
store.settings['0'].dossier={status:'approved',expires:'2099-12-31',documents:[],history:[],reason:''};
const slots=M.slotsFor(coach,'2027-03-28',store,offer);
ok(!slots.includes('02:00')&&!slots.includes('02:30'),'No nonexistent start offered');
ok(slots.includes('03:00'), 'Valid post-DST departure remains bookable');
M.setDemoClock(0);
// Dependency regressions: normal behavior plus hostile inputs. No suppression of npm advisories.
const braces=require('../apps/mobile/node_modules/braces');
assert.deepEqual(braces.expand('src/{a,b}.ts'),['src/a.ts','src/b.ts']);checks++;
for(const fn of ['parse','compile','expand','stringify']) {
  assert.throws(()=>braces[fn]('{'.repeat(10000)+'a,b'+'}'.repeat(10000)),SyntaxError); checks++;
}
const ast={type:'root',nodes:[]};let node=ast;
for(let i=0;i<1000;i++){const child={type:'brace',nodes:[]};node.nodes.push(child);node=child;}
for(const fn of ['compile','expand','stringify']){assert.throws(()=>braces[fn](ast),SyntaxError);checks++;}
const forge=require('../apps/mobile/node_modules/node-forge'), a=forge.asn1;
const keys=forge.pki.rsa.generateKeyPair({bits:1024,e:0x10001});
const md=forge.md.sha256.create().update('partant-patch-regression');
const digest=md.digest().getBytes();
ok(keys.publicKey.verify(digest,keys.privateKey.sign(md)),'Normal RSA signature accepted');
const make=(members)=>a.toDer(a.create(a.Class.UNIVERSAL,a.Type.SEQUENCE,true,[
 a.create(a.Class.UNIVERSAL,a.Type.SEQUENCE,true,members),
 a.create(a.Class.UNIVERSAL,a.Type.OCTETSTRING,false,digest)
])).getBytes();
const oid=()=>a.create(a.Class.UNIVERSAL,a.Type.OID,false,a.oidToDer(forge.pki.oids.sha256).getBytes());
const nil=()=>a.create(a.Class.UNIVERSAL,a.Type.NULL,false,'');
for(const members of [[oid(),nil(),nil()],[oid(),a.create(a.Class.UNIVERSAL,a.Type.OCTETSTRING,false,'extra')],[oid(),a.create(a.Class.UNIVERSAL,a.Type.NULL,false,'extra')]]) {
 const sig=keys.privateKey.sign(make(members),'NONE');
 assert.throws(()=>keys.publicKey.verify(digest,sig),/DigestInfo/); checks++;
}
const noParameters=keys.privateKey.sign(make([oid()]),'NONE');
ok(keys.publicKey.verify(digest,noParameters),'SHA256 absent optional NULL accepted');
const {runtimeMode}=require('../apps/mobile/src/runtimeMode.ts');
for(const platform of ['ios','web','android']) for(const data of ['preview','connected',null]) {
 const mode=runtimeMode(true,platform,data,'preview','connections');
 ok(mode.live&&!mode.connectionTools,'Production never opens fixtures or tools');
}
ok(!runtimeMode(false,'web','preview').live,'Explicit development preview retained');
const app=JSON.parse(fs.readFileSync('apps/mobile/app.json','utf8'));
ok(app.expo.ios.privacyManifests.NSPrivacyCollectedDataTypes.length>0,'iOS data declaration populated');
ok(app.expo.ios.privacyManifests.NSPrivacyTracking===false,'No tracking declared');
console.log(`PASS ${checks} hardening regressions (DST, dependency mitigations)`);
