from pathlib import Path
p=Path('work/partant.template.html');s=p.read_text()
start=s.index('const base=new Date(');end=s.index('\n',start)
s=s[:start]+'''// Stable date indices preserve existing reservations across calendar rollovers.
let runtime={mode:'presentation',clock:null};try{Object.assign(runtime,JSON.parse(localStorage.getItem('partant-runtime')||'{}'))}catch(e){}
function appNow(){return runtime.clock?new Date(runtime.clock):new Date()}
function parisISO(date=appNow()){return new Intl.DateTimeFormat('fr-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
const base=new Date(2026,8,14,8),epochUTC=Date.UTC(2026,8,14);
function dayIndex(iso){return Math.round((Date.parse(iso+'T00:00:00Z')-epochUTC)/86400000)}
function todayIndex(){return dayIndex(parisISO())}
function isoForDay(i){return new Date(epochUTC+i*86400000).toISOString().slice(0,10)}
function instantFor(day,time){let iso=isoForDay(day),target=Date.parse(iso+'T'+time+':00Z'),utc=target;for(let i=0;i<3;i++){let parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(utc));utc+=target-Date.parse(parts.replace(' ','T')+'Z')}return utc}
const days=[];function extendDays(){let limit=Math.max(14,todayIndex()+91);while(days.length<limit){let i=days.length,d=new Date(base);d.setDate(d.getDate()+i);days.push({iso:isoForDay(i),short:d.toLocaleDateString('fr-FR',{weekday:'short'}).replace('.',''),num:d.getDate(),long:d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'}),d})}}extendDays();''' +s[end:]
s=s.replace('return b.day*24+(mins(b.time)-480)/60','return (instantFor(b.day,b.time)-appNow().getTime())/3600000')
s=s.replace('d>=cfg.horizon','d>=todayIndex()+cfg.horizon').replace('g.day<cfg.horizon','g.day<todayIndex()+cfg.horizon')
s=s.replace('d*24+(mins(t)-480)/60>=cfg.notice','hoursUntil({day:d,time:t})>=cfg.notice')
s=s.replace('state.day===0','state.day===todayIndex()').replace('state.day===1','state.day===todayIndex()+1').replace('state.day>1','state.day>todayIndex()+1')
s=s.replace("${days[state.day].num} sept.","${days[state.day].num} ${days[state.day].d.toLocaleDateString('fr-FR',{month:'short'})}")
s=s.replace("day:0,period:","day:todayIndex(),period:").replace("query:'',day:0,","query:'',day:todayIndex(),").replace("state.day=1;","state.day=todayIndex()+1;")
s=s.replace('Septembre 2026 · Heure de Paris','${days[d].d.toLocaleDateString(\'fr-FR\',{month:\'long\',year:\'numeric\'})} · Heure de Paris')
s=s.replace("[[7,'7 jours à l’avance'],[14,'14 jours à l’avance']]","[[7,'7 jours à l’avance'],[14,'14 jours à l’avance'],[30,'30 jours à l’avance'],[60,'60 jours à l’avance'],[90,'90 jours à l’avance']]")
s=s.replace("bindAccount(account);if(created", "let pending=state.pendingCheckout;bindAccount(account);if(created")
s=s.replace("state.screen='onboarding'}persist();render()}","state.screen='onboarding'}if(pending&&account.role==='client'){state.booking=pending;state.pendingCheckout=null;state.screen='checkout';state.history=[]}persist();render()}")
s=s.replace("let account=identity.accounts.find", "let account=identity.accounts.find")
# Exclude locally removed accounts from login lookup.
s=s.replace("a.email===draft.email&&a.role===state.entryRole)","a.email===draft.email&&a.role===state.entryRole&&!a.deleted)")
s=s.replace('Démo figée au 14 septembre 2026 à 08:00.', 'Calendrier glissant, heure de Paris.')
# Extension is kept inside standalone output; source is duplicated only for authoring convenience.
insert=s.rindex('\nsyncAllCoaches();')
s=s[:insert]+'\n'+Path('work/finalization.js').read_text()+s[insert:]
p.write_text(s)
