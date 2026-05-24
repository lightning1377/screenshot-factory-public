import createStudioEditor from '@grapesjs/studio-sdk';
import '@grapesjs/studio-sdk/style';

// Use a loose interface for the editor instance from Studio SDK
interface Editor {
  BlockManager: any;
  Canvas: any;
  Commands: any;
  DeviceManager: any;
  getContainer: () => HTMLElement | undefined;
  on: (event: string, callback: () => void) => void;
  setComponents: (html: string) => void;
  setStyle: (css: string) => void;
  getHtml: () => string | undefined;
  getCss: () => string | undefined;
  setDevice: (device: string) => void;
  runCommand: (command: string, ...args: any[]) => void;
  destroy: () => void;
}

export interface TemplateContent {
  html: string;
  css: string;
  headContent: string;
}

export interface TemplateParts {
  head: string | null;
  bodyAttrs: string;
  body: string;
}

export class GrapesJSService {
  private editor: Editor | null = null;
  private zoom = 1;

  async initializeEditor(
    rootElement: HTMLElement,
    blocksContainer: HTMLElement,
    onEditorReady?: (editor: Editor) => void,
  ): Promise<void> {
    if (!rootElement || this.editor) return;

    // Ensure the root container has explicit dimensions for layout
    rootElement.style.height = '100%';
    rootElement.style.width = '100%';
    rootElement.style.overflow = 'hidden';
    rootElement.style.display = 'flex';
    rootElement.style.flexDirection = 'column';

    try {
      createStudioEditor({
        root: rootElement,
        project: {
          default: {
            pages: [
              {
                component: '<div></div>',
              },
            ],
          },
        },
        // The Studio SDK might have a different options structure depending on version
        // If 'options' is not compatible, we might need to check recent documentation
        // @ts-expect-error - studio sdk options type mismatch
        options: {
          height: '100%',
          width: '100%',
          storageManager: false,
          blockManager: {
            appendTo: blocksContainer,
          },
          canvas: {
            styles: ['body{min-height:100vh;overflow:auto;}'],
          },
        },
        onEditor: (editor) => {
          this.editor = editor;
          this.setupEditor();
          if (onEditorReady) {
            onEditorReady(editor);
          }
        },
      });
    } catch (error) {
      console.error('Error initializing GrapesJS Studio:', error);
      throw new Error('Failed to load visual builder');
    }
  }

  private setupEditor(): void {
    if (!this.editor) return;

    this.setupBlocks();
    this.setupZoom();
    this.setupCommands();
    this.setupEventListeners();
  }

  private setupBlocks(): void {
    if (!this.editor) return;
    const bm = this.editor.BlockManager;

    bm.add('hero-title', {
      label: 'Title',
      category: 'Content',
      content: '<h1 class="hero-title">{{title}}</h1>',
      attributes: { class: 'fa fa-heading' },
    });

    bm.add('screenshot-image', {
      label: 'Screenshot',
      category: 'Content',
      content: '<img class="screenshot" src="{{screenshot}}" alt="Screenshot" />',
      attributes: { class: 'fa fa-image' },
    });

    bm.add('phone-frame', {
      label: 'Phone Frame',
      category: 'Frames',
      content:
        '<div class="device-frame phone"><img class="screenshot" src="{{screenshot}}" /></div>',
      attributes: { class: 'fa fa-mobile' },
    });

    bm.add('tablet-frame', {
      label: 'Tablet Frame',
      category: 'Frames',
      content:
        '<div class="device-frame tablet"><img class="screenshot" src="{{screenshot}}" /></div>',
      attributes: { class: 'fa fa-tablet' },
    });
  }

  private setupZoom(): void {
    if (!this.editor) return;
    const canvas = this.editor.Canvas;
    const originalSetZoom = canvas.setZoom.bind(canvas);

    const applyZoom = (zoom: number) => {
      if (!this.editor) return;
      const clamped = Math.max(0.2, Math.min(2, zoom));
      this.zoom = clamped;
      originalSetZoom(1);

      // Studio SDK specific structure check
      const framesEl = this.editor
        .getContainer()
        ?.querySelector('.gjs-cv-canvas__frames') as HTMLElement | null;
      if (framesEl) {
        framesEl.style.transform = 'none';
        framesEl.style.zoom = String(clamped);
      } else {
        originalSetZoom(clamped);
      }
    };

    canvas.setZoom = (zoom: number) => {
      applyZoom(zoom);
    };
  }

  private setupCommands(): void {
    if (!this.editor) return;
    this.editor.Commands.add('custom:fit', {
      run: (editorInstance: Editor) => {
        const cv = editorInstance.Canvas;
        const frameEl = cv.getFrameEl();
        const container = editorInstance.getContainer();
        if (!container) return;
        const canvasEl =
          container.querySelector('.gjs-cv-canvas') || container.querySelector('.gjs-cv');

        if (!frameEl || !canvasEl) return;

        const canvasRect = canvasEl.getBoundingClientRect();
        const frameDoc = frameEl.contentDocument;
        const docEl = frameDoc?.documentElement;
        const body = frameDoc?.body;

        const contentWidth = Math.max(docEl?.scrollWidth || 0, body?.scrollWidth || 0, 1);
        const contentHeight = Math.max(docEl?.scrollHeight || 0, body?.scrollHeight || 0, 1);

        const padding = 32;
        const scaleX = (canvasRect.width - padding) / contentWidth;
        const scaleY = (canvasRect.height - padding) / contentHeight;

        const zoom = Math.max(0.2, Math.min(1, Math.min(scaleX, scaleY)));
        this.setZoom(zoom);

        if (canvasEl.scrollTo) {
          canvasEl.scrollTo(0, 0);
        } else {
          canvasEl.scrollTop = 0;
          canvasEl.scrollLeft = 0;
        }
      },
    });
  }

