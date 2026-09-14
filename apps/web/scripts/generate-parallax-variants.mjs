#!/usr/bin/env node
/**
 * Generates responsive WebP variants for the parallax gallery masters.
 *
 * The 12 masters in apps/web/public/images/parallax/ are 1080px wide
 * (1080x1485, matching the gallery tile aspect ratio). This script derives
 * -480.webp and -800.webp variants that the gallery's <img srcset> serves to
 * phones and small-desktop DPRs, cutting GPU texture memory ~10x on mobile
 * and ~3x on desktop.
 *
 * Idempotent: an output is regenerated only when missing, stale (older than
 * its master), or when --force is passed.
 *
 * Usage:
 *   node apps/web/scripts/generate-parallax-variants.mjs [--force]
 */
import { readdir, stat, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const imageDir = path.resolve(scriptDir, '../public/images/parallax');
const WIDTHS = [480, 800];
const FORCE = process.argv.includes('--force');

const MASTER_RE = /^\d{2}-.+\.webp$/;
const VARIANT_RE = /-(?:480|800)\.webp$/;

async function main() {
  let entries;
  try {
    entries = await readdir(imageDir);
  } catch (err) {
    console.error(`Cannot read ${imageDir}: ${err.message}`);
    process.exit(1);
  }

  const masters = entries.filter(
    (name) => MASTER_RE.test(name) && !VARIANT_RE.test(name) && name.endsWith('.webp')
  );
  if (masters.length === 0) {
    console.error('No parallax master images found.');
    process.exit(1);
  }

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const master of masters) {
    const masterPath = path.join(imageDir, master);
    const masterMtime = (await stat(masterPath)).mtimeMs;
    const base = master.slice(0, -'.webp'.length);

    for (const width of WIDTHS) {
      const outName = `${base}-${width}.webp`;
      const outPath = path.join(imageDir, outName);
      let outMtime = -Infinity;
      try {
        outMtime = (await stat(outPath)).mtimeMs;
      } catch {
        outMtime = -Infinity;
      }

      const stale = outMtime < masterMtime;
      if (!FORCE && outMtime !== -Infinity && !stale) {
        skipped++;
        continue;
      }

      try {
        await mkdir(path.dirname(outPath), { recursive: true });
        const input = await readFile(masterPath);
        const output = await sharp(input)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80, effort: 4 })
          .toBuffer();
        await writeFile(outPath, output);
        generated++;
        console.log(
          `${stale && !FORCE ? 'stale  ' : FORCE ? 'forced ' : 'new    '}${outName} (${(output.length / 1024).toFixed(1)} KB)`
        );
      } catch (err) {
        failed++;
        console.error(`FAILED ${outName}: ${err.message}`);
      }
    }
  }

  console.log(
    `\nDone: ${generated} generated, ${skipped} up-to-date, ${failed} failed across ${masters.length} masters.`
  );
  if (failed > 0) process.exit(1);
}

main();
