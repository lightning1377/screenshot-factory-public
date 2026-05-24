import { signal } from '@preact/signals';
import type { AppStats, AppConfig } from '../types';
import type { PreviewGridCard } from '../views/PreviewGrid';

export interface PreviewControlsState {
  locale: string;
  scene: string;
  theme: string;
  deviceType: 'phone' | 'tablet';
  template: string;
  title: string;
}

export interface PreviewSelectOption {
  value: string;
  label: string;
}

type WorkspaceMode = 'empty' | 'single' | 'all';
type RenderTone = 'muted' | 'success' | 'error';

interface PreviewStoreContext {
  hasAppConfig: boolean;
  hasConfigPath: boolean;
}

interface PreviewStoreOptions {
  initialControls?: Partial<PreviewControlsState>;
  templates: string[];
  minZoom: number;
  maxZoom: number;
}

export function createPreviewStore(options: PreviewStoreOptions) {
  const { initialControls, templates, minZoom, maxZoom } = options;

  const stats = signal<AppStats | null>(null);
  const gridCards = signal<PreviewGridCard[]>([]);
  const workspaceMode = signal<WorkspaceMode>('empty');
  const singlePreview = signal<{ url: string; width: number; height: number } | null>(null);
  const zoom = signal(1);

  const controls = signal<PreviewControlsState>({
    locale: initialControls?.locale || '',
    scene: initialControls?.scene || '',
    theme: initialControls?.theme || '',
    deviceType: initialControls?.deviceType || 'phone',
    template: initialControls?.template || '',
    title: initialControls?.title || '',
  });

  const locale = signal(controls.value.locale);
  const scene = signal(controls.value.scene);
  const theme = signal(controls.value.theme);
  const deviceType = signal(controls.value.deviceType);
  const template = signal(controls.value.template);
  const title = signal(controls.value.title);

  const localeOptions = signal<PreviewSelectOption[]>([]);
  const sceneOptions = signal<PreviewSelectOption[]>([]);
  const themeOptions = signal<PreviewSelectOption[]>([]);
  const templateOptions = signal<string[]>(templates || []);

  const localeDisabled = signal(true);
  const sceneDisabled = signal(true);
  const themeDisabled = signal(true);
  const templateDisabled = signal((templates || []).length === 0);

  const previewDisabled = signal(true);
  const previewAllDisabled = signal(true);
  const renderDisabled = signal(true);
  const stopRenderDisabled = signal(true);

  const renderStatusMessage = signal('Select an app to render final outputs.');
  const renderStatusTone = signal<RenderTone>('muted');
  const renderLogs = signal('');
  const renderRunning = signal(false);

  let context: PreviewStoreContext = { hasAppConfig: false, hasConfigPath: false };

  function syncActionState(nextContext?: PreviewStoreContext): void {
    if (nextContext) {
      context = nextContext;
    }

    const canPreview = context.hasAppConfig && !!controls.value.locale && !!controls.value.scene;
    const canPreviewAll = context.hasAppConfig && !!controls.value.locale;

    previewDisabled.value = !canPreview;
    previewAllDisabled.value = !canPreviewAll;
    renderDisabled.value = renderRunning.value || !context.hasConfigPath;
    stopRenderDisabled.value = !renderRunning.value;
  }

  function setControlsState(nextPartial: Partial<PreviewControlsState>): void {
    const next = { ...controls.value, ...nextPartial };

    // If scene changed, update available themes
    if (nextPartial.scene && nextPartial.scene !== controls.value.scene && context.hasAppConfig) {
      // We need to trigger a theme update, but we can't easily access appConfig here.
      // Ideally updateForConfig should handle this, or we need to pass config.
      // For now, let's assume the caller handles updating theme options if scene changes,
      // or we handle it in updateForConfig which is called initially.
      // Actually, we need to be able to lookup scene config to update themes.
      // Let's refine this: updateForConfig sets up initial state.
      // When scene changes, we should look up themes, but we don't have config here.
      // We will rely on options being updated by the view/caller or store having config.
      // Let's defer theme options update to a separate action that view calls, or better:
      // store the config in the store so we can react to scene changes.
      // Refactoring to store appConfig...
    }

    controls.value = next;
    locale.value = next.locale;
    scene.value = next.scene;
    theme.value = next.theme;
    deviceType.value = next.deviceType;
    template.value = next.template;
    title.value = next.title;

    syncActionState();
  }

  // .. (rest of functions)

  function setRenderRunning(running: boolean): void {
    renderRunning.value = running;
    syncActionState();
  }

  function setRenderStatus(message: string, tone: RenderTone = 'muted'): void {
    renderStatusMessage.value = message;
    renderStatusTone.value = tone;
  }

  function setStats(nextStats: AppStats | null): void {
    stats.value = nextStats || null;
  }

  function setZoom(nextZoom: number): void {
    zoom.value = Math.max(minZoom, Math.min(maxZoom, nextZoom));
  }

  function setSinglePreview(preview: { url: string; width: number; height: number }): void {
    singlePreview.value = preview;
    gridCards.value = [];
    workspaceMode.value = 'single';
  }

  function setAllPreview(cards: PreviewGridCard[]): void {
    gridCards.value = cards;
    singlePreview.value = null;
    workspaceMode.value = 'all';
  }

  function setEmptyPreview(): void {
    gridCards.value = [];
    singlePreview.value = null;
    workspaceMode.value = 'empty';
  }

  function setLocaleOptions(options: PreviewSelectOption[]): void {
    localeOptions.value = options;
  }

  function setSceneOptions(options: PreviewSelectOption[]): void {
    sceneOptions.value = options;
  }

  function setLocaleDisabled(disabled: boolean): void {
    localeDisabled.value = disabled;
  }

  function setSceneDisabled(disabled: boolean): void {
    sceneDisabled.value = disabled;
  }

  function updateTemplateOptions(nextTemplates: string[]): void {
    templateOptions.value = nextTemplates;
    templateDisabled.value = nextTemplates.length === 0;

    const currentTemplate = controls.value.template;
    if (currentTemplate && !nextTemplates.includes(currentTemplate)) {
      setControlsState({ template: '' });
    }
  }

  // We need to store appConfig to handle scene changes updating themes
  let currentAppConfig: AppConfig | null = null;

  function updateForConfig(appConfig: AppConfig | null, path: string | null): void {
    currentAppConfig = appConfig;
    if (!appConfig) {
      setLocaleOptions([]);
      setSceneOptions([]);
      setThemeOptions([]);
      setLocaleDisabled(true);
      setSceneDisabled(true);
      setThemeDisabled(true);
      syncActionState({ hasAppConfig: false, hasConfigPath: !!path });
      return;
    }

    const nextLocaleOptions = appConfig.locales.map((l) => ({ value: l, label: l.toUpperCase() }));
    const nextSceneOptions = (appConfig.scenes || []).map((s) => ({ value: s, label: s }));

    setLocaleOptions(nextLocaleOptions);
    setSceneOptions(nextSceneOptions);
    setLocaleDisabled(nextLocaleOptions.length === 0);
    setSceneDisabled(nextSceneOptions.length === 0);

    // Auto-select defaults
    const nextPartial: Partial<PreviewControlsState> = {};
    if (!controls.value.locale && nextLocaleOptions.length > 0) {
      nextPartial.locale = nextLocaleOptions[0].value;
    }
    if (!controls.value.scene && nextSceneOptions.length > 0) {
      nextPartial.scene = nextSceneOptions[0].value;
    }

    setControlsState(nextPartial);

    // Update theme options based on current (resolved) scene
    updateThemeOptionsForScene(nextPartial.scene || controls.value.scene);

    syncActionState({ hasAppConfig: true, hasConfigPath: !!path });
  }

  function updateThemeOptionsForScene(sceneName: string) {
    if (!currentAppConfig || !sceneName) {
      setThemeOptions([]);
      setThemeDisabled(true);
      return;
    }

    // Rely on index lookup matching utils.ts
    const idx = currentAppConfig.scenes.indexOf(sceneName);
    const config = idx >= 0 ? currentAppConfig.sceneConfigs?.[idx] : undefined;

    const themes = config?.themes || ['light'];
    const options = themes.map((t) => ({
      value: t,
      label: t.charAt(0).toUpperCase() + t.slice(1),
    }));

    if (options.length > 0) {
      options.unshift({ value: 'all', label: 'Default (All)' });
    }

    setThemeOptions(options);
    setThemeDisabled(options.length <= 1);

    // Auto select first theme if current is invalid
    if (!controls.value.theme || !options.find((o) => o.value === controls.value.theme)) {
      setControlsState({ theme: options[0].value });
    }
  }

  function setThemeOptions(options: PreviewSelectOption[]) {
    themeOptions.value = options;
  }

  function setThemeDisabled(disabled: boolean) {
    themeDisabled.value = disabled;
  }

  function clearRenderLogs(): void {
    renderLogs.value = '';
  }

  function appendRenderLogs(lines: string[]): void {
    if (!lines || lines.length === 0) return;
    renderLogs.value += `${lines.join('\n')}\n`;
  }

  return {
    signals: {
      stats,
      gridCards,
      workspaceMode,
      singlePreview,
      zoom,
      controls,
      locale,
      scene,
      deviceType,
      template,
      title,
      localeOptions,
      sceneOptions,
      theme,
      themeOptions,
      themeDisabled,
      templateOptions,
      localeDisabled,
      sceneDisabled,
      templateDisabled,
      previewDisabled,
      previewAllDisabled,
      renderDisabled,
      stopRenderDisabled,
      renderStatusMessage,
      renderStatusTone,
      renderLogs,
      renderRunning,
    },
    actions: {
      syncActionState,
      setControlsState,
      setRenderRunning,
      setRenderStatus,
      setStats,
      setZoom,
      setSinglePreview,
      setAllPreview,
      setEmptyPreview,
      setLocaleOptions,
      setSceneOptions,
      setThemeOptions,
      setLocaleDisabled,
      setSceneDisabled,
      setThemeDisabled,
      updateTemplateOptions,
      updateForConfig,
      updateThemeOptionsForScene,
      clearRenderLogs,
      appendRenderLogs,
    },
  };
}
