import { Request, Response } from 'express';
import { PlayStoreUploaderService } from '../services/PlayStoreUploaderService';
import { ConfigService } from '../services/ConfigService';
import path from 'path';

export class UploadController {
  private uploadService = new PlayStoreUploaderService();
  private configService = new ConfigService();

  async discoverScreenshots(req: Request, res: Response) {
    try {
      const { configPath } = req.body;
      if (!configPath || typeof configPath !== 'string') {
        return res.status(400).json({ error: 'Invalid config path' });
      }

      const resolvedPath = path.resolve(process.cwd(), configPath);
      const result = await this.configService.readConfig(resolvedPath);

      if (!result || !result.config) {
        return res.status(404).json({ error: 'App configuration not found' });
      }

      const info = await this.uploadService.getDiscoveryInfo(result.config);
      res.json(info);
    } catch (error) {
      console.error('Error discovering screenshots:', error);
      res.status(500).json({ error: 'Failed to discover screenshots' });
    }
  }

  async startUpload(req: Request, res: Response) {
    try {
      const { configPath, dryRun, uploadOrder } = req.body;

      if (!configPath || typeof configPath !== 'string') {
        return res.status(400).json({ error: 'Invalid config path' });
      }

      const resolvedPath = path.resolve(process.cwd(), configPath);
      const result = await this.configService.readConfig(resolvedPath);

      if (!result || !result.config) {
        return res.status(404).json({ error: 'App configuration not found' });
      }

      const config = { ...result.config };
      if (Array.isArray(uploadOrder)) {
        config.uploadOrder = uploadOrder;
      }

      const jobId = await this.uploadService.startUpload(config, dryRun === true);

      res.json({ id: jobId });
    } catch (error) {
      console.error('Error starting upload:', error);
      res.status(500).json({ error: 'Failed to start upload' });
    }
  }

  async prepareUpload(req: Request, res: Response) {
    try {
      const { configPath, uploadOrder } = req.body;

      if (!configPath || typeof configPath !== 'string') {
        return res.status(400).json({ error: 'Invalid config path' });
      }

      const resolvedPath = path.resolve(process.cwd(), configPath);
      const result = await this.configService.readConfig(resolvedPath);

      if (!result || !result.config) {
        return res.status(404).json({ error: 'App configuration not found' });
      }

      const config = { ...result.config };
      if (Array.isArray(uploadOrder)) {
        config.uploadOrder = uploadOrder;
      }

      const jobId = await this.uploadService.prepareUploadDir(config);

      res.json({ id: jobId });
    } catch (error) {
      console.error('Error preparing upload:', error);
      res.status(500).json({ error: 'Failed to prepare upload' });
    }
  }

  async getUploadRun(req: Request, res: Response) {
    try {
      const job = this.uploadService.getUploadJob(req.params.id as string);
      if (!job) {
        return res.status(404).json({ error: 'Upload job not found' });
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
      console.error('Error loading upload job:', error);
      res.status(500).json({ error: 'Failed to load upload job' });
    }
  }
}
