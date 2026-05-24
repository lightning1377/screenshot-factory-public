import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runScreenshots } from './run';
import * as android from './android';
import * as config from '../config';
import fs from 'fs-extra';

vi.mock('./android');
vi.mock('../config');
vi.mock('fs-extra');

describe('runScreenshots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should run screenshots for all locales and scenes', async () => {
    const mockAppConfig = {
      id: 'test-app',
      packageName: 'com.test',
      name: 'Test App',
      scenes: ['scene1'],
      locales: ['en', 'fr'],
      sceneConfigs: [{ themes: ['light'] }],
    } as config.AppConfig;

    vi.mocked(config.loadAppConfig).mockResolvedValue(mockAppConfig);
    vi.mocked(android.listDevices).mockResolvedValue(['emulator-5554']);
    vi.mocked(fs.ensureDir).mockResolvedValue(undefined);

    const logger = vi.fn();

    await runScreenshots({ configPath: 'apps/test.json', deviceType: 'phone' }, logger);

    expect(android.triggerDeepLink).toHaveBeenCalledTimes(2); // 2 locales * 1 scene
    expect(android.captureScreenshot).toHaveBeenCalledTimes(2);
    expect(logger).toHaveBeenCalledWith(
      expect.stringContaining('Starting Screenshot Factory'),
      'info',
    );
    expect(logger).toHaveBeenCalledWith(expect.stringContaining('Processing locale: fr'), 'info');
  });

  it('should throw error if no devices are found', async () => {
    vi.mocked(android.listDevices).mockResolvedValue([]);

    await expect(
      runScreenshots({ configPath: 'apps/test.json', deviceType: 'phone' }),
    ).rejects.toThrow('No emulator or device connected');
  });
});
