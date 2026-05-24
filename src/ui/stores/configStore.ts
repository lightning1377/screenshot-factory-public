import { signal, computed } from '@preact/signals';
import type { AppConfig, TemplateCatalogEntry } from '../types';

export interface ConfigStoreOptions {
  initialConfig?: AppConfig | null;
  templateCatalog: TemplateCatalogEntry[];
}

export function createConfigStore(options: ConfigStoreOptions) {
  const { initialConfig } = options;

  const config = signal<AppConfig | null>(initialConfig || null);
  const configDirty = signal(false);
  const activeConfigIndex = signal(0);
  const activeConfigLocale = signal<string | null>(null);

  const statusMessage = signal('Select an app to edit titles.');
  const statusTone = signal<'muted' | 'success' | 'error'>('muted');

  const locales = computed(() => config.value?.locales || ['en']);
  const scenes = computed(() => config.value?.scenes || []);
  const sceneConfigs = computed(() => config.value?.sceneConfigs || []);
  const uploadOrder = computed(() => config.value?.uploadOrder || []);

  const activeSceneConfig = computed(() => {
    const configs = sceneConfigs.value;
    const idx = activeConfigIndex.value;
    return configs[idx] || null;
  });

  function setConfig(nextConfig: AppConfig | null) {
    config.value = nextConfig;
    configDirty.value = false;
    activeConfigIndex.value = 0;
    activeConfigLocale.value = nextConfig?.locales[0] || null;
    statusMessage.value = nextConfig
      ? 'Edit configuration and click "Save".'
      : 'Select an app to edit titles.';
    statusTone.value = 'muted';
  }

  function setDirty(isDirty: boolean) {
    configDirty.value = isDirty;
    if (isDirty) {
      statusMessage.value = 'You have unsaved config changes.';
      statusTone.value = 'muted';
    }
  }

  function setStatus(message: string, tone: 'muted' | 'success' | 'error' = 'muted') {
    statusMessage.value = message;
    statusTone.value = tone;
  }

  function setActiveConfigIndex(idx: number) {
    activeConfigIndex.value = idx;
  }

  function setActiveLocale(locale: string) {
    activeConfigLocale.value = locale;
  }

  function addSceneConfig() {
    if (!config.value) return;
    const nextConfigs = [...(config.value.sceneConfigs || [])];
    nextConfigs.push({ themes: ['light'] });
    config.value = { ...config.value, sceneConfigs: nextConfigs };
    activeConfigIndex.value = nextConfigs.length - 1;
    setDirty(true);
  }

  function removeSceneConfig(idx: number) {
    if (!config.value?.sceneConfigs) return;
    if (config.value.sceneConfigs.length <= 1) {
      alert('You must have at least one screenshot configuration.');
      return;
    }

    if (!confirm(`Are you sure you want to remove screenshot #${idx + 1}?`)) return;

    const nextConfigs = [...config.value.sceneConfigs];
    nextConfigs.splice(idx, 1);

    config.value = { ...config.value, sceneConfigs: nextConfigs };
    if (activeConfigIndex.value >= nextConfigs.length) {
      activeConfigIndex.value = Math.max(0, nextConfigs.length - 1);
    }
    setDirty(true);
  }

  function updateSceneConfig(idx: number, patch: Partial<any>) {
    if (!config.value?.sceneConfigs) return;
    const nextConfigs = [...config.value.sceneConfigs];
    nextConfigs[idx] = { ...nextConfigs[idx], ...patch };
    config.value = { ...config.value, sceneConfigs: nextConfigs };
    setDirty(true);
  }

  function updateConfig(patch: Partial<AppConfig>) {
    if (!config.value) return;
    config.value = { ...config.value, ...patch };
    setDirty(true);
  }

  function updateLocales(nextLocales: string[]) {
    if (!config.value) return;
    config.value = { ...config.value, locales: nextLocales };
    if (activeConfigLocale.value && !nextLocales.includes(activeConfigLocale.value)) {
      activeConfigLocale.value = nextLocales[0] || null;
    }
  }

  return {
    signals: {
      config,
      configDirty,
      activeConfigIndex,
      activeConfigLocale,
      statusMessage,
      statusTone,
      locales,
      scenes,
      sceneConfigs,
      activeSceneConfig,
      uploadOrder,
    },
    actions: {
      setConfig,
      setDirty,
      setStatus,
      setActiveConfigIndex,
      setActiveLocale,
      addSceneConfig,
      removeSceneConfig,
      updateSceneConfig,
      updateConfig,
      updateLocales,
      updateUploadOrder: (nextOrder: string[]) => updateConfig({ uploadOrder: nextOrder }),
    },
  };
}
