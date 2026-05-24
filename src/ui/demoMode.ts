import type { AppConfig, TemplateCatalogEntry } from './types';
import type { PreviewGridCard } from './views/PreviewGrid';
import { buildTemplateUrl, getTemplateDimensions } from './utils';

export const DEMO_CONFIG_PATH = 'apps/example.config.json';

export function isDemoMode(): boolean {
  return new URLSearchParams(window.location.search).get('demo') === '1';
}

export const demoDevices = ['emulator-5554', 'Pixel_8_API_35'];

export const demoEmulators = [
  {
    id: 'pixel-8-api-35',
    name: 'Pixel 8 API 35',
    status: 'booted',
    type: 'android',
  },
  {
    id: 'pixel-tablet-api-35',
    name: 'Pixel Tablet API 35',
    status: 'stopped',
    type: 'android',
  },
];

export const demoCaptureLogs = [
  '[info] Loaded apps/example.config.json',
  '[info] Using emulator-5554 as phone target',
  '[info] Opening myapp://screenshot/home?lang=en&theme=light',
  '[info] Captured screenshots/raw/example-app/phone/en/home_light.png',
  '[info] Opening myapp://screenshot/details?lang=en&theme=light',
  '[info] Captured screenshots/raw/example-app/phone/en/details_light.png',
  '[success] Capture finished successfully.',
].join('\n');

export const demoRenderLogs = [
  '[info] Rendered screenshots/final/example-app/phone/en/home-light-market.png',
  '[info] Rendered screenshots/final/example-app/phone/en/details-light-market.png',
  '[success] Ready for store upload.',
].join('\n');

export const demoUploadLogs = [
  '[info] Found 2 phone screenshots for en',
  '[info] Prepared screenshots/upload/example-app/en/01-home-light.png',
  '[info] Prepared screenshots/upload/example-app/en/02-details-light.png',
  '[success] Dry run completed.',
].join('\n');

export const demoDiscoveredScreenshots = [
  {
    fullPath: 'screenshots/final/example-app/phone/en/home-light-market.png',
    filename: 'home-light-market.png',
    language: 'en',
    deviceType: 'phone',
  },
  {
    fullPath: 'screenshots/final/example-app/phone/en/details-light-market.png',
    filename: 'details-light-market.png',
    language: 'en',
    deviceType: 'phone',
  },
];

function demoRawScreenshot(scene: string): string {
  const isDetails = scene === 'details';
  const accent = isDetails ? '#14b8a6' : '#6366f1';
  const title = isDetails ? 'Details' : 'Home';
  const subtitle = isDetails ? 'Feature insight' : 'Daily overview';
  const metric = isDetails ? '92%' : '18.4k';

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#f8fafc"/>
          <stop offset="1" stop-color="#e2e8f0"/>
        </linearGradient>
      </defs>
      <rect width="720" height="1280" fill="url(#bg)"/>
      <rect x="56" y="76" width="608" height="1128" rx="44" fill="#ffffff"/>
      <circle cx="112" cy="136" r="24" fill="${accent}"/>
      <text x="152" y="148" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="700" fill="#0f172a">Example App</text>
      <text x="88" y="256" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="800" fill="#0f172a">${title}</text>
      <text x="92" y="314" font-family="Inter, Arial, sans-serif" font-size="30" fill="#64748b">${subtitle}</text>
      <rect x="88" y="384" width="544" height="240" rx="34" fill="${accent}" opacity="0.14"/>
      <text x="126" y="488" font-family="Inter, Arial, sans-serif" font-size="86" font-weight="800" fill="${accent}">${metric}</text>
      <text x="132" y="546" font-family="Inter, Arial, sans-serif" font-size="28" fill="#334155">screenshots generated</text>
      <rect x="88" y="684" width="544" height="86" rx="24" fill="#f1f5f9"/>
      <rect x="88" y="804" width="544" height="86" rx="24" fill="#f1f5f9"/>
      <rect x="88" y="924" width="544" height="86" rx="24" fill="#f1f5f9"/>
      <rect x="120" y="716" width="260" height="22" rx="11" fill="#94a3b8"/>
      <rect x="120" y="836" width="330" height="22" rx="11" fill="#94a3b8"/>
      <rect x="120" y="956" width="220" height="22" rx="11" fill="#94a3b8"/>
    </svg>
  `;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function resolveTemplateFile(
  catalog: TemplateCatalogEntry[],
  templateId: string,
  deviceType: 'phone' | 'tablet',
): string {
  const entry = catalog.find((item) => item.name === templateId);
  if (entry) {
    return deviceType === 'tablet' ? entry.files.tablet : entry.files.phone;
  }
  return deviceType === 'tablet' ? 'tablet.html' : 'phone.html';
}

export function createDemoPreviewCards(
  config: AppConfig,
  catalog: TemplateCatalogEntry[],
): PreviewGridCard[] {
  const deviceType = 'phone';
  const locale = config.locales[0] || 'en';
  const cardWidth = 300;

  return (config.scenes || []).map((scene, index) => {
    const sceneConfig = config.sceneConfigs?.[index];
    const templateFile = resolveTemplateFile(
      catalog,
      sceneConfig?.templateId || 'normal',
      deviceType,
    );
    const dims = getTemplateDimensions(templateFile);
    const scale = cardWidth / dims.width;
    const primary = demoRawScreenshot(scene);
    const secondary = demoRawScreenshot(scene === 'details' ? 'home' : 'details');

    const titleSlot = sceneConfig?.textSlots?.title?.[locale];
    const title = typeof titleSlot === 'string' ? titleSlot : scene;

    const url = buildTemplateUrl({
      template: templateFile,
      title,
      screenshot: primary,
      screenshots: {
        primary,
        secondary,
      },
      theme: 'light',
    });

    return {
      id: `${scene}-demo`,
      label: scene,
      subtitle: title,
      url,
      width: dims.width,
      height: dims.height,
      scaledWidth: cardWidth,
      scaledHeight: dims.height * scale,
      scale,
    };
  });
}
