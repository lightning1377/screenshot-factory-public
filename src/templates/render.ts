import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs-extra';
import { loadAppConfig } from '../config';
import chalk from 'chalk';
import { RenderOptions } from '../contract/types';
import { Logger } from '../runner/run';

const defaultLogger: Logger = (msg) => console.log(chalk.gray(`  🖼️ ${msg}`));

interface TemplateSlot {
  id: string;
  required?: boolean;
}

interface TemplateMetadata {
  name: string;
  files: {
    phone: string;
    tablet: string;
  };
  slots: TemplateSlot[];
  textSlots?: { id: string; label?: string }[];
}

function resolveSlotBinding(binding: any, fallbackScene: string, fallbackTheme?: string) {
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

function getTemplateFileFromName(templateName: string | undefined, deviceType: 'phone' | 'tablet') {
  const normalized = (templateName || '').trim();
  if (!normalized) {
    return deviceType === 'tablet' ? 'tablet.html' : 'phone.html';
  }

  if (normalized.endsWith('.html')) {
    return normalized;
  }

  if (normalized === 'normal' || normalized === 'default') {
    return deviceType === 'tablet' ? 'tablet.html' : 'phone.html';
  }

  return `${deviceType}_${normalized}.html`;
}

async function loadTemplateMetadata(templateName: string): Promise<TemplateMetadata | null> {
  const metadataPath = path.join(process.cwd(), 'templates', `${templateName}.meta.json`);
  if (!(await fs.pathExists(metadataPath))) {
    return null;
  }

  try {
    const raw = await fs.readJson(metadataPath);
    const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
    const phoneFile = typeof raw?.files?.phone === 'string' ? raw.files.phone.trim() : '';
    const tabletFile = typeof raw?.files?.tablet === 'string' ? raw.files.tablet.trim() : '';
    if (!name || !phoneFile || !tabletFile) {
      return null;
    }

    const slots = Array.isArray(raw?.slots)
      ? raw.slots
          .map((slot: any) => {
            const id = typeof slot?.id === 'string' ? slot.id.trim() : '';
            if (!id) return null;
            const required = typeof slot?.required === 'boolean' ? slot.required : undefined;
            return { id, required };
          })
          .filter(Boolean)
      : [];

    const textSlots = Array.isArray(raw?.textSlots)
      ? raw.textSlots
          .map((slot: any) => {
            const id = typeof slot?.id === 'string' ? slot.id.trim() : '';
            if (!id) return null;
            const label = typeof slot?.label === 'string' ? slot.label.trim() : undefined;
            return { id, label };
          })
          .filter(Boolean)
      : [];

    return {
      name,
      files: {
        phone: phoneFile,
        tablet: tabletFile,
      },
      slots: slots as TemplateSlot[],
      textSlots: textSlots.length > 0 ? textSlots : undefined,
    };
  } catch {
    return null;
  }
}

export async function renderFinalImages(options: RenderOptions, logger: Logger = defaultLogger) {
  const { configPath, deviceType, signal } = options;
  const appConfig = await loadAppConfig(configPath);

  const browser = await puppeteer.launch({
    headless: true,
  });
  const page = await browser.newPage();

  const rawDir = path.join(process.cwd(), 'screenshots', 'raw', appConfig.id, deviceType);
  const finalDir = path.join(process.cwd(), 'screenshots', 'final', appConfig.id, deviceType);

  for (const locale of appConfig.locales) {
    if (signal?.aborted) throw new Error('Render aborted by user');
    const localeDir = path.join(finalDir, locale);
    await fs.ensureDir(localeDir);

    for (const scene of appConfig.scenes) {
      if (signal?.aborted) throw new Error('Render aborted by user');
      // Check for raw screenshot candidates (default or themes)
      const defaultPath = path.join(rawDir, locale, `${scene}.png`);
      const candidates: { path: string; theme?: string }[] = [];

      if (await fs.pathExists(defaultPath)) {
        candidates.push({ path: defaultPath });
      }

      // Check for configured themes
      const sceneIdx = appConfig.scenes.indexOf(scene);
      const sceneConfig = sceneIdx >= 0 ? appConfig.sceneConfigs?.[sceneIdx] : undefined;
      if (sceneConfig?.themes) {
        const themes = sceneConfig.themes.filter(Boolean);
        for (const theme of themes) {
          const themePath = path.join(rawDir, locale, `${scene}_${theme}.png`);
          if (await fs.pathExists(themePath)) {
            candidates.push({ path: themePath, theme });
          }
        }
      }

      if (candidates.length === 0) {
        logger(`Missing raw screenshot for scene: ${scene} (checked default and themes)`, 'warn');
        continue;
      }

      for (const candidate of candidates) {
        if (signal?.aborted) throw new Error('Render aborted by user');
        const currentTheme = candidate.theme;

        // Determine template for this scene
        const configuredTemplateName = sceneConfig?.templateId;
        let templateName = getTemplateFileFromName(
          configuredTemplateName,
          deviceType === 'tablet' ? 'tablet' : 'phone',
        );
        let templatePath = path.join(process.cwd(), 'templates', templateName);
        let templateMetadata =
          configuredTemplateName && !configuredTemplateName.endsWith('.html')
            ? await loadTemplateMetadata(configuredTemplateName)
            : null;

        if (templateMetadata) {
          templateName = templateMetadata.files[deviceType === 'tablet' ? 'tablet' : 'phone'];
          templatePath = path.join(process.cwd(), 'templates', templateName);
        }

        if (!(await fs.pathExists(templatePath))) {
          logger(`Template not found: ${templateName}, falling back to default`, 'warn');
          templateName = `${deviceType}.html`;
          templatePath = path.join(process.cwd(), 'templates', templateName);
          templateMetadata = await loadTemplateMetadata('normal');
        }

        const textParams: Record<string, string> = {};
        const templateTextSlots = templateMetadata?.textSlots || [{ id: 'title' }];

        templateTextSlots.forEach((slot) => {
          const slotDef = sceneConfig?.textSlots?.[slot.id]?.[locale];
          let val = slot.id === 'title' ? scene : '';

          if (typeof slotDef === 'string') {
            val = slotDef;
          } else if (slotDef) {
            val = (currentTheme && slotDef[currentTheme]) || slotDef.default || val;
          }
          textParams[slot.id] = val;
        });

        const slotSceneMap = sceneConfig?.slotSceneMap || {};
        const slots = templateMetadata?.slots || [];

        const screenshots: Record<string, string> = {};
        let missingRequiredSlot = false;

        for (const slot of slots) {
          const slotBinding = resolveSlotBinding(slotSceneMap[slot.id], scene, currentTheme);
          const slotFile = slotBinding.theme
            ? `${slotBinding.scene}_${slotBinding.theme}.png`
            : `${slotBinding.scene}.png`;
          const slotPath = path.join(rawDir, locale, slotFile);

          if (await fs.pathExists(slotPath)) {
            screenshots[slot.id] = slotPath;
            continue;
          }

          if (slot.required) {
            missingRequiredSlot = true;
            logger(
              `Missing required slot "${slot.id}" for scene "${scene}" (${slotFile}) using template "${templateName}"`,
              'warn',
            );
          }
        }

        if (missingRequiredSlot) {
          continue;
        }

        const firstSlotId = slots[0]?.id;
        const primaryScreenshot =
          (firstSlotId ? screenshots[firstSlotId] : undefined) || candidate.path;
        if (firstSlotId && !screenshots[firstSlotId]) {
          screenshots[firstSlotId] = primaryScreenshot;
        }

        // Load template with data
        const query = new URLSearchParams();
        query.set('screenshot', primaryScreenshot);
        query.set('screenshots', JSON.stringify(screenshots));

        // Pass all text slots to template
        Object.entries(textParams).forEach(([key, val]) => {
          query.set(key, val);
        });

        // Pass theme to template if available
        if (currentTheme) {
          query.set('theme', currentTheme);
          if (currentTheme === 'dark') {
            query.set('darkMode', 'true');
          }
        }
        const url = `file://${templatePath}?${query.toString()}`;

        // Set viewport based on template type
        const viewport =
          deviceType === 'tablet'
            ? { width: 2560, height: 1600 } // Tablet store screenshot size (Landscape)
            : { width: 1080, height: 1920 }; // Phone store screenshot size

        await page.setViewport(viewport);
        await page.goto(url, { waitUntil: 'networkidle0' });

        const suffix = currentTheme ? `-${currentTheme}` : '';
        const outPath = path.join(localeDir, `${scene}${suffix}-market.png`);
        await page.screenshot({ path: outPath });
        logger(`Rendered: ${outPath}`, 'info');
      }
    }
  }

  await browser.close();
}
