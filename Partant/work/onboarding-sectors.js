const commonGoals=['Me remettre en forme','Me sentir mieux','Découvrir une pratique'];
const sportGoals={
'Tout':['Gagner en force','Préparer une course','Améliorer ma mobilité','Perdre du poids'],
'Préparation physique':['Gagner en force','Préparer une compétition','Améliorer mon endurance'],
'Running':['Courir plus longtemps','Préparer une course','Améliorer ma vitesse'],
'Pilates':['Renforcer mes muscles profonds','Améliorer ma posture','Améliorer ma mobilité'],
'Musculation':['Gagner en force','Développer ma masse musculaire','Améliorer ma technique'],
'Boxe':['Apprendre les bases de la boxe','Améliorer mon cardio','Préparer un combat'],
'Yoga':['Gagner en souplesse','Mieux gérer mon stress','Approfondir ma pratique'],
'Mobilité':['Améliorer ma mobilité','Gagner en souplesse','Bouger plus facilement au quotidien'],
'Remise en forme':['Améliorer mon endurance','Renforcer tout mon corps','Perdre du poids'],
'Tennis':['Apprendre les bases du tennis','Améliorer mon service','Préparer un tournoi'],
'Football':['Améliorer ma technique de balle','Améliorer mon endurance','Préparer la saison'],
'Natation':['Apprendre à nager','Améliorer ma technique de nage','Nager plus longtemps'],
'Sports de combat':['Apprendre les techniques de base','Améliorer mon cardio','Préparer un combat'],
'Récupération':['Retrouver de la mobilité','Mieux récupérer après l’effort','Installer une routine de récupération']};
function goalsFor(sport){return [...commonGoals,...(sportGoals[sport]||sportGoals.Tout)]}
function setPractice(sport){customer.sport=sport;let choices=goalsFor(sport),changed=!choices.includes(customer.goal);if(changed)customer.goal=choices[0];return changed}
const idfDepartments={'75':'Paris','77':'Seine-et-Marne','78':'Yvelines','91':'Essonne','92':'Hauts-de-Seine','93':'Seine-Saint-Denis','94':'Val-de-Marne','95':'Val-d’Oise'};
// API Découpage administratif, snapshot 14/09/2026. Embedded for offline use.
const idfCommunes=__COMMUNES__;
const sectors=[...Array.from({length:20},(_,i)=>({nom:'Paris '+(i+1)+(i===0?'er':'e'),code:String(75101+i),codeDepartement:'75',codesPostaux:[String(75001+i)]})),...idfCommunes];
function sectorLabel(c){return c.codeDepartement==='75'?c.nom:c.nom+' · '+c.codeDepartement}
function folded(s){return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’'\-]/g,' ').replace(/\s+/g,' ').trim()}
function sectorMatches(query='',department=''){let words=folded(query).split(' ').filter(Boolean);return sectors.filter(c=>(!department||c.codeDepartement===department)&&words.every(w=>folded([c.nom,c.codeDepartement,idfDepartments[c.codeDepartement],...c.codesPostaux].join(' ')).includes(w)))}
function sectorRows(){let found=sectorMatches(state.sectorQuery,state.sectorDepartment),limit=state.sectorLimit||15;return `<p class="small muted" role="status" style="margin:12px 0">${found.length} secteur${found.length===1?'':'s'}${found.length>limit?' · '+limit+' affichés':''}</p>${found.slice(0,limit).map(c=>`<button type="button" class="setting-row" data-action="choose-sector" data-id="${c.code}"><span style="min-width:0"><strong>${esc(c.nom)}</strong><small class="muted" style="display:block">${esc(idfDepartments[c.codeDepartement])} · ${c.codesPostaux[0]||c.codeDepartement}</small></span>${ic('chevron','sm')}</button>`).join('')||'<p class="note">Aucun secteur trouvé. Essayez le nom de la commune ou son code postal.</p>'}${found.length>limit?'<button type="button" class="pill light full space" data-action="more-sectors">Afficher plus de communes</button>':''}`}
function openSectors(){state.sectorQuery='';state.sectorDepartment='';state.sectorLimit=15;showModal('Votre secteur en Île-de-France',`<p class="small muted subhead">${esc(state.screen==='onboarding'?customer.city:state.city)} · secteur actuel</p><label class="field">Commune ou code postal<input type="search" id="sector-search" placeholder="Versailles, Saint-Denis, 94000…" autocomplete="off"></label>${selectField('Département','sector-department',[['','Toute l’Île-de-France'],...Object.entries(idfDepartments).map(([code,name])=>[code,code+' · '+name])],'')}<div id="sector-results">${sectorRows()}</div><p class="small muted space">Les 8 départements, les communes et les 20 arrondissements de Paris. L’offre de coachs reste fictive et parisienne ; la visio est disponible ailleurs.</p>`)}
function chooseSector(code){let c=sectors.find(c=>c.code===code);if(!c)return;customer.city=sectorLabel(c);customer.cityCode=c.code;state.city=customer.city;persist();closeModal();if(state.screen==='onboarding')render();else go('explore')}
function updateSectors(){state.sectorQuery=document.getElementById('sector-search').value;state.sectorDepartment=document.querySelector('[name="sector-department"]').value;state.sectorLimit=15;document.getElementById('sector-results').innerHTML=sectorRows()}
document.addEventListener('input',e=>{if(e.target.id==='sector-search')updateSectors()});
document.addEventListener('change',e=>{let el=e.target;if(el.name==='sector-department'){updateSectors();return}if(!el.closest?.('#onboard-form'))return;if(el.name==='sport'){let reset=setPractice(el.value),goal=document.querySelector('#onboard-form [name="goal"]');goal.innerHTML=goalsFor(customer.sport).map(v=>`<option ${v===customer.goal?'selected':''}>${esc(v)}</option>`).join('');document.getElementById('goal-context').textContent=reset?'Les objectifs ont été adaptés à votre pratique. Choisissez celui qui vous correspond.':'Des objectifs adaptés à votre pratique.'}else if(el.name)customer[el.name]=['budget','distance'].includes(el.name)?+el.value:el.value;persist()});
