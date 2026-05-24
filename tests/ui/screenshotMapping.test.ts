import { describe, expect, it } from 'vitest';
import {
  buildSceneScreenshotPath,
  buildTemplateScreenshots,
  resolveSlotBinding,
} from '../../src/ui/preview/screenshotMapping';
import type { TemplateSlot } from '../../src/ui/types';

describe('screenshotMapping', () => {
  it('resolves string and object slot bindings with fallback theme rules', () => {
    expect(resolveSlotBinding('details', 'home', 'dark')).toEqual({
      scene: 'details',
      theme: 'dark',
    });

    expect(resolveSlotBinding({ scene: 'gallery', theme: '$current' }, 'home', 'dark')).toEqual({
      scene: 'gallery',
      theme: 'dark',
    });

    expect(resolveSlotBinding({ scene: 'gallery', theme: 'light' }, 'home', 'dark')).toEqual({
      scene: 'gallery',
      theme: 'light',
    });
  });

  it('builds slot screenshot map from slotSceneMap and returns first-slot primary screenshot', () => {
    const slots: TemplateSlot[] = [{ id: 'screenshot' }, { id: 'screenshot2' }];

    const result = buildTemplateScreenshots({
      slots,
      slotSceneMap: {
        screenshot: 'details',
        screenshot2: { scene: 'home', theme: 'light' },
      },
      app: 'demo',
      deviceType: 'phone',
      locale: 'en',
      scene: 'home',
      currentTheme: 'dark',
    });

    expect(result.screenshots).toEqual({
      screenshot: '/screenshots/raw/demo/phone/en/details_dark.png',
      screenshot2: '/screenshots/raw/demo/phone/en/home_light.png',
    });
    expect(result.primaryScreenshot).toBe('/screenshots/raw/demo/phone/en/details_dark.png');
  });

  it('uses screenshot override for all slots', () => {
    const slots: TemplateSlot[] = [{ id: 'screenshot' }, { id: 'screenshot2' }];
    const result = buildTemplateScreenshots({
      slots,
      scene: 'home',
      deviceType: 'phone',
      screenshotOverride: 'https://example.com/override.png',
    });

    expect(result.screenshots).toEqual({
      screenshot: 'https://example.com/override.png',
      screenshot2: 'https://example.com/override.png',
    });
    expect(result.primaryScreenshot).toBe('https://example.com/override.png');
  });

  it('builds fallback screenshot path for non-slot previews', () => {
    expect(
      buildSceneScreenshotPath({
        app: 'demo',
        deviceType: 'tablet',
        locale: 'en',
        scene: 'home',
      }),
    ).toBe('/screenshots/raw/demo/tablet/en/home.png');
  });
});
