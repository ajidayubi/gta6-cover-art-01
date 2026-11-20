import * as fs from 'fs';
import * as path from 'path';
import { buildDossier } from './vendor/makefun-app.ts';

// This entrypoint copies the app and screenshots into the output directory and builds the dossier.
function copyRecursiveSync(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    for (const childItemName of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function main() {
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR || 'out';

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  copyRecursiveSync('app', path.join(outputDir, 'app'));
  copyRecursiveSync('screenshots', path.join(outputDir, 'screenshots'));

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
  console.log('Output directory:', outputDir);
}

main();
