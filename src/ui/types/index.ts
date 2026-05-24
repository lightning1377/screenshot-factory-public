export type DeviceType = 'phone' | 'tablet';

export interface SlotBinding {
  scene: string;
  theme?: string; // e.g. dark, light, $current
}

export interface SceneConfig {
  templateId?: string;
  slotSceneMap?: Record<string, string | SlotBinding>;
  themes?: string[];
  textSlots?: Record<string, Record<string, string | Record<string, string>>>;
}

export interface AppConfig {
  id: string;
  packageName: string;
  apkPath?: string;
  uploadKeyPath?: string;
  name: string;
  locales: string[];
  scenes: string[];
  sceneConfigs?: SceneConfig[];
  uploadOrder?: string[];
}

export interface AppSummary {
  id: string;
  name: string;
  packageName: string;
  configPath: string;
}

export interface AppStats {
  totalApps: number;
  totalScreenshots: number;
  totalLocales: number;
  totalScenes: number;
}

export interface AppsResponse {
  apps: AppSummary[];
  stats: AppStats;
}

export interface ConfigResponse {
  configPath: string;
  config: AppConfig;
}

export interface TemplateResponse {
  name: string;
  content: string;
}

export interface TemplateSlot {
  id: string;
  label?: string;
  required?: boolean;
}

export interface TemplateCatalogEntry {
  name: string;
  files: {
    phone: string;
    tablet: string;
  };
  slots: TemplateSlot[];
  textSlots?: { id: string; label?: string }[];
}

export type CaptureStatus = 'running' | 'success' | 'error';
export type UploadStatus = 'running' | 'success' | 'error';

export interface CaptureJob {
  id: string;
  status: CaptureStatus;
  logs: string[];
  startedAt: string;
  finishedAt?: string;
  exitCode?: number | null;
  nextOffset: number;
}

export interface UploadJob {
  id: string;
  status: UploadStatus;
  logs: string[];
  startedAt: string;
  finishedAt?: string;
  exitCode?: number | null;
  nextOffset: number;
}

export interface UploadOptions {
  configPath: string;
  dryRun?: boolean;
}

export interface TemplatesResponse {
  templates: string[];
  catalog?: TemplateCatalogEntry[];
}

export interface CaptureStartResponse {
  id: string;
}

export interface DevicesResponse {
  devices: string[];
}

export interface UIState {
  selectedAppId: string;
  selectedConfigAppId: string;
  selectedCaptureConfig: string;
}

export interface PreviewTemplateSync {
  selectedTemplate: string;
  deviceType: DeviceType | null;
}

export interface TemplateManager {
  loadTemplates: (preferredTemplate?: string) => Promise<void>;
  loadTemplateContent: (templateName: string) => Promise<void>;
  saveTemplateContent: (templateName: string, content: string) => Promise<void>;
  createTemplateContent: (templateName: string, content: string) => Promise<void>;
  applyPreviewTemplateSelection: (selected: string) => Promise<PreviewTemplateSync>;
  syncPreviewTemplateForDevice: (type: DeviceType) => Promise<PreviewTemplateSync>;
  getPreviewTemplateSelection: () => string;
  refreshBuilder: () => Promise<void>;
  setTemplateDirty: (isDirty: boolean) => void;
  findTemplateByType: (type: string) => string | null | undefined;
  updateForConfig: (appConfig: AppConfig | null) => void;
}

export interface PreviewPage {
  mount: () => void;
  unmount: () => void;
  setStats: (stats: AppStats) => void;
  updateForConfig: (appConfig: AppConfig | null) => void;
  updateTemplateOptions: (templates: string[]) => void;
  syncTemplateSelection: (sync: PreviewTemplateSync) => void;
  refreshCurrentPreview: (cacheBust?: boolean) => void;
  getSelectedDeviceType: () => DeviceType;
}

export interface ConfigEditor {
  mount: () => void;
  unmount: () => void;
  updateForConfig: (configData: AppConfig | null) => void;
}

export interface AppState {
  appConfigs: AppSummary[];
  currentAppConfig: AppConfig | null;
  templates: string[];
  templateCatalog: TemplateCatalogEntry[];
  currentTemplateName: string | null;
  templateDirty: boolean;
  templateOriginal: string;
  builderZoom: number;
  currentPreview: {
    mode: 'single' | 'all';
    app?: string;
    locale?: string;
    scene?: string;
    template?: string;
    deviceType?: string;
    title?: string;
    screenshotOverride?: string;
  } | null;
  currentConfigPath: string | null;
  currentConfigAppId: string | null;
  currentConfigData: AppConfig | null;
  configDirty: boolean;
  activeConfigIndex: number;
  activeConfigLocale: string | null;
  ui: UIState;
}
