import { Router } from 'express';
import { RenderController } from '../controllers/RenderController';

const router = Router();
const renderController = new RenderController();

router.post('/run', renderController.startRender.bind(renderController));
router.get('/runs/:id', renderController.getRenderRun.bind(renderController));
router.delete('/runs/:id', renderController.stopRender.bind(renderController));

export { router as renderRouter };
