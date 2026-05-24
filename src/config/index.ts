import path from 'path';
import fs from 'fs-extra';
import { AppConfig, AppConfigSchema } from '../contract/types';

function resolveAppConfigPath(configPath: string): string {
  const appsDir = path.resolve(process.cwd(), 'apps');
  const resolved = path.resolve(process.cwd(), configPath);
  const relativeToApps = path.relative(appsDir, resolved);

  if (
    !resolved.endsWith('.json') ||
    relativeToApps.startsWith('..') ||
    path.isAbsolute(relativeToApps)
  ) {
    throw new Error('Config path must be inside apps/ and end with .json');
  }

  return resolved;
}

export async function loadAppConfig(configPath: string): Promise<AppConfig> {
  const data = await fs.readJson(resolveAppConfigPath(configPath));
  return AppConfigSchema.parse(data);
}

export type { AppConfig };
