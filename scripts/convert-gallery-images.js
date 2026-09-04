/* One-off: report gallery image dimensions, then resize + convert to WebP. */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'apps', 'web', 'public', 'images', 'parallax');
const MODE = process.argv[2] || 'report'; // report | convert
const MAX_WIDTH = 1080; // columns are ~23vw; 1080 covers 4K@DPR1 + 1440p@DPR1.5
const QUALITY = 82;

(async () => {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.jpg'));
  for (const f of files) {
    const src = path.join(DIR, f);
    const meta = await sharp(src).metadata();
    const kb = Math.round(fs.statSync(src).size / 1024);
    if (MODE === 'report') {
      console.log(`${f} ${meta.width}x${meta.height} ${kb}KB`);
      continue;
    }
    const out = path.join(DIR, f.replace(/\.jpg$/, '.webp'));
    const targetW = Math.min(meta.width, MAX_WIDTH);
    await sharp(src)
      .resize({ width: targetW, withoutEnlargement: true })
      .webp({ quality: QUALITY })
      .toFile(out);
    const outKb = Math.round(fs.statSync(out).size / 1024);
    console.log(`${f} ${meta.width}x${meta.height} ${kb}KB -> ${path.basename(out)} ${targetW}x${Math.round((meta.height * targetW) / meta.width)} ${outKb}KB`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
