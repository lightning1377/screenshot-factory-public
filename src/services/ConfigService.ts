import path from 'path';
import fs from 'fs-extra';

export class ConfigService {
  private appsDir = path.resolve(process.cwd(), 'apps');

  async readConfig(configPath: string): Promise<{ configPath: string; config: any } | null> {
    const resolved = this.resolveConfigPath(configPath);
    if (!resolved || !(await fs.pathExists(resolved))) {
      return null;
    }

    const config = await fs.readJson(resolved);
    return {
      configPath: path.relative(process.cwd(), resolved),
      config,
    };
  }

  async createConfig(name: string, appId: string): Promise<{ configPath: string; config: any }> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const filename = `${slug}.json`;
    const configPath = path.join('apps', filename);
    const fullPath = path.resolve(process.cwd(), configPath);

    const defaultConfig = {
      id: appId,
      name: name,
      packageName: appId,
      scenes: ['home'],
      locales: ['en'],
      sceneConfigs: [
        {
          themes: ['light'],
          textSlots: {
            title: {
              en: 'Welcome to ' + name,
            },
          },
        },
      ],
    };

    await fs.ensureDir(this.appsDir);
    await fs.writeJson(fullPath, defaultConfig, { spaces: 2 });

    return {
      configPath: configPath,
      config: defaultConfig,
    };
  }

  async saveConfig(configPath: string, config: any): Promise<boolean> {
    const resolved = this.resolveConfigPath(configPath);
    if (!resolved) {
      return false;
    }

    try {
      await fs.writeJson(resolved, config, { spaces: 2 });
      return true;
    } catch (error) {
      console.error('Error saving config file:', error);
      return false;
    }
  }

  private resolveConfigPath(configPath: string): string | null {
    const resolved = path.resolve(process.cwd(), configPath);
    if (!resolved.endsWith('.json')) return null;
    const relativeToApps = path.relative(this.appsDir, resolved);
    if (relativeToApps.startsWith('..') || path.isAbsolute(relativeToApps)) return null;
    return resolved;
  }
}
