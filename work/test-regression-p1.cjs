const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('outputs/partant.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const nodes=new Map(),listeners={};const node=id=>{if(!nodes.has(id))nodes.set(id,{innerHTML:'',textContent:'',value:'',open:false,classList:{add(){},remove(){},toggle(){}},addEventListener(){},focus(){},showModal(){this.open=true},close(){this.open=false},scrollTop:0,scrollIntoView(){}});return nodes.get(id)};
class TestData{constructor(f){this.data=f.fields||{}}get(k){return this.data[k]??null}getAll(k){let v=this.get(k);return v===null?[]:Array.isArray(v)?v:[v]}has(k){return this.get(k)!==null}entries(){return Object.entries(this.data)[Symbol.iterator]()}}
let memory={};const ctx=vm.createContext({document:{getElementById:node,addEventListener(t,fn){(listeners[t]??=[]).push(fn)},querySelectorAll(){return []}},localStorage:{getItem(k){return memory[k]||null},setItem(k,v){memory[k]=v},removeItem(k){delete memory[k]}},setTimeout(){},clearTimeout(){},console,Date,Blob,URL,FormData:TestData});
vm.runInContext(script,ctx);let count=0;const run=x=>vm.runInContext(x,ctx);const equal=(a,b,n)=>{assert.deepEqual(a,b,n);count++};const submit=(id,fields,dataset={})=>listeners.submit.forEach(fn=>fn({target:{id,fields,dataset},preventDefault(){}}));
equal(run('state.screen'),'welcome');equal(run('results().length'),6);
run("act('entry-role',{id:'client'});act('entry-next',{})");equal(run('state.screen'),'login');submit('entry-form',{email:'alex@example.test'});equal(run('state.screen'),'code');submit('code-form',{code:'000000'});equal(run('state.screen'),'code');submit('code-form',{code:'123456'});equal(run('state.screen'),'onboarding');
submit('onboard-form',{sport:'Pilates',goal:'Améliorer ma mobilité',level:'Je reprends'});equal(run('state.onboardStep'),1);run("act('back',{})");equal(run('state.onboardStep'),0);submit('onboard-form',{sport:'Pilates',goal:'Améliorer ma mobilité',level:'Je reprends'});submit('onboard-form',{city:'Paris 11e',budget:'50',distance:'10'});submit('onboard-form',{format:'Visio',moment:'Libre'});equal(run('state.screen'),'explore');equal(run('results()[0].name'),'Sarah Dubois');equal(run('results().length'),1);
run("resetFilters();state.screen='explore';startBooking(0,'19:00',1);act('select-service',{id:'duo'});doPay()");equal(run('state.bookings[0].price'),70);equal(run('state.bookings[0].duration'),60);equal(run("avail(coaches[0],1).includes('19:00')"),false);
run("startBooking(1,'19:00',1);doPay()");equal(run('state.bookings.length'),1,'Client conflict');
run("state.selectedBooking=state.bookings[0].id;state.screen='detail';state.rescheduleChoice={day:2,time:'18:30'};act('confirm-reschedule',{})");equal(run('state.bookings[0].day'),2);equal(run('state.bookings[0].price'),70);
run("state.screen='config';state.configSection='offers'");submit('service-form',{name:'Bilan individuel',kind:'Individuel',duration:'90',price:'65'},{id:'solo'});equal(run('primaryService(0).duration'),90);equal(run('state.bookings[0].price'),70);
submit('config-form',{week:['0','1','2','3','4'],start:'09:00',end:'20:00',breakStart:'12:00',breakEnd:'14:00',useBreak:'on',daysOff:[]},{section:'schedule'});equal(run('cfg.weeklyConfigured'),true);equal(run("allSlots(coaches[0],0).includes('11:30')"),false,'90-minute service does not cross lunch');equal(run("allSlots(coaches[0],0).includes('18:30')"),true);equal(run("allSlots(coaches[0],0).includes('19:00')"),false,'Service fits opening hours');
run("state.screen='explore';startBooking(0,'14:00',1);doPay()");equal(run('state.bookings[1].duration'),90);equal(run('state.bookings[1].price'),65);
submit('config-form',{buffer:'30',notice:'2',horizon:'14',cancelHours:'48'},{section:'rules'});run("state.screen='explore'");equal(run("avail(coaches[0],1).includes('15:30')"),false,'Buffer protects following time');equal(run("avail(coaches[0],1).includes('16:00')"),true);equal(run('state.bookings[1].cancelHours'),24,'Paid cancellation policy is immutable');
run("cfg.published=false");equal(run('avail(coaches[0],1).length'),0);equal(run("state.bookings.filter(b=>b.status==='confirmed').length"),2);run('cfg.published=true');
submit('private-event-form',{day:'1',start:'14:00',end:'15:00',title:'Busy'});equal(run('cfg.privateEvents.length'),0,'Cannot block booked session');submit('private-event-form',{day:'0',start:'16:00',end:'17:00',title:'Busy'});equal(run('cfg.privateEvents.length'),1);equal(run("avail(coaches[0],0).includes('16:00')"),false);
run("state.selectedBooking=state.bookings[1].id");submit('coach-cancel-form',{reason:'Lieu indisponible'});equal(run('state.bookings[1].refund'),65);equal(run('state.bookings[1].cancelledBy'),'coach');
run("state.clientId='alex'");submit('client-note-form',{note:'Prévoir une progression technique'});equal(run("cfg.clientNotes.alex"),'Prévoir une progression technique');
run("activateAccount('coach-0');openChat(state.bookings[0].id)");submit('conversation-form',{message:'À très vite'});equal(run("identity.messages[state.bookings[0].id][0].text"),'À très vite');
run("state.screen='config';state.configSection='profile'");submit('config-form',{name:'Thomas Martin',sport:'Préparation physique',bio:'Une approche progressive et adaptée.',experience:'8',cert:'Nouveau justificatif',langs:'Français'},{section:'profile'});equal(run('cfg.verified'),false);equal(run('cfg.published'),false);
run("act('simulate-verification',{})");equal(run('cfg.verified'),true);
run("state.entryRole='coach';state.entryMode='signup';state.entryDraft={email:'new-coach@example.test',name:'Nouveau coach'}");submit('code-form',{code:'123456'});equal(run('state.screen'),'coach-wizard');equal(run('cfg.published'),false);equal(run('publicationReady()'),false);run("act('publish',{})");equal(run('cfg.published'),false,'Incomplete coach cannot publish');
run("activateAccount('coach-0');startBooking(0,'19:00',3);state.selectedBooking=state.bookings[0].id");
for(const screen of ['welcome','login','code','onboarding','explore','favorites','bookings','account','profile','setup','checkout','confirmation','detail','coach','config','client','coach-wizard']){run(`state.screen='${screen}';render()`);assert.ok(node('view').innerHTML.length>50);count++}
for(const tab of ['agenda','clients','activity','settings']){run(`state.screen='coach';state.coachTab='${tab}';render()`);count++}
for(const section of ['profile','offers','places','schedule','rules','documents','payout','notifications','calendars']){run(`state.screen='config';state.configSection='${section}';render()`);count++}
equal(html.includes('partant↗'),false);assert.ok(!/<(?:script|link)[^>]+(?:src|href)="https?:/.test(html));count++;
// Final coherence audit: flexible time search, valid opening ranges and complete reset.
run("state.screen='explore';dateModal('search',1)");
equal(node('modal-content').innerHTML.includes('09:30'),true,'Every half-hour is searchable');
run("Object.assign(cfg,JSON.parse(JSON.stringify(freshCfg)));cfg.services[0].duration=90;cfg.services[1].active=false");
submit('config-form',{week:['0'],start:'09:00',end:'10:00',breakStart:'12:00',breakEnd:'14:00',daysOff:[]},{section:'schedule'});
equal(run('cfg.weeklyConfigured'),false,'Impossible weekly window is not saved');
equal(node('config-error').textContent.includes('aucune de vos séances'),true);
equal(run("scheduleFits(60,'09:00','12:00',true,'09:30','11:30')"),false,'Neither side of a break fits');
run("cfg.weeklyConfigured=true;cfg.start='09:00';cfg.end='10:00'");equal(run('publicationReady()'),false,'Cannot publish a schedule incompatible with offers');
run("customer.name='Test';customer.budget=40;customer.sport='Boxe';customer.done=true;act('confirm-reset',{})");
equal(run('customer.name'),'Alex');equal(run('customer.budget'),80);equal(run('customer.sport'),'Tout');equal(run('state.booking'),null);equal(run('state.screen'),'welcome');equal(run('state.bookings.length'),0);
// Contextual goals and complete local sector catalogue.
equal(run("goalsFor('Running').includes('Préparer une course')"),true);
equal(run("goalsFor('Yoga').includes('Préparer une course')"),false);
equal(run("goalsFor('Natation').includes('Apprendre à nager')"),true);
run("customer.goal='Préparer une course';setPractice('Yoga')");equal(run('customer.goal'),'Me remettre en forme');
run("customer.goal='Me sentir mieux';setPractice('Boxe')");equal(run('customer.goal'),'Me sentir mieux');
equal(run('idfCommunes.length'),1266);equal(run('new Set(idfCommunes.map(c=>c.codeDepartement)).size'),8);
equal(run("sectors.filter(c=>c.code.startsWith('751')).length"),20);
equal(run("sectorMatches('78000','78')[0].nom"),'Versailles');
equal(run("sectorMatches('saint denis','93').some(c=>c.nom==='Saint-Denis')"),true);
equal(run("sectorMatches('creteil','94')[0].nom"),'Créteil');
equal(run("sectorMatches('saint denis')[0].nom"),'Saint-Denis','Exact city ranked above matching department');
equal(run("sectorMatches('78000','91').length"),0);
run("state.screen='onboarding';state.onboardStep=1;customer.budget=60;chooseSector('78646')");
equal(run('customer.city'),'Versailles · 78');equal(run('customer.cityCode'),'78646');equal(run('customer.budget'),60);
run("customer.format='Tous';customer.sport='Tout';applyPreferences();state.screen='explore'");equal(run('results().length'),0);
equal(run("explore().includes('Pas encore de coach dans ce secteur')"),true);
run("act('search-visio',{})");equal(run('results().length>0'),true);
// Priority journeys: saved availability, preparation snapshots and support decisions.
run("act('confirm-reset',{});state.screen='explore';resetFilters();state.day=1;newAlert(null)");
submit('alert-form',{day:'1',from:'20:00',to:'18:00'});equal(run('operations.alerts.length'),0,'Invalid interval refused');
submit('alert-form',{day:'1',from:'19:00',to:'19:00'});equal(run('operations.alerts.length'),1);
equal(run('alertCandidates(operations.alerts[0]).some(m=>m.coach===0)'),true);
run("state.closed.push(key(0,1,'19:00'))");equal(run('alertCandidates(operations.alerts[0]).some(m=>m.coach===0)'),false,'Alert respects coach closure');
run("state.closed=[];state.screen='explore';newAlert(null)");submit('alert-form',{day:'1',from:'19:00',to:'19:00'});equal(run('operations.alerts.length'),1,'No duplicate alert');
run("act('toggle-alert',{id:operations.alerts[0].id})");equal(run('alertCandidates(operations.alerts[0]).length'),0);
run("act('toggle-alert',{id:operations.alerts[0].id});act('alert-book',{id:operations.alerts[0].id,coach:'0',time:'19:00'});doPay()");
equal(run('operations.alerts[0].status'),'booked');equal(run('state.bookings.length'),1);
let initialPreparation=run('state.bookings[0].preparation.bring');
submit('preparation-form',{provided:'Élastiques',bring:'Votre tapis',meeting:'Entrée sud',weather:'Report à convenir'});
equal(run('cfg.preparation.bring'),'Votre tapis');equal(run('preparationFor(state.bookings[0]).bring'),initialPreparation,'Booked instructions preserved');
run("issueForm(state.bookings[0].id)");submit('issue-form',{reason:'Le coach est absent',message:'Le coach de démonstration ne vient pas.'});
equal(run('operations.tickets.length'),1);equal(run('state.bookings[0].status'),'confirmed','Support request does not cancel booking');
run("issueForm(state.bookings[0].id)");equal(run('operations.tickets.length'),1);
run("resolveTicket(operations.tickets[0].id)");submit('resolution-form',{decision:'refund',reply:'Remboursement intégral accordé dans la démo.'});
equal(run('operations.tickets[0].status'),'resolved');equal(run('state.bookings[0].refund'),50);equal(run('operations.tickets[0].refund'),50);
equal(run('state.bookings[0].status'),'cancelled');equal(run('operations.tickets[0].audit.length'),2);
submit('resolution-form',{decision:'refund',reply:'Rejouer'});equal(run('operations.tickets[0].audit.length'),2,'Resolved decision is not applied twice');
run("issueForm(state.bookings[0].id)");submit('issue-form',{reason:'Problème de paiement ou remboursement',message:'Suivi fictif'});run("resolveTicket(operations.tickets[0].id)");submit('resolution-form',{decision:'refund',reply:'Déjà remboursé.'});equal(run('operations.tickets[0].refund'),0,'Refund cannot exceed payment');
run("issueForm('past-sarah')");submit('issue-form',{reason:'Séance contestée',message:'Essai de demande historique'});run("resolveTicket(operations.tickets[0].id)");submit('resolution-form',{decision:'refund',reply:'Remboursement fictif après examen.'});equal(run('pastBooking.refund'),45);equal(run("state.bookings.filter(b=>b.id==='past-sarah').length"),0,'No duplicate seeded history');
for(const screen of ['alerts','support','operations','preparation-settings']){run(`state.screen='${screen}';render()`);assert.ok(node('view').innerHTML.length>100);count++}
run("act('confirm-reset',{})");equal(run('operations.alerts.length'),0);equal(run('operations.tickets.length'),0);equal(run('pastBooking.status'),'completed');equal(run('pastBooking.refund'),undefined);
// Group inventory: a dated class blocks the coach, seats remain independent.
run("act('confirm-reset',{});state.screen='config';state.configSection='offers'");
submit('service-form',{name:'Renforcement en petit groupe',kind:'Groupe',duration:'60',price:'20',capacity:'6',groupFormat:'Parc',level:'Tous niveaux'},{id:'new'});
equal(run("cfg.services.at(-1).capacity"),6);equal(run("servicesFor(0).some(s=>s.kind==='Groupe')"),false,'Group not sold as a private session');
let groupOfferId=run('cfg.services.at(-1).id');submit('schedule-group-form',{serviceId:groupOfferId,day:'2',time:'18:00'});
equal(run('operations.groups.length'),1);equal(run('groupSeats(operations.groups[0])'),6);
run("state.screen='explore';state.day=2;resetFilters();state.day=2");equal(run("avail(coaches[0],2).includes('18:30')"),false,'Empty class already blocks private booking');
equal(run('groupMatches(operations.groups[0])'),true);equal(run("canScheduleGroup(cfg.services.at(-1),2,'18:30').length>0"),true);
submit('private-event-form',{day:'2',start:'18:00',end:'19:00',title:'Busy'});equal(run('cfg.privateEvents.length'),0,'Cannot block scheduled group');
run("act('join-group',{id:operations.groups[0].id})");submit('group-checkout-form',{participants:'3',goal:'Bouger entre amis'});equal(run('bookingPrice(state.booking)'),60);run('doPay()');
equal(run('state.bookings[0].participants'),3);equal(run('state.bookings[0].price'),60);equal(run('groupSeats(operations.groups[0])'),3);
run('doPay()');equal(run('state.bookings.length'),1,'Same client cannot book overlapping class twice');
run("state.groupId=operations.groups[0].id");submit('group-capacity-form',{capacity:'2'});equal(run('operations.groups[0].capacity'),6,'Cannot shrink below enrolled seats');
submit('group-capacity-form',{capacity:'4'});equal(run('groupSeats(operations.groups[0])'),1);
run("cfg.services.at(-1).price=30;cfg.services.at(-1).capacity=10");equal(run('operations.groups[0].unitPrice'),20);equal(run('operations.groups[0].capacity'),4,'Changes to offer affect future classes');
run("state.selectedBooking=state.bookings[0].id;act('confirm-cancel',{})");equal(run('state.bookings[0].refund'),60);equal(run('groupSeats(operations.groups[0])'),4);equal(run('operations.groups[0].status'),'open','Participant cancellation keeps class open');
run("act('join-group',{id:operations.groups[0].id})");submit('group-checkout-form',{participants:'2',goal:'Essai'});run('doPay()');equal(run('state.bookings[1].price'),40);
run("act('confirm-cancel-group',{id:operations.groups[0].id})");equal(run('operations.groups[0].status'),'cancelled');equal(run('state.bookings[1].refund'),40);equal(run('state.bookings[1].status'),'cancelled');
run("state.screen='explore'");equal(run("avail(coaches[0],2).includes('18:30')"),true,'Course cancellation frees coach schedule');
submit('schedule-group-form',{serviceId:groupOfferId,day:'3',time:'18:00'});equal(run('operations.groups[1].capacity'),10);equal(run('operations.groups[1].unitPrice'),30);
run("state.screen='explore';resetFilters();state.day=3;newAlert(0)");submit('alert-form',{day:'3',from:'18:00',to:'18:00'});equal(run('alertCandidates(operations.alerts[0]).some(m=>!!m.groupId)'),true,'Group availability reaches alerts');
for(const screen of ['group-planning','group-details','group-setup']){run(`state.groupId=operations.groups[0].id;state.screen='${screen}';render()`);assert.ok(node('view').innerHTML.length>100);count++}
run("act('confirm-reset',{})");equal(run('operations.groups.length'),0);
console.log(`PASS: ${count} checks — entry, onboarding, recommendations, custom offers, durations, conflicts, buffers, breaks, snapshots, publication, private events, coach cancellation, client notes, messages and all screens.`);
