import { Router } from 'express';
import { appsRouter } from './apps';
import { templatesRouter } from './templates';
import { captureRouter } from './capture';
import { renderRouter } from './render';
import { devicesRouter } from './devices';
import { configRouter } from './config';
import { uploadRouter } from './upload';

const router = Router();

router.use('/apps', appsRouter);
router.use('/templates', templatesRouter);
router.use('/capture', captureRouter);
router.use('/render', renderRouter);
router.use('/devices', devicesRouter);
router.use('/config', configRouter);
router.use('/upload', uploadRouter);

export { router as apiRouter };
