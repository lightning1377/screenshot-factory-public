import path from 'path';
import fs from 'fs-extra';
import { AppConfig } from '../config';

export class AppsService {
  private appsDir = path.join(process.cwd(), 'apps');

  async getAllApps() {
    if (!(await fs.pathExists(this.appsDir))) {
      return {
        apps: [],
        stats: { totalApps: 0, totalScreenshots: 0, totalLocales: 0, totalScenes: 0 },
      };
    }

    const files = await fs.readdir(this.appsDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    const apps = await Promise.all(
      jsonFiles.map(async (file) => {
        const config = await fs.readJson(path.join(this.appsDir, file));
        return {
          id: config.id,
          name: config.name,
          packageName: config.packageName,
          configPath: path.relative(process.cwd(), path.join(this.appsDir, file)),
        };
      }),
    );

    const stats = await this.calculateStats(jsonFiles);

    return { apps, stats };
  }

  async getAppById(appId: string): Promise<AppConfig | null> {
    const result = await this.findAppConfig(appId);
    return result?.config || null;
  }

  async updateApp(
    appId: string,
    updates: {
      sceneConfigs?: any[];
      name?: string;
      scenes?: string[];
    },
  ): Promise<AppConfig | null> {
    const result = await this.findAppConfig(appId);
    if (!result) return null;

    const nextConfig = { ...result.config };
    if (updates.sceneConfigs) {
      nextConfig.sceneConfigs = updates.sceneConfigs;
    }
    if (typeof updates.name === 'string') {
      nextConfig.name = updates.name;
    }
    if (Array.isArray(updates.scenes)) {
      nextConfig.scenes = updates.scenes;
    }

    await fs.writeJson(result.filePath, nextConfig, { spaces: 2 });
    return nextConfig;
  }

  private async findAppConfig(appId: string) {
    if (!(await fs.pathExists(this.appsDir))) return null;

    const files = await fs.readdir(this.appsDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = path.join(this.appsDir, file);
      const config = await fs.readJson(filePath);
      if (config.id === appId) {
        return { filePath, config };
      }
    }

    return null;
  }

  private async calculateStats(jsonFiles: string[]) {
    let foundLocales = new Set<string>();
    let totalScenes = 0;
    let totalScreenshots = 0;

    for (const file of jsonFiles) {
      const config = await fs.readJson(path.join(this.appsDir, file));
      totalScenes += config.scenes?.length || 0;

      const rawDir = path.join(process.cwd(), 'screenshots', 'raw', config.id);
      if (await fs.pathExists(rawDir)) {
        const deviceTypes = await fs.readdir(rawDir);
        for (const type of deviceTypes) {
          const typeDir = path.join(rawDir, type);
          if ((await fs.stat(typeDir)).isDirectory()) {
            const locales = await fs.readdir(typeDir);
            for (const locale of locales) {
              const localeDir = path.join(typeDir, locale);
              if ((await fs.stat(localeDir)).isDirectory()) {
                const screenshots = await fs.readdir(localeDir);
                totalScreenshots += screenshots.filter((f) => f.endsWith('.png')).length;
              }
              foundLocales.add(locale);
            }
          }
        }
      }
    }

    return {
      totalApps: jsonFiles.length,
      totalScreenshots,
      totalLocales: foundLocales.size,
      totalScenes,
    };
  }
}
