import { Request, Response } from 'express';
import { TemplatesService } from '../services/TemplatesService';

export class TemplatesController {
  private templatesService = new TemplatesService();

  async getTemplates(req: Request, res: Response) {
    try {
      const templates = await this.templatesService.getAllTemplates();
      const catalog = await this.templatesService.getTemplateCatalog();
      res.json({ templates, catalog });
    } catch (error) {
      console.error('Error loading templates:', error);
      res.status(500).json({ error: 'Failed to load templates' });
    }
  }

  async getTemplate(req: Request, res: Response) {
    try {
      const name = this.templatesService.sanitizeTemplateName(req.params.name);
      if (!name) {
        return res.status(400).json({ error: 'Invalid template name' });
      }

      const template = await this.templatesService.getTemplate(name);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json(template);
    } catch (error) {
      console.error('Error reading template:', error);
      res.status(500).json({ error: 'Failed to read template' });
    }
  }

  async updateTemplate(req: Request, res: Response) {
    try {
      const name = this.templatesService.sanitizeTemplateName(req.params.name);
      if (!name) {
        return res.status(400).json({ error: 'Invalid template name' });
      }

      const { content } = req.body;
      if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Invalid template content' });
      }

      const success = await this.templatesService.updateTemplate(name, content);
      if (!success) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json({ success: true, name });
    } catch (error) {
      console.error('Error updating template:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  }

  async createTemplate(req: Request, res: Response) {
    try {
      const { name: rawName, content } = req.body;
      const name = this.templatesService.sanitizeTemplateName(rawName);

      if (!name) {
        return res.status(400).json({ error: 'Invalid template name' });
      }

      if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Invalid template content' });
      }

      const result = await this.templatesService.createTemplate(name, content);
      if (!result.success) {
        return res.status(409).json({ error: result.error });
      }

      res.json({ success: true, name });
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  }
}
