import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const ARTIFACT_DIR = path.resolve(process.cwd(), 'C:/Users/anuro/.gemini/antigravity-ide/brain/ebe76311-8789-4f9a-95a8-1c6243c53182');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);

  // 1. Initial Hero view
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_landing_hero.png') });
  console.log('Saved 01_landing_hero.png');

  // Scroll to LogoCloud / top of Parallax Gallery
  await page.evaluate(() => {
    const gallery = document.querySelector('[data-testid="parallax-gallery-section"]');
    if (gallery) {
      gallery.scrollIntoView({ behavior: 'instant', block: 'start' });
    } else {
      window.scrollTo(0, 900);
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_gallery_start.png') });
  console.log('Saved 02_gallery_start.png');

  // Scroll 400px down inside gallery
  await page.evaluate(() => window.scrollBy(0, 450));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_gallery_mid_scroll.png') });
  console.log('Saved 03_gallery_mid_scroll.png');

  // Scroll another 500px down inside gallery
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_gallery_deep_scroll.png') });
  console.log('Saved 04_gallery_deep_scroll.png');

  // Scroll to Showcase panel transition
  await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="showcase-panel"]');
    if (panel) {
      panel.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_showcase_panel_transition.png') });
  console.log('Saved 05_showcase_panel_transition.png');

  // Tablet Viewport Check
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.evaluate(() => {
    const gallery = document.querySelector('[data-testid="parallax-gallery-section"]');
    if (gallery) gallery.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_tablet_gallery.png') });
  console.log('Saved 06_tablet_gallery.png');

  // Mobile Viewport Check
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const gallery = document.querySelector('[data-testid="parallax-gallery-section"]');
    if (gallery) gallery.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_mobile_gallery.png') });
  console.log('Saved 07_mobile_gallery.png');

  // Check console logs or errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  console.log('Visual audit captures complete. Checking column transforms...');
  const columnTransforms = await page.evaluate(() => {
    const cols = Array.from(document.querySelectorAll('.parallax-column'));
    return cols.map((col, i) => {
      const style = window.getComputedStyle(col);
      return {
        col: i + 1,
        transform: style.transform,
        top: style.top,
        height: style.height,
      };
    });
  });
  console.log('Column transforms and metrics:', JSON.stringify(columnTransforms, null, 2));

  await browser.close();
})();
