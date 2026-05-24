import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadAppConfig } from './index';
import fs from 'fs-extra';
import path from 'path';

vi.mock('fs-extra');

describe('Config Loader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load app config correctly', async () => {
    const mockConfig = {
      id: 'test-app',
      packageName: 'com.test.app',
      name: 'Test App',
      scenes: ['main'],
      locales: ['en'],
    };

    vi.mocked(fs.readJson).mockResolvedValue(mockConfig);

    const config = await loadAppConfig('apps/test.json');
    expect(config).toEqual(mockConfig);
    expect(fs.readJson).toHaveBeenCalledWith(path.resolve(process.cwd(), 'apps/test.json'));
  });

  it('should throw error if config is invalid', async () => {
    const invalidConfig = {
      id: 'test-app',
      // missing packageName
    };

    vi.mocked(fs.readJson).mockResolvedValue(invalidConfig);

    await expect(loadAppConfig('apps/test.json')).rejects.toThrow();
  });

  it('should reject config paths outside apps', async () => {
    await expect(loadAppConfig('/tmp/example-app/screenshot-factory.json')).rejects.toThrow(
      'Config path must be inside apps/ and end with .json',
    );
    expect(fs.readJson).not.toHaveBeenCalled();
  });
});
