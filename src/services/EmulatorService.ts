import { execFileSync, spawn } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs-extra';
import { Emulator } from '../contract/types';

export class EmulatorService {
  private getEmulatorExecutable(): string {
    const isWin = os.platform() === 'win32';
    const home = os.homedir();

    // Check typical locations
    const locations = isWin
      ? [
          path.join(process.env.LOCALAPPDATA || '', 'Android', 'Sdk', 'emulator', 'emulator.exe'),
          path.join(process.env.ANDROID_HOME || '', 'emulator', 'emulator.exe'),
        ]
      : [
          path.join(home, 'Library', 'Android', 'sdk', 'emulator', 'emulator'),
          '/usr/local/share/android-sdk/emulator/emulator',
        ];

    for (const loc of locations) {
      if (fs.existsSync(loc)) return loc;
    }

    return 'emulator'; // Fallback to PATH
  }

  async listEmulators(): Promise<Emulator[]> {
    const emulators: Emulator[] = [];

    // Android
    try {
      const exe = this.getEmulatorExecutable();
      const output = execFileSync(exe, ['-list-avds'], {
        stdio: ['pipe', 'pipe', 'ignore'],
      }).toString();
      const avds = output
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      // Get running devices to check status
      let runningSerials: string[] = [];
      try {
        const adbOutput = execFileSync('adb', ['devices'], {
          stdio: ['pipe', 'pipe', 'ignore'],
        }).toString();
        runningSerials = adbOutput
          .split('\n')
          .slice(1)
          .map((line) => line.split('\t')[0].trim())
          .filter(Boolean);
      } catch {
        // adb might not be in path
      }

      for (const avd of avds) {
        // Mapping AVD name to serial is hard, so we just check if any emulator-xxxx is running
        // For now, we'll just mark as 'off' and let the user boot if they want,
        // or check if 'emulator' is in the adb list (usually it is).
        const isRunning = runningSerials.some((s) => s.startsWith('emulator-'));

        emulators.push({
          id: avd,
          name: avd,
          type: 'android',
          status: isRunning ? 'booted' : 'off',
        });
      }
    } catch (e) {
      console.warn('Failed to list Android emulators:', e);
    }

    // iOS (macOS only)
    if (os.platform() === 'darwin') {
      try {
        const output = execFileSync(
          'xcrun',
          ['simctl', 'list', 'devices', 'available', '--json'],
          {
            stdio: ['pipe', 'pipe', 'ignore'],
          },
        ).toString();
        const data = JSON.parse(output);
        for (const runtime in data.devices) {
          // Extract human readable runtime name
          const runtimeName = runtime.split('.').pop()?.replace('iOS-', 'iOS ') || runtime;

          for (const device of data.devices[runtime]) {
            emulators.push({
              id: device.udid,
              name: `${device.name} (${runtimeName})`,
              type: 'ios',
              status: device.state === 'Booted' ? 'booted' : 'off',
            });
          }
        }
      } catch (e) {
        console.warn('Failed to list iOS simulators:', e);
      }
    }

    return emulators;
  }

  async bootEmulator(id: string, type: 'android' | 'ios'): Promise<void> {
    if (type === 'android') {
      const exe = this.getEmulatorExecutable();
      console.log(`Booting Android emulator: ${id} using ${exe}`);
      // Spawn so it doesn't block the main process
      const child = spawn(exe, ['-avd', id], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
    } else {
      console.log(`Booting iOS simulator: ${id}`);
      execFileSync('xcrun', ['simctl', 'boot', id], { stdio: 'ignore' });
      try {
        execFileSync('open', ['-a', 'Simulator'], { stdio: 'ignore' });
      } catch {
        // Simulator app might already be open or fail on some setups
      }
    }
  }
}
