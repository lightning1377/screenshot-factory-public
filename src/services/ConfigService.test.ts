import path from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'fs-extra';
import { ConfigService } from './ConfigService';

vi.mock('fs-extra');

describe('ConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads configs from the apps directory', async () => {
    const service = new ConfigService();
    const configPath = 'apps/example.config.json';
    const resolvedPath = path.resolve(process.cwd(), configPath);
    const config = {
      id: 'example-app',
      packageName: 'com.example.app',
      name: 'Example App',
      locales: ['en'],
      scenes: ['home'],
    };

    vi.mocked(fs.pathExists).mockResolvedValue(true as never);
    vi.mocked(fs.readJson).mockResolvedValue(config);

    await expect(service.readConfig(configPath)).resolves.toEqual({
      configPath,
      config,
    });
    expect(fs.readJson).toHaveBeenCalledWith(resolvedPath);
  });

  it('rejects configs outside the apps directory', async () => {
    const service = new ConfigService();

    await expect(service.readConfig('/tmp/example-app/screenshot-factory.json')).resolves.toBeNull();
    expect(fs.pathExists).not.toHaveBeenCalled();
    expect(fs.readJson).not.toHaveBeenCalled();
  });
});
