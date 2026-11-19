import { cpSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputDir = process.env.MAKEFUN_OUTPUT_DIR || join(__dirname, 'output');

mkdirSync(outputDir, { recursive: true });

const appSrc = join(__dirname, 'app');
const appDest = join(outputDir, 'app');
if (existsSync(appSrc)) {
  cpSync(appSrc, appDest, { recursive: true });
}

const screenshotsSrc = join(__dirname, 'screenshots');
const screenshotsDest = join(outputDir, 'screenshots');
if (existsSync(screenshotsSrc)) {
  cpSync(screenshotsSrc, screenshotsDest, { recursive: true });
}

const caps = {
  text_max_bytes: 163840,
  screenshots: {
    max: 4,
    max_bytes: 262144,
  },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const dossier = buildDossier(outputDir, caps);

writeFileSync(join(outputDir, 'dossier.json'), dossier);

console.log(`Wrote dossier to ${join(outputDir, 'dossier.json')}`);
