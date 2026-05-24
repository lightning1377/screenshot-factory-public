import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildScenePreviewUrl, buildSinglePreviewUrl } from '../../src/ui/preview/urlBuilder';

describe('previewUrlBuilder', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds single preview url with cache busting and slot screenshots', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);

    const url = buildSinglePreviewUrl({
      templateFile: 'phone.html',
      title: 'My Great App',
      screenshot: '/screenshots/raw/demo/phone/en/home.png',
      screenshots: {
        screenshot: '/screenshots/raw/demo/phone/en/home.png',
        screenshot2: '/screenshots/raw/demo/phone/en/details.png',
      },
      cacheBust: true,
    });

    expect(url.startsWith('/templates/phone.html?')).toBe(true);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('title')).toBe('My Great App');
    expect(params.get('screenshot')).toBe('/screenshots/raw/demo/phone/en/home.png');
    expect(params.get('t')).toBe('1700000000000');
    expect(params.get('screenshots')).toBe(
      JSON.stringify({
        screenshot: '/screenshots/raw/demo/phone/en/home.png',
        screenshot2: '/screenshots/raw/demo/phone/en/details.png',
      }),
    );
  });

  it('adds theme and darkMode for dark themed scene previews', () => {
    const url = buildScenePreviewUrl({
      templateFile: 'phone.html',
      title: 'Home',
      screenshot: '/screenshots/raw/demo/phone/en/home_dark.png',
      screenshots: {
        screenshot: '/screenshots/raw/demo/phone/en/home_dark.png',
      },
      theme: 'dark',
    });

    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('theme')).toBe('dark');
    expect(params.get('darkMode')).toBe('true');
  });
});
