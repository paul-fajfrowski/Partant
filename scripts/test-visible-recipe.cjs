// Executes the visible replay controller against the actual exported application in DOM.
// This validates actions and storage isolation, not pixels or a native device.
const fs=require('node:fs'),assert=require('node:assert/strict');
process.env.PARTANT_QA_URL='http://127.0.0.1:8081/?data=preview&recette=visible-qa';
const H=require('./native-web-harness.cjs');
const {JSDOM}=require('../work/qa-runtime/node_modules/jsdom');
const parent=new JSDOM(fs.readFileSync('apps/mobile/public/recette.html','utf8').replace('<script src="recette.js"></script>',''),{url:'http://127.0.0.1:8081/recette.html',runScripts:'dangerously',pretendToBeVisual:true});
const w=parent.window,frame=w.document.getElementById('app');
Object.defineProperty(frame,'contentWindow',{get:()=>H.w});
Object.defineProperty(frame,'contentDocument',{get:()=>H.d});
Object.defineProperty(frame,'src',{get:()=>H.w.location.href,set:()=>{}});
Object.defineProperty(w,'localStorage',{value:H.w.localStorage});
Object.defineProperty(w.crypto,'randomUUID',{value:()=> 'visible-qa'});
const set=w.setTimeout.bind(w);w.setTimeout=(fn,ms)=>set(fn,Math.min(ms,180));
const sentinel=JSON.stringify({marker:'existing-demo-must-not-change'});
H.w.localStorage.setItem('partant-native-preview-v1',sentinel);
(async()=>{
 try{
  for(let i=0;i<80&&!H.d.body.textContent.includes('Bienvenue chez Partant.');i++)await H.wait();
  w.eval(fs.readFileSync('apps/mobile/public/recette.js','utf8'));
  w.document.getElementById('start').click();
  let done=false;
  for(let i=0;i<600;i++){
   await H.wait();
   if(!w.document.getElementById('start').disabled){done=true;break;}
  }
  assert.ok(done,'Replay completed before timeout');
  assert.equal(w.document.querySelectorAll('li.done').length,10,w.document.getElementById('result').textContent+'\n'+H.d.body.textContent.slice(-1800));
  assert.equal(H.w.localStorage.getItem('partant-native-preview-v1'),sentinel,'Original demo preserved');
  assert.ok(H.w.localStorage.getItem('partant-native-recette-visible-qa'),'Dedicated QA storage exists');
  assert.equal(H.errors.length,0,H.errors.join(';'));
  console.log('PASS visible replay: '+w.document.getElementById('result').textContent+' Original demo storage preserved. DOM only.');
 }finally{parent.window.close();H.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
