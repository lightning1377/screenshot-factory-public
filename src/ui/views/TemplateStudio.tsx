import { useEffect, useRef } from 'preact/hooks';
import type { DeviceType } from '../types';

interface TemplateStudioProps {
  templates: string[];
  selectedTemplate: string | null;
  templateContent: string;
  isDirty: boolean;
  viewMode: 'editor' | 'builder';
  zoomLevel: number;
  sampleDevice: DeviceType;
  sampleLocale: string | null;
  sampleScene: string | null;
  onInitGrapesJS: (container: HTMLElement, blocksContainer: HTMLElement) => void;
  onTemplateChange: (name: string) => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onSaveAs: (name: string) => void;
  onReload: () => void;
  onViewModeChange: (mode: 'editor' | 'builder') => void;
  onZoom: (delta: number) => void;
}

export function TemplateStudio({
  templates,
  selectedTemplate,
  templateContent,
  isDirty,
  viewMode,
  zoomLevel,
  sampleDevice,
  onInitGrapesJS,
  onTemplateChange,
  onContentChange,
  onSave,
  onSaveAs,
  onReload,
  onViewModeChange,
  onZoom,
}: TemplateStudioProps) {
  const gjsRef = useRef<HTMLDivElement>(null);
  const blocksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewMode === 'builder' && gjsRef.current && blocksRef.current) {
      onInitGrapesJS(gjsRef.current, blocksRef.current);
    }
  }, [viewMode]);

  const templateType = (selectedTemplate || '').toLowerCase().includes('tablet')
    ? 'TABLET'
    : 'PHONE';

  return (
    <section id="page-templates" class="page active">
      <header class="page-header">
        <h1>Template Studio</h1>
        <p class="subtitle">Create, edit, and refine your HTML templates.</p>
      </header>

      <div class="studio-container">
        <div class="studio-sidebar">
          <div class="panel">
            <div class="control-group">
              <label>Template To Edit</label>
              <div class="select-wrapper">
                <select
                  value={selectedTemplate || ''}
                  onChange={(e) => onTemplateChange(e.currentTarget.value)}
                >
                  <option value="">-- Select Template --</option>
                  {templates.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div class="control-group" style="margin-top: 1.5rem">
              <label>Template Actions</label>
              <div class="button-group">
                <button class="secondary" disabled={!isDirty || !selectedTemplate} onClick={onSave}>
                  💾 Save Changes
                </button>
                <button
                  class="secondary"
                  disabled={!selectedTemplate}
                  onClick={() => {
                    const name = prompt(
                      'Enter new template name:',
                      selectedTemplate || 'new-template.html',
                    );
                    if (name) onSaveAs(name);
                  }}
                >
                  ➕ Save As New
                </button>
                <button class="secondary" disabled={!selectedTemplate} onClick={onReload}>
                  ↩ Reload
                </button>
              </div>
            </div>
          </div>

          <div class="panel" style="margin-top: 2rem">
            <label>📸 Builder Preview</label>
            <div class="control-grid" style="margin-top: 1rem">
              <div class="control-group">
                <label>Sample Device</label>
                <div class="select-wrapper">
                  <select value={sampleDevice} disabled>
                    <option value="phone">Phone</option>
                    <option value="tablet">Tablet</option>
                  </select>
                </div>
              </div>
              <p class="subtitle" style="font-size: 0.8rem">
                Sample data bindings are currently managed in the Preview page.
              </p>
            </div>
          </div>
        </div>

        <div class="studio-main">
          <div class="studio-toolbar">
            <div id="template-status" class="status">
              {isDirty ? 'Unsaved Changes*' : 'Changes saved.'}
            </div>
            <div class="button-group" style="gap: 0.5rem">
              <span class="template-type-tag">{templateType}</span>
              <button
                class={`secondary ${viewMode === 'editor' ? 'active' : ''}`}
                style="padding: 0.5rem 1rem"
                onClick={() => onViewModeChange('editor')}
              >
                Code
              </button>
              <button
                class={`secondary ${viewMode === 'builder' ? 'active' : ''}`}
                style="padding: 0.5rem 1rem"
                onClick={() => onViewModeChange('builder')}
              >
                Visual
              </button>
            </div>
          </div>

          {viewMode === 'editor' ? (
            <div id="template-editor-panel" style="flex: 1; display: flex; flex-direction: column">
              <textarea
                id="template-editor"
                spellcheck={false}
                value={templateContent}
                onInput={(e) => onContentChange(e.currentTarget.value)}
              />
            </div>
          ) : (
            <div
              id="template-builder-panel"
              style="flex: 1; display: flex; flex-direction: column; gap: 1rem"
            >
              <div class="studio-toolbar">
                <div class="button-group">
                  <button class="secondary" onClick={() => onZoom(0.1)}>
                    ＋
                  </button>
                  <button class="secondary" onClick={() => onZoom(-0.1)}>
                    －
                  </button>
                  <button class="secondary" onClick={() => onZoom(1 - zoomLevel)}>
                    100%
                  </button>
                </div>
              </div>
              <div
                ref={gjsRef}
                id="gjs"
                class="builder-canvas"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              />
              <div
                ref={blocksRef}
                id="builder-blocks-container"
                style="
                  background: var(--bg);
                  border: 1px solid var(--border);
                  border-radius: 0.75rem;
                  padding: 0.5rem;
                  max-height: 250px;
                  overflow-y: auto;
                "
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
