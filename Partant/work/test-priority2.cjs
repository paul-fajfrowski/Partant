const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('outputs/partant.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map(),listeners={};const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',open:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},focus(){},showModal(){this.open=true},close(){this.open=false},scrollTop:0,scrollIntoView(){}});return nodes.get(id)};
class TestData{constructor(f){this.data=f.fields||{}}get(k){return this.data[k]??null}getAll(k){let v=this.get(k);return v===null?[]:Array.isArray(v)?v:[v]}has(k){return this.get(k)!==null}entries(){return Object.entries(this.data)[Symbol.iterator]()}}
let memory={};const ctx=vm.createContext({document:{getElementById:node,addEventListener(t,fn){(listeners[t]??=[]).push(fn)},querySelectorAll(){return []}},localStorage:{getItem(k){return memory[k]||null},setItem(k,v){memory[k]=v},removeItem(k){delete memory[k]}},setTimeout(){},clearTimeout(){},console,Date,Blob,URL,FormData:TestData});
vm.runInContext(script,ctx);let count=0;const run=x=>vm.runInContext(x,ctx);const equal=(a,b,n)=>{assert.deepEqual(a,b,n);count++};const submit=(id,fields,dataset={})=>listeners.submit.forEach(fn=>fn({target:{id,fields,dataset},preventDefault(){}}));

