import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'fs-extra';
import puppeteer, { type Browser, type Page } from 'puppeteer';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const baseUrl = process.env.SCREENSHOT_FACTORY_DOCS_URL || 'http://localhost:8000';
const outputDir = path.join(repoRoot, 'docs', 'screenshots');

interface PanelScreenshot {
  hash: string;
  file: string;
  label: string;
  waitText: string;
  waitSelector?: string;
  scrollSelector?: string;
}

const panels: PanelScreenshot[] = [
  {
    hash: 'landing',
    file: 'home.png',
    label: 'Home',
    waitText: 'Select App Configuration',
  },
  {
    hash: 'configs',
    file: 'app-config.png',
    label: 'App Config',
    waitText: 'Config Actions',
  },
  {
    hash: 'capture',
    file: 'capture.png',
    label: 'Capture',
    waitText: 'Demo capture data loaded.',
  },
  {
    hash: 'preview',
    file: 'preview.png',
    label: 'Preview',
    waitText: 'Demo render outputs are ready.',
    waitSelector: '#preview-grid iframe',
    scrollSelector: '#preview-grid',
  },
  {
    hash: 'templates',
    file: 'templates.png',
    label: 'Templates',
    waitText: 'Template Studio',
  },
  {
    hash: 'upload',
    file: 'upload.png',
    label: 'Upload',
    waitText: 'Demo screenshots discovered and verified.',
  },
];

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerReady(): Promise<boolean> {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServer(): Promise<ChildProcessWithoutNullStreams | null> {
  if (await isServerReady()) {
    return null;
  }

  const server = spawn('npm', ['run', 'dev'], {
    cwd: repoRoot,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
  });
  server.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
  });

  const startedAt = Date.now();
  while (Date.now() - startedAt < 30000) {
    if (await isServerReady()) {
      return server;
    }
    await delay(500);
  }

  server.kill();
  throw new Error(`Timed out waiting for ${baseUrl}`);
}

async function waitForPanel(page: Page, panel: PanelScreenshot): Promise<void> {
  await page.waitForSelector(panel.waitSelector || '#page-root', { timeout: 15000 });
  await page.waitForFunction(
    (text) => document.querySelector('#page-root')?.textContent?.includes(text),
    { timeout: 15000 },
    panel.waitText,
  );
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  if (panel.scrollSelector) {
    await page.evaluate((selector) => {
      document.querySelector(selector)?.scrollIntoView({ block: 'start' });
    }, panel.scrollSelector);
  }
  await delay(500);
}

async function capturePanel(page: Page, panel: PanelScreenshot): Promise<void> {
  const url = `${baseUrl}/?demo=1#${panel.hash}`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForPanel(page, panel);

  const outPath = path.join(outputDir, panel.file);
  await page.screenshot({
    path: outPath,
    fullPage: false,
  });
  console.log(`Captured ${panel.label}: ${path.relative(repoRoot, outPath)}`);
}

function screenshotGalleryMarkdown(): string {
  const image = (panel: PanelScreenshot) =>
    `![${panel.label} panel](docs/screenshots/${panel.file})`;

  return [
    '<!-- readme-screenshots:start -->',
    '### UI Screenshots',
    '',
    '| Home | App Config | Capture |',
    '| --- | --- | --- |',
    `| ${image(panels[0])} | ${image(panels[1])} | ${image(panels[2])} |`,
    '',
    '| Preview | Templates | Upload |',
    '| --- | --- | --- |',
    `| ${image(panels[3])} | ${image(panels[4])} | ${image(panels[5])} |`,
    '<!-- readme-screenshots:end -->',
  ].join('\n');
}

async function updateReadme(): Promise<void> {
  const readmePath = path.join(repoRoot, 'README.md');
  const readme = await fs.readFile(readmePath, 'utf8');
  const gallery = screenshotGalleryMarkdown();
  const blockPattern = /<!-- readme-screenshots:start -->[\s\S]*?<!-- readme-screenshots:end -->/;

  if (blockPattern.test(readme)) {
    await fs.writeFile(readmePath, `${readme.replace(blockPattern, gallery)}\n`);
    return;
  }

  const insertionPoint = '\n## App Configs';
  if (!readme.includes(insertionPoint)) {
    throw new Error('Could not find README insertion point.');
  }

  await fs.writeFile(readmePath, readme.replace(insertionPoint, `\n${gallery}\n${insertionPoint}`));
}

async function run(): Promise<void> {
  await fs.ensureDir(outputDir);

  const server = await ensureServer();
  let browser: Browser | null = null;

  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });

    for (const panel of panels) {
      await capturePanel(page, panel);
    }

    await updateReadme();
    console.log('README screenshot gallery updated.');
  } finally {
    if (browser) {
      await browser.close();
    }
    if (server) {
      server.kill();
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
