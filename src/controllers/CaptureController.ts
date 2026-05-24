import { Request, Response } from 'express';
import { CaptureService } from '../services/CaptureService';
import { EmulatorService } from '../services/EmulatorService';

export class CaptureController {
  private captureService = new CaptureService();
  private emulatorService = new EmulatorService();

  async startCapture(req: Request, res: Response) {
    try {
      const { configPath, deviceType, serial } = req.body;

      if (!configPath || typeof configPath !== 'string') {
        return res.status(400).json({ error: 'Invalid config path' });
      }

      if (
        !deviceType ||
        typeof deviceType !== 'string' ||
        (deviceType !== 'phone' && deviceType !== 'tablet')
      ) {
        return res.status(400).json({ error: 'Invalid device type' });
      }

      const jobId = await this.captureService.startCapture({
        configPath,
        deviceType,
        serial,
      });

      res.json({ id: jobId });
    } catch (error) {
      console.error('Error starting capture:', error);
      res.status(500).json({ error: 'Failed to start capture' });
    }
  }

  async getCaptureRun(req: Request, res: Response) {
    try {
      const job = this.captureService.getCaptureJob(req.params.id as string);
      if (!job) {
        return res.status(404).json({ error: 'Capture job not found' });
      }

      const from = Number.parseInt(String(req.query.from || '0'), 10);
      const start = Number.isNaN(from) || from < 0 ? 0 : from;
      const logs = job.logs.slice(start);

      res.json({
        id: job.id,
        status: job.status,
        exitCode: job.exitCode,
        startedAt: job.startedAt,
        finishedAt: job.finishedAt,
        logs,
        nextOffset: job.logs.length,
      });
    } catch (error) {
      console.error('Error loading capture job:', error);
      res.status(500).json({ error: 'Failed to load capture job' });
    }
  }

  async stopCapture(req: Request, res: Response) {
    try {
      const success = this.captureService.stopCapture(req.params.id as string);
      if (!success) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error stopping capture:', error);
      res.status(500).json({ error: 'Failed to stop capture' });
    }
  }

  async listEmulators(req: Request, res: Response) {
    try {
      const emulators = await this.emulatorService.listEmulators();
      res.json(emulators);
    } catch (error) {
      console.error('Error listing emulators:', error);
      res.status(500).json({ error: 'Failed to list emulators' });
    }
  }

  async bootEmulator(req: Request, res: Response) {
    try {
      const { id, type } = req.body;
      if (!id || !type) {
        return res.status(400).json({ error: 'Missing id or type' });
      }
      await this.emulatorService.bootEmulator(id, type);
      res.json({ success: true });
    } catch (error) {
      console.error('Error booting emulator:', error);
      res.status(500).json({ error: 'Failed to boot emulator' });
    }
  }
}
