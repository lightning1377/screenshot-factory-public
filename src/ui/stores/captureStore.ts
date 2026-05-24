import { signal } from '@preact/signals';
import { screenshotFactorySDK } from '../sdk/ScreenshotFactorySDK';
import { JobRunnerService } from '../services/JobRunnerService';

export function createCaptureStore() {
  const devices = signal<string[]>([]);
  const emulators = signal<any[]>([]);
  const selectedDeviceType = signal('phone');
  const selectedSerial = signal('');
  const selectedEmulator = signal('');
  const isRunning = signal(false);
  const logs = signal('');
  const statusMessage = signal('Select a config to run.');
  const statusTone = signal<'success' | 'error' | 'muted' | 'warning'>('muted');

  const setStatus = (msg: string, tone: 'success' | 'error' | 'muted' | 'warning' = 'muted') => {
    statusMessage.value = msg;
    statusTone.value = tone;
  };

  const appendLogs = (lines: string[]) => {
    if (!lines || lines.length === 0) return;
    logs.value += `${lines.join('\n')}\n`;
  };

  const clearLogs = () => {
    logs.value = '';
  };

  const loadDevices = async () => {
    try {
      const response = await screenshotFactorySDK.getDevices();
      devices.value = response.devices || [];
    } catch (e) {
      console.error('Failed to load devices:', e);
    }
  };

  const loadEmulators = async () => {
    try {
      const emuList = await screenshotFactorySDK.listEmulators();
      emulators.value = emuList;
    } catch (e) {
      console.error('Failed to load emulators:', e);
    }
  };

  const bootEmulator = async () => {
    if (!selectedEmulator.value) return;
    try {
      const { id, type } = JSON.parse(selectedEmulator.value);
      setStatus(`Booting ${type} emulator...`, 'warning');
      await screenshotFactorySDK.bootEmulator(id, type);
      setStatus('Boot command sent.', 'success');
      setTimeout(loadEmulators, 5000);
      setTimeout(loadDevices, 10000);
    } catch (e) {
      console.error('Failed to boot emulator:', e);
      setStatus('Failed to boot emulator.', 'error');
    }
  };

  const captureRunner = new JobRunnerService({
    poll: (id, from) => screenshotFactorySDK.getCaptureRun(id, from),
    stop: (id) => screenshotFactorySDK.stopCapture(id),
    onStateChange: (running) => {
      isRunning.value = running;
    },
    onLogs: appendLogs,
    onRunning: () => setStatus('Capture running...'),
    onSuccess: () => setStatus('Capture finished successfully.', 'success'),
    onFailure: () => setStatus('Capture finished with errors.', 'error'),
    onPollError: () => setStatus('Failed to fetch capture logs.', 'error'),
    onStartError: () => setStatus('Failed to start capture.', 'error'),
  });

  const startCapture = async (configPath: string | null) => {
    if (!configPath) {
      setStatus('Select a config to run.', 'error');
      return;
    }

    clearLogs();
    setStatus('Starting capture...');
    await captureRunner.start(() =>
      screenshotFactorySDK.startCapture({
        configPath,
        deviceType: selectedDeviceType.value,
        serial: selectedSerial.value || undefined,
      }),
    );
  };

  const stopCapture = async () => {
    await captureRunner.cancel();
  };

  return {
    signals: {
      devices,
      emulators,
      selectedDeviceType,
      selectedSerial,
      selectedEmulator,
      isRunning,
      logs,
      statusMessage,
      statusTone,
    },
    actions: {
      loadDevices,
      loadEmulators,
      bootEmulator,
      startCapture,
      stopCapture,
      setStatus,
    },
  };
}
