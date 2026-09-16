from pathlib import Path
p=Path('work/test-priority1.cjs');s=p.read_text();idx=s.index('console.log(`PASS')
s=s[:idx]+'''// A group-only profile must retain its courses and never offer a solo calendar.
run("cfg.services.forEach(s=>{if(s.kind!=='Groupe')s.active=false});syncCoach();state.screen='profile';state.coach=0;render()");
equal(node('view').innerHTML.includes('Groupe du mercredi'),true);
equal(node('view').innerHTML.includes('data-action="profile-calendar"'),false);
equal(node('view').innerHTML.includes('class="schedule"'),false);
equal(node('view').innerHTML.includes('undefined'),false);
run("state.screen='conversations';render()");equal(node('nav').innerHTML.includes('coach-tab'),true);
run("act('join-group',{id:operations.groups[0].id})");equal(run('state.screen'),'accounts','Coach selects a client identity before booking');
run("activateAccount('coach-0');persist()");
const reloadContext=vm.createContext({...ctx});vm.runInContext(script,reloadContext);
const reload=x=>vm.runInContext(x,reloadContext);
equal(reload('state.auth.id'),'coach-0');
equal(reload('coaches.length'),7);
equal(reload('identity.configs[6].name'),'Zoé Durand');
equal(reload('identity.configs[6].photoIndex'),4);
equal(reload('identity.configs[1].services[0].price'),47);
equal(reload('groupSeats(operations.groups[0])'),1);
equal(reload(`identity.messages['${alexBooking}'].length`),2);
equal(reload('identity.moderation[0].status'),'closed');
equal(reload('state.bookings.filter(b=>b.customerId===\\'nina\\').length'),2);
run('resetIdentityDemo()');equal(run('coaches.every(c=>Number.isFinite(c.reviews)&&!c.rating.includes(\\'NaN\\'))'),true);
equal(run('identity.accounts.length'),8);equal(run('identity.messages'),{});
'''+s[idx:];p.write_text(s)
