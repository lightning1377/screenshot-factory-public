import { Signal } from '@preact/signals';
import { AppConfig } from '../types';
import { ScreenshotSorter } from './ScreenshotSorter';

interface UploadPageProps {
  appConfig: Signal<AppConfig | null>;
  isRunning: Signal<boolean>;
  logs: Signal<string>;
  statusMessage: Signal<string>;
  statusTone: Signal<'success' | 'error' | 'muted' | 'warning'>;
  dryRun: Signal<boolean>;
  uploadOrder: Signal<string[]>;
  discoveredScreenshots: Signal<any[]>;
  isDiscovering: Signal<boolean>;
  connectionValid: Signal<boolean | null>;
  connectionError: Signal<string | null>;
  onDiscover: () => void;
  onUpdateConfig: (patch: Partial<AppConfig>) => void;
  onUpdateUploadOrder: (order: string[]) => void;
  onStartUpload: () => void;
  onPrepareUpload: () => void;
  onClearLogs: () => void;
  onResetUpload: () => void;
}

export function UploadPage({
  appConfig,
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
  onDiscover,
  onUpdateConfig,
  onUpdateUploadOrder,
  onStartUpload,
  onPrepareUpload,
  onClearLogs,
  onResetUpload,
}: UploadPageProps) {
  const getToneColor = () => {
    switch (statusTone.value) {
      case 'success':
        return 'var(--success)';
      case 'error':
        return '#ef4444';
      case 'warning':
        return 'var(--warning)';
      default:
        return 'var(--text-muted)';
    }
  };

  if (!appConfig.value) {
    return (
      <div id="page-upload" class="page active">
        <header class="page-header">
          <h1>Play Store Upload</h1>
          <p class="subtitle">Select an app from Home to configure and upload screenshots.</p>
        </header>
        <div class="panel">
          <div class="status">Please select an app config first.</div>
        </div>
      </div>
    );
  }

  const config = appConfig.value;

  return (
    <div id="page-upload" class="page active">
      <header class="page-header">
        <h1>Play Store Upload</h1>
        <p class="subtitle">Upload framed screenshots to Google Play Store.</p>
      </header>

      <div class="control-grid">
        <div class="panel">
          <label>Google Play Configuration</label>
          <div class="control-grid" style="margin-top: 1rem">
            <div class="control-group">
              <label>Package Name</label>
              <input
                type="text"
                value={config.packageName}
                onInput={(e) => onUpdateConfig({ packageName: e.currentTarget.value })}
                placeholder="com.example.app"
              />
            </div>
          </div>

          <div class="control-group" style="margin-top: 1.5rem">
            <label>1. Discover & Verify Connection</label>
            <div style="margin-top: 0.5rem">
              <button
                class="secondary"
                disabled={isDiscovering.value || isRunning.value}
                onClick={onDiscover}
                style="width: 100%"
              >
                {isDiscovering.value ? 'Verifying...' : '🔍 Scan & Test API Connection'}
              </button>
            </div>
          </div>

          {connectionValid.value !== null && (
            <div
              class="panel"
              style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: connectionValid.value
                  ? 'rgba(74, 222, 128, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${connectionValid.value ? 'var(--success)' : '#ef4444'}`,
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold' }}
              >
                <span style={{ fontSize: '1.2rem' }}>{connectionValid.value ? '🟢' : '🔴'}</span>
                Google Play API: {connectionValid.value ? 'Connected' : 'Connection Failed'}
              </div>
              {connectionError.value && (
                <div style="margin-top: 0.5rem; font-size: 0.8rem; color: #ef4444; word-break: break-all">
                  {connectionError.value}
                </div>
              )}
            </div>
          )}

          {discoveredScreenshots.value.length > 0 && (
            <div class="control-group" style="margin-top: 1.5rem">
              <label>Discovered Screenshots ({discoveredScreenshots.value.length})</label>
              <div
                class="panel"
                style="max-height: 200px; overflow-y: auto; margin-top: 0.5rem; background: var(--bg); font-size: 0.8rem"
              >
                {discoveredScreenshots.value.map((s) => (
                  <div
                    key={s.fullPath}
                    style="padding: 0.25rem 0; border-bottom: 1px solid var(--border)"
                  >
                    {s.filename}{' '}
                    <span style="color: var(--text-muted)">
                      ({s.language} - {s.deviceType})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div class="control-group" style="margin-top: 1.5rem">
            <label>2. Prepare Upload Directory</label>
            <p class="subtitle" style="font-size: 0.8rem; margin: 0.5rem 0">
              Generates a new directory <code>screenshots/upload/[id]</code> with screenshots named
              according to the upload order (e.g., 01-home-light.png).
            </p>
            <div style="margin-top: 0.5rem">
              <button
                class="secondary"
                disabled={isRunning.value || discoveredScreenshots.value.length === 0}
                onClick={onPrepareUpload}
                style="width: 100%"
              >
                📂 Generate Ordered Screenshots
              </button>
            </div>
          </div>

          <div class="control-group" style="margin-top: 1.5rem">
            <label>3. Upload to Play Store</label>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem">
              <input
                type="checkbox"
                id="dry-run-checkbox"
                checked={dryRun.value}
                onChange={(e) => (dryRun.value = e.currentTarget.checked)}
                style="width: auto"
              />
              <label
                for="dry-run-checkbox"
                style="text-transform: none; letter-spacing: normal; cursor: pointer"
              >
                Enable Dry Run (Test Only)
              </label>
            </div>

            <div class="button-group" style="margin-top: 1rem">
              <button
                disabled={
                  isRunning.value ||
                  !config.packageName ||
                  !config.uploadKeyPath ||
                  discoveredScreenshots.value.length === 0 ||
                  connectionValid.value !== true
                }
                onClick={onStartUpload}
              >
                {dryRun.value ? '🧪 Start Dry Run' : '📤 Start Real Upload'}
              </button>
              {isRunning.value && (
                <button class="error" onClick={() => onResetUpload()}>
                  Reset
                </button>
              )}
            </div>
            <div style="margin-top: 0.5rem">
              <button class="secondary" onClick={onClearLogs} style="width: 100%">
                Clear Logs
              </button>
            </div>
          </div>
        </div>

        <ScreenshotSorter
          sceneConfigs={{ value: config.sceneConfigs || [] } as any}
          uploadOrder={uploadOrder}
          onUpdateOrder={onUpdateUploadOrder}
        />
      </div>

      <div class="panel panel-spaced" style="margin-top: 2rem">
        <div class="status" style={{ color: getToneColor() }}>
          {statusMessage.value}
        </div>
        <pre class="capture-logs" style="margin-top: 1rem">
          {logs.value || 'Waiting for activity...'}
        </pre>
      </div>
    </div>
  );
}
