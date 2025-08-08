#!/usr/bin/env tsx
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { chromium, type Download } from 'playwright';

dotenv.config();

const BASE_URL = 'https://web.onepilot.app';
const EMAIL = process.env.ONEPILOT_EMAIL;
const PASSWORD = process.env.ONEPILOT_PASSWORD;
const HEADLESS = Boolean(process.env.HEADLESS);
const DOWNLOAD_DIR = path.resolve(process.cwd(), 'downloads');

function ts(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
}

async function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function loginEveryTime(page: import('playwright').Page) {
  if (!EMAIL || !PASSWORD) throw new Error('Missing ONEPILOT_EMAIL or ONEPILOT_PASSWORD');

  // Always start from login
  await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Fill credentials
  const email = page.locator('#email');
  const password = page.locator('#password');
  await email.waitFor({ state: 'visible', timeout: 15000 });
  await password.waitFor({ state: 'visible', timeout: 15000 });
  await email.fill(EMAIL);
  await password.fill(PASSWORD);

  // Submit when enabled
  const submit = page.locator('button[type="submit"]');
  await submit.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => {
    const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    return !!btn && !btn.disabled;
  }, { timeout: 10000 });
  await Promise.all([
    page.waitForURL(/\/vehicles/i, { timeout: 30000 }),
    submit.click()
  ]);

  // Ensure vehicles page
  if (!/\/vehicles/i.test(page.url())) {
    await page.goto(`${BASE_URL}/vehicles`, { waitUntil: 'domcontentloaded' });
  }
}

async function exportXlsx(page: import('playwright').Page): Promise<Download> {
  // 1) Identify the actions dropdown at the right of the header: it has a button "Adicionar veículo"
  const addVehicleBtn = page.getByRole('button', { name: /Adicionar veículo/i });
  await addVehicleBtn.first().waitFor({ state: 'visible', timeout: 10000 });

  // 2) Click the split toggle that is the sibling of that button
  const splitToggle = addVehicleBtn.first().locator('xpath=following-sibling::button[contains(@class, "dropdown-toggle-split")]');
  await splitToggle.first().click({ timeout: 5000 });
  await page.waitForTimeout(200);

  // 3) Click on the Exportar menu item within the dropdown menu associated to that button
  const buttonId = await addVehicleBtn.first().getAttribute('id');
  let menu = page.locator('ul.dropdown-menu.show');
  if (buttonId) {
    const byAria = page.locator(`ul.dropdown-menu[aria-labelledby="${buttonId}"]`);
    if ((await byAria.count()) > 0) menu = byAria;
  }
  const exportItem = menu.getByRole('menuitem', { name: /Exportar/i }).or(menu.locator('a.dropdown-item:has-text("Exportar")'));
  await exportItem.first().click({ timeout: 5000 });

  // 4) After clicking Exportar, an XLSX/Excel option may appear or a download may start directly
  const dlPromise = page.waitForEvent('download', { timeout: 60000 });
  const xlsx = page
    .locator('[data-testid*="xlsx" i], [data-test*="xlsx" i], [data-testid*="excel" i], [data-test*="excel" i], [href*="xlsx" i]')
    .or(page.getByRole('menuitem', { name: /xlsx|excel/i }))
    .or(page.getByRole('button', { name: /xlsx|excel/i }))
    .or(page.getByText(/xlsx|excel/i));
  try {
    if ((await xlsx.count()) > 0) {
      await xlsx.first().click({ timeout: 5000 });
    }
  } catch {}
  return dlPromise;
}

async function main() {
  await ensureDir(DOWNLOAD_DIR);
  const browser = await chromium.launch({
    headless: HEADLESS,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    await loginEveryTime(page);
    const download = await exportXlsx(page);
    const out = path.join(DOWNLOAD_DIR, `stock-vehicles-${ts()}.xlsx`);
    await download.saveAs(out);
    console.log(out);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


