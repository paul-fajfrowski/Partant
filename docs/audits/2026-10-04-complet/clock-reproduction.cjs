// Audit-only deterministic clock; neither app source nor existing tests are changed.
const fixed=Date.parse('2026-09-30T10:00:00Z');
function freeze(time){const Original=Date;globalThis.Date=class extends Original{constructor(...args){super(...(args.length?args:[time]));}static now(){return time;}};}
freeze(fixed);
const {chromium}=require(require('node:path').resolve(process.cwd(),'tools/qa/node_modules/playwright'));
const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{const b=await launch(...args),context=b.newContext.bind(b),page=b.newPage.bind(b);b.newContext=async(...args)=>{const c=await context(...args);await c.addInitScript(freeze,fixed);return c};b.newPage=async(...args)=>{const p=await page(...args);await p.addInitScript(freeze,fixed);return p};return b};
