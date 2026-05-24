import path from 'path';
import fs from 'fs-extra';
import { renderFinalImages } from '../templates/render';
import { CaptureJob, DeviceType } from '../contract/types';

interface RenderOptions {
  configPath: string;
  deviceType: DeviceType;
}

const MAX_RENDER_LOG_LINES = 2000;

export class RenderService {
  private appsDir = path.resolve(process.cwd(), 'apps');
  private renderJobs = new Map<string, CaptureJob>();
  private abortControllers = new Map<string, AbortController>();

  async startRender(options: RenderOptions): Promise<string> {
    const { configPath, deviceType } = options;

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
    this.renderJobs.set(jobId, job);

    const controller = new AbortController();
    this.abortControllers.set(jobId, controller);

    const relativeConfigPath = path.relative(process.cwd(), resolvedPath);

    (async () => {
      try {
        await renderFinalImages(
          {
            configPath: relativeConfigPath,
            deviceType,
            signal: controller.signal,
          },
          (message, type) => {
            const prefix = type ? `[${type}] ` : '';
            this.pushRenderLog(job, `${prefix}${message}`);
          },
        );
        job.status = 'success';
        job.exitCode = 0;
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);

        if (
          msg === 'Render aborted by user' ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          this.pushRenderLog(job, '[info] Render terminated by user.');
          job.status = 'error';
        } else {
          console.error('Render failed:', error);
          this.pushRenderLog(job, `[error] ${msg}`);
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

  getRenderJob(id: string): CaptureJob | undefined {
    return this.renderJobs.get(id);
  }

  stopRender(id: string): boolean {
    const job = this.renderJobs.get(id);
    if (!job) return false;

    const controller = this.abortControllers.get(id);
    if (controller) {
      controller.abort();
    }

    return true;
  }

  private createJobId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private pushRenderLog(job: CaptureJob, message: string): void {
    if (!message) return;
    job.logs.push(message);
    if (job.logs.length > MAX_RENDER_LOG_LINES) {
      job.logs.splice(0, job.logs.length - MAX_RENDER_LOG_LINES);
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
