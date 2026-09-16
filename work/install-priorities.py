from pathlib import Path
p=Path('work/partant.template.html');s=p.read_text()
for name in ['render','act','persist','doPay']:
 old='function '+name+'(';new='function v2'+name[0].upper()+name[1:]+'(';assert s.count(old)==1,(name,s.count(old));s=s.replace(old,new)
extra=Path('work/priority-features.js').read_text();s=s.replace('\nrender();\n\n</script>', '\n'+extra+'\nrender();\n\n</script>')
p.write_text(s)
