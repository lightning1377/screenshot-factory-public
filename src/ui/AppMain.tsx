import { useEffect } from 'preact/hooks';
import { MainShell } from './views/MainShell';
import { LandingPage } from './views/LandingPage';
import { ConfigPage } from './views/configs/ConfigPage';
import { PreviewPage } from './views/PreviewPage';
import { CapturePage } from './views/CapturePage';
import { TemplateStudio } from './views/TemplateStudio';
import { UploadPage } from './views/UploadPage';

// Stores
import { createAppStore } from './stores/appStore';
import { createLandingStore } from './stores/landingStore';
import { createPreviewStore } from './stores/previewStore';
import { createConfigStore } from './stores/configStore';
import { createCaptureStore } from './stores/captureStore';
import { createTemplateStore } from './stores/templateStore';
import { createUploadStore } from './stores/uploadStore';

import { screenshotFactorySDK } from './sdk/ScreenshotFactorySDK';

// Initialize Stores
const appStore = createAppStore({ initialApps: [] });
const landingStore = createLandingStore();
const previewStore = createPreviewStore({
  templates: [],
  minZoom: 0.1,
  maxZoom: 2,
});
const configStore = createConfigStore({
  templateCatalog: [],
});
const captureStore = createCaptureStore();
const templateStore = createTemplateStore();
const uploadStore = createUploadStore();

const { signals: appSignals, actions: appActions } = appStore;
const { signals: landingSignals, actions: landingActions } = landingStore;
const { signals: previewSignals, actions: previewActions } = previewStore;
const { signals: configSignals, actions: configActions } = configStore;
const { signals: captureSignals, actions: captureActions } = captureStore;
const { signals: templateSignals, actions: templateActions } = templateStore;
const { signals: uploadSignals, actions: uploadActions } = uploadStore;

