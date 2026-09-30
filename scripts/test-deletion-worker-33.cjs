const fs=require('node:fs'),ts=require('../apps/mobile/node_modules/typescript'),assert=require('node:assert/strict');
const m={exports:{}};new Function('exports','module',ts.transpileModule(fs.readFileSync('supabase/functions/_shared/accountDeletion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(m.exports,m);
let checks=0;const ok=(v,msg)=>{assert.ok(v,msg);checks++};
async function run({count=2,listFailure=false,removeFailure=false,authFailure=false,missing=false,leaseValid=true}={}){
 const objects=new Map(['coach-documents','coach-photos'].map(bucket=>[bucket,Array.from({length:count},(_,i)=>({id:String(i),name:i+'.pdf'}))]));
 const calls=[];let finished;
 const admin={rpc:async(name,args)=>{
  if(name==='product_deletion_claim')return {data:[{actor:'actor-test',attempts:1}]};
  finished=args;return {data:leaseValid};
 },storage:{from:bucket=>({list:async(prefix,opts)=>{ok(prefix==='actor-test'&&opts.offset===0,'Only actor prefix, restart after removals');return listFailure?{error:{}}:{data:objects.get(bucket).slice(0,opts.limit)}},remove:async(paths)=>{calls.push(['remove',bucket]);ok(paths.every(p=>p.startsWith('actor-test/')),'No cross-account deletion');if(removeFailure)return {error:{}};objects.set(bucket,objects.get(bucket).filter(o=>!paths.includes('actor-test/'+o.name)));return {}}})},auth:{admin:{deleteUser:async(id)=>{calls.push(['auth',id]);ok([...objects.values()].every(a=>a.length===0),'Auth deletion only after storage is empty');return {error:authFailure?{status:503}:missing?{status:404}:null}}}}};
 const result=await m.exports.runAccountDeletions(admin);
 return {result,finished,calls};
}
(async()=>{
 let r=await run();ok(r.result.completed===1&&r.finished.p_stage==='completed','Successful deletion acknowledged');
 for(const failure of ['listFailure','removeFailure']){r=await run({[failure]:true});ok(r.result.completed===0&&!r.calls.some(c=>c[0]==='auth'),'Storage failure does not claim completion');ok(r.finished.p_error==='storage_unavailable','Storage retry recorded');}
 r=await run({authFailure:true});ok(r.finished.p_stage==='auth'&&r.finished.p_error==='auth_unavailable','Auth failure persisted for retry');
 r=await run({missing:true});ok(r.result.completed===1,'Already removed Auth is idempotent success');
 r=await run({count:401});ok(r.finished.p_error==='storage_pending'&&!r.calls.some(c=>c[0]==='auth'),'Large folder is bounded and continued on retry');
 r=await run({leaseValid:false});ok(r.result.completed===0,'Stale lease cannot report completion');
 console.log(`PASS ${checks} erasure worker scope, provider failure, bounded work and replay checks.`);
})().catch(e=>{console.error(e);process.exitCode=1});
