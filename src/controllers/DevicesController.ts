import { Request, Response } from 'express';
import { listDevices } from '../runner/android';

export class DevicesController {
  async getDevices(req: Request, res: Response) {
    try {
      const devices = await listDevices();
      res.json({ devices });
    } catch (error) {
      console.error('Error listing devices:', error);
      res.status(500).json({ error: 'Failed to list devices' });
    }
  }
}