export function AppMain() {
  // Initial Data Load
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const appsData = await screenshotFactorySDK.getApps();
        appActions.setAppConfigs(appsData.apps || []);
        previewActions.setStats(appsData.stats);

        await templateActions.loadTemplates();
        appActions.setTemplates(templateSignals.templates.value, templateSignals.catalog.value);
        previewActions.updateTemplateOptions(templateSignals.templates.value);

        await captureActions.loadDevices();
        await captureActions.loadEmulators();
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    loadInitialData();
  }, []);

  // Handle App Selection
  const handleAppSelected = async (path: string) => {
    try {
      const result = await screenshotFactorySDK.readConfig(path);
      const config = result.config;
      if (!config) return;

      appActions.setCurrentApp(config, path);
      configActions.setConfig(config);
      uploadActions.initOrder(config.uploadOrder || []);
      previewActions.updateForConfig(config, path);
      appActions.setPage('configs');
    } catch (err) {
      console.error('Failed to load active config:', err);
      alert('Failed to load app configuration.');
    }
  };

  // Render Current Page
  const renderPage = () => {
    switch (appSignals.currentPage.value) {
      case 'landing':
        return (
          <LandingPage
            apps={appSignals.appConfigs.value}
            onAppSelected={handleAppSelected}
            isModalOpen={landingSignals.isModalOpen.value}
            newAppName={landingSignals.newAppName.value}
            newAppId={landingSignals.newAppId.value}
            isSubmitting={landingSignals.isSubmitting.value}
            onOpenModal={landingActions.openModal}
            onCloseModal={landingActions.closeModal}
            onAppNameChange={(val) => (landingSignals.newAppName.value = val)}
            onAppIdChange={(val) => (landingSignals.newAppId.value = val)}
            onCreateApp={() => landingActions.createApp(handleAppSelected)}
          />
        );
      case 'configs':
        return (
          <ConfigPage
            config={configSignals.config}
            configDirty={configSignals.configDirty}
            activeConfigIndex={configSignals.activeConfigIndex}
            activeConfigLocale={configSignals.activeConfigLocale}
            statusMessage={configSignals.statusMessage}
            statusTone={configSignals.statusTone}
            locales={configSignals.locales}
            scenes={configSignals.scenes}
            sceneConfigs={configSignals.sceneConfigs}
            activeSceneConfig={configSignals.activeSceneConfig}
            templateCatalog={appSignals.templateCatalog.value}
            templates={templateSignals.templates.value}
            configPath={appSignals.currentConfigPath.value}
            onAddScene={configActions.addSceneConfig}
            onRemoveScene={configActions.removeSceneConfig}
            onUpdateScene={configActions.updateSceneConfig}
            onSetActiveIndex={configActions.setActiveConfigIndex}
            onSetActiveLocale={configActions.setActiveLocale}
            onSetStatus={configActions.setStatus}
            onSetDirty={configActions.setDirty}
            onUpdateLocales={configActions.updateLocales}
          />
        );
      case 'preview':
        return (
          <PreviewPage
            appConfig={appSignals.currentAppConfig}
            configPath={appSignals.currentConfigPath}
            templateCatalog={templateSignals.catalog}
            previewSignals={previewSignals}
            previewActions={previewActions}
          />
        );
      case 'capture':
        return (
          <CapturePage
            devices={captureSignals.devices.value}
            emulators={captureSignals.emulators.value}
            selectedDeviceType={captureSignals.selectedDeviceType.value}
            selectedSerial={captureSignals.selectedSerial.value}
            selectedEmulator={captureSignals.selectedEmulator.value}
            isRunning={captureSignals.isRunning.value}
            logs={captureSignals.logs.value}
            statusMessage={captureSignals.statusMessage.value}
            statusTone={captureSignals.statusTone.value}
            activeConfigName={appSignals.currentAppConfig.value?.name || null}
            onDeviceTypeChange={(val) => (captureSignals.selectedDeviceType.value = val)}
            onSerialChange={(val) => (captureSignals.selectedSerial.value = val)}
            onEmulatorChange={(val) => (captureSignals.selectedEmulator.value = val)}
            onBootEmulator={captureActions.bootEmulator}
            onRefreshEmulators={() => {
              captureActions.loadEmulators();
              captureActions.loadDevices();
            }}
            onRun={() => captureActions.startCapture(appSignals.currentConfigPath.value)}
            onStop={captureActions.stopCapture}
          />
        );
      case 'templates':
        return (
          <TemplateStudio
            templates={templateSignals.templates.value}
            selectedTemplate={templateSignals.selectedTemplate.value}
            templateContent={templateSignals.templateContent.value}
            isDirty={templateSignals.isDirty.value}
            viewMode={templateSignals.viewMode.value}
            zoomLevel={templateSignals.zoomLevel.value}
            sampleDevice={templateSignals.sampleDevice.value}
            sampleLocale={templateSignals.sampleLocale.value}
            sampleScene={templateSignals.sampleScene.value}
            onInitGrapesJS={templateActions.initGrapesJS}
            onTemplateChange={(name) => {
              templateSignals.selectedTemplate.value = name;
              templateActions.loadTemplateContent(name);
            }}
            onContentChange={(val) => {
              templateSignals.templateContent.value = val;
              templateSignals.isDirty.value = true;
            }}
            onSave={() => {
              if (templateSignals.selectedTemplate.value) {
                templateActions.saveTemplate(
                  templateSignals.selectedTemplate.value,
                  templateSignals.templateContent.value,
                );
              }
            }}
            onSaveAs={(name) =>
              templateActions.saveTemplate(name, templateSignals.templateContent.value)
            }
            onReload={() => {
              if (templateSignals.selectedTemplate.value) {
                templateActions.loadTemplateContent(templateSignals.selectedTemplate.value);
              }
            }}
            onViewModeChange={templateActions.setViewMode}
            onZoom={templateActions.adjustZoom}
          />
        );
      case 'upload':
        return (
          <UploadPage
            appConfig={configSignals.config}
            isRunning={uploadSignals.isRunning}
            logs={uploadSignals.logs}
            statusMessage={uploadSignals.statusMessage}
            statusTone={uploadSignals.statusTone}
            dryRun={uploadSignals.dryRun}
            uploadOrder={uploadSignals.uploadOrder}
            discoveredScreenshots={uploadSignals.discoveredScreenshots}
            isDiscovering={uploadSignals.isDiscovering}
            connectionValid={uploadSignals.connectionValid}
            connectionError={uploadSignals.connectionError}
            onDiscover={() => uploadActions.discover(appSignals.currentConfigPath.value)}
            onUpdateConfig={configActions.updateConfig}
            onUpdateUploadOrder={uploadActions.updateOrder}
            onStartUpload={() => uploadActions.startUpload(appSignals.currentConfigPath.value)}
            onPrepareUpload={() => uploadActions.prepareUpload(appSignals.currentConfigPath.value)}
            onClearLogs={uploadActions.clearLogs}
            onResetUpload={uploadActions.reset}
          />
        );
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <MainShell
      currentPage={appSignals.currentPage.value}
      isExpanded={appSignals.isExpanded.value}
      onPageChange={appActions.setPage}
      onToggleExpanded={appActions.setExpanded}
    >
      {renderPage()}
    </MainShell>
  );
}
