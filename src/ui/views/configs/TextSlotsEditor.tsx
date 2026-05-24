import type { TemplateCatalogEntry } from '../../types';

interface TextSlotsEditorProps {
  locales: string[];
  activeLocale: string | null;
  sceneThemes: string[];
  sharedConfig: any;
  templateMetadata: TemplateCatalogEntry | undefined;
  onActiveLocaleChange: (locale: string) => void;
  onAddLocale: () => void;
  onRemoveLocale: (locale: string) => void;
  onUpdate: (patch: Partial<any>) => void;
}

export function TextSlotsEditor({
  locales,
  activeLocale,
  sceneThemes,
  sharedConfig,
  templateMetadata,
  onActiveLocaleChange,
  onAddLocale,
  onRemoveLocale,
  onUpdate,
}: TextSlotsEditorProps) {
  const templateTextSlots = templateMetadata?.textSlots || [{ id: 'title', label: 'Title' }];

  const handleTextChange = (fieldId: string, locale: string, theme: string, value: string) => {
    const textSlots = { ...sharedConfig.textSlots };
    if (!textSlots[fieldId]) textSlots[fieldId] = {};
    const slotLocales = { ...textSlots[fieldId] };

    if (theme === 'default') {
      const existing = slotLocales[locale];
      if (typeof existing === 'object' && existing !== null) {
        if (value) {
          slotLocales[locale] = { ...existing, default: value };
        } else {
          const next = { ...existing };
          delete next.default;
          slotLocales[locale] = next;
        }
      } else {
        slotLocales[locale] = value;
      }
    } else {
      if (value) {
        if (typeof slotLocales[locale] !== 'object' || slotLocales[locale] === null) {
          const currentVal = slotLocales[locale] as string;
          slotLocales[locale] = { default: currentVal || '', [theme]: value };
        } else {
          slotLocales[locale] = { ...slotLocales[locale], [theme]: value };
        }
      } else if (typeof slotLocales[locale] === 'object' && slotLocales[locale] !== null) {
        const next = { ...slotLocales[locale] };
        delete next[theme];
        slotLocales[locale] = next;
      }
    }

    // Cleanup locale entry
    if (typeof slotLocales[locale] === 'object' && slotLocales[locale] !== null) {
      const keys = Object.keys(slotLocales[locale]);
      if (keys.length === 1 && keys[0] === 'default') {
        slotLocales[locale] = (slotLocales[locale] as any).default;
      } else if (keys.length === 0) {
        delete slotLocales[locale];
      }
    }

    if (Object.keys(slotLocales).length === 0) {
      delete textSlots[fieldId];
    } else {
      textSlots[fieldId] = slotLocales;
    }

    onUpdate({ textSlots });
  };

  return (
    <div style={{ marginTop: '16px', borderTop: '1px solid #333', paddingTop: '12px' }}>
      <h5>Text Slots</h5>

      <div className="sub-tabs-header">
        {locales.map((locale) => (
          <button
            key={locale}
            className={`sub-tab-btn ${activeLocale === locale ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onActiveLocaleChange(locale);
            }}
          >
            {locale.toUpperCase()}
          </button>
        ))}
        <div className="locale-management">
          <button
            className="btn-icon-sm btn-add-scene"
            title="Add Language"
            onClick={(e) => {
              e.preventDefault();
              onAddLocale();
            }}
          >
            +
          </button>
          <button
            className="btn-icon-sm btn-remove-scene"
            title="Remove Current Language"
            onClick={(e) => {
              e.preventDefault();
              if (activeLocale) onRemoveLocale(activeLocale);
            }}
          >
            ×
          </button>
        </div>
      </div>

      {templateTextSlots.map((slot) => (
        <div
          key={slot.id}
          style={{
            marginBottom: '20px',
            padding: '10px',
            background: '#1a1a1a',
            borderRadius: '4px',
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#aaa' }}>
            {slot.label || slot.id}
          </div>

          {locales.map((locale) => {
            if (locale !== activeLocale) return null;

            const slotLocaleDef = sharedConfig.textSlots?.[slot.id]?.[locale];
            const defaultValue =
              typeof slotLocaleDef === 'string' ? slotLocaleDef : slotLocaleDef?.default || '';

            return (
              <div key={locale} className="locale-group active" style={{ marginBottom: '12px' }}>
                <div className="scene-row" style={{ marginBottom: '4px' }}>
                  <label style={{ width: '80px', fontSize: '11px' }}>Default</label>
                  <input
                    type="text"
                    placeholder="Text for all themes"
                    value={defaultValue}
                    onInput={(e) =>
                      handleTextChange(slot.id, locale, 'default', e.currentTarget.value)
                    }
                  />
                </div>

                {sceneThemes.length > 1 &&
                  sceneThemes.map((theme) => (
                    <div key={theme} className="scene-row" style={{ marginBottom: '4px' }}>
                      <label style={{ width: '80px', fontSize: '11px' }}>
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </label>
                      <input
                        type="text"
                        placeholder={`Override for ${theme}`}
                        value={(slotLocaleDef as any)?.[theme] || ''}
                        onInput={(e) =>
                          handleTextChange(slot.id, locale, theme, e.currentTarget.value)
                        }
                      />
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
