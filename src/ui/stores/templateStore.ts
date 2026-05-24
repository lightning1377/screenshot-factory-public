import { signal } from '@preact/signals';
import { screenshotFactorySDK } from '../sdk/ScreenshotFactorySDK';
import { GrapesJSService } from '../services/GrapesJSService';
import type { DeviceType, TemplateCatalogEntry } from '../types';

export function createTemplateStore() {
  const templates = signal<string[]>([]);
  const catalog = signal<TemplateCatalogEntry[]>([]);
  const selectedTemplate = signal<string | null>(null);
  const templateContent = signal('');
  const isDirty = signal(false);
  const viewMode = signal<'editor' | 'builder'>('editor');
  const zoomLevel = signal(1);

  // Builder Sample State
  const sampleDevice = signal<DeviceType>('phone');
  const sampleLocale = signal<string | null>(null);
  const sampleScene = signal<string | null>(null);

  let grapesjs: GrapesJSService | null = null;

  const initGrapesJS = (container: HTMLElement, blocksContainer: HTMLElement) => {
    grapesjs = new GrapesJSService();
    grapesjs.initializeEditor(container, blocksContainer);
  };

  const loadTemplates = async (preferred?: string) => {
    try {
      const resp = await screenshotFactorySDK.getTemplates();
      const list = resp.templates || [];
      templates.value = list;
      catalog.value = resp.catalog || [];

      if (preferred && list.includes(preferred)) {
        selectedTemplate.value = preferred;
      } else if (list.length > 0 && !selectedTemplate.value) {
        selectedTemplate.value = list[0];
      }
    } catch (e) {
      console.error('Failed to load templates:', e);
    }
  };

  const loadTemplateContent = async (name: string) => {
    try {
      const resp = await screenshotFactorySDK.getTemplate(name);
      const content = resp.content || '';
      templateContent.value = content;
      isDirty.value = false;
      if (grapesjs && viewMode.value === 'builder') {
        const parts = grapesjs.extractHtmlCss(content);
        grapesjs.setContent(parts.html, parts.css);
      }
    } catch (e) {
      console.error('Failed to load template content:', e);
    }
  };

  const saveTemplate = async (name: string, content: string) => {
    try {
      await screenshotFactorySDK.updateTemplate(name, content);
      isDirty.value = false;
      await loadTemplates(name);
    } catch (e) {
      console.error('Failed to save template:', e);
      alert('Failed to save template: ' + (e as Error).message);
    }
  };

  const setViewMode = (mode: 'editor' | 'builder') => {
    viewMode.value = mode;
    if (mode === 'builder' && grapesjs) {
      const parts = grapesjs.extractHtmlCss(templateContent.value);
      grapesjs.setContent(parts.html, parts.css);
    }
  };

  const adjustZoom = (delta: number) => {
    zoomLevel.value = Math.max(0.1, Math.min(2, zoomLevel.value + delta));
  };

  return {
    signals: {
      templates,
      catalog,
      selectedTemplate,
      templateContent,
      isDirty,
      viewMode,
      zoomLevel,
      sampleDevice,
      sampleLocale,
      sampleScene,
    },
    actions: {
      initGrapesJS,
      loadTemplates,
      loadTemplateContent,
      saveTemplate,
      setViewMode,
      adjustZoom,
    },
    getGrapesJS: () => grapesjs,
  };
}
