import { z } from 'zod';

// SceneConfigurationSchema removed — phone/tablet sub-objects are no longer used.

export const SlotBindingSchema = z.object({
  scene: z.string(),
  theme: z.string().optional(), // e.g. dark, light, $current
});

export const SlotSceneMapSchema = z.record(z.string(), z.union([z.string(), SlotBindingSchema]));

export const TemplateTextSlotSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
});

// Assuming TemplateSlotSchema is defined elsewhere or needs a basic definition for TemplateMetadataSchema to be valid.
// For the purpose of this edit, we'll define a minimal placeholder.
export const TemplateSlotSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  // Add other properties if known
});

export const TemplateMetadataSchema = z.object({
  name: z.string(),
  files: z.object({
    phone: z.string(),
    tablet: z.string(),
  }),
  slots: z.array(TemplateSlotSchema),
  textSlots: z.array(TemplateTextSlotSchema).optional(),
});

export const SceneConfigSchema = z.object({
  templateId: z.string().optional(),
  slotSceneMap: SlotSceneMapSchema.optional(),
  themes: z.array(z.string()).optional(),
  textSlots: z
    .record(
      z.string(), // placementId (e.g. title)
      z.record(z.string(), z.union([z.string(), z.record(z.string(), z.string())])), // locale -> (string | themeMap)
    )
    .optional(),
});

export const AppConfigSchema = z.object({
  id: z.string(),
  packageName: z.string(),
  apkPath: z.string().optional(),
  uploadKeyPath: z.string().optional(),
  name: z.string(),
  locales: z.array(z.string()),
  scenes: z.array(z.string()),
  sceneConfigs: z.array(SceneConfigSchema).optional(),
  uploadOrder: z.array(z.string()).optional(),
});

export type AppConfig = z.infer<typeof AppConfigSchema>;

export type DeviceType = 'phone' | 'tablet';

export interface ScreenshotMetadata {
  filename: string;
  fullPath: string;
  route: string;
  language: string;
  theme: string;
  deviceType: DeviceType;
  playStoreLocale: string;
}

export type CaptureStatus = 'running' | 'success' | 'error';
export type UploadStatus = 'running' | 'success' | 'error' | 'awaiting_confirmation';

export interface CaptureJob {
  id: string;
  status: CaptureStatus;
  logs: string[];
  startedAt: string;
  finishedAt?: string;
  exitCode?: number | null;
}

export interface UploadJob {
  id: string;
  status: UploadStatus;
  logs: string[];
  startedAt: string;
  finishedAt?: string;
  exitCode?: number | null;
}

export interface UploadOptions {
  configPath: string;
  dryRun?: boolean;
  uploadOrder?: string[];
}

export interface CaptureOptions {
  configPath: string;
  deviceType: DeviceType;
  serial?: string;
  force?: boolean;
  verbose?: boolean;
  signal?: AbortSignal;
}

export interface RenderOptions {
  configPath: string;
  deviceType: DeviceType;
  verbose?: boolean;
  signal?: AbortSignal;
}

export interface Emulator {
  id: string;
  name: string;
  type: 'android' | 'ios';
  status: 'booted' | 'off';
}
