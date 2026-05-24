import { execFileSync } from 'child_process';
import chalk from 'chalk';

const STABLE_CHECK_PATH = '/sdcard/stable_check.png';

function adbArgs(serial?: string): string[] {
  return serial ? ['-s', serial] : [];
}

function execAdb(args: string[], options?: Parameters<typeof execFileSync>[2]) {
  return execFileSync('adb', args, options);
}

function execAdbText(args: string[]): string {
  return execFileSync('adb', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

export async function listDevices() {
  const output = execAdb(['devices']).toString();
  const lines = output.split('\n');
  const devices = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && line.includes('\tdevice')) {
      const [serial] = line.split('\t');
      devices.push(serial);
    }
  }

  return devices;
}

export async function triggerDeepLink(
  packageName: string,
  sceneKey: string,
  locale?: string,
  serial?: string,
  theme?: string,
) {
  const query = new URLSearchParams();
  if (locale) {
    query.set('lang', locale);
  }
  if (theme) {
    query.set('theme', theme);
  }
  const queryString = query.toString();
  const url = `myapp://screenshot/${encodeURIComponent(sceneKey)}${queryString ? `?${queryString}` : ''}`;

  console.log(chalk.gray(`  🔗 Triggering deep link: ${url}`));
  const target = adbArgs(serial);
  const args = [
    ...target,
    'shell',
    'am',
    'start',
    '-W',
    '-a',
    'android.intent.action.VIEW',
    '-d',
    url,
  ];
  try {
    execAdb([...args, packageName], { stdio: 'ignore' });
  } catch {
    console.error(chalk.yellow(`  ⚠️ Failed to trigger deep link, trying without package name...`));
    execAdb(args, { stdio: 'ignore' });
  }
}

export async function captureScreenshot(outputPath: string, serial?: string) {
  console.log(chalk.gray(`  📸 Capturing screenshot to ${outputPath}`));
  const target = adbArgs(serial);
  execAdb([...target, 'shell', 'screencap', '-p', '/sdcard/screen.png']);
  execAdb([...target, 'pull', '/sdcard/screen.png', outputPath]);
}

export async function waitForStable(serial?: string) {
  console.log(chalk.gray('  ⏳ Waiting for screen to stabilize...'));
  const target = adbArgs(serial);

  const maxAttempts = 10;
  const intervalMs = 300;
  let lastSignature = '';
  let consecutiveIdentical = 0;

  // Initial wait to let the transition actually start before we begin checking
  await new Promise((resolve) => setTimeout(resolve, 300));

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      execAdb([...target, 'shell', 'screencap', '-p', STABLE_CHECK_PATH], {
        stdio: ['ignore', 'ignore', 'ignore'],
      });

      let signature = '';
      try {
        signature = execAdbText([...target, 'shell', 'md5sum', STABLE_CHECK_PATH]).trim();
      } catch {
        signature = execAdbText([...target, 'shell', 'ls', '-l', STABLE_CHECK_PATH]).trim();
      }

      if (signature) {
        if (signature === lastSignature) {
          consecutiveIdentical++;
          // If the screen is visually identical for 2 consecutive checks, it is stable
          if (consecutiveIdentical >= 2) {
            try {
              execAdb([...target, 'shell', 'rm', STABLE_CHECK_PATH], { stdio: 'ignore' });
            } catch {}
            return;
          }
        } else {
          consecutiveIdentical = 0;
          lastSignature = signature;
        }
      }
    } catch (err) {
      console.warn(
        chalk.yellow(
          `  ⚠️ ADB stability check failed, falling back to static wait: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      );
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  // Cleanup temporary file if we timed out
  try {
    execAdb([...target, 'shell', 'rm', STABLE_CHECK_PATH], { stdio: 'ignore' });
  } catch {}
}

export async function installApk(apkPath: string, serial?: string) {
  console.log(chalk.gray(`  📦 Installing APK: ${apkPath}`));
  execAdb([...adbArgs(serial), 'install', '-r', apkPath]);
}

export async function clearAppData(packageName: string, serial?: string) {
  console.log(chalk.gray(`  🧹 Clearing app data for: ${packageName}`));
  try {
    execAdb([...adbArgs(serial), 'shell', 'pm', 'clear', packageName], { stdio: 'ignore' });
  } catch {
    console.warn(chalk.yellow(`  ⚠️ Failed to clear app data for ${packageName}`));
  }
}

export async function ensureEmulator(serial?: string) {
  const devices = await listDevices();
  if (devices.length === 0) {
    throw new Error('No emulator or device connected via ADB');
  }
  if (serial && !devices.includes(serial)) {
    throw new Error(`Device with serial ${serial} is not connected`);
  }
}
