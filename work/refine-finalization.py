from pathlib import Path
p=Path('work/partant.template.html');s=p.read_text();j=Path('work/finalization.js').read_text()
# Active source corrections, preserving all previous layers.
s=s.replace('days.map((d,i)=>[i,d.long])','futureDays()')
s=s.replace('<small class="muted">Septembre 2026</small>','<small class="muted">${days[pd].d.toLocaleDateString(\'fr-FR\',{month:\'long\',year:\'numeric\'})}</small>')
s=s.replace('state.profileDay=0;go(\'profile\')','state.profileDay=todayIndex();go(\'profile\')')
s=s.replace("state.coachDay:0", "state.coachDay:todayIndex()")
# .ics now uses actual UTC instants and avoids obsolete timezone rules.
a=s.index('function calendarExport(b)');b=s.index('\n',a)
s=s[:a]+'''function calendarExport(b){const stamp=t=>new Date(t).toISOString().replace(/[-:]/g,'').replace(/\\.\\d{3}Z$/,'Z'),ce=t=>String(t).replace(/\\\\/g,'\\\\\\\\').replace(/\\n/g,'\\\\n').replace(/,/g,'\\\\,').replace(/;/g,'\\\\;');let l=locationFor(b),start=instantFor(b.day,b.time);downloadText('partant-'+b.id+'.ics',['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Partant//Prototype//FR','BEGIN:VEVENT','UID:'+b.id+'@partant.demo','DTSTAMP:'+stamp(appNow().getTime()),'DTSTART:'+stamp(start),'DTEND:'+stamp(start+(b.duration||60)*60000),'SUMMARY:'+ce('Partant · '+coaches[b.coach].name),'LOCATION:'+ce(l.name+' - '+l.address),'DESCRIPTION:Séance fictive du prototype Partant.','END:VEVENT','END:VCALENDAR'].join('\\r\\n'),'text/calendar;charset=utf-8');toast('Calendrier téléchargé. Réimportez-le après une modification.')}''' +s[b:]
j=j.replace("if(screen==='checkout'&&!requireClient())return;", "if(runtime.mode!=='demo'&&['accounts','operations'].includes(screen)){toast('Ouvrez le mode Test dans À propos de la simulation.');return}if(screen==='checkout'&&!requireClient())return;")
j=j.replace("if(!requireClient())return;let b=state.booking,issue=paymentProblem(b);", "if(!requireClient())return;let done=identity.payments.find(p=>p.id===state.paymentAttempt&&p.owner===actorId()&&p.status==='paid');if(done){state.selectedBooking=done.bookingId;go('confirmation');return}let b=state.booking,issue=paymentProblem(b);")
j=j.replace("el.innerHTML+=proposalPanel(b)+refundPanel(b)+", "el.innerHTML+='<div class=\"section\">'+proposalPanel(b)+refundPanel(b)+")
j=j.replace("</button>`:'')}hiddenTestTools()};", "</button>`:'')+'</div>'}hiddenTestTools()};")
j=j.replace("let special={payment:", "let special={payment:")
# Keep the payment attempt and its owner separate from accounts switched in demo.
j=j.replace("case 'pay':beginPayment();return;", "case 'pay':beginPayment();return;\ncase 'book':case 'join-group':case 'alert-book':if(state.auth?.role==='coach'&&runtime.mode==='presentation'){state.entryRole='client';state.entryMode='login';go('login');toast('Connectez-vous côté particulier pour réserver.');return}break;")
# New fields must not survive the explicit demo reset.
j += "\nresetIdentityDemo=function(){identity.payments=[];identity.proposals=[];identity.reminderKeys=[];identity.refundLedger=[];state.pendingCheckout=null;finalBase.resetIdentityDemo()};\n"
# Mark verified state changes coherently when qualifications/name change via public profile.
j += "\nconfigSave=function(form){let was=cfg.verified;finalBase.configSave(form);if(was&&!cfg.verified&&cfg.documentCase){cfg.documentCase.status='draft';cfg.documentCase.reason='Votre profil a changé. Soumettez un dossier actualisé.';persist()}};\n"
# Never display the full 90 day availability list as a giant form; keep 7-day strip.
s=s[:s.index('// Finalisation du prototype :')]+j+'\nsyncAllCoaches();\nrender();\n</script></body></html>\n'
style='''\n.day-interval{border:0;border-bottom:1px solid #e6e6e6;padding:20px 0;margin:0;min-width:0}.day-interval legend{font-weight:600;font-size:18px;padding:0}.day-interval .split{gap:12px}.day-interval .field{min-width:0}.day-interval input[type=time]{width:100%;min-width:0}.day-interval .field:not(:first-child){margin-top:0}button[hidden]{display:none!important}\n'''
s=s.replace('</style>',style+'</style>',1)
p.write_text(s);Path('work/finalization.js').write_text(j)
# Regression fixture now authenticates before a purchase, as the real UI requires.
p=Path('work/test-regression-p1.cjs');t=p.read_text();t=t.replace("act('confirm-reset',{});state.screen='explore';resetFilters();state.day=1;newAlert(null)","act('confirm-reset',{});activateAccount('client-alex');state.screen='explore';resetFilters();state.day=1;newAlert(null)");t=t.replace('assert.deepEqual(a,b,n)','assert.deepEqual(a,b,n||\'regression\')');p.write_text(t)
