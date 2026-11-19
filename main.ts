import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildDossier } from './vendor/makefun-app.ts';

const outputDir = process.env.MAKEFUN_OUTPUT_DIR || 'out';

// Ensure output directory exists
fs.mkdirSync(outputDir, { recursive: true });

// Copy app directory if it exists
const appDir = 'app';
if (fs.existsSync(appDir)) {
  fs.cpSync(appDir, path.join(outputDir, 'app'), { recursive: true });
}

// Copy screenshots directory if it exists
const screenshotsDir = 'screenshots';
if (fs.existsSync(screenshotsDir)) {
  fs.cpSync(screenshotsDir, path.join(outputDir, 'screenshots'), { recursive: true });
}

// Build submission dossier
const dossierBytes = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: {
    max: 4,
    max_bytes: 262144
  },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000
});

// Write dossier bytes directly to dossier.json in the output directory
fs.writeFileSync(path.join(outputDir, 'dossier.json'), Buffer.from(dossierBytes));

console.log('Dossier was written');
