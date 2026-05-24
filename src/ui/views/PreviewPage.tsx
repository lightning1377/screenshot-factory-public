import type { Signal } from '@preact/signals';
import { PreviewControls } from './PreviewControls';
import { PreviewWorkspace } from './PreviewWorkspace';
import {
  getTemplateDimensions,
  getSceneConfig,
  getSceneText,
  buildTemplateUrl,
  buildScreenshotPath,
} from '../utils';
import type { AppConfig, TemplateCatalogEntry } from '../types';
import { screenshotFactorySDK } from '../sdk/ScreenshotFactorySDK';

import type { PreviewGridCard } from './PreviewGrid';

interface PreviewPageProps {
  appConfig: Signal<AppConfig | null>;
  configPath: Signal<string | null>;
  templateCatalog: Signal<TemplateCatalogEntry[]>;

  // Preview Store Signals
  previewSignals: any;
  previewActions: any;
}

export function PreviewPage({
  appConfig,
  configPath,
  templateCatalog,
  previewSignals,
  previewActions,
}: PreviewPageProps) {
  const resolveTemplateFile = (nameOrId: string, device: 'phone' | 'tablet'): string => {
    if (!nameOrId) return '';
    // If it already is a .html file, just use it
    if (nameOrId.endsWith('.html')) return nameOrId;

    const entry = templateCatalog.value.find((c) => c.name === nameOrId);
    if (entry) {
      return device === 'tablet' ? entry.files.tablet : entry.files.phone;
    }
    return nameOrId;
  };

  const handlePreview = () => {
    const config = appConfig.value;
    if (!config) return;

    const locale = previewSignals.locale.value;
    const scene = previewSignals.scene.value;
    let theme = previewSignals.theme.value;
    const deviceType = previewSignals.deviceType.value;
    const templateOverride = previewSignals.template.value;
    const titleOverride = previewSignals.title.value;

    if (!locale || !scene) return;

    // If 'all' is selected for single preview, just use the first available theme
    if (theme === 'all') {
      const sceneConfig = getSceneConfig(config, scene);
      theme = sceneConfig?.themes?.[0] || 'light';
    }

    // Resolve template
    let templateName = templateOverride;
    if (!templateName) {
      const sceneConfig = getSceneConfig(config, scene);
      templateName = sceneConfig?.templateId || '';
    }

    let templateFile = resolveTemplateFile(templateName, deviceType);

    if (!templateFile) {
      // Fallback if no template defined
      const catalog = templateCatalog.value;
      if (catalog.length > 0) {
        templateFile = deviceType === 'tablet' ? catalog[0].files.tablet : catalog[0].files.phone;
      }
    }

    if (!templateFile) {
      alert('No template selected or defined for this scene.');
      return;
    }

    // Resolve title
    const title = titleOverride || getSceneText(config, locale, scene, 'title', theme);

    // Build screenshots for slots (usually just the primary one for now)
    const screenshot = buildScreenshotPath({
      app: config.id,
      deviceType,
      locale,
      scene,
      theme,
    });

    // Override: The user specifically asked for `home_light.png`.
    // So we should pass 'light' if that is the selected theme.
    // However, we need to check if existing utils handles this.
    // utils.ts: export function buildScreenshotPath({ ... theme ... }) { return theme ? ... : ... }
    // so if we pass 'light', it becomes `home_light.png`. Correct.

    const url = buildTemplateUrl({
      template: templateFile,
      title,
      screenshot,
      cacheBust: true,
      theme,
      darkMode: theme === 'dark',
    });

    const dims = getTemplateDimensions(templateFile);

    previewActions.setSinglePreview({
      url,
      width: dims.width,
      height: dims.height,
    });
  };

  const handlePreviewAll = () => {
    const config = appConfig.value;
    if (!config) return;

    const locale = previewSignals.locale.value;
    const selectedTheme = previewSignals.theme.value;
    const deviceType = previewSignals.deviceType.value;
    const templateOverride = previewSignals.template.value;

    if (!locale) return;

    const cards: PreviewGridCard[] = [];

    (config.scenes || []).forEach((scene) => {
      const sceneConfig = getSceneConfig(config, scene);
      // If 'all' selected, show all themes for this scene. Otherwise show just the selected one.
      const themes = selectedTheme === 'all' ? sceneConfig?.themes || ['light'] : [selectedTheme];

      themes.forEach((theme) => {
        // Resolve template
        let templateName = templateOverride;
        if (!templateName) {
          templateName = sceneConfig?.templateId || '';
        }

        let templateFile = resolveTemplateFile(templateName, deviceType);

        if (!templateFile) {
          const catalog = templateCatalog.value;
          if (catalog.length > 0) {
            templateFile =
              deviceType === 'tablet' ? catalog[0].files.tablet : catalog[0].files.phone;
          }
        }

        const title = getSceneText(config, locale, scene, 'title', theme);
        const screenshot = buildScreenshotPath({
          app: config.id,
          deviceType,
          locale,
          scene,
          theme,
        });

        const url = buildTemplateUrl({
          template: templateFile,
          title,
          screenshot,
          cacheBust: true,
          theme,
          darkMode: theme === 'dark',
        });

        const dims = getTemplateDimensions(templateFile);
        const CARDWidth = 300;
        const scale = CARDWidth / dims.width;

        cards.push({
          id: `${scene}_${theme}`,
          label: themes.length > 1 ? `${scene} (${theme})` : scene,
          subtitle: title,
          url,
          width: dims.width,
          height: dims.height,
          scaledWidth: CARDWidth,
          scaledHeight: dims.height * scale,
          scale,
        });
      });
    });

    previewActions.setAllPreview(cards);
  };

  const handleRender = async () => {
    const path = configPath.value;
    if (!path) return;

    try {
      previewActions.setRenderRunning(true);
      previewActions.clearRenderLogs();
      previewActions.setRenderStatus('Starting render process...', 'muted');

      const { id } = await screenshotFactorySDK.startRender({
        configPath: path,
        deviceType: previewSignals.deviceType.value,
      });

      // Poll for logs
      let offset = 0;
      const poll = async () => {
        if (!previewSignals.renderRunning.value) return;

        try {
          const job = await screenshotFactorySDK.getRenderRun(id, offset);
          if (job.logs && job.logs.length > 0) {
            previewActions.appendRenderLogs(job.logs);
            offset = job.nextOffset;
          }

          if (job.status === 'success') {
            previewActions.setRenderStatus('Render completed successfully!', 'success');
            previewActions.setRenderRunning(false);
          } else if (job.status === 'error') {
            previewActions.setRenderStatus('Render failed with errors.', 'error');
            previewActions.setRenderRunning(false);
          } else {
            setTimeout(poll, 1000);
          }
        } catch (e) {
          console.error('Polling failed:', e);
          previewActions.setRenderStatus('Error polling render status.', 'error');
          previewActions.setRenderRunning(false);
        }
      };

      poll();
    } catch (e) {
      console.error('Render start failed:', e);
      previewActions.setRenderStatus('Failed to start render: ' + (e as Error).message, 'error');
      previewActions.setRenderRunning(false);
    }
  };

  const handleStopRender = async () => {
    // For now we just stop polling on client side
    previewActions.setRenderRunning(false);
    previewActions.setRenderStatus('Render stopped by user.', 'muted');
  };

  return (
    <div id="page-preview" className="page active">
      <header className="page-header">
        <h1>Preview & Export</h1>
        <p className="subtitle">Preview your templates with real data and export final images.</p>
      </header>

      <div className="panel">
        <PreviewControls
          locale={previewSignals.locale}
          scene={previewSignals.scene}
          theme={previewSignals.theme}
          deviceType={previewSignals.deviceType}
          template={previewSignals.template}
          title={previewSignals.title}
          localeOptions={previewSignals.localeOptions}
          sceneOptions={previewSignals.sceneOptions}
          themeOptions={previewSignals.themeOptions}
          templateOptions={previewSignals.templateOptions}
          localeDisabled={previewSignals.localeDisabled}
          sceneDisabled={previewSignals.sceneDisabled}
          themeDisabled={previewSignals.themeDisabled}
          templateDisabled={previewSignals.templateDisabled}
          previewDisabled={previewSignals.previewDisabled}
          previewAllDisabled={previewSignals.previewAllDisabled}
          renderDisabled={previewSignals.renderDisabled}
          stopRenderDisabled={previewSignals.stopRenderDisabled}
          renderStatusMessage={previewSignals.renderStatusMessage}
          renderStatusTone={previewSignals.renderStatusTone}
          renderLogs={previewSignals.renderLogs}
          onLocaleChange={(val) => previewActions.setControlsState({ locale: val })}
          onSceneChange={(val) => previewActions.setControlsState({ scene: val })}
          onThemeChange={(val) => previewActions.setControlsState({ theme: val })}
          onDeviceChange={(val) => previewActions.setControlsState({ deviceType: val })}
          onTemplateChange={(val) => previewActions.setControlsState({ template: val })}
          onTitleChange={(val) => previewActions.setControlsState({ title: val })}
          onPreview={handlePreview}
          onPreviewAll={handlePreviewAll}
          onRender={handleRender}
          onStopRender={handleStopRender}
          onRefresh={() => window.location.reload()}
          onSample={() => {
            previewActions.setControlsState({
              template:
                previewSignals.deviceType.value === 'tablet'
                  ? 'clean_airy_tablet.html'
                  : 'clean_airy.html',
            });
          }}
        />
      </div>

      <div
        className="panel"
        style={{ marginTop: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}
      >
        <PreviewWorkspace
          mode={previewSignals.workspaceMode}
          zoom={previewSignals.zoom}
          cards={previewSignals.gridCards}
          singlePreview={previewSignals.singlePreview}
          onSetZoom={previewActions.setZoom}
          zoomStep={0.1}
        />
      </div>
    </div>
  );
}
