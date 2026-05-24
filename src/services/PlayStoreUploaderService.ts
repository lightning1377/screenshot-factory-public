import { androidpublisher_v3, google } from 'googleapis';
import fs from 'fs-extra';
import path from 'path';
import { AppConfig, UploadJob, ScreenshotMetadata, DeviceType } from '../contract/types';

interface LanguageMapping {
  code: string;
  playStoreLocale: string;
  name: string;
}

const MAX_UPLOAD_LOG_LINES = 2000;

export class PlayStoreUploaderService {
  private uploadJobs = new Map<string, UploadJob>();
  private abortControllers = new Map<string, AbortController>();

  private readonly languageMappings: LanguageMapping[] = [
    { code: 'en', playStoreLocale: 'en-US', name: 'English' },
    { code: 'es', playStoreLocale: 'es-ES', name: 'Spanish' },
    { code: 'ar', playStoreLocale: 'ar', name: 'Arabic' },
    { code: 'fa', playStoreLocale: 'fa', name: 'Persian' },
    { code: 'hi', playStoreLocale: 'hi-IN', name: 'Hindi' },
  ];

  private readonly screenshotTypeMapping: Record<string, string> = {
    phone: 'phoneScreenshots',
    tablet: 'tenInchScreenshots',
  };

  async getDiscoveryInfo(config: AppConfig): Promise<{
    screenshots: ScreenshotMetadata[];
    connectionValid: boolean;
    connectionError?: string;
  }> {
    const job: UploadJob = {
      id: 'discovery',
      status: 'running',
      logs: [],
      startedAt: new Date().toISOString(),
    };

    const screenshotsDir = path.resolve(process.cwd(), 'screenshots', 'final', config.id);
    if (!(await fs.pathExists(screenshotsDir))) {
      throw new Error(`Screenshots directory not found: ${screenshotsDir}`);
    }

    const screenshots = await this.discoverScreenshots(job, screenshotsDir);

    let connectionValid = false;
    let connectionError: string | undefined;

    try {
      const publisher = await this.initPublisher(config);
      // Test connection by attempting to create an edit (and not committing it)
      await publisher.edits.insert({
        packageName: config.packageName,
      });
      connectionValid = true;
    } catch (err) {
      connectionValid = false;
      connectionError = err instanceof Error ? err.message : String(err);
    }

    return { screenshots, connectionValid, connectionError };
  }

