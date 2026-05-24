import express from 'express';
import ViteExpress from 'vite-express';
import chalk from 'chalk';
import { apiRouter } from './routes';
import { setupStaticFiles } from './middleware/staticFiles';
import { corsMiddleware } from './middleware/cors';

const app = express();
const PORT = 8000;

app.use(express.json({ limit: '10mb' }));
app.use(corsMiddleware);
setupStaticFiles(app);

// API routes
app.use('/api', apiRouter);

ViteExpress.listen(app, PORT, () => {
  console.log(`Server is listening on port ${PORT}...`);
});

console.log(chalk.green.bold('\n✨ Screenshot Factory'));
console.log(chalk.cyan(`📡 Server running at: http://localhost:${PORT}`));
console.log(chalk.gray(`\n   Press Ctrl+C to stop\n`));
