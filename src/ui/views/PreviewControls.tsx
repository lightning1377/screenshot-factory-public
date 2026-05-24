import type { Signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';

interface PreviewSelectOption {
  value: string;
  label: string;
}

interface PreviewControlsProps {
  locale: Signal<string>;
  scene: Signal<string>;
  theme: Signal<string>;
  deviceType: Signal<'phone' | 'tablet'>;
  template: Signal<string>;
  title: Signal<string>;
  localeOptions: Signal<PreviewSelectOption[]>;
  sceneOptions: Signal<PreviewSelectOption[]>;
  themeOptions: Signal<PreviewSelectOption[]>;
  templateOptions: Signal<string[]>;
  localeDisabled: Signal<boolean>;
  sceneDisabled: Signal<boolean>;
  themeDisabled: Signal<boolean>;
  templateDisabled: Signal<boolean>;
  previewDisabled: Signal<boolean>;
  previewAllDisabled: Signal<boolean>;
  renderDisabled: Signal<boolean>;
  stopRenderDisabled: Signal<boolean>;
  renderStatusMessage: Signal<string>;
  renderStatusTone: Signal<'muted' | 'success' | 'error'>;
  renderLogs: Signal<string>;
  onLocaleChange: (value: string) => void;
  onDeviceChange: (value: 'phone' | 'tablet') => void | Promise<void>;
  onSceneChange: (value: string) => void;
  onThemeChange: (value: string) => void;
  onTemplateChange: (value: string) => void | Promise<void>;
  onTitleChange: (value: string) => void;
  onPreview: () => void;
  onPreviewAll: () => void;
  onRender: () => void;
  onStopRender: () => void;
  onRefresh: () => void;
  onSample: () => void;
}

export function PreviewControls({
  locale,
  scene,
  theme,
  deviceType,
  template,
  title,
  localeOptions,
  sceneOptions,
  themeOptions,
  templateOptions,
  localeDisabled,
  sceneDisabled,
  themeDisabled,
  templateDisabled,
  previewDisabled,
  previewAllDisabled,
  renderDisabled,
  stopRenderDisabled,
  renderStatusMessage,
  renderStatusTone,
  renderLogs,
  onLocaleChange,
  onDeviceChange,
  onSceneChange,
  onThemeChange,
  onTemplateChange,
  onTitleChange,
  onPreview,
  onPreviewAll,
  onRender,
  onStopRender,
  onRefresh,
  onSample,
}: PreviewControlsProps) {
  const logsRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (!logsRef.current) return;
    logsRef.current.scrollTop = logsRef.current.scrollHeight;
  }, [renderLogs.value]);

  const toneColor =
    renderStatusTone.value === 'success'
      ? 'var(--success)'
      : renderStatusTone.value === 'error'
        ? 'var(--warning)'
        : 'var(--text-muted)';

  return (
    <>
      <div className="control-grid">
        <div className="control-group">
          <label htmlFor="locale-select">Language / Locale</label>
          <div className="select-wrapper">
            <select
              id="locale-select"
              value={locale.value}
              disabled={localeDisabled.value}
              onChange={(event) => {
                onLocaleChange((event.currentTarget as HTMLSelectElement).value);
              }}
            >
              <option value="">-- Select Language --</option>
              {localeOptions.value.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="device-select">Device Type</label>
          <div className="select-wrapper">
            <select
              id="device-select"
              value={deviceType.value}
              onChange={(event) => {
                void onDeviceChange(
                  (event.currentTarget as HTMLSelectElement).value as 'phone' | 'tablet',
                );
              }}
            >
              <option value="phone">Phone</option>
              <option value="tablet">Tablet</option>
            </select>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="scene-select">Scene / Screen</label>
          <div className="select-wrapper">
            <select
              id="scene-select"
              value={scene.value}
              disabled={sceneDisabled.value}
              onChange={(event) => {
                onSceneChange((event.currentTarget as HTMLSelectElement).value);
              }}
            >
              <option value="">-- Select Scene --</option>
              {sceneOptions.value.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="theme-select">Theme</label>
          <div className="select-wrapper">
            <select
              id="theme-select"
              value={theme.value}
              disabled={themeDisabled.value}
              onChange={(event) => {
                onThemeChange((event.currentTarget as HTMLSelectElement).value);
              }}
            >
              {themeOptions.value.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="control-group">
          <label htmlFor="template-select-preview">Template</label>
          <div className="select-wrapper">
            <select
              id="template-select-preview"
              value={template.value}
              disabled={templateDisabled.value}
              onChange={(event) => {
                void onTemplateChange((event.currentTarget as HTMLSelectElement).value);
              }}
            >
              <option value="">
                {templateOptions.value.length > 0
                  ? 'Use App Config (Auto)'
                  : '-- Loading Templates --'}
              </option>
              {templateOptions.value.map((templateName) => (
                <option key={templateName} value={templateName}>
                  {templateName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="control-group" style={{ marginBottom: '1.5rem' }}>
          <label htmlFor="title-input">Custom Title (Optional)</label>
          <input
            id="title-input"
            type="text"
            value={title.value}
            placeholder="Leave empty to use app config title"
            onInput={(event) => {
              onTitleChange((event.currentTarget as HTMLInputElement).value);
            }}
          />
        </div>

        <div className="control-group" style={{ marginTop: '1.5rem' }}>
          <label>Preview Actions</label>
          <div className="button-group">
            <button id="preview-btn" disabled={previewDisabled.value} onClick={onPreview}>
              🔍 Preview
            </button>
            <button
              id="preview-all-btn"
              className="secondary"
              disabled={previewAllDisabled.value}
              onClick={onPreviewAll}
            >
              🧩 Preview All
            </button>
            <button
              id="render-final-btn"
              className="secondary"
              disabled={renderDisabled.value}
              onClick={onRender}
            >
              🎬 Render Final Outputs
            </button>
            <button
              id="render-final-stop-btn"
              className="secondary"
              disabled={stopRenderDisabled.value}
              onClick={onStopRender}
            >
              ✕ Cancel Render
            </button>
            <button id="refresh-btn" className="secondary" onClick={onRefresh}>
              🔄 Refresh Apps
            </button>
            <button id="sample-btn" className="secondary" onClick={onSample}>
              🎨 Load Sample Template
            </button>
          </div>
        </div>

        <div id="render-final-status" className="status" style={{ color: toneColor }}>
          {renderStatusMessage.value}
        </div>
        <pre id="render-final-logs" ref={logsRef} className="capture-logs">
          {renderLogs.value}
        </pre>
      </div>
    </>
  );
}
