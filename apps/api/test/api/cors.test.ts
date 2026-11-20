import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../../src/app';

const FRONT = 'http://localhost:5173';

describe('CORS', () => {
  it('raspunde la preflight fara token pt originea permisa', async () => {
    const res = await request(app)
      .options('/api/bookings')
      .set('Origin', FRONT)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');
    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(FRONT);
    expect(res.headers['access-control-allow-headers']).toMatch(/Authorization/);
  });

  it('pune headerul si pe cererile normale, chiar daca pica pe 401', async () => {
    const res = await request(app).get('/api/users/me').set('Origin', FRONT);
    expect(res.status).toBe(401);
    expect(res.headers['access-control-allow-origin']).toBe(FRONT);
  });

  it('nu da headerul unei origini necunoscute', async () => {
    const res = await request(app)
      .options('/api/bookings')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    expect(res.headers.vary).toMatch(/Origin/);
  });
});

describe('headere de securitate', () => {
  it('sunt pe orice raspuns si x-powered-by lipseste', async () => {
    const res = await request(app).get('/api/nu-exista');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
