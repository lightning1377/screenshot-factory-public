import { Router } from 'express';
import { ConfigController } from '../controllers/ConfigController';

const router = Router();
const configController = new ConfigController();

router.post('/read', configController.readConfig.bind(configController));
router.post('/save', configController.saveConfig.bind(configController));
router.post('/create', configController.createConfig.bind(configController));

export { router as configRouter };
