const fs = require('fs');
const puppeteer = require('puppeteer');

const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const RENDER_TIMEOUT_MS = 20_000;

let browserPromise = null;

function executablePath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  return fs.existsSync(MAC_CHROME) ? MAC_CHROME : undefined;
}

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: executablePath()?.includes('headless-shell') ? 'shell' : true,
        executablePath: executablePath(),
        timeout: 90_000,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      })
      .then((browser) => {
        browser.on('disconnected', () => (browserPromise = null));
        return browser;
      })
      .catch((err) => {
        browserPromise = null;
        throw err;
      });
  }
  return browserPromise;
}

async function htmlToPdf(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setJavaScriptEnabled(false);
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('data:') || url === 'about:blank') request.continue();
      else request.abort();
    });

    await page.setContent(html, { waitUntil: 'load', timeout: RENDER_TIMEOUT_MS });
    return await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      timeout: RENDER_TIMEOUT_MS,
    });
  } finally {
    await page.close().catch(() => {});
  }
}

async function closeBrowser() {
  if (!browserPromise) return;
  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  await browser?.close();
}

module.exports = { htmlToPdf, closeBrowser, getBrowser };
