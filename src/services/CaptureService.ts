import path from 'path';
import fs from 'fs-extra';
import { runScreenshots } from '../runner/run';
import { CaptureJob, DeviceType } from '../contract/types';

interface CaptureOptions {
  configPath: string;
  deviceType: DeviceType;
  serial?: string;
  force?: boolean;
}

const MAX_CAPTURE_LOG_LINES = 2000;

export class CaptureService {
  private appsDir = path.resolve(process.cwd(), 'apps');
  private captureJobs = new Map<string, CaptureJob>();
  private abortControllers = new Map<string, AbortController>();

  async startCapture(options: CaptureOptions): Promise<string> {
    const { configPath, deviceType, serial, force } = options;

    const resolvedPath = this.resolveConfigPath(configPath);
    if (!resolvedPath) {
      throw new Error('Config path must be inside apps/ and end with .json');
    }

    if (!(await fs.pathExists(resolvedPath))) {
      throw new Error('Config file not found');
    }

    const jobId = this.createJobId();
    const job: CaptureJob = {
      id: jobId,
      status: 'running',
      logs: [],
      startedAt: new Date().toISOString(),
    };
    this.captureJobs.set(jobId, job);

    const controller = new AbortController();
    this.abortControllers.set(jobId, controller);

    const relativeConfigPath = path.relative(process.cwd(), resolvedPath);

    // Run in background
    (async () => {
      try {
        await runScreenshots(
          {
            configPath: relativeConfigPath,
            deviceType,
            serial,
            force,
            signal: controller.signal,
          },
          (message, type) => {
            const prefix = type ? `[${type}] ` : '';
            this.pushCaptureLog(job, `${prefix}${message}`);
          },
        );
        job.status = 'success';
        job.exitCode = 0;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);

        if (
          msg === 'Capture aborted by user' ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          this.pushCaptureLog(job, '[info] Process terminated by user.');
          job.status = 'error'; // or 'aborted' if we had that status
        } else {
          console.error('Capture failed:', error);
          this.pushCaptureLog(job, `[error] ${msg}`);
          job.status = 'error';
        }
        job.exitCode = 1;
      } finally {
        job.finishedAt = new Date().toISOString();
        this.abortControllers.delete(jobId);
      }
    })();

    return jobId;
  }

  getCaptureJob(id: string): CaptureJob | undefined {
    return this.captureJobs.get(id);
  }

  stopCapture(id: string): boolean {
    const job = this.captureJobs.get(id);
    if (!job) return false;

    // Trigger abort
    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
      // The finally block in startCapture will clean up the map entry
    }

    // We don't manually set status here anymore, let the async task handle the abort exception
    // But if the task is somehow stuck synchronously (unlikely with await), we might want to flag it?
    // The previous implementation set status immediately.
    // Let's rely on the exception handling to update status/logs to avoid race conditions.

    return true;
  }

  private createJobId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private pushCaptureLog(job: CaptureJob, message: string): void {
    if (!message) return;
    job.logs.push(message);
    if (job.logs.length > MAX_CAPTURE_LOG_LINES) {
      job.logs.splice(0, job.logs.length - MAX_CAPTURE_LOG_LINES);
    }
  }

  private resolveConfigPath(configPath: string): string | null {
    const resolved = path.resolve(process.cwd(), configPath);
    if (!resolved.endsWith('.json')) return null;
    const relativeToApps = path.relative(this.appsDir, resolved);
    if (relativeToApps.startsWith('..') || path.isAbsolute(relativeToApps)) return null;
    return resolved;
  }
}
