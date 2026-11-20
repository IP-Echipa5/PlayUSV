import type { RequestHandler } from 'express';
import { config } from '../config';

/**
 * CORS pt frontend (alt port in dev, alt domeniu in productie).
 * Doar originile din CORS_ORIGINS primesc headerele, restul sunt blocate de browser.
 * Preflight-ul (OPTIONS) nu are token, deci trebuie raspuns inainte de authenticate.
 */
export const cors: RequestHandler = (req, res, next) => {
  const origin = req.headers.origin;
  res.vary('Origin');
  if (origin && config.corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
};
