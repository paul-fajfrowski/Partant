// Check tracked working files; print filenames/reasons only, never credential contents.
const {execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const files=execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
let failures=0;
for(const file of files) {
 if(!fs.existsSync(path.join(root,file)))continue;
 const forbidden=(/(^|\/)\.env(?:\..*)?$/.test(file)&&!file.endsWith('.env.example')) || /(^|\/)(AuthKey_[^/]+\.p8|client_secret_[^/]+\.json)$/.test(file)||file.startsWith('.local-backups/');
 let reason=forbidden?'private filename':'';
 const text=fs.readFileSync(path.join(root,file),'utf8');
 if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text))reason='private key';
 if(/\bsb_secret_[A-Za-z0-9_-]{20,}/.test(text))reason='Supabase secret key';
 for(const token of text.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)||[]) {
  try {if(JSON.parse(Buffer.from(token.split('.')[1],'base64url')).role==='service_role')reason='privileged JWT';}catch{}
 }
 if(reason){failures++;console.error(`${file}: ${reason}`);}
}
console.log(`${files.length} tracked files checked; ${failures} potential secret(s). This is not a full Git-history scan.`);
process.exitCode=failures?1:0;
