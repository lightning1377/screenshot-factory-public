import { Router } from 'express';
import { UploadController } from '../controllers/UploadController';

const router = Router();
const uploadController = new UploadController();

router.post('/discover', (req, res) => uploadController.discoverScreenshots(req, res));
router.post('/prepare', (req, res) => uploadController.prepareUpload(req, res));
router.post('/run', (req, res) => uploadController.startUpload(req, res));
router.get('/runs/:id', (req, res) => uploadController.getUploadRun(req, res));

export { router as uploadRouter };
