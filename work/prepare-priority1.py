from pathlib import Path
import re
p=Path('work/partant.template.html');s=p.read_text()
s=s.replace("'use strict';", "'use strict';\nvar identity=null;let activeCoachId=0;let currentCustomerId='alex';")
s=s.replace('const cfg=','let cfg=').replace('const customer=','let customer=')
# Coach-specific existing logic now follows an explicit context.
start=s.index('function syncCoach()');head=s[:start];tail=s[start:]
tail=tail.replace('coaches[0]','coaches[activeCoachId]').replace('primaryService(0)','primaryService(activeCoachId)').replace('selectedService(0)','selectedService(activeCoachId)').replace('servicesFor(0)','servicesFor(activeCoachId)').replace('key(0,','key(activeCoachId,').replace('coach:0,','coach:activeCoachId,').replace('state.coach=0','state.coach=activeCoachId')
tail=re.sub(r'\b(c\.id|b\.coach|id|a\.coach|state\.coach)(===|!==)0\b',r'\1\2activeCoachId',tail)
tail=tail.replace('data-id="0">Prévisualiser','data-id="${activeCoachId}">Prévisualiser').replace('newAlert(0)','newAlert(activeCoachId)')
# All group management operations must stay within the owning coach.
tail=tail.replace("operations.groups.filter(g=>g.day===", "operations.groups.filter(g=>g.coach===activeCoachId&&g.day===")
tail=tail.replace("operations.groups.some(g=>g.status===", "operations.groups.some(g=>g.coach===activeCoachId&&g.status===")
tail=tail.replace("operations.groups.slice().sort", "operations.groups.filter(g=>g.coach===activeCoachId).slice().sort")
tail=tail.replace("let g={id:'g-'", "let g={coach:activeCoachId,id:'g-'")
s=head+tail
# Old public UI snippets using Thomas's settings get contextual rendering too.
s=s.replace("const price=c=>c.id===0?(primaryService(0).price||0):(state.prices[c.id]||c.price);", "const price=c=>primaryService(c.id).price;")
s=s.replace("c.id===0&&state.format", "c.id===activeCoachId&&state.format").replace("c.id===0&&cfg.travelFee", "c.id===activeCoachId&&cfg.travelFee").replace("b.coach===0&&", "b.coach===activeCoachId&&")
# Owner-aware client conflicts and immutable ownership on booking.
s=s.replace("x=>x.status==='confirmed'&&", "x=>x.customerId===currentCustomerId&&x.status==='confirmed'&&")
s=s.replace("x=>x.id!==b.id&&x.status==='confirmed'&&", "x=>x.customerId===currentCustomerId&&x.id!==b.id&&x.status==='confirmed'&&")
s=s.replace("let booked={...b,id:", "let booked={...b,customerId:currentCustomerId,id:")
s=s.replace("state.bookings.find(b=>b.status==='confirmed')", "state.bookings.find(b=>b.customerId===currentCustomerId&&b.status==='confirmed')")
s=s.replace(",pastBooking];return", ",...(currentCustomerId==='alex'?[pastBooking]:[])];return")
s=s.replace("{...a,id:'a-'", "{...a,customerId:currentCustomerId,id:'a-'").replace("x=>x.signature===signature", "x=>x.customerId===currentCustomerId&&x.signature===signature")
s=s.replace("{id:'d-'+", "{customerId:currentCustomerId,id:'d-'+")
# Disable obsolete event handlers; v4 provides the visible forms and shared messages.
for id in ['entry-form','code-form','message-form','coach-message-form','review-form','report-form']:
 s=s.replace("'"+id+"'", "'obsolete-"+id+"'")
 # Keep visible generated forms at their original ids so the new handlers receive them.
# Public text is escaped even when a coach edits it.
for field in ['name','sport','quote','bio','method','cert','langs','area','place','address']:
 s=s.replace('${c.'+field+'}', '${esc(c.'+field+')}')
s=s.replace('photo p${c.id}', 'photo person-${c.id} p${c.photoIndex??c.id%6}')
s=s.replace('photo p0" style="height:190px', 'photo person-${activeCoachId} p${coaches[activeCoachId].photoIndex??activeCoachId%6}" style="height:190px')
# Rename helpers, retaining tested behavior under wrappers with explicit coach context.
functions=['render','act','persist','doPay','syncCoach','servicesFor','primaryService','selectedService','allSlots','avail','locationFor','displayPrice','soloBookingPrice','setup','checkout','profile','card','confirmation','bookingDetail','preparationFor','groupPublic','groupMatches','groupCard','groupDetails','groupPay','alertCandidates','individualAlertCandidates','results','bookings','clientData','clientDetail','openChat','coachChat','reviewModal','configPage','configSave','supportPage','alertsPage','operationsPage','account']
for name in functions:
 old='function '+name+'(';assert s.count(old)==1,(name,s.count(old));s=s.replace(old,'function prior_'+name+'(')
s=s.replace('\nrender();\n\n</script>', '\n__PRIORITY_ONE__\nrender();\n\n</script>')
p.write_text(s)
