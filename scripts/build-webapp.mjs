import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mobile = path.join(root, "apps/mobile");
const cli = path.join(mobile, "node_modules/expo/bin/cli");
if (!fs.existsSync(cli))
  throw Error(
    "Installez les dépendances partagées : npm --prefix apps/mobile ci",
  );
const production = process.argv.includes("--production");
const destination = path.join(root, "apps/web", production ? "dist-production" : "dist");
const result = spawnSync(
  process.execPath,
  [
    cli,
    "export",
    "--platform",
    "web",
    "--output-dir",
    destination,
  ],
  {
    cwd: mobile,
    stdio: "inherit",
    env: { ...process.env, ...(production ? {EXPO_PUBLIC_RELEASE_CHANNEL: "production", EXPO_PUBLIC_DATA_MODE: "connected"} : {}) },
  },
);
if (result.status !== 0) process.exit(result.status ?? 1);
if (production) {
  for (const name of fs.readdirSync(destination)) {
    if (/^(simulation|recette|coach-volume|web)\.(html|js|json)$/.test(name)) fs.unlinkSync(path.join(destination, name));
  }
  fs.copyFileSync(path.join(root, "apps/web/production-headers.txt"), path.join(destination, "_headers"));
}
console.log(production ? "Production export: connected mode only; provider must apply _headers." : "Development export: simulations retained.");
