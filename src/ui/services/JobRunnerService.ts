export type JobRunStatus = 'running' | 'success' | 'error';

export interface JobRunSnapshot {
  status: JobRunStatus;
  logs: string[];
  nextOffset: number;
}

interface JobRunnerOptions {
  poll: (id: string, from: number) => Promise<JobRunSnapshot>;
  stop: (id: string) => Promise<unknown>;
  pollIntervalMs?: number;
  onRunning?: () => void;
  onLogs?: (lines: string[]) => void;
  onSuccess?: () => void;
  onFailure?: () => void;
  onPollError?: (error: unknown) => void;
  onStartError?: (error: unknown) => void;
  onStateChange?: (running: boolean) => void;
}

interface StartResponse {
  id: string;
}

export class JobRunnerService {
  private runId: string | null = null;
  private logOffset = 0;
  private running = false;
  private pollInFlight = false;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private readonly pollIntervalMs: number;

  constructor(private readonly options: JobRunnerOptions) {
    this.pollIntervalMs = options.pollIntervalMs ?? 1000;
  }

  isRunning(): boolean {
    return this.running;
  }

  async start(startRun: () => Promise<StartResponse>): Promise<void> {
    if (this.running) return;

    this.logOffset = 0;

    try {
      const data = await startRun();
      this.runId = data.id;
      this.running = true;
      this.options.onStateChange?.(true);

      this.pollTimer = setInterval(() => {
        void this.pollOnce();
      }, this.pollIntervalMs);

      await this.pollOnce();
    } catch (error) {
      this.running = false;
      this.options.onStateChange?.(false);
      this.options.onStartError?.(error);
    }
  }

  async cancel(): Promise<void> {
    if (!this.runId || !this.running) return;

    await this.options.stop(this.runId);
    this.clearPolling();
  }

  async stop(): Promise<void> {
    return this.cancel();
  }

  reset(): void {
    this.clearPolling();
    this.logOffset = 0;
  }

  private async pollOnce(): Promise<void> {
    if (!this.runId || this.pollInFlight) return;

    this.pollInFlight = true;
    try {
      const data = await this.options.poll(this.runId, this.logOffset);
      this.options.onLogs?.(data.logs);
      this.logOffset = data.nextOffset || this.logOffset;

      if (data.status === 'running') {
        this.options.onRunning?.();
        return;
      }

      this.clearPolling();

      if (data.status === 'success') {
        this.options.onSuccess?.();
      } else {
        this.options.onFailure?.();
      }
    } catch (error) {
      this.clearPolling();
      this.options.onPollError?.(error);
    } finally {
      this.pollInFlight = false;
    }
  }

  private clearPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.running = false;
    this.runId = null;
    this.options.onStateChange?.(false);
  }
}
