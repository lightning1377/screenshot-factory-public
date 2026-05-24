import { AppState } from '../types';

export class TemplateStateService {
  constructor(private state: AppState) {}

  setTemplateDirty(isDirty: boolean): void {
    this.state.templateDirty = isDirty;
  }

  isTemplateDirty(): boolean {
    return this.state.templateDirty;
  }

  setCurrentTemplate(name: string, content: string): void {
    this.state.currentTemplateName = name;
    this.state.templateOriginal = content;
    this.setTemplateDirty(false);
  }

  getCurrentTemplateName(): string | null {
    return this.state.currentTemplateName;
  }

  getOriginalContent(): string {
    return this.state.templateOriginal;
  }

  setTemplates(templates: string[]): void {
    this.state.templates = templates;
  }

  getTemplates(): string[] {
    return this.state.templates;
  }

  findTemplateByType(type: 'phone' | 'tablet'): string | null {
    if (!this.state.templates || this.state.templates.length === 0) return null;

    const target = type.toLowerCase();
    const match = this.state.templates.find(
      (template) => this.getTemplateType(template) === target,
    );

    return match || null;
  }

  getTemplateType(templateName: string): 'phone' | 'tablet' {
    const name = (templateName || '').toLowerCase();
    return name.includes('tablet') ? 'tablet' : 'phone';
  }

  getTemplateDimensions(templateName: string): { width: string; height: string } {
    const isTablet = this.getTemplateType(templateName) === 'tablet';
    return isTablet ? { width: '2560px', height: '1600px' } : { width: '1080px', height: '1920px' };
  }
}
