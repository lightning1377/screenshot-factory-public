import path from 'path';
import fs from 'fs-extra';
import { loadAppConfig } from '../config';
import {
  listDevices,
  ensureEmulator,
  triggerDeepLink,
  captureScreenshot,
  waitForStable,
  installApk,
  clearAppData,
} from './android';
import chalk from 'chalk';
import { CaptureOptions } from '../contract/types';

export type Logger = (message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;

const defaultLogger: Logger = (msg, type) => {
  const colorMap = {
    info: chalk.blue,
    success: chalk.green,
    warn: chalk.yellow,
    error: chalk.red,
  };
  const color = type ? colorMap[type] : (msg: string) => msg;
  console.log(color(msg));
};

export async function runScreenshots(options: CaptureOptions, logger: Logger = defaultLogger) {
  const { configPath, deviceType, serial, force, signal } = options;
  const appConfig = await loadAppConfig(configPath);

  const devices = await listDevices();
  if (devices.length === 0) {
    throw new Error('No emulator or device connected via ADB');
  }

  const selectedSerial = serial || devices[0];
  if (serial && !devices.includes(serial)) {
    throw new Error(`Device ${serial} not found`);
  }

  logger(`🚀 Starting Screenshot Factory for ${appConfig.name}`, 'info');
  logger(`📱 Using device: ${selectedSerial}`, 'info');
  logger(`📂 Using device type: ${deviceType}`, 'info');

  await ensureEmulator(selectedSerial);

  if (appConfig.apkPath) {
    try {
      await installApk(appConfig.apkPath, selectedSerial);
      logger(`✅ App installed successfully on ${selectedSerial}`, 'success');
    } catch {
      if (force) {
        logger(`⚠️ Failed to install APK but continuing due to --force`, 'warn');
      } else {
        throw new Error(
          `Installation failed for APK: ${appConfig.apkPath}. Use --force to continue.`,
        );
      }
    }
  }

  // Clear app data to ensure clean state
  await clearAppData(appConfig.packageName, selectedSerial);

  const baseDir = path.join(process.cwd(), 'screenshots', 'raw', appConfig.id, deviceType);

  for (const locale of appConfig.locales) {
    if (signal?.aborted) throw new Error('Capture aborted by user');
    logger(`🌍 Processing locale: ${locale}`, 'info');

    for (const scene of appConfig.scenes) {
      if (signal?.aborted) throw new Error('Capture aborted by user');
      logger(`  🎬 Scene: ${scene}`, 'info');

      const outDir = path.join(baseDir, locale);
      await fs.ensureDir(outDir);

      const sceneIdx = appConfig.scenes.indexOf(scene);
      const sceneConfig = sceneIdx >= 0 ? appConfig.sceneConfigs?.[sceneIdx] : undefined;

      const themes = sceneConfig?.themes || [];

      // If no themes specified, capture default (no theme param, standard filename)
      if (themes.length === 0) {
        const finalPath = path.join(outDir, `${scene}.png`);
        await triggerDeepLink(appConfig.packageName, scene, locale, selectedSerial);
        await waitForStable(selectedSerial);
        await captureScreenshot(finalPath, selectedSerial);
        continue;
      }

      // Capture for each theme
      for (const theme of themes) {
        if (signal?.aborted) throw new Error('Capture aborted by user');
        logger(`    🎨 Theme: ${theme}`, 'info');

        // e.g. scene_dark.png, scene_light.png
        // If theme is 'default', maybe standard filename? But let's be explicit for variants
        const finalPath = path.join(outDir, `${scene}_${theme}.png`);

        await triggerDeepLink(appConfig.packageName, scene, locale, selectedSerial, theme);
        await waitForStable(selectedSerial);
        await captureScreenshot(finalPath, selectedSerial);
      }
    }
  }
}
