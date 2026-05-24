import { Signal } from '@preact/signals';
import { getTemplateSlots, readSlotBinding } from './ConfigEditorUtils';
import type { TemplateCatalogEntry } from '../../types';

interface SceneEditorProps {
  index: number;
  config: Signal<any>;
  scenes: Signal<string[]>;
  templateNames: string[];
  templateCatalog: TemplateCatalogEntry[];
  onUpdate: (patch: Partial<any>) => void;
  onRemove: () => void;
}

export function SceneEditor({
  index,
  config,
  scenes,
  templateNames,
  templateCatalog,
  onUpdate,
  onRemove,
}: SceneEditorProps) {
  const sharedConfig = config.value || {};
  const selectedTemplateName = (sharedConfig.templateId || '').trim();
  const templateSlots = getTemplateSlots(selectedTemplateName || 'normal', templateCatalog);

  const slotThemeOptions = [
    { value: '$current', label: 'Use Current Variant Theme' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  const handleTemplateChange = (e: any) => {
    const templateId = e.currentTarget.value;
    onUpdate({ templateId });
  };

  const handleSlotSceneChange = (slotId: string, scene: string) => {
    const slotSceneMap = { ...sharedConfig.slotSceneMap };
    const current = readSlotBinding(slotSceneMap[slotId], scenes.value[0] || '');
    slotSceneMap[slotId] = { ...current, scene };
    onUpdate({ slotSceneMap });
  };

  const handleSlotThemeChange = (slotId: string, theme: string) => {
    const slotSceneMap = { ...sharedConfig.slotSceneMap };
    const current = readSlotBinding(slotSceneMap[slotId], scenes.value[0] || '');
    if (!theme || theme === '$current') {
      delete current.theme;
    } else {
      current.theme = theme;
    }
    slotSceneMap[slotId] = current;
    onUpdate({ slotSceneMap });
  };

  const handleThemesChange = (e: any) => {
    const selected = Array.from((e.currentTarget as HTMLSelectElement).selectedOptions)
      .map((opt) => opt.value)
      .filter(Boolean);
    onUpdate({ themes: selected.length > 0 ? selected : ['light'] });
  };

  return (
    <div className="tab-content active">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ margin: 0 }}>Screenshot #{index + 1}</h3>
        <button
          className="secondary btn-remove-scene"
          style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      <div className="scene-config-row">
        <div>
          <h5>Template</h5>
          <select value={selectedTemplateName} onChange={handleTemplateChange}>
            <option value="">Default (normal)</option>
            {templateNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <small style={{ display: 'block', color: '#888' }}>
            Template name applies to both phone/tablet. Size is inferred from render target.
          </small>
        </div>

        <div>
          <h5>Template Slots</h5>
          {templateSlots.length === 0 ? (
            <small style={{ display: 'block', color: '#888' }}>This template has no slots.</small>
          ) : (
            <div className="screenshot-slots-row">
              {templateSlots.map((slot) => {
                const binding = readSlotBinding(
                  sharedConfig.slotSceneMap?.[slot.id],
                  scenes.value[0] || '',
                );
                return (
                  <div key={slot.id} className="scene-row">
                    <label>{slot.label || slot.id}</label>
                    <select
                      value={binding.scene}
                      onChange={(e) => handleSlotSceneChange(slot.id, e.currentTarget.value)}
                    >
                      {scenes.value.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <select
                      value={binding.theme || '$current'}
                      onChange={(e) => handleSlotThemeChange(slot.id, e.currentTarget.value)}
                    >
                      {slotThemeOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="size-theme-row">
          <div>
            <h5>Themes</h5>
            <select multiple onChange={handleThemesChange}>
              <option value="light" selected={sharedConfig.themes?.includes('light')}>
                Light
              </option>
              <option value="dark" selected={sharedConfig.themes?.includes('dark')}>
                Dark
              </option>
            </select>
            <small style={{ display: 'block', color: '#888' }}>
              Hold Cmd/Ctrl to select multiple
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}
