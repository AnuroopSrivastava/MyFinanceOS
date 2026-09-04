import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const url = process.argv[2] || 'http://localhost:3000';
const outputPath = process.argv[3] || 'preview.png';
const width = parseInt(process.argv[4] || '1440', 10);
const height = parseInt(process.argv[5] || '900', 10);

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 2,
    });

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    const resolvedOutput = path.resolve(process.cwd(), outputPath);
    const dir = path.dirname(resolvedOutput);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    await page.screenshot({ path: resolvedOutput, fullPage: false });
    console.log(`Screenshot saved successfully to ${resolvedOutput}`);
  } catch (error) {
    console.error('Failed to capture screenshot:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
