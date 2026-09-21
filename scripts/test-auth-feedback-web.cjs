// Controlled responses only: no real email is sent and no account is created.
const fs = require('node:fs');
const ts = require('../apps/mobile/node_modules/typescript');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText, f);
const { initialStore } = require('../apps/mobile/src/product/model.ts');
const { errorMessage } = require('../apps/mobile/src/lib/errors.ts');
const mode = process.argv[2] || 'limited';
let sends = 0;
const response = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json' },
});
global.fetch = async (url) => {
  const path = String(url);
  if (path.includes('/auth/v1/settings')) return response({ external: { google: true, apple: true } });
  if (path.includes('/functions/v1/product-api')) return response({ version: 0, store: {
    ...initialStore, connected: true, offers: [], extraCoaches: [], bookings: [], notices: [], groups: [], settings: {}, published: false,
  }});
  if (path.includes('/auth/v1/otp')) {
    sends++;
    await new Promise(r => setTimeout(r, 200));
    return mode === 'success' ? response({}) : response({ code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' }, 429);
  }
  throw Error('Unexpected request in controlled test');
};
process.env.PARTANT_QA_URL = 'http://127.0.0.1:8081/?data=connected';
const H = require('./native-web-harness.cjs');
const { d, wait, click, input, ok } = H;
(async () => {
  try {
    for(let i=0;i<40 && !d.body.textContent.includes('Me connecter');i++) await wait();
    await click('Me connecter');
    input('Adresse e-mail', 'test@example.test');
    await wait();
    const button = [...d.querySelectorAll('[role="button"]')].find(e => e.textContent === 'Continuer avec mon e-mail');
    ok(!!button, 'Email button exists');
    button.click(); button.click();
    await wait(); await wait(); await wait();
    ok(sends === 1, 'Rapid double click sends only one request');
    if(mode === 'success') {
      ok(d.body.textContent.includes('Votre lien vous attend.'), 'Successful send reaches link instructions');
    } else {
      ok(d.querySelector('[role="alert"]')?.textContent.includes('Aucun nouvel e-mail'), 'Persistent French error after quota failure');
      ok(!d.body.textContent.includes('Votre lien vous attend.'), 'Failed send never claims link sent');
      const paused = [...d.querySelectorAll('[role="button"]')].find(e => e.textContent.includes('avant un nouvel essai'));
      ok(paused?.getAttribute('aria-disabled') === 'true', 'Email retries temporarily disabled');
      paused.click(); await wait();
      ok(sends === 1, 'Cooldown does not re-send');
      for(const name of ['Google', 'Apple']) {
        const social = [...d.querySelectorAll('[role="button"]')].find(e => e.textContent === 'Continuer avec ' + name);
        ok(social && social.getAttribute('aria-disabled') !== 'true', name + ' remains usable');
      }
    }
    ok(errorMessage({code:'email_address_not_authorized'}).includes('version de test'), 'Unauthorized recipient explained');
    ok(errorMessage({code:'otp_expired'}).includes('expiré'), 'Expired code explained');
    H.finish('auth feedback ' + mode);
  } catch(e) { H.close(); console.error(e.message); process.exitCode=1; }
})();