run("activateAccount('coach-0');cfg.weeklyConfigured=true;cfg.services.push({id:'group-p2',name:'Renforcement collectif',kind:'Groupe',active:true,price:20,duration:60,capacity:6,groupFormat:'Parc'});operations.groups=[20,30,15,40].map((unitPrice,i)=>({id:'p2-'+i,coach:0,serviceId:'group-p2',name:['Parc','Studio','Mobilité','Petit groupe'][i],unitPrice,capacity:6,day:i+2,time:'18:00',duration:60,format:'Parc',location:{name:'Square Maurice-Gardette',address:'Paris 11e'},preparation:{...preparationDefaults},cancelHours:24,status:'open'}));persist();activateAccount('client-alex');act('join-group',{id:'p2-0'})");
submit('group-checkout-form',{participants:'3',goal:'Bouger'});run('doPay()');let bid=run('state.selectedBooking');
run(`identity.messages['${bid}']=[{id:'hello',sender:'client-alex',text:'Bonjour',at:1,readBy:['client-alex']}];operations.checks['${bid}']={equipment:true};persist()`);
run("activateAccount('client-nina');act('join-group',{id:'p2-0'})");submit('group-checkout-form',{participants:'2',goal:'Bouger aussi'});run('doPay()');equal(run("groupSeats(groupById('p2-0'))"),1);
run(`activateAccount('client-alex');act('partial-group',{id:'${bid}'})`);submit('partial-places-form',{remaining:'2'});equal(run('state.changeDraft.refund'),20);run("act('confirm-partial')");
equal(run(`bookingRecord('${bid}').participants`),2);equal(run(`bookingRecord('${bid}').price`),60);equal(run(`bookingRecord('${bid}').refund`),20);equal(run(`netPaid(bookingRecord('${bid}'))`),40);equal(run("groupSeats(groupById('p2-0'))"),2);equal(run('identity.events.at(-1).kind'),'participants');
let events=run('identity.events.length');run("act('confirm-partial')");equal(run('identity.events.length'),events,'Partial confirmation is not replayable');
run(`act('transfer-group',{id:'${bid}'});act('quote-transfer',{id:'p2-1'})`);equal(run('state.changeDraft.delta'),20);
run("act('fail-transfer')");equal(run(`bookingRecord('${bid}').groupSessionId`),'p2-0');equal(run(`netPaid(bookingRecord('${bid}'))`),40);
run("act('quote-transfer',{id:'p2-1'});act('confirm-transfer')");equal(run(`bookingRecord('${bid}').groupSessionId`),'p2-1');equal(run(`bookingRecord('${bid}').price`),80);equal(run(`bookingRecord('${bid}').refund`),20);equal(run(`netPaid(bookingRecord('${bid}'))`),60);equal(run("groupSeats(groupById('p2-0'))"),4);equal(run("groupSeats(groupById('p2-1'))"),4);equal(run(`identity.messages['${bid}'].length`),1);equal(run(`operations.checks['${bid}']`),undefined);equal(run('identity.events.at(-1).kind'),'transferred');equal(run(`bookingRecord('${bid}').changes.length`),2);
run(`act('transfer-group',{id:'${bid}'});act('quote-transfer',{id:'p2-2'})`);equal(run('state.changeDraft.delta'),-30);run("act('confirm-transfer');act('confirm-transfer')");equal(run(`bookingRecord('${bid}').refund`),50);equal(run(`netPaid(bookingRecord('${bid}'))`),30);equal(run(`bookingRecord('${bid}').changes.length`),3);
// No mutation if capacity, price, publication, or the source changed after the quote.
run(`act('transfer-group',{id:'${bid}'});act('quote-transfer',{id:'p2-3'});groupById('p2-3').capacity=1;act('confirm-transfer')`);equal(run(`bookingRecord('${bid}').groupSessionId`),'p2-2');equal(run(`bookingRecord('${bid}').price`),80);
run("groupById('p2-3').capacity=6;act('quote-transfer',{id:'p2-3'});groupById('p2-3').unitPrice=41;act('confirm-transfer')");equal(run(`bookingRecord('${bid}').groupSessionId`),'p2-2');equal(run('state.changeDraft'),null);
run(`act('quote-transfer',{id:'p2-3'});bookingRecord('${bid}').participants=1;act('confirm-transfer')`);equal(run(`bookingRecord('${bid}').groupSessionId`),'p2-2');run(`bookingRecord('${bid}').participants=2`);
run("act('quote-transfer',{id:'p2-3'});identity.configs[0].published=false;act('confirm-transfer')");equal(run(`bookingRecord('${bid}').groupSessionId`),'p2-2');run('identity.configs[0].published=true');
run(`state.bookings.push({...bookingRecord('${bid}'),id:'busy-p2',groupSessionId:null,day:5,time:'18:00',status:'confirmed'});act('quote-transfer',{id:'p2-3'})`);equal(run('state.changeDraft'),null);run("state.bookings=state.bookings.filter(b=>b.id!=='busy-p2')");
// Coach previews and exports use the remaining balance and cumulative refunds.
run(`activateAccount('coach-0');act('coach-cancel',{id:'${bid}'})`);
equal(node('modal-content').innerHTML.includes('Remboursement supplémentaire : <strong>30 €</strong>'),true);
equal(node('modal-content').innerHTML.includes('50 € déjà remboursés'),true);
run("downloadText=(filename,text,type)=>{state.testExport={filename,text,type}};act('export-sales')");
equal(run('state.testExport.text.includes(\'"80";"50";"4.50";"25.50"\')'),true);
run("activateAccount('client-alex')");
// Full cancellation after partial cancellation and two transfers must never over-refund.
run(`state.selectedBooking='${bid}';act('cancel-booking',{id:'${bid}'});act('confirm-cancel');act('confirm-cancel')`);equal(run(`bookingRecord('${bid}').refund`),80);equal(run(`netPaid(bookingRecord('${bid}'))`),0);equal(run("groupSeats(groupById('p2-2'))"),6);
// Too-late partial cancellation releases seats but retains their price.
run("operations.groups.push({...groupById('p2-0'),id:'late-p2',day:0,time:'18:00'});act('join-group',{id:'late-p2'})");submit('group-checkout-form',{participants:'3',goal:'Test'});run('doPay()');let late=run('state.selectedBooking');
run(`act('partial-group',{id:'${late}'});quotePartial(1);act('confirm-partial')`);equal(run(`bookingRecord('${late}').participants`),1);equal(run(`bookingRecord('${late}').refund`),0);equal(run(`bookingRecord('${late}').retainedFees`),40);equal(run(`netPaid(bookingRecord('${late}'))`),60);equal(run(`transferCandidates(bookingRecord('${late}')).length`),0);
run(`state.selectedBooking='${late}';act('confirm-cancel')`);equal(run(`netPaid(bookingRecord('${late}'))`),60);equal(run("groupSeats(groupById('late-p2'))"),6);equal(run(`bookingRecord('${late}').retainedFees`),60);
// Ownership and closed reservations.
run(`activateAccount('client-nina');act('partial-group',{id:'${bid}'})`);equal(run(`editableGroup('${bid}')`),null);run(`activateAccount('coach-0')`);equal(run(`ownedBooking('${bid}')`),null);
// Replay suggestions use the current offer and preserve objective/format.
run("activateAccount('client-alex');state.repeatBookingId=pastBooking.id;state.screen='repeat';identity.configs[1].services[0].price=67;identity.configs[1].services[0].duration=90;identity.configs[1].weeklyConfigured=true;render()");equal(run('repeatService(pastBooking).price'),67);equal(run('repeatOptions(pastBooking).length'),3);equal(node('view').innerHTML.includes('67 €'),true);
run("let next=repeatOptions(pastBooking)[0];startRepeatSlot(next.day,next.time)");equal(run('state.screen'),'setup');equal(run('state.booking.offerPrice'),67);equal(run('state.booking.duration'),90);equal(run('state.bookings.length'),3,'Repeat selection alone does not purchase');
run("state.screen='repeat';identity.configs[1].published=false");equal(run('repeatOptions(pastBooking).length'),0);run('identity.configs[1].published=true');
run(`state.repeatBookingId='${bid}';state.screen='repeat';render()`);equal(node('view').innerHTML.includes('Choisir mes places'),true);
// Persist the same reference, messages, amounts and history.
run('persist()');const reloadContext=vm.createContext({...ctx});vm.runInContext(script,reloadContext);const reload=x=>vm.runInContext(x,reloadContext);
equal(reload(`bookingRecord('${bid}').changes.length`),3);equal(reload(`bookingRecord('${bid}').refund`),80);equal(reload(`identity.messages['${bid}'].length`),1);equal(reload('state.bookings.every(b=>(b.refund||0)<=b.price)'),true);
run("activateAccount('coach-0');state.coachTab='activity';render()");equal(node('view').innerHTML.includes('Remboursements cumulés'),true);equal(node('view').innerHTML.includes('NaN'),false);
console.log(`PASS ${count} priority-two checks: repeat proposals, amounts, group capacity, transfers, partial/full cancellation, payment failure, stale quotes, ownership, notifications and persistence.`);
