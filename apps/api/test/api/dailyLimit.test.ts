import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../src/app';
import { dbDate } from '../../src/lib/time';
import { bearer, createFacility, createUser, inDays, prisma, resetDb } from '../helpers';

beforeEach(resetDb);

const limit = (token: string, facilityId: string, date: string) =>
  request(app)
    .get(`/api/facilities/${facilityId}/daily-limit?date=${date}`)
    .set('Authorization', token);

describe('GET /facilities/:id/daily-limit', () => {
  it('scade doar rezervarile active ale studentului din ziua ceruta', async () => {
    const pool = await createFacility({ studentDailyLimitMinutes: 90 });
    const unitId = pool.units[0].id;
    const student = await createUser('STUDENT');
    const other = await createUser('STUDENT');
    const date = inDays(1);
    const add = (userId: string, startTime: number, extra: object = {}) =>
      prisma.booking.create({
        data: { userId, unitId, date: dbDate(date), startTime, endTime: startTime + 30, ...extra },
      });
    await add(student.id, 1080);
    await add(student.id, 1140, { status: 'CANCELLED', cancelledBy: 'USER' }); // nu se numara
    await add(other.id, 1110); // al altcuiva
    await prisma.booking.create({
      data: { userId: student.id, unitId, date: dbDate(inDays(2)), startTime: 1080, endTime: 1140 },
    }); // alta zi

    const res = await limit(bearer(student), pool.id, date);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ date, limitMinutes: 90, usedMinutes: 30, remainingMinutes: 60 });
  });

  it('nu are limita pt profesori', async () => {
    const pool = await createFacility();
    const teacher = await createUser('TEACHER');
    const res = await limit(bearer(teacher), pool.id, inDays(1));
    expect(res.body).toMatchObject({ limitMinutes: null, remainingMinutes: null, usedMinutes: 0 });
  });

  it('valideaza data si baza', async () => {
    const student = await createUser('STUDENT');
    const pool = await createFacility();
    expect((await limit(bearer(student), pool.id, 'maine')).status).toBe(400);
    const missing = await limit(bearer(student), '00000000-0000-4000-8000-000000000000', inDays(1));
    expect(missing.status).toBe(404);
  });
});
