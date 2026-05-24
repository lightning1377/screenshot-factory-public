import { buildTemplateUrl } from '../utils';

export function buildSinglePreviewUrl({
  templateFile,
  title,
  screenshot,
  screenshots,
  cacheBust = false,
}: {
  templateFile: string;
  title: string;
  screenshot: string;
  screenshots: Record<string, string>;
  cacheBust?: boolean;
}): string {
  return buildTemplateUrl({
    template: templateFile,
    title,
    screenshot,
    screenshots,
    cacheBust,
  });
}

export function buildScenePreviewUrl({
  templateFile,
  title,
  screenshot,
  screenshots,
  cacheBust = false,
  theme,
}: {
  templateFile: string;
  title: string;
  screenshot: string;
  screenshots: Record<string, string>;
  cacheBust?: boolean;
  theme?: string;
}): string {
  return buildTemplateUrl({
    template: templateFile,
    title,
    screenshot,
    screenshots,
    cacheBust,
    theme,
    darkMode: theme === 'dark',
  });
}
