import { Request, Response, NextFunction } from 'express';

const ALLOWED_ORIGIN_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function isAllowedOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    return (url.protocol === 'http:' || url.protocol === 'https:') && ALLOWED_ORIGIN_HOSTS.has(url.hostname);
  } catch {
    return false;
  }
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.header('Origin');

  if (origin) {
    if (!isAllowedOrigin(origin)) {
      res.status(403).json({ error: 'Origin not allowed' });
      return;
    }
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
}
