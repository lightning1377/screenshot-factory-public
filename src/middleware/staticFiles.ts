import express from 'express';
import path from 'path';

export function setupStaticFiles(app: express.Application) {
  app.use('/templates', express.static(path.join(process.cwd(), 'templates')));
  app.use('/screenshots', express.static(path.join(process.cwd(), 'screenshots')));
}
