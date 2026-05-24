import { Signal } from '@preact/signals';
import { SceneTabs } from './SceneTabs';
import { SceneEditor } from './SceneEditor';
import { TextSlotsEditor } from './TextSlotsEditor';
import { getTemplateNames } from './ConfigEditorUtils';
import type { TemplateCatalogEntry } from '../../types';
import { screenshotFactorySDK } from '../../sdk/ScreenshotFactorySDK';

interface ConfigPageProps {
  config: Signal<any>;
  configDirty: Signal<boolean>;
  activeConfigIndex: Signal<number>;
  activeConfigLocale: Signal<string | null>;
  statusMessage: Signal<string>;
  statusTone: Signal<'muted' | 'success' | 'error'>;
  locales: Signal<string[]>;
  scenes: Signal<string[]>;
  sceneConfigs: Signal<any[]>;
  activeSceneConfig: Signal<any>;
  templateCatalog: TemplateCatalogEntry[];
  templates: string[];
  configPath: string | null;
  onAddScene: () => void;
  onRemoveScene: (idx: number) => void;
  onUpdateScene: (idx: number, patch: Partial<any>) => void;
  onSetActiveIndex: (idx: number) => void;
  onSetActiveLocale: (locale: string) => void;
  onSetStatus: (msg: string, tone?: 'muted' | 'success' | 'error') => void;
  onSetDirty: (isDirty: boolean) => void;
  onUpdateLocales: (locales: string[]) => void;
}

export function ConfigPage({
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
  templateCatalog,
  templates,
  configPath,
  onAddScene,
  onRemoveScene,
  onUpdateScene,
  onSetActiveIndex,
  onSetActiveLocale,
  onSetStatus,
  onSetDirty,
  onUpdateLocales,
}: ConfigPageProps) {
  const templateNames = getTemplateNames(templates, templateCatalog);

  const handleSave = async () => {
    if (!config.value || !configPath) return;

    try {
      await screenshotFactorySDK.saveConfig(configPath, config.value);
      onSetStatus('Saved configuration successfully.', 'success');
      onSetDirty(false);
    } catch (error) {
      console.error('Error saving app config:', error);
      onSetStatus('Failed to save config.', 'error');
    }
  };

  const handleAddLocale = async () => {
    const lang = prompt('Enter new language code (e.g. fr, de):');
    if (!lang || !lang.trim()) return;

    const code = lang.trim().toLowerCase();
    if (locales.value.includes(code)) {
      alert('Language already exists!');
      return;
    }

    const nextLocales = [...locales.value, code];
    onUpdateLocales(nextLocales);
    onSetActiveLocale(code);
    onSetDirty(true);

    // We auto-save locale additions in legacy, let's keep it consistent if needed,
    // but the plan says "modern Preact implementation using signals for state management"
    // so maybe we just mark it dirty. Legacy did an immediate save.
    // Let's do a manual save for consistency with other changes unless it's strictly required.
    // Legacy: await screenshotFactorySDK.saveConfig(state.currentConfigPath, state.currentConfigData);
  };

  const handleRemoveLocale = (code: string) => {
    if (locales.value.length <= 1) {
      alert('You must have at least one language.');
      return;
    }

    if (
      !confirm(
        `Are you sure you want to remove language "${code.toUpperCase()}"? This will not delete translations but they will be hidden.`,
      )
    )
      return;

    const nextLocales = locales.value.filter((l) => l !== code);
    onUpdateLocales(nextLocales);
    onSetDirty(true);
  };

  const toneColor =
    statusTone.value === 'success'
      ? 'var(--success)'
      : statusTone.value === 'error'
        ? 'var(--warning)'
        : 'var(--text-muted)';

  if (!config.value) {
    return (
      <div data-component="panel">
        <div id="config-status" className="status">
          Select an app from Home to edit settings.
        </div>
      </div>
    );
  }

  const selectedTemplateName = (activeSceneConfig.value?.templateId || '').trim();
  const templateMetadata = templateCatalog.find(
    (t) => t.name === (selectedTemplateName || 'normal'),
  );

  return (
    <div data-component="panel">
      <div className="control-group" style={{ marginBottom: '1.5rem' }}>
        <label>Config Actions</label>
        <div className="button-group">
          <button id="config-save" disabled={!configDirty.value} onClick={handleSave}>
            💾 Save Config
          </button>
        </div>
      </div>

      <div id="config-status" className="status" style={{ color: toneColor }}>
        {statusMessage.value}
      </div>

      <div id="config-editor" className="locale-grid">
        <div className="tabs-container">
          <SceneTabs
            sceneConfigs={sceneConfigs}
            activeIndex={activeConfigIndex}
            onSelect={onSetActiveIndex}
            onAdd={onAddScene}
          />

          <SceneEditor
            index={activeConfigIndex.value}
            config={activeSceneConfig}
            scenes={scenes}
            templateNames={templateNames}
            templateCatalog={templateCatalog}
            onUpdate={(patch) => onUpdateScene(activeConfigIndex.value, patch)}
            onRemove={() => onRemoveScene(activeConfigIndex.value)}
          />

          <TextSlotsEditor
            locales={locales.value}
            activeLocale={activeConfigLocale.value}
            sceneThemes={activeSceneConfig.value?.themes || ['light']}
            sharedConfig={activeSceneConfig.value}
            templateMetadata={templateMetadata}
            onActiveLocaleChange={onSetActiveLocale}
            onAddLocale={handleAddLocale}
            onRemoveLocale={handleRemoveLocale}
            onUpdate={(patch) => onUpdateScene(activeConfigIndex.value, patch)}
          />
        </div>
      </div>
    </div>
  );
}
