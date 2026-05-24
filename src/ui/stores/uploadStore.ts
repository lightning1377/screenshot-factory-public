import { signal } from '@preact/signals';
import { screenshotFactorySDK } from '../sdk/ScreenshotFactorySDK';
import { JobRunnerService } from '../services/JobRunnerService';

export function createUploadStore() {
  const isRunning = signal(false);
  const logs = signal('');
  const statusMessage = signal('Select an app to upload screenshots.');
  const statusTone = signal<'success' | 'error' | 'muted' | 'warning'>('muted');
  const dryRun = signal(true);
  const uploadOrder = signal<string[]>([]);
  const discoveredScreenshots = signal<any[]>([]);
  const isDiscovering = signal(false);
  const connectionValid = signal<boolean | null>(null);
  const connectionError = signal<string | null>(null);

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

  const uploadRunner = new JobRunnerService({
    poll: (id, from) => screenshotFactorySDK.getUploadRun(id, from),
    stop: () => Promise.resolve({ success: true }),
    onStateChange: (running) => {
      isRunning.value = running;
    },
    onLogs: appendLogs,
    onRunning: () => setStatus('Upload running...'),
    onSuccess: () => setStatus('Upload finished successfully.', 'success'),
    onFailure: () => setStatus('Upload finished with errors.', 'error'),
    onPollError: () => setStatus('Failed to fetch upload logs.', 'error'),
    onStartError: () => setStatus('Failed to start upload.', 'error'),
  });

  const discover = async (configPath: string | null) => {
    if (!configPath) {
      setStatus('Select an app config to discover.', 'error');
      return;
    }
    isDiscovering.value = true;
    connectionValid.value = null;
    connectionError.value = null;
    setStatus('Discovering screenshots...');
    try {
      const res = (await screenshotFactorySDK.discoverScreenshots({ configPath })) as any;
      discoveredScreenshots.value = res.screenshots;
      connectionValid.value = res.connectionValid;
      connectionError.value = res.connectionError;

      if (res.connectionValid) {
        setStatus(
          `Found ${res.screenshots.length} screenshots. API Connection verified.`,
          'success',
        );
      } else {
        setStatus(`Found ${res.screenshots.length} screenshots. API Connection failed!`, 'warning');
      }
    } catch (err) {
      setStatus(`Discovery failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      isDiscovering.value = false;
    }
  };

  const startUpload = async (configPath: string | null) => {
    if (!configPath) {
      setStatus('Select an app config to upload.', 'error');
      return;
    }

    clearLogs();
    setStatus('Starting upload...');
    await uploadRunner.start(() =>
      screenshotFactorySDK.startUpload({
        configPath,
        dryRun: dryRun.value,
        uploadOrder: uploadOrder.value,
      }),
    );
  };

  const prepareUpload = async (configPath: string | null) => {
    if (!configPath) {
      setStatus('Select an app config to prepare.', 'error');
      return;
    }

    clearLogs();
    setStatus('Preparing upload directory...');
    await uploadRunner.start(() =>
      screenshotFactorySDK.prepareUpload({
        configPath,
        uploadOrder: uploadOrder.value,
      }),
    );
  };

  const initOrder = (order: string[]) => {
    uploadOrder.value = [...order];
  };

  const updateOrder = (order: string[]) => {
    uploadOrder.value = [...order];
    setStatus('Upload order updated for session.');
  };

  return {
    signals: {
      isRunning,
      logs,
      statusMessage,
      statusTone,
      dryRun,
      uploadOrder,
      discoveredScreenshots,
      isDiscovering,
      connectionValid,
      connectionError,
    },
    actions: {
      startUpload,
      stopUpload: uploadRunner.stop,
      initOrder,
      updateOrder,
      discover,
      prepareUpload,
      clearLogs,
      setStatus,
      reset: () => {
        uploadRunner.reset();
        discoveredScreenshots.value = [];
        connectionValid.value = null;
        connectionError.value = null;
      },
    },
  };
}
