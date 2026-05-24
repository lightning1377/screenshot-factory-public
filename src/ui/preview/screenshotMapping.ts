import { buildScreenshotPath } from '../utils';
import type { SlotBinding, TemplateSlot } from '../types';

export function buildSceneScreenshotPath({
  app,
  deviceType,
  locale,
  scene,
  theme,
}: {
  app?: string;
  deviceType: string;
  locale?: string;
  scene?: string;
  theme?: string;
}): string {
  return buildScreenshotPath({
    app,
    deviceType,
    locale,
    scene,
    theme,
  });
}

export function resolveSlotBinding(
  binding: string | SlotBinding | undefined,
  fallbackScene: string,
  fallbackTheme?: string,
): { scene: string; theme?: string } {
  if (typeof binding === 'string' && binding.trim()) {
    return { scene: binding.trim(), theme: fallbackTheme };
  }

  if (binding && typeof binding === 'object' && typeof binding.scene === 'string') {
    const scene = binding.scene.trim() || fallbackScene;
    const bindingTheme =
      typeof binding.theme === 'string' && binding.theme.trim() ? binding.theme.trim() : undefined;
    if (!bindingTheme || bindingTheme === '$current') {
      return { scene, theme: fallbackTheme };
    }
    return { scene, theme: bindingTheme };
  }

  return { scene: fallbackScene, theme: fallbackTheme };
}

export function buildTemplateScreenshots({
  slots,
  slotSceneMap,
  app,
  locale,
  scene,
  deviceType,
  currentTheme,
  screenshotOverride,
}: {
  slots: TemplateSlot[];
  slotSceneMap?: Record<string, string | SlotBinding>;
  app?: string;
  locale?: string;
  scene: string;
  deviceType: string;
  currentTheme?: string;
  screenshotOverride?: string;
}): { screenshots: Record<string, string>; primaryScreenshot?: string } {
  const screenshots: Record<string, string> = {};

  slots.forEach((slot) => {
    if (screenshotOverride) {
      screenshots[slot.id] = screenshotOverride;
      return;
    }

    const binding = resolveSlotBinding(slotSceneMap?.[slot.id], scene, currentTheme);
    screenshots[slot.id] = buildSceneScreenshotPath({
      app,
      deviceType,
      locale,
      scene: binding.scene,
      theme: binding.theme,
    });
  });

  const firstSlotId = slots[0]?.id;
  const primaryScreenshot = firstSlotId ? screenshots[firstSlotId] : screenshotOverride;
  return { screenshots, primaryScreenshot };
}
