from pathlib import Path
import re
p=Path('work/partant.template.html');s=p.read_text()
icons={
'run':'<path d="m4 5 4 2 2 5 4 2 4 .8A3.5 3.5 0 0 1 21 18v1H3v-7l1-7Z"/><path d="M3 16h5m3-5-2 2m5 0-2 2M5 7l-1 5"/>',
'strength':'<rect x="4" y="6" width="4" height="12" rx="1.5"/><rect x="16" y="6" width="4" height="12" rx="1.5"/><path d="M8 10h8m-8 4h8M2 9v6m20-6v6"/>',
'pilates':'<ellipse cx="12" cy="12" rx="7" ry="8"/><rect x="2.5" y="9" width="4" height="6" rx="1.5" fill="var(--sport-surface,#fff)"/><rect x="17.5" y="9" width="4" height="6" rx="1.5" fill="var(--sport-surface,#fff)"/>',
'yoga':'<circle cx="12" cy="4.5" r="2"/><path d="M12 8v6m-4-5-2 4H3m13-4 2 4h3M9 14l-5 3a2 2 0 0 0 1 4h14a2 2 0 0 0 1-4l-5-3m-7 4 8 3m0-3-8 3"/>',
'boxing':'<path d="M7 16c-3-1-4-3-4-6V9a2 2 0 0 1 4 0V6a4 4 0 0 1 4-4h3a5 5 0 0 1 5 5v4c0 2-1 4-3 5v5H7v-5Z"/><path d="M7 9v3m0 5h9m-6 2h3"/>',
'all':'<rect x="3" y="3" width="7" height="7" rx="2.5"/><rect x="14" y="3" width="7" height="7" rx="2.5"/><rect x="3" y="14" width="7" height="7" rx="2.5"/><rect x="14" y="14" width="7" height="7" rx="2.5"/>'}
for name,svg in icons.items():
 if name=='yoga':s=s.replace("function ic(name,cl='')", "icons.yoga='"+svg+"';\nfunction ic(name,cl='')")
 else:
  s,n=re.subn(r"\b"+name+r":'[^']*'",lambda m:name+":'"+svg+"'",s,count=1);assert n==1
s=s.replace("['Yoga','pilates']", "['Yoga','yoga']")
s=s.replace('${ic(i)}${s}</button>', '${ic(i,\'sport-symbol\')}${s}</button>')
s=s.replace('</style>', '\n.sport .sport-symbol{width:28px;height:28px;stroke-width:1.6;transition:transform .16s ease}.sport{--sport-surface:#fff}.sport.active .sport-symbol{transform:translateY(-1px)}@media(prefers-reduced-motion:reduce){.sport .sport-symbol{transition:none}}\n</style>')
p.write_text(s)
