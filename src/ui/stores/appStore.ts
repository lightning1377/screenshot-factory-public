import { signal } from '@preact/signals';
import type { AppSummary, AppConfig, TemplateCatalogEntry } from '../types';

export interface AppStoreOptions {
  initialApps: AppSummary[];
}

export function createAppStore(options: AppStoreOptions) {
  const { initialApps } = options;

  // Routing and Navigation
  const currentPage = signal<string>(window.location.hash.replace('#', '') || 'landing');
  const isExpanded = signal(false); // Zen mode

  // Global Data
  const appConfigs = signal<AppSummary[]>(initialApps);
  const currentAppConfig = signal<AppConfig | null>(null);
  const currentConfigPath = signal<string | null>(null);

  // Template Data (Global-ish)
  const templates = signal<string[]>([]);
  const templateCatalog = signal<TemplateCatalogEntry[]>([]);
  const currentTemplateName = signal<string | null>(null);

  // Actions
  const setPage = (page: string) => {
    currentPage.value = page;
    window.location.hash = page;
  };

  const setExpanded = (expanded: boolean) => {
    isExpanded.value = expanded;
  };

  const setAppConfigs = (apps: AppSummary[]) => {
    appConfigs.value = apps;
  };

  const setCurrentApp = (config: AppConfig | null, path: string | null) => {
    currentAppConfig.value = config;
    currentConfigPath.value = path;
  };

  const setTemplates = (list: string[], catalog: TemplateCatalogEntry[]) => {
    templates.value = list;
    templateCatalog.value = catalog;
  };

  // Sync with hash changes
  window.addEventListener('hashchange', () => {
    const page = window.location.hash.replace('#', '') || 'landing';
    if (currentPage.value !== page) {
      currentPage.value = page;
    }
  });

  return {
    signals: {
      currentPage,
      isExpanded,
      appConfigs,
      currentAppConfig,
      currentConfigPath,
      templates,
      templateCatalog,
      currentTemplateName,
    },
    actions: {
      setPage,
      setExpanded,
      setAppConfigs,
      setCurrentApp,
      setTemplates,
    },
  };
}
