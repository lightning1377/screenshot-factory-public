import path from 'path';
import fs from 'fs-extra';

const TEMPLATE_NAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.html$/;

export interface TemplateSlot {
  id: string;
  label?: string;
  required?: boolean;
}

export interface TemplateCatalogEntry {
  name: string;
  files: {
    phone: string;
    tablet: string;
  };
  slots: TemplateSlot[];
}

export class TemplatesService {
  private templatesDir = path.join(process.cwd(), 'templates');

  sanitizeTemplateName(rawName?: string | string[]): string | null {
    if (!rawName) return null;
    let name = Array.isArray(rawName) ? rawName.join('') : rawName;
    name = name.trim();
    if (!name) return null;
    if (!name.endsWith('.html')) {
      name += '.html';
    }
    if (name.length > 120) return null;
    if (name.includes('/') || name.includes('\\') || name.includes('..')) return null;
    if (!TEMPLATE_NAME_REGEX.test(name)) return null;
    return name;
  }

  async getAllTemplates(): Promise<string[]> {
    if (!(await fs.pathExists(this.templatesDir))) {
      return [];
    }

    const files = await fs.readdir(this.templatesDir);
    return files.filter((file) => file.endsWith('.html')).sort();
  }

  async getTemplateCatalog(): Promise<TemplateCatalogEntry[]> {
    if (!(await fs.pathExists(this.templatesDir))) {
      return [];
    }

    const files = await fs.readdir(this.templatesDir);
    const metaFiles = files.filter((file) => file.endsWith('.meta.json')).sort();
    const catalog: TemplateCatalogEntry[] = [];

    for (const file of metaFiles) {
      const metaPath = path.join(this.templatesDir, file);
      try {
        const raw = await fs.readJson(metaPath);
        const name = typeof raw?.name === 'string' ? raw.name.trim() : '';
        const phone = typeof raw?.files?.phone === 'string' ? raw.files.phone.trim() : '';
        const tablet = typeof raw?.files?.tablet === 'string' ? raw.files.tablet.trim() : '';
        if (!name || !phone || !tablet) {
          continue;
        }

        const rawSlots = Array.isArray(raw?.slots) ? raw.slots : [];
        const slots = rawSlots
          .map((slot: any) => {
            const id = typeof slot?.id === 'string' ? slot.id.trim() : '';
            if (!id) return null;
            const label = typeof slot?.label === 'string' ? slot.label.trim() : undefined;
            const required = typeof slot?.required === 'boolean' ? slot.required : undefined;
            return { id, label, required };
          })
          .filter(Boolean) as TemplateSlot[];

        catalog.push({
          name,
          files: {
            phone,
            tablet,
          },
          slots,
        });
      } catch (error) {
        console.warn(`Skipping invalid template metadata file: ${file}`, error);
      }
    }

    return catalog.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getTemplate(name: string): Promise<{ name: string; content: string } | null> {
    const templatePath = path.join(this.templatesDir, name);
    if (!(await fs.pathExists(templatePath))) {
      return null;
    }

    const content = await fs.readFile(templatePath, 'utf8');
    return { name, content };
  }

  async updateTemplate(name: string, content: string): Promise<boolean> {
    const templatePath = path.join(this.templatesDir, name);
    if (!(await fs.pathExists(templatePath))) {
      return false;
    }

    await fs.writeFile(templatePath, content, 'utf8');
    return true;
  }

  async createTemplate(
    name: string,
    content: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!(await fs.pathExists(this.templatesDir))) {
      await fs.ensureDir(this.templatesDir);
    }

    const templatePath = path.join(this.templatesDir, name);
    if (await fs.pathExists(templatePath)) {
      return { success: false, error: 'Template already exists' };
    }

    await fs.writeFile(templatePath, content, 'utf8');
    return { success: true };
  }
}
