import { Request, Response } from 'express';
import { RenderService } from '../services/RenderService';

export class RenderController {
  private renderService = new RenderService();

  async startRender(req: Request, res: Response) {
    try {
      const { configPath, deviceType } = req.body;

      if (!configPath || typeof configPath !== 'string') {
        return res.status(400).json({ error: 'Invalid config path' });
      }

      const jobId = await this.renderService.startRender({
        configPath,
        deviceType,
      });

      res.json({ id: jobId });
    } catch (error) {
      console.error('Error starting render:', error);
      res.status(500).json({ error: 'Failed to start render' });
    }
  }

  async getRenderRun(req: Request, res: Response) {
    try {
      const job = this.renderService.getRenderJob(req.params.id as string);
      if (!job) {
        return res.status(404).json({ error: 'Render job not found' });
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
      console.error('Error loading render job:', error);
      res.status(500).json({ error: 'Failed to load render job' });
    }
  }

  async stopRender(req: Request, res: Response) {
    try {
      const success = this.renderService.stopRender(req.params.id as string);
      if (!success) {
        return res.status(404).json({ error: 'Render job not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error stopping render:', error);
      res.status(500).json({ error: 'Failed to stop render' });
    }
  }
}
