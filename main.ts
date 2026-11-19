import { cp, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");

await mkdir(out, { recursive: true });
await cp(join(here, "app"), join(out, "app"), { recursive: true });
await cp(join(here, "screenshots"), join(out, "screenshots"), {
  recursive: true,
});

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
await writeFile(join(out, "dossier.json"), dossier);
console.log("dossier written to", join(out, "dossier.json"));
