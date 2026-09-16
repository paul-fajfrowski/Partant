const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const {JSDOM,VirtualConsole}=require(path.join(root,'work/qa-runtime/node_modules/jsdom'));
const dom=new JSDOM(fs.readFileSync(path.join(root,'outputs/partant.html'),'utf8'),{url:'http://localhost:8766',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:new VirtualConsole(),beforeParse(w){w.HTMLDialogElement.prototype.showModal=function(){this.open=true};w.HTMLDialogElement.prototype.close=function(){this.open=false};w.HTMLElement.prototype.scrollIntoView=function(){};}});
const w=dom.window;
const evaluate=expression=>JSON.parse(w.eval('JSON.stringify('+expression+')'));
const data={coaches:evaluate('originalSeedCoaches'),icons:evaluate('icons'),sportGoals:evaluate('sportGoals'),services:evaluate('originalSeedCoaches.map(c=>({coach:c.id,offers:servicesFor(c.id)}))'),coachSections:evaluate('coachSections'),availability:evaluate('originalSeedCoaches.map(c=>Array.from({length:7},(_,i)=>allSlots(c,todayIndex()+i)))'),anchor:evaluate('parisISO()'),goals:evaluate('Object.fromEntries(Object.keys(sportGoals).map(s=>[s,goalsFor(s)]))')};
fs.writeFileSync(path.join(root,'apps/mobile/src/reference/prototype.json'),JSON.stringify(data,null,2)+'\n');
for(const name of ['welcome','login','codeScreen','onboarding','explore','profile','account','coachHome','setup','checkout']){
 try{const html=w.eval(name+'()');fs.writeFileSync('/private/tmp/partant-'+name+'.html',html)}catch(e){console.log(name+': needs state setup')}
}
console.log('Reference extracted: '+data.coaches.length+' coaches; '+Object.keys(data.icons).length+' SVGs; '+Object.keys(data.sportGoals).length+' practices.');
dom.window.close();
