// Authorized operator-only, read-only. Supabase CLI handles its existing credentials.
import {spawnSync} from 'node:child_process';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const r=spawnSync('supabase',['db','query','--linked','--project-ref','jhhsysjdeyqsuztjtgea','--file',path.join(root,'scripts/sql/operations-health-33.sql'),'--output','json'],{cwd:root,encoding:'utf8',timeout:60000});
if(r.status!==0)throw Error('Contrôle indisponible : vérifier l’accès CLI Supabase.');
const health=JSON.parse(r.stdout).rows[0].health;console.log(JSON.stringify(health,null,2));
process.exitCode=health.deletions_stalled||health.push_stalled||health.cron_failures_24h?1:0;
