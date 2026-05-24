import { Router } from 'express';
import { AppsController } from '../controllers/AppsController';

const router = Router();
const appsController = new AppsController();

router.get('/', appsController.getApps.bind(appsController));
router.get('/:id', appsController.getApp.bind(appsController));
router.put('/:id', appsController.updateApp.bind(appsController));

export { router as appsRouter };
