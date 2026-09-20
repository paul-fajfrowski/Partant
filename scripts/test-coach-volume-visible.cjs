// Executes the visible volume scenario against the exported app, without a connected session.
const fs=require('node:fs'),assert=require('node:assert/strict');
process.env.PARTANT_QA_URL='http://127.0.0.1:8081/?data=preview&recette=volume-visible';
const H=require('./native-web-harness.cjs');
const {JSDOM}=require('../work/qa-runtime/node_modules/jsdom');
const parent=new JSDOM(fs.readFileSync('apps/mobile/public/coach-volume.html','utf8').replace('<script src="coach-volume.js"></script>',''),{url:'http://127.0.0.1:8081/coach-volume.html',runScripts:'dangerously',pretendToBeVisual:true});
const w=parent.window,frame=w.document.getElementById('app');
Object.defineProperty(frame,'contentWindow',{get:()=>H.w});Object.defineProperty(frame,'contentDocument',{get:()=>H.d});Object.defineProperty(frame,'src',{get:()=>H.w.location.href,set:()=>{}});
Object.defineProperty(w,'localStorage',{value:H.w.localStorage});Object.defineProperty(w.crypto,'randomUUID',{value:()=> 'visible'});
w.fetch=async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync('apps/mobile/public/coach-volume.json','utf8'))});
const set=w.setTimeout.bind(w);w.setTimeout=(fn,ms)=>set(fn,Math.min(ms,180));
const sentinel='preserve-user-demo';H.w.localStorage.setItem('partant-native-preview-v1',sentinel);
(async()=>{try{
 w.eval(fs.readFileSync('apps/mobile/public/coach-volume.js','utf8'));w.document.getElementById('start').click();
 let done=false;
 for(let i=0;i<400;i++){await H.wait();if(!w.document.getElementById('start').disabled){done=true;break;}}
 assert.ok(done,'Simulation timeout');
 assert.equal(w.document.querySelectorAll('li.done').length,7,w.document.getElementById('result').textContent);
 assert.equal(H.w.localStorage.getItem('partant-native-preview-v1'),sentinel);
 assert.ok(H.w.localStorage.getItem('partant-native-recette-volume-visible'));
 assert.equal(H.errors.length,0,H.errors.join(';'));
 console.log('PASS volume visible: 7 steps, normal demo preserved, no runtime errors. DOM only.');
}finally{parent.window.close();H.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
