import { Router } from 'express';
import { DevicesController } from '../controllers/DevicesController';

const router = Router();
const devicesController = new DevicesController();

router.get('/', devicesController.getDevices.bind(devicesController));

export { router as devicesRouter };
