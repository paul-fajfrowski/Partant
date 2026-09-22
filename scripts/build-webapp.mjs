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
const result = spawnSync(
  process.execPath,
  [
    cli,
    "export",
    "--platform",
    "web",
    "--output-dir",
    path.join(root, "apps/web/dist"),
  ],
  {
    cwd: mobile,
    stdio: "inherit",
    env: process.env,
  },
);
process.exit(result.status ?? 1);
