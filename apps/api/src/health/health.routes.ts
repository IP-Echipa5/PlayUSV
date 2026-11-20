import { Router } from 'express';
import { AppError } from '../lib/errors';
import { prisma } from '../lib/prisma';

/** Public check that the server is up and reaches the database (frontend, deploy, demo la lab). */
export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    throw new AppError(503, 'DB_UNAVAILABLE', 'Baza de date nu răspunde.');
  }
  res.json({ status: 'ok', db: 'ok', dbMs: Date.now() - started, time: new Date().toISOString() });
});
