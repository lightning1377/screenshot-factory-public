import type { TemplateCatalogEntry, TemplateSlot } from '../../types';

export function getTemplateNames(templates: string[], catalog: TemplateCatalogEntry[]): string[] {
  if (catalog?.length) {
    return catalog.map((item) => item.name).sort();
  }

  const derived = new Set<string>();
  for (const templateFile of templates || []) {
    const name = templateFile.replace(/\.html$/i, '');
    if (name === 'phone' || name === 'tablet') {
      derived.add('normal');
      continue;
    }
    if (name.startsWith('phone_')) {
      derived.add(name.slice('phone_'.length));
    } else if (name.startsWith('tablet_')) {
      derived.add(name.slice('tablet_'.length));
    }
  }

  if (derived.size === 0) {
    derived.add('normal');
  }

  return Array.from(derived).sort();
}

export function getTemplateSlots(
  templateName: string,
  catalog: TemplateCatalogEntry[],
): TemplateSlot[] {
  const selectedName = (templateName || '').trim();
  const entry = selectedName
    ? catalog.find((item) => item.name === selectedName)
    : catalog.find((item) => item.name === 'normal');

  if (entry?.slots?.length) {
    return entry.slots;
  }

  return [];
}

export function readSlotBinding(
  rawBinding: any,
  fallbackScene: string,
): { scene: string; theme?: string } {
  if (typeof rawBinding === 'string' && rawBinding.trim()) {
    return { scene: rawBinding.trim(), theme: '$current' };
  }
  if (rawBinding && typeof rawBinding === 'object' && typeof rawBinding.scene === 'string') {
    const scene = rawBinding.scene.trim() || fallbackScene;
    const theme =
      typeof rawBinding.theme === 'string' && rawBinding.theme.trim()
        ? rawBinding.theme.trim()
        : '$current';
    return { scene, theme };
  }
  return { scene: fallbackScene, theme: '$current' };
}
