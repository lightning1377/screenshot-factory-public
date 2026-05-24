import { Router } from 'express';
import { TemplatesController } from '../controllers/TemplatesController';

const router = Router();
const templatesController = new TemplatesController();

router.get('/', templatesController.getTemplates.bind(templatesController));
router.get('/:name', templatesController.getTemplate.bind(templatesController));
router.put('/:name', templatesController.updateTemplate.bind(templatesController));
router.post('/', templatesController.createTemplate.bind(templatesController));

export { router as templatesRouter };
