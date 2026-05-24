import { Request, Response } from 'express';
import { ConfigService } from '../services/ConfigService';

export class ConfigController {
  private configService = new ConfigService();

  async readConfig(req: Request, res: Response) {
    try {
      const { path: configPath } = req.body;

      if (!configPath || typeof configPath !== 'string') {
        return res.status(400).json({ error: 'Invalid config path' });
      }

      const result = await this.configService.readConfig(configPath);
      if (!result) {
        return res.status(404).json({ error: 'Config file not found or invalid' });
      }

      res.json(result);
    } catch (error) {
      console.error('Error reading config:', error);
      res.status(500).json({ error: 'Failed to read config' });
    }
  }

  async createConfig(req: Request, res: Response) {
    try {
      const { name, appId } = req.body;
      if (!name || !appId) {
        return res.status(400).json({ error: 'Name and App ID are required' });
      }

      const result = await this.configService.createConfig(name, appId);
      res.json(result);
    } catch (error) {
      console.error('Error creating config:', error);
      res.status(500).json({ error: 'Failed to create config' });
    }
  }
  async saveConfig(req: Request, res: Response) {
    try {
      const { path: configPath, config } = req.body;
      if (!configPath || !config) {
        return res.status(400).json({ error: 'Config path and config data are required' });
      }

      const success = await this.configService.saveConfig(configPath, config);
      if (!success) {
        return res.status(500).json({ error: 'Failed to save config file' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error saving config:', error);
      res.status(500).json({ error: 'Failed to save config' });
    }
  }
}
