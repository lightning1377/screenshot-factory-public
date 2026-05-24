import { Request, Response } from 'express';
import { AppsService } from '../services/AppsService';

export class AppsController {
  private appsService = new AppsService();

  async getApps(req: Request, res: Response) {
    try {
      const result = await this.appsService.getAllApps();
      res.json(result);
    } catch (error) {
      console.error('Error loading apps:', error);
      res.status(500).json({ error: 'Failed to load apps' });
    }
  }

  async getApp(req: Request, res: Response) {
    try {
      const config = await this.appsService.getAppById(req.params.id as string);
      if (!config) {
        return res.status(404).json({ error: 'App not found' });
      }
      res.json(config);
    } catch (error) {
      console.error('Error loading app:', error);
      res.status(500).json({ error: 'Failed to load app' });
    }
  }

  async updateApp(req: Request, res: Response) {
    try {
      const { sceneConfigs, name, scenes } = req.body;

      if (sceneConfigs && !Array.isArray(sceneConfigs)) {
        return res.status(400).json({ error: 'Invalid sceneConfigs payload' });
      }

      const updatedConfig = await this.appsService.updateApp(req.params.id as string, {
        sceneConfigs,
        name,
        scenes,
      });

      if (!updatedConfig) {
        return res.status(404).json({ error: 'App not found' });
      }

      res.json(updatedConfig);
    } catch (error) {
      console.error('Error updating app config:', error);
      res.status(500).json({ error: 'Failed to update app' });
    }
  }
}
