import { describe, expect, it } from 'vitest';
import {
  getSceneConfigForScene,
  resolveTemplateFile,
  resolveTemplateSlots,
} from '../../src/ui/preview/templateResolution';
import type { AppConfig, TemplateCatalogEntry } from '../../src/ui/types';

const templateCatalog: TemplateCatalogEntry[] = [
  {
    name: 'normal',
    files: {
      phone: 'phone.html',
      tablet: 'tablet.html',
    },
    slots: [{ id: 'primary' }],
  },
  {
    name: 'example_multi',
    files: {
      phone: 'phone_example_multi.html',
      tablet: 'tablet_example_multi.html',
    },
    slots: [{ id: 'primary' }, { id: 'secondary' }],
  },
];

describe('templateResolution', () => {
  it('resolves template file from explicit file, catalog key, and defaults', () => {
    expect(resolveTemplateFile('phone_example.html', 'phone', templateCatalog)).toBe(
      'phone_example.html',
    );
    expect(resolveTemplateFile('example_multi', 'tablet', templateCatalog)).toBe(
      'tablet_example_multi.html',
    );
    expect(resolveTemplateFile('normal', 'phone', templateCatalog)).toBe('phone.html');
    expect(resolveTemplateFile('', 'tablet', templateCatalog)).toBe('tablet.html');
    expect(resolveTemplateFile('minimal', 'phone', templateCatalog)).toBe('phone_minimal.html');
  });

  it('resolves slots from template name first, then fallback by file', () => {
    const byName = resolveTemplateSlots(
      'tablet_example_multi.html',
      'tablet',
      templateCatalog,
      'normal',
    );
    expect(byName.map((slot) => slot.id)).toEqual(['primary']);

    const byFile = resolveTemplateSlots('phone_example_multi.html', 'phone', templateCatalog);
    expect(byFile.map((slot) => slot.id)).toEqual(['primary', 'secondary']);
  });

  it('returns matching scene config by scene index', () => {
    const appConfig: AppConfig = {
      id: 'demo',
      packageName: 'com.demo',
      name: 'Demo',
      locales: ['en'],
      scenes: ['home', 'details'],
      sceneConfigs: [
        { templateId: 'normal' },
        { templateId: 'example_multi', themes: ['dark'] },
      ],
    };

    expect(getSceneConfigForScene('details', appConfig)?.templateId).toBe('example_multi');
    expect(getSceneConfigForScene('missing', appConfig)).toBeUndefined();
  });
});
