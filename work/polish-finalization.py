from pathlib import Path
p=Path('work/partant.template.html');s=p.read_text();j=Path('work/finalization.js').read_text()
j=j.replace('return `<fieldset class="day-interval"><legend>${weekdayNames[day]}</legend>', 'return `<details class="day-interval" ${day===0?\'open\':\'\'}><summary><strong>${weekdayNames[day]}</strong><span class="small muted">${list.length?list.map(x=>x.join(\'–\')).join(\' · \'):\'Fermé\'}</span></summary><fieldset style="border:0;padding:0;margin:12px 0 0"><legend class="sr-only">Plages du ${weekdayNames[day]}</legend>')
j=j.replace(".join('')}</fieldset>`}",".join('')}</fieldset></details>`}",1)
j=j.replace("function hiddenTestTools(){if(runtime.mode==='demo')return;", "function hiddenTestTools(){let hide=runtime.mode!=='demo';")
j=j.replace('[data-action="operations"],[data-action="complete-demo"]','[data-action="operations"],[data-action="open-operations"],[data-action="complete-demo"]')
j=j.replace("el.hidden=true;el.style.display='none'", "el.hidden=hide;el.style.display=hide?'none':''")
# Prefer explicit return to an in-progress attempt after reload, never automatic charge.
j=j.replace("let special={payment:","let special={payment:")
j=j.replace("if(state.screen==='detail'){let b=findBooking();", "if(['account','bookings'].includes(state.screen)&&signedClient()){let attempts=identity.payments.filter(p=>p.owner===actorId()&&['pending','refused','interrupted','expired'].includes(p.status));if(attempts.length)view.innerHTML+='<div class=\"section\"><h2>Séances à confirmer</h2>'+attempts.slice(-3).reverse().map(p=>`<button class=\"setting-row\" data-action=\"resume-payment\" data-id=\"${p.id}\"><span>${dayLabel(p.selection.day)} · ${p.selection.time}<small>${esc(coaches[p.selection.coach].name)} · ${p.selection.quotedTotal} € · aucun débit</small></span>${ic('chevron')}</button>`).join('')+'</div>'}if(state.screen==='detail'){let b=findBooking();")
j=j.replace("case 'retry-payment':state.paymentAttempt=null;beginPayment();return;", "case 'retry-payment':{let old=identity.payments.find(p=>p.id===state.paymentAttempt);if(old&&old.status!=='paid')old.status='replaced';state.paymentAttempt=null;beginPayment();return}\ncase 'resume-payment':{let p=identity.payments.find(p=>p.id===d.id&&p.owner===actorId());if(!p||p.status==='paid')return;state.booking=clone(p.selection);state.paymentAttempt=p.id;go('checkout');return}")
# Ensure group alert-selected participant count is carried to the purchase.
j=j.replace("}finalBase.act(a,d)};", "}finalBase.act(a,d);if(a==='join-group'&&state.booking?.sourceAlert){let alert=operations.alerts.find(x=>x.id===state.booking.sourceAlert);if(alert){state.booking.participants=alert.participants||1;render()}}};")
s=s[:s.index('// Finalisation du prototype :')]+j+'\nsyncAllCoaches();\nrender();\n</script></body></html>\n'
s=s.replace('</style>','\n.day-interval summary{display:flex;justify-content:space-between;align-items:center;gap:12px;min-height:44px;cursor:pointer}.day-interval summary .small{max-width:60%;text-align:right}.day-interval[open] summary{margin-bottom:12px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}\n</style>',1)
# Hide stale date text in the desktop introduction and give simulation access from there.
s=s.replace('14 septembre 2026','calendrier glissant') if False else s
p.write_text(s);Path('work/finalization.js').write_text(j)
p=Path('work/test-finalization.cjs');t=p.read_text();t='\n'.join(t.splitlines()[:6])+'\n'+t[t.index('// A1 :'):];p.write_text(t)