  private setupEventListeners(): void {
    if (!this.editor) return;
    this.editor.on('canvas:frame:load', () => {
      this.setZoom(this.zoom);
    });
  }

  extractHtmlCss(content: string): TemplateContent {
    if (!content) return { html: '', css: '', headContent: '' };

    let html = content;
    let headContent = '';

    // Extract Head
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      headContent = headMatch[1].trim();
    }

    // Extract CSS
    let css = '';
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    if (styleMatch) {
      css = styleMatch[1].trim();
      html = html.replace(styleMatch[0], '');
    }

    // Strip ALL <script> tags to prevent crashes
    html = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '');

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      html = bodyMatch[1].trim();
    }

    // Convert :root and body styles to also apply to GrapesJS wrapper
    css = css.replace(/:root|body/g, (match) => `${match}, .gjs-wrapper`);

    return { html: html.trim(), css, headContent };
  }

  extractTemplateParts(content: string): TemplateParts {
    if (!content) return { head: null, bodyAttrs: '', body: '' };

    const headMatch = content.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const bodyMatch = content.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);

    return {
      head: headMatch ? headMatch[1].trim() : null,
      bodyAttrs: bodyMatch ? bodyMatch[1] : '',
      body: bodyMatch ? bodyMatch[2].trim() : '',
    };
  }

  buildTemplate(options: { baseTemplate: string; html: string; css: string }): string {
    const { baseTemplate, html, css } = options;
    const parts = this.extractTemplateParts(baseTemplate);

    const headContent =
      parts.head ||
      `<meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Screenshot Template</title>`;

    const styleBlock = css && css.trim() ? `\n    <style>\n${css}\n    </style>` : '';
    const bodyAttrs = parts.bodyAttrs || '';

    const scriptBlock = `
    <script>
      (function() {
        var urlParams = new URLSearchParams(window.location.search);
        var titleEl = document.getElementById('title');
        var screenshotEl = document.getElementById('screenshot');
        
        if (titleEl) {
          titleEl.textContent = urlParams.get('title') || 'Default Title';
        }
2
        if (screenshotEl) {
          const screenshotPath = urlParams.get('screenshot');
          if (screenshotPath) {
            screenshotEl.src = screenshotPath;
          } else {
            screenshotEl.style.backgroundColor = '#1a1a1a';
          }
        }
      })();
    </script>`;

    return `<!doctype html>
<html lang="en">
  <head>
    ${headContent}${styleBlock}
  </head>
  <body${bodyAttrs}>
${html || ''}
${scriptBlock}
  </body>
</html>
`;
  }

  setContent(html: string, css: string): void {
    if (!this.editor) return;
    this.editor.setComponents(html || '');
    this.editor.setStyle(css || '');
  }

  getContent(): { html: string; css: string } {
    if (!this.editor) return { html: '', css: '' };
    return {
      html: this.editor.getHtml() || '',
      css: this.editor.getCss() || '',
    };
  }

  setDevice(dimensions: { width: string; height: string }): void {
    if (!this.editor) return;

    const dm = this.editor.DeviceManager;
    let device = dm.get('template-size');

    if (!device) {
      device = dm.add({
        id: 'template-size',
        name: 'Template Size',
        width: dimensions.width,
        height: dimensions.height,
      });
    } else {
      device.set(dimensions);
    }

    this.editor.setDevice('template-size');
  }

  injectHeadContent(headContent: string): void {
    if (!this.editor || !headContent) return;

    const canvas = this.editor.Canvas;
    const doc = canvas.getDocument();

    if (doc) {
      let injector = doc.getElementById('gjs-head-injector');
      if (!injector) {
        injector = doc.createElement('div');
        injector.id = 'gjs-head-injector';
        injector.style.display = 'none';
        doc.head.appendChild(injector);
      }
      injector.innerHTML = headContent;
    }
  }

  setZoom(zoom: number): void {
    if (!this.editor) return;
    const canvas = this.editor.Canvas;
    canvas.setZoom(zoom);
  }

  fit(): void {
    if (!this.editor) return;
    this.editor.runCommand('custom:fit');
  }

  clear(): void {
    if (!this.editor) return;
    this.editor.setComponents('');
    this.editor.setStyle('');
  }

  updateScreenshot(screenshotPath: string): boolean {
    if (!this.editor) return false;

    const doc = this.editor.Canvas.getDocument();
    const screenshotImg = doc.getElementById('screenshot') as HTMLImageElement | null;

    if (screenshotImg) {
      screenshotImg.src = screenshotPath;
      return true;
    }

    return false;
  }

  destroy(): void {
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
    }
  }
}
