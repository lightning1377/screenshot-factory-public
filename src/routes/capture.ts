import { Router } from 'express';
import { CaptureController } from '../controllers/CaptureController';

const router = Router();
const captureController = new CaptureController();

router.post('/run', captureController.startCapture.bind(captureController));
router.get('/runs/:id', captureController.getCaptureRun.bind(captureController));
router.delete('/runs/:id', captureController.stopCapture.bind(captureController));

router.get('/emulators', captureController.listEmulators.bind(captureController));
router.post('/emulators/boot', captureController.bootEmulator.bind(captureController));

export { router as captureRouter };
