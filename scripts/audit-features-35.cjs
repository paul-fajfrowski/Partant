// Read-only product audit: isolated in-memory fixtures, no network or real accounts.
// This records observed gaps; it is deliberately NOT a regression acceptance suite.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('../apps/mobile/node_modules/typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, f);
const M = require('../apps/mobile/src/product/model.ts');
const W = require('../apps/mobile/src/product/workflows.ts');
const D = require('../apps/mobile/src/product/connectedDomain.ts');
M.setDemoClock((Date.parse('2026-09-30T06:00:00Z') - Date.now()) / 3600000);
const coach = { id: '11111111-1111-4111-8111-111111111111', email: 'coach@example.test' };
const client = { id: '22222222-2222-4222-8222-222222222222', email: 'client@example.test' };
const team = { id: '33333333-3333-4333-8333-333333333333', email: 'team@example.test', staff: true };
const cmd = (s, actor, name, ...args) => D.applyCommand(s, actor, { name, args });
function fixture() {
  let s = D.emptyConnected();
  for (const [actor, role] of [[coach, 'coach'], [client, 'client'], [team, 'client']])
    s = D.register(s, actor, role, role);
  s = cmd(s, coach, 'saveCoach', coach.id, {
    name: 'Coach Audit', bio: 'Accompagnement sportif individuel à Paris.', cert: 'BPJEPS test',
    sport: 'Musculation', tags: [], years: 5, area: 'Paris 11e',
  });
  const cfg = M.configFor(s, coach.id);
  s = cmd(s, coach, 'saveSettings', coach.id, {
    ...cfg, weeklyConfigured: true, payoutReady: true,
    locations: { Domicile: { type: 'Domicile', name: 'Chez le client', address: '',
      instructions: '', sector: 'Paris 11e', radius: 3, travelFee: 0 } },
    week: Array.from({ length: 7 }, () => [['09:00', '12:00', null, ['Domicile']]]),
    dossier: { ...cfg.dossier, status: 'pending', documents: ['id', 'diploma', 'card', 'insurance'], expires: '2027-09-30' },
  });
  s = cmd(s, coach, 'saveOffer', {
    id: 'solo', coach: coach.id, name: 'Renforcement à domicile', kind: 'Individuel',
    duration: 60, price: 50, capacity: 1, active: true, formats: ['Domicile'],
  });
  s = cmd(s, team, 'reviewDossier', coach.id, 'approved', 'Dossier fictif pour audit local.');
  return cmd(s, coach, 'publish', coach.id);
}
const observations = [];
{
  let s = fixture();
  s = cmd(s, client, 'report', { kind: 'Assistance', body: 'Signalement fictif', coach: coach.id });
  const ticket = s.tickets.at(-1);
  s = cmd(s, team, 'resolveTicket', ticket.id, 'Suspension de test.', 'Suspendre le profil');
  assert.equal(M.configFor(s, coach.id).published, false);
  s = cmd(s, coach, 'publish', coach.id);
  observations.push({ id: 'F-01', observed: 'Coach can republish after team suspension', reproduced: M.configFor(s, coach.id).published });
}
{
  let s = fixture();
  s = cmd(s, client, 'reserve', { id: 'far-away', coach: coach.id, offerId: 'solo',
    day: '2026-10-02', time: '09:00', format: 'Domicile', seats: 1, price: 50,
    goal: '', address: 'Place Bellecour, 69002 Lyon' });
  observations.push({ id: 'F-02', observed: 'Paris coach with 3 km radius accepts a home booking in Lyon',
    reproduced: s.bookings.some(b => b.id === 'far-away' && b.status === 'confirmed') });
}
{
  let s = fixture();
  s = cmd(s, coach, 'publish', coach.id);
  s = cmd(s, coach, 'saveSettings', coach.id, { ...M.configFor(s, coach.id),
    week: Array.from({ length: 7 }, () => []),
    exceptions: { '2026-10-02': [['09:00', '12:00', null, ['Domicile']]] },
  });
  const issues = W.publicationIssues(s, coach.id);
  let error = '';
  try { cmd(s, coach, 'publish', coach.id); } catch (e) { error = e.message; }
  observations.push({ id: 'F-03', observed: 'Date-only availability cannot publish without a recurring week',
    reproduced: issues.includes('Ouvrez votre planning.') && error.includes('Ouvrez votre planning.'), issues });
}
{
  let s = fixture();
  const duo = { ...s.offers.find(o => o.id === 'solo'), id: 'duo', kind: 'Duo', capacity: 2, price: 70 };
  s = cmd(s, coach, 'saveOffer', duo);
  const c = M.allCoaches(s).find(c => c.id === coach.id);
  const slots = M.slotsFor(c, '2026-10-02', s, duo);
  const matches = W.alertMatches(s, { id: 'duo-alert', owner: client.id, active: true,
    coach: coach.id, sport: 'Tout', day: '2026-10-02', from: '09:00', to: '12:00',
    budget: 200, seats: 2, groupOnly: false, format: 'Tous', seen: [] });
  observations.push({ id: 'F-04', observed: 'Two-person alert excludes an available Duo even with groupOnly false',
    reproduced: slots.length > 0 && !matches.some(m => m.offer.id === 'duo'), availableDuoSlots: slots.length });
}
console.log(JSON.stringify({ fixtureDate: '2026-09-30', scope: 'shared connected domain; synthetic local data only', observations }, null, 2));
