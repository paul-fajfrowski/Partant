const fs=require('node:fs'),assert=require('node:assert/strict'),ts=require('../apps/mobile/node_modules/typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,f);
const {secureSessionStorage}=require('../apps/mobile/src/lib/secureSessionStorage.ts');
const memory=()=>({map:new Map(),async getItem(k){return this.map.get(k)??null},async setItem(k,v){this.map.set(k,v)},async removeItem(k){this.map.delete(k)}});
(async()=>{
 const s=memory(),l=memory(),a=secureSessionStorage(s,l),k='sb-partant-auth-token',token='😀é'.repeat(5000);let n=0;
 const check=(v)=>{assert.ok(v);n++};
 await l.setItem(k,token);check(await a.getItem(k)===token);check(!l.map.size);check([...s.map.values()].every(v=>Buffer.byteLength(v)<=2048));
 const original=s.setItem.bind(s);s.setItem=async(key,v)=>{if(key.endsWith('.b.1'))throw Error('interrupted');return original(key,v)};
 await assert.rejects(a.setItem(k,'X'.repeat(1000)));n++;check(await a.getItem(k)===token);check(![...s.map.keys()].some(k=>k.includes('.b.')));
 s.setItem=original;await Promise.all([a.setItem(k,'new'),a.removeItem(k)]);check(await a.getItem(k)===null);check(s.map.size===0);check(l.map.size===0);
 await a.setItem(k,'final');check(await a.getItem(k)==='final');await a.setItem(k,'');check(await a.getItem(k)==='');await a.removeItem(k);
 await assert.rejects(a.setItem('../bad','x'));n++;await assert.rejects(a.setItem(k,'a'.repeat(52000)));n++;check(s.map.size===0);
 await a.setItem(k,'a'.repeat(1000));s.map.delete('partant.'+k+'.a.1');await assert.rejects(a.getItem(k));n++;await a.removeItem(k);check(s.map.size===0);
 console.log('PASS '+n+' secure session migration, chunking, interrupted writes and logout checks.');
})().catch(e=>{console.error(e);process.exitCode=1});
