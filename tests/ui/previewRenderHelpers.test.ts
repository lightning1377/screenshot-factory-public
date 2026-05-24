import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildScreenshotPath, buildTemplateUrl } from '../../src/ui/utils';

describe('preview render helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('buildScreenshotPath produces themed and non-themed paths', () => {
    expect(
      buildScreenshotPath({
        app: 'demo',
        deviceType: 'phone',
        locale: 'en',
        scene: 'home',
      }),
    ).toBe('/screenshots/raw/demo/phone/en/home.png');

    expect(
      buildScreenshotPath({
        app: 'demo',
        deviceType: 'phone',
        locale: 'en',
        scene: 'home',
        theme: 'dark',
      }),
    ).toBe('/screenshots/raw/demo/phone/en/home_dark.png');
  });

  it('buildTemplateUrl encodes query params used by preview rendering', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const url = buildTemplateUrl({
      template: 'phone.html',
      title: 'My Great App',
      screenshot: '/screenshots/raw/demo/phone/en/home.png',
      screenshots: {
        screenshot: '/screenshots/raw/demo/phone/en/home.png',
        screenshot2: '/screenshots/raw/demo/phone/en/details.png',
      },
      cacheBust: true,
      theme: 'dark',
      darkMode: true,
    });

    expect(url.startsWith('/templates/phone.html?')).toBe(true);

    const [, query = ''] = url.split('?');
    const params = new URLSearchParams(query);

    expect(params.get('title')).toBe('My Great App');
    expect(params.get('screenshot')).toBe('/screenshots/raw/demo/phone/en/home.png');
    expect(params.get('theme')).toBe('dark');
    expect(params.get('darkMode')).toBe('true');
    expect(params.get('t')).toBe('1700000000000');
    expect(params.get('screenshots')).toBe(
      JSON.stringify({
        screenshot: '/screenshots/raw/demo/phone/en/home.png',
        screenshot2: '/screenshots/raw/demo/phone/en/details.png',
      }),
    );
  });
});
