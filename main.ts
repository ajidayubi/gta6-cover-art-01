import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function copyRecursive(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    const parentDir = path.dirname(dest);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
  }
}

function main() {
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR || path.join(__dirname, 'out');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Resolve app and screenshots directories from this file's location because the grader runs from a different working directory
  const appSrc = path.join(__dirname, 'app');
  const appDest = path.join(outputDir, 'app');
  copyRecursive(appSrc, appDest);

  const screenshotsSrc = path.join(__dirname, 'screenshots');
  const screenshotsDest = path.join(outputDir, 'screenshots');
  copyRecursive(screenshotsSrc, screenshotsDest);

  const limits = {
    text_max_bytes: 163840,
    screenshots: {
      max: 4,
      max_bytes: 262144
    },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000
  };

  const dossierBytes = buildDossier(outputDir, limits);

  const dossierPath = path.join(outputDir, 'dossier.json');
  fs.writeFileSync(dossierPath, Buffer.from(dossierBytes));

  console.log('Dossier was written');
  console.log(outputDir);
  console.log(appSrc);
}

main();
