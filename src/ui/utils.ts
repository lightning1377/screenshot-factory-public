import type { AppConfig } from './types';

export function getTemplateType(templateName: string): 'tablet' | 'phone' {
  const name = (templateName || '').toLowerCase();
  return name.includes('tablet') ? 'tablet' : 'phone';
}

interface Dimensions {
  width: number;
  height: number;
}

export function getTemplateDimensions(templateName: string): Dimensions {
  const isTablet = getTemplateType(templateName) === 'tablet';
  return isTablet ? { width: 2560, height: 1600 } : { width: 1080, height: 1920 };
}

interface ScreenshotPathOptions {
  app?: string;
  deviceType?: string;
  locale?: string;
  scene?: string;
  theme?: string;
}

export function buildScreenshotPath({
  app,
  deviceType,
  locale,
  scene,
  theme,
}: ScreenshotPathOptions): string {
  const file = theme ? `${scene}_${theme}.png` : `${scene}.png`;
  return `/screenshots/raw/${app}/${deviceType}/${locale}/${file}`;
}

interface TemplateUrlOptions {
  template?: string;
  title?: string;
  screenshot?: string;
  screenshots?: Record<string, string>;
  cacheBust?: boolean;
  theme?: string;
  darkMode?: boolean;
}

export function buildTemplateUrl({
  template,
  title,
  screenshot,
  screenshots,
  cacheBust = false,
  theme,
  darkMode,
}: TemplateUrlOptions): string {
  const params = new URLSearchParams();
  if (title) params.set('title', title);
  if (screenshot) params.set('screenshot', screenshot);
  if (screenshots && Object.keys(screenshots).length > 0) {
    params.set('screenshots', JSON.stringify(screenshots));
  }
  if (cacheBust) params.set('t', Date.now().toString());
  if (theme) params.set('theme', theme);
  if (darkMode) params.set('darkMode', 'true');
  return `/templates/${template}?${params.toString()}`;
}

import type { SceneConfig } from './types';

export function getSceneConfig(config: AppConfig | null, scene: string): SceneConfig | undefined {
  if (!config?.scenes || !config?.sceneConfigs) return undefined;
  const idx = config.scenes.indexOf(scene);
  if (idx < 0) return undefined;
  return config.sceneConfigs[idx];
}

export function getSceneText(
  config: AppConfig | null,
  locale: string,
  scene: string,
  fieldId: string,
  theme?: string,
): string {
  if (!config) return scene;

  const sceneConfig = getSceneConfig(config, scene);
  if (!sceneConfig || !sceneConfig.textSlots) return fieldId === 'title' ? scene : '';

  const slotDef = sceneConfig.textSlots[fieldId];
  if (!slotDef) return fieldId === 'title' ? scene : '';

  const localeDef = slotDef[locale];
  if (!localeDef) return fieldId === 'title' ? scene : '';

  if (typeof localeDef === 'string') {
    return localeDef;
  }

  if (theme && localeDef[theme]) {
    return localeDef[theme];
  }

  return localeDef.default || (fieldId === 'title' ? scene : '');
}

export function titleCase(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}