  private async initPublisher(config: AppConfig): Promise<androidpublisher_v3.Androidpublisher> {
    if (!config.uploadKeyPath) {
      throw new Error('uploadKeyPath is not defined in app config');
    }

    const keyPath = path.resolve(process.cwd(), config.uploadKeyPath);
    if (!(await fs.pathExists(keyPath))) {
      throw new Error(`Service account key not found at ${keyPath}`);
    }

    const keyContent = await fs.readJson(keyPath);
    const auth = new google.auth.GoogleAuth({
      credentials: keyContent,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    return google.androidpublisher({
      version: 'v3',
      auth,
    });
  }

  async startUpload(config: AppConfig, dryRun = false): Promise<string> {
    const jobId = this.createJobId();
    const job: UploadJob = {
      id: jobId,
      status: 'running',
      logs: [],
      startedAt: new Date().toISOString(),
    };
    this.uploadJobs.set(jobId, job);

    const controller = new AbortController();
    this.abortControllers.set(jobId, controller);

    // Run in background
    (async () => {
      try {
        await this.runUpload(job, config, dryRun, controller.signal);
        job.status = 'success';
        job.exitCode = 0;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('Upload failed:', error);
        this.pushUploadLog(job, `[error] ${msg}`);
        job.status = 'error';
        job.exitCode = 1;
      } finally {
        job.finishedAt = new Date().toISOString();
        this.abortControllers.delete(jobId);
      }
    })();

    return jobId;
  }

  getUploadJob(id: string): UploadJob | undefined {
    return this.uploadJobs.get(id);
  }

  private async runUpload(
    job: UploadJob,
    config: AppConfig,
    dryRun: boolean,
    signal: AbortSignal,
  ): Promise<void> {
    this.pushUploadLog(job, `🚀 Starting Play Store Uploader for ${config.name}`);
    this.pushUploadLog(job, `📦 Package: ${config.packageName}`);
    if (dryRun) {
      this.pushUploadLog(job, '🧪 DRY RUN MODE - No actual uploads will be performed');
    }

    this.pushUploadLog(job, '🔐 Initializing Google Play Store API...');
    const androidPublisher = await this.initPublisher(config);
    this.pushUploadLog(job, '✅ Google Play Store API initialized');

    const screenshotsDir = path.resolve(process.cwd(), 'screenshots', 'final', config.id);
    if (!(await fs.pathExists(screenshotsDir))) {
      throw new Error(`Screenshots directory not found: ${screenshotsDir}`);
    }

    const screenshots = await this.discoverScreenshots(job, screenshotsDir);
    if (screenshots.length === 0) {
      throw new Error('No screenshots found to upload');
    }

    this.pushUploadLog(job, `📸 Found ${screenshots.length} screenshots to upload`);

    const screenshotsByLanguage = this.groupScreenshotsByLanguage(screenshots);

    for (const [locale, localeScreenshots] of Object.entries(screenshotsByLanguage)) {
      if (signal.aborted) throw new Error('Upload aborted by user');

      this.pushUploadLog(
        job,
        `\n🌍 Processing locale: ${locale} (${localeScreenshots.length} screenshots)`,
      );
      await this.uploadScreenshotsForLocale(
        job,
        androidPublisher,
        config,
        locale,
        localeScreenshots,
        dryRun,
        signal,
      );
    }

    this.pushUploadLog(job, '\n✅ Screenshot upload completed!');
  }

  async prepareUploadDir(config: AppConfig): Promise<string> {
    const jobId = this.createJobId();
    const job: UploadJob = {
      id: jobId,
      status: 'running',
      logs: [],
      startedAt: new Date().toISOString(),
    };
    this.uploadJobs.set(jobId, job);

    // Run in background
    (async () => {
      try {
        this.pushUploadLog(job, `📂 Preparing upload directory for ${config.name}...`);

        const sourceDir = path.resolve(process.cwd(), 'screenshots', 'final', config.id);
        const targetDir = path.resolve(process.cwd(), 'screenshots', 'upload', config.id);

        if (!(await fs.pathExists(sourceDir))) {
          throw new Error(`Source screenshots directory not found: ${sourceDir}`);
        }

        // Clear and create target directory
        await fs.emptyDir(targetDir);
        this.pushUploadLog(job, `🧹 Cleared target directory: ${targetDir}`);

        const screenshots = await this.discoverScreenshots(job, sourceDir);
        if (screenshots.length === 0) {
          throw new Error('No screenshots found to prepare');
        }

        const screenshotsByLangAndDevice: Record<string, Record<string, ScreenshotMetadata[]>> = {};

        for (const s of screenshots) {
          if (!screenshotsByLangAndDevice[s.language]) {
            screenshotsByLangAndDevice[s.language] = {};
          }
          if (!screenshotsByLangAndDevice[s.language][s.deviceType]) {
            screenshotsByLangAndDevice[s.language][s.deviceType] = [];
          }
          screenshotsByLangAndDevice[s.language][s.deviceType].push(s);
        }

        for (const [lang, devices] of Object.entries(screenshotsByLangAndDevice)) {
          for (const [device, langScreenshots] of Object.entries(devices)) {
            const sorted = this.sortScreenshots(langScreenshots, config);

            const localeDir = path.join(targetDir, device, lang);
            await fs.ensureDir(localeDir);

            for (let i = 0; i < sorted.length; i++) {
              const s = sorted[i];
              const prefix = (i + 1).toString().padStart(2, '0');
              const newFilename = `${prefix}-${s.filename}`;
              const targetPath = path.join(localeDir, newFilename);

              await fs.copy(s.fullPath, targetPath);
            }

            this.pushUploadLog(
              job,
              `✅ Prepared ${sorted.length} screenshots for ${lang} (${device})`,
            );
          }
        }

        this.pushUploadLog(job, `\n✨ Successfully prepared all screenshots in: ${targetDir}`);
        job.status = 'success';
        job.exitCode = 0;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error('Preparation failed:', error);
        this.pushUploadLog(job, `[error] ${msg}`);
        job.status = 'error';
        job.exitCode = 1;
      } finally {
        job.finishedAt = new Date().toISOString();
      }
    })();

    return jobId;
  }

  private sortScreenshots(
    screenshots: ScreenshotMetadata[],
    config: AppConfig,
  ): ScreenshotMetadata[] {
    return [...screenshots].sort((a, b) => {
      if (config.uploadOrder && config.uploadOrder.length > 0) {
        const getOrderIndex = (s: ScreenshotMetadata) => {
          if (!config.sceneConfigs) return -1;
          const idx = config.sceneConfigs.findIndex((sc) => {
            const primarySlot = sc?.slotSceneMap?.primary;
            const primaryScene =
              typeof primarySlot === 'string' ? primarySlot : (primarySlot as any)?.scene;
            return primaryScene === s.route;
          });
          if (idx === -1) return -1;
          const id = `${idx}:${s.theme}`;
          return config.uploadOrder!.indexOf(id);
        };

        const aIdx = getOrderIndex(a);
        const bIdx = getOrderIndex(b);

        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
      }

      const routeOrder = ['home', 'items', 'logs', 'targets', 'analytics'];
      const aRouteIdx = routeOrder.indexOf(a.route);
      const bRouteIdx = routeOrder.indexOf(b.route);

      if (aRouteIdx !== bRouteIdx) {
        if (aRouteIdx !== -1 && bRouteIdx !== -1) return aRouteIdx - bRouteIdx;
        if (aRouteIdx !== -1) return -1;
        if (bRouteIdx !== -1) return 1;
      }

      return a.theme.localeCompare(b.theme);
    });
  }

  private async discoverScreenshots(
    job: UploadJob,
    baseDir: string,
  ): Promise<ScreenshotMetadata[]> {
    const screenshots: ScreenshotMetadata[] = [];
    const deviceTypes: DeviceType[] = ['phone', 'tablet'];

    for (const deviceType of deviceTypes) {
      const deviceDir = path.join(baseDir, deviceType);
      if (!(await fs.pathExists(deviceDir))) continue;

      const locales = await fs.readdir(deviceDir);
      for (const locale of locales) {
        const localeDir = path.join(deviceDir, locale);
        if (!(await fs.stat(localeDir)).isDirectory()) continue;

        const langMapping = this.languageMappings.find((m) => m.code === locale);
        if (!langMapping) continue;

        const files = await fs.readdir(localeDir);
        for (const file of files) {
          if (!file.endsWith('.png')) continue;

          // Pattern: route-theme-market.png
          const parts = file.replace('.png', '').split('-');
          if (parts.length >= 2) {
            const route = parts[0];
            const theme = parts[1];

            screenshots.push({
              filename: file,
              fullPath: path.join(localeDir, file),
              route,
              language: locale,
              theme,
              deviceType,
              playStoreLocale: langMapping.playStoreLocale,
            });
          }
        }
      }
    }

    return screenshots;
  }

  private groupScreenshotsByLanguage(
    screenshots: ScreenshotMetadata[],
  ): Record<string, ScreenshotMetadata[]> {
    return screenshots.reduce(
      (groups, screenshot) => {
        const locale = screenshot.playStoreLocale;
        if (!groups[locale]) {
          groups[locale] = [];
        }
        groups[locale].push(screenshot);
        return groups;
      },
      {} as Record<string, ScreenshotMetadata[]>,
    );
  }

  private async uploadScreenshotsForLocale(
    job: UploadJob,
    publisher: androidpublisher_v3.Androidpublisher,
    config: AppConfig,
    locale: string,
    screenshots: ScreenshotMetadata[],
    dryRun: boolean,
    signal: AbortSignal,
  ): Promise<void> {
    const logPrefix = dryRun ? '🧪 [DRY RUN] ' : '  ';
    this.pushUploadLog(job, `${logPrefix}📝 Creating edit for ${locale}...`);

    let editId = 'simulation-edit-id';
    if (!dryRun) {
      const editResponse = await publisher.edits.insert({
        packageName: config.packageName,
      });
      editId = editResponse.data.id || '';
    } else {
      await new Promise((r) => setTimeout(r, 300));
    }

    if (!editId) throw new Error('Failed to create edit');

    this.pushUploadLog(job, `${logPrefix}✅ Edit created: ${editId}`);

    const imageTypes = Array.from(
      new Set(screenshots.map((s) => this.screenshotTypeMapping[s.deviceType])),
    );

    // Clear existing screenshots
    for (const imageType of imageTypes) {
      if (signal.aborted) throw new Error('Upload aborted by user');
      try {
        let deletedCount = 0;
        if (!dryRun) {
          const res = await publisher.edits.images.deleteall({
            packageName: config.packageName,
            editId,
            language: locale,
            imageType,
          });
          deletedCount = res.data.deleted?.length ?? 0;
        } else {
          await new Promise((r) => setTimeout(r, 200));
          deletedCount = 3; // Simulated count
        }
        this.pushUploadLog(
          job,
          `${logPrefix}🗑️  Cleared existing screenshots for ${locale} (${imageType}): ${deletedCount} deleted`,
        );
      } catch {
        this.pushUploadLog(
          job,
          `${logPrefix}ℹ️  No existing screenshots to clear for ${locale} (${imageType})`,
        );
      }
    }

    // Sort screenshots based on user-defined order if available
    const sortedScreenshots = this.sortScreenshots(screenshots, config);

    for (const screenshot of sortedScreenshots) {
      if (signal.aborted) throw new Error('Upload aborted by user');
      await this.uploadSingleScreenshot(
        job,
        publisher,
        config.packageName,
        editId,
        locale,
        screenshot,
        dryRun,
      );
    }

    this.pushUploadLog(job, `${logPrefix}💾 Committing changes for ${locale}...`);
    if (!dryRun) {
      await publisher.edits.commit({
        packageName: config.packageName,
        editId,
      });
    } else {
      await new Promise((r) => setTimeout(r, 500));
    }

    this.pushUploadLog(
      job,
      `${logPrefix}✅ Successfully ${dryRun ? 'simulated upload of' : 'uploaded'} ${screenshots.length} screenshots for ${locale}`,
    );
  }

  private async uploadSingleScreenshot(
    job: UploadJob,
    publisher: androidpublisher_v3.Androidpublisher,
    packageName: string,
    editId: string,
    locale: string,
    screenshot: ScreenshotMetadata,
    dryRun: boolean,
  ): Promise<void> {
    const logPrefix = dryRun ? '🧪 [DRY RUN] ' : '    ';
    this.pushUploadLog(job, `${logPrefix}📤 Uploading: ${screenshot.filename}`);

    if (!dryRun) {
      const imageType = this.screenshotTypeMapping[screenshot.deviceType];
      const buffer = await fs.readFile(screenshot.fullPath);

      const res = await publisher.edits.images.upload({
        packageName,
        editId,
        language: locale,
        imageType,
        media: {
          mimeType: 'image/png',
          body: buffer,
        },
      });

      this.pushUploadLog(
        job,
        `${logPrefix}✅ Uploaded: ${screenshot.filename} (ID: ${res.data.image?.id})`,
      );
    } else {
      await new Promise((r) => setTimeout(r, 150));
      this.pushUploadLog(
        job,
        `${logPrefix}✅ Simulated upload: ${screenshot.filename} (ID: simulated-img-id)`,
      );
    }
  }

  private createJobId(): string {
    return `upload-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private pushUploadLog(job: UploadJob, message: string): void {
    if (!message) return;
    job.logs.push(message);
    if (job.logs.length > MAX_UPLOAD_LOG_LINES) {
      job.logs.splice(0, job.logs.length - MAX_UPLOAD_LOG_LINES);
    }
  }
}
