// make.fun entry build: copies app/ and screenshots/ into the output directory
// and writes the scorer's dossier.json there. Run:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? 'out';
const here = import.meta.dirname ?? '.';

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

// The frontend: static files a browser opens at app/index.html.
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
// The captures: the first by name is the entry's cover.
cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

// The entry ships four captures (checklist, guide, roadmap, filters), each under 256 KiB;
// the caps below mirror the bounty gate so a local build refuses what the scorer would refuse.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});

if (dossier.length === 0) throw new Error('buildDossier returned an empty dossier');

writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`Wrote ${join(outDir, 'dossier.json')} (${dossier.length} bytes)`);
