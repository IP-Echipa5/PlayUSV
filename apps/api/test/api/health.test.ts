import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { app } from '../../src/app';
import { prisma } from '../helpers';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /health', () => {
  it('answers without a token when the database is up', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', db: 'ok' });
    expect(typeof res.body.dbMs).toBe('number');
    expect(Date.parse(res.body.time)).not.toBeNaN();
  });

  it('returns 503 DB_UNAVAILABLE when the database is down', async () => {
    vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('connection refused'));
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ code: 'DB_UNAVAILABLE', message: 'Baza de date nu răspunde.' });
  });
});
