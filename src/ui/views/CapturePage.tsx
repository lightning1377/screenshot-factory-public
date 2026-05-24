// Capturerunner page

interface CapturePageProps {
  devices: string[];
  emulators: any[];
  selectedDeviceType: string;
  selectedSerial: string;
  selectedEmulator: string;
  isRunning: boolean;
  logs: string;
  statusMessage: string;
  statusTone: 'success' | 'error' | 'muted' | 'warning';
  activeConfigName: string | null;
  onDeviceTypeChange: (type: string) => void;
  onSerialChange: (serial: string) => void;
  onEmulatorChange: (val: string) => void;
  onBootEmulator: () => void;
  onRefreshEmulators: () => void;
  onRun: () => void;
  onStop: () => void;
}

export function CapturePage({
  devices,
  emulators,
  selectedDeviceType,
  selectedSerial,
  selectedEmulator,
  isRunning,
  logs,
  statusMessage,
  statusTone,
  activeConfigName,
  onDeviceTypeChange,
  onSerialChange,
  onEmulatorChange,
  onBootEmulator,
  onRefreshEmulators,
  onRun,
  onStop,
}: CapturePageProps) {
  const getToneColor = () => {
    switch (statusTone) {
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

  return (
    <div id="page-capture" class="page active">
      <header class="page-header">
        <h1>Capture Runner</h1>
        <p class="subtitle">Trigger screenshot capture runs directly from the UI.</p>
      </header>

      <div class="control-grid">
        <div class="panel">
          <div class="control-grid">
            <div class="control-group">
              <label>Device Type</label>
              <div class="select-wrapper">
                <select
                  value={selectedDeviceType}
                  onChange={(e) => onDeviceTypeChange(e.currentTarget.value)}
                >
                  <option value="phone">Phone</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
            </div>

            <div class="control-group">
              <label>Target Device (Serial)</label>
              <div class="select-wrapper">
                <select
                  value={selectedSerial}
                  onChange={(e) => onSerialChange(e.currentTarget.value)}
                >
                  <option value="">-- Auto-select --</option>
                  {devices.map((dev) => (
                    <option key={dev} value={dev}>
                      {dev}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div class="control-group" style="margin-top: 1.5rem">
            <label>Capture Actions</label>
            <div class="button-group">
              <button class="secondary" disabled={isRunning || !activeConfigName} onClick={onRun}>
                ▶ Run Capture
              </button>
              <button class="secondary" disabled={!isRunning} onClick={onStop}>
                ✕ Cancel Run
              </button>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="control-group">
            <label>Emulator Control</label>
            <div class="select-wrapper">
              <select
                value={selectedEmulator}
                onChange={(e) => onEmulatorChange(e.currentTarget.value)}
              >
                {emulators.length === 0 ? (
                  <option value="">-- No emulators found --</option>
                ) : (
                  emulators.map((emu) => (
                    <option key={emu.id} value={JSON.stringify({ id: emu.id, type: emu.type })}>
                      {emu.status === 'booted' ? '🟢' : '⚪'} [{emu.type}] {emu.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div class="button-group" style="margin-top: 1rem">
            <button
              class="secondary"
              onClick={onBootEmulator}
              disabled={!selectedEmulator || isRunning}
            >
              Boot Selected
            </button>
            <button class="secondary" onClick={onRefreshEmulators}>
              Refresh List
            </button>
          </div>
        </div>
      </div>

      <div class="panel panel-spaced" style="margin-top: 2rem">
        <div class="status" style={{ color: getToneColor() }}>
          {activeConfigName ? `Active Config: ${activeConfigName}` : 'No active config'} |{' '}
          {statusMessage}
        </div>
        <pre class="capture-logs" style="margin-top: 1rem">
          {logs || 'Waiting for logs...'}
        </pre>
      </div>
    </div>
  );
}
