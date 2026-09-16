from pathlib import Path
p=Path('work/partant.template.html');s=p.read_text()
for name in ['render','act','doPay']:
 old='function '+name+'(';assert s.count(old)==1;s=s.replace(old,'function priority'+name[0].upper()+name[1:]+'(')
for name in ['avail','bookingPrice','editService']:
 old='function '+name+'(';assert s.count(old)==1;s=s.replace(old,'function solo'+name[0].upper()+name[1:]+'(')
s=s.replace("cfg.services.filter(s=>s.active):", "cfg.services.filter(s=>s.active&&s.kind!=='Groupe'):")
s=s.replace("return servicesFor(id)[0]||{id:'none'", "return servicesFor(id)[0]||(id===0?cfg.services.find(s=>s.active&&s.kind==='Groupe'):null)||{id:'none'")
s=s.replace("'service-form'", "'legacy-service-form'").replace('id="service-form"', 'id="legacy-service-form"')
s=s.replace("Durées, individuel, duo", "Individuel, duo et cours en groupe")
s=s.replace("if(state.bookings.some(b=>b.coach===0&&b.status==='confirmed'&&b.day===d&&overlaps(mins(start),mins(end)-mins(start),mins(b.time),b.duration||60)))", "if(operations.groups.some(g=>g.status==='open'&&g.day===d&&overlaps(mins(start),mins(end)-mins(start),mins(g.time),g.duration))||state.bookings.some(b=>b.coach===0&&b.status==='confirmed'&&b.day===d&&overlaps(mins(start),mins(end)-mins(start),mins(b.time),b.duration||60)))")
s=s.replace('\nrender();\n\n</script>', '\n'+Path('work/groups.js').read_text()+'\nrender();\n\n</script>')
p.write_text(s)
