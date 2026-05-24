import type { AppConfig, DeviceType, SceneConfig, TemplateCatalogEntry, TemplateSlot } from '../types';

function normalizeDeviceType(deviceType?: string): DeviceType {
  return deviceType === 'tablet' ? 'tablet' : 'phone';
}

export function resolveTemplateFile(
  templateRef: string | undefined,
  deviceType: string,
  templateCatalog: TemplateCatalogEntry[],
): string {
  const ref = (templateRef || '').trim();
  const resolvedDeviceType = normalizeDeviceType(deviceType);

  if (!ref) {
    return resolvedDeviceType === 'tablet' ? 'tablet.html' : 'phone.html';
  }

  if (ref.endsWith('.html')) {
    return ref;
  }

  const byCatalogName = templateCatalog.find((item) => item.name === ref);
  if (byCatalogName) {
    return byCatalogName.files[resolvedDeviceType];
  }

  if (ref === 'normal' || ref === 'default') {
    return resolvedDeviceType === 'tablet' ? 'tablet.html' : 'phone.html';
  }

  return `${resolvedDeviceType}_${ref}.html`;
}

export function resolveTemplateSlots(
  templateFile: string,
  deviceType: string,
  templateCatalog: TemplateCatalogEntry[],
  templateName?: string,
): TemplateSlot[] {
  const resolvedDeviceType = normalizeDeviceType(deviceType);
  const byName = templateName ? templateCatalog.find((item) => item.name === templateName) : null;
  const byFile = templateCatalog.find(
    (item) => item.files[resolvedDeviceType] === templateFile,
  );
  const entry = byName || byFile || null;
  return entry?.slots?.length ? entry.slots : [];
}

export function getSceneConfigForScene(
  scene: string | undefined,
  appConfig: Pick<AppConfig, 'scenes' | 'sceneConfigs'> | null | undefined,
): SceneConfig | undefined {
  if (!scene || !appConfig) return undefined;
  const sceneIdx = appConfig.scenes.indexOf(scene);
  if (sceneIdx < 0) return undefined;
  return appConfig.sceneConfigs?.[sceneIdx];
}
