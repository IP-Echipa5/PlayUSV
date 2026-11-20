// Backend-ul simulat in browser pt modul demo. Aceleasi reguli si aceleasi mesaje ca
// apps/api (bookings.rules.ts, facilities.service.ts listSlots, maintenance.service.ts),
// datele stau in localStorage si se refac in fiecare zi relativ la azi.
import { addDays, nowLocal, SLOT, toEndMinutes, toHHMM, toInstant, toMinutes } from '../lib/time';
import { ApiError, type Api } from './client';
import type {
  Booking,
  BookingStatus,
  Facility,
  FacilityType,
  MaintenanceBlock,
  Role,
  Slot,
  User,
} from './types';

const KEY = 'csb.demo';
const MAX_DAYS_AHEAD = 14;
const STUDENT_EARLIEST_START = 18 * 60;

type DFacility = Omit<Facility, 'openTime' | 'closeTime'> & { openTime: number; closeTime: number };
type DBooking = {
  id: string;
  userId: string;
  unitId: string;
  date: string;
  start: number;
  end: number;
  status: 'ACTIVE' | 'CANCELLED';
  cancelledBy: Booking['cancelledBy'];
  createdAt: string;
};
type DBlock = Omit<MaintenanceBlock, 'createdBy'> & { createdById: string };
type State = {
  day: string;
  users: User[];
  facilities: DFacility[];
  bookings: DBooking[];
  blocks: DBlock[];
};

/** Conturile din selectorul de rol de pe login. */
export const DEMO_ACCOUNTS: { role: Role; email: string }[] = [
  { role: 'STUDENT', email: 'student1@student.usv.ro' },
  { role: 'TEACHER', email: 'mihai.ionescu@usm.ro' },
  { role: 'ADMIN', email: 'admin@usm.ro' },
];

let counter = 0;
const id = (p: string) => `${p}-${Date.now().toString(36)}-${(counter++).toString(36)}`;
const err = (status: number, code: string, message: string) => new ApiError(status, code, message);
const conflict = (code: string, message: string) => err(409, code, message);

// --- seed: aceleasi baze si oameni ca apps/api/prisma/seed.ts, plus cateva rezervari trecute ---

function seed(): State {
  const today = nowLocal().date;
  const f = (
    name: string,
    type: FacilityType,
    close: number,
    cap: number,
    limit: number,
    units: string[],
  ): DFacility => ({
    id: `f-${type.toLowerCase()}`,
    name,
    type,
    openTime: 8 * 60,
    closeTime: close,
    capacityPerSlot: cap,
    studentDailyLimitMinutes: limit,
    units: units.map((u, i) => ({ id: `u-${type.toLowerCase()}-${i + 1}`, name: u })),
  });
  const facilities = [
    f('Bazin de înot', 'POOL', 1320, 10, 60, ['Bazinul']),
    f('Sală de fitness', 'GYM', 1440, 50, 120, ['Sala']),
    f('Teren de fotbal', 'FOOTBALL', 1440, 1, 180, ['Terenul']),
    f('Teren de baschet', 'BASKETBALL', 1320, 1, 120, ['Terenul 1', 'Terenul 2']),
  ];
  const u = (uid: string, name: string, email: string, role: Role): User => ({
    id: uid,
    name,
    email,
    role,
    blocked: false,
  });
  const first = [
    'Ana',
    'Andrei',
    'Maria',
    'Ioan',
    'Ioana',
    'Vlad',
    'Elena',
    'Radu',
    'Diana',
    'Paul',
    'Irina',
    'Matei',
  ];
  const students = first.map((n, i) =>
    u(`s${i + 1}`, `${n} Popescu`, `student${i + 1}@student.usv.ro`, 'STUDENT'),
  );
  const users = [
    u('admin', 'Administrator Baze Sportive', 'admin@usm.ro', 'ADMIN'),
    u('t1', 'Prof. Mihai Ionescu', 'mihai.ionescu@usm.ro', 'TEACHER'),
    u('t2', 'Conf. Elena Rusu', 'elena.rusu@usm.ro', 'TEACHER'),
    ...students,
  ];
  users.find((x) => x.id === 's12')!.blocked = true;

  const d = (n: number) => addDays(today, n);
  const created = new Date().toISOString();
  const b = (
    userId: string,
    unitId: string,
    date: string,
    start: string,
    end: string,
    extra: Partial<DBooking> = {},
  ): DBooking => ({
    id: id('b'),
    userId,
    unitId,
    date,
    start: toMinutes(start),
    end: toEndMinutes(end),
    status: 'ACTIVE',
    cancelledBy: null,
    createdAt: created,
    ...extra,
  });
  const bookings = [
    // maine 18:00–18:30 la bazin e plin: 10 din 10
    ...students.slice(0, 10).map((s) => b(s.id, 'u-pool-1', d(1), '18:00', '18:30')),
    b('s11', 'u-pool-1', d(1), '18:30', '19:30'),
    b('t1', 'u-pool-1', d(1), '10:00', '11:00'),
    b('s12', 'u-gym-1', d(1), '19:00', '21:00'),
    b('s1', 'u-gym-1', d(1), '23:00', '00:00'),
    b('t2', 'u-football-1', d(2), '20:00', '21:30'),
    b('s2', 'u-basketball-1', d(1), '19:00', '20:00'),
    b('s3', 'u-basketball-2', d(1), '19:00', '20:00'),
    b('admin', 'u-basketball-2', d(2), '12:00', '13:00'),
    b('s4', 'u-basketball-1', d(2), '18:00', '19:00', { status: 'CANCELLED', cancelledBy: 'USER' }),
    // istoric pt Ana si profesor
    b('s1', 'u-pool-1', d(-1), '18:00', '19:00'),
    b('s1', 'u-basketball-1', d(-3), '20:00', '21:00'),
    b('s1', 'u-gym-1', d(-6), '19:00', '20:30'),
    b('s1', 'u-football-1', d(-4), '19:00', '20:00', {
      status: 'CANCELLED',
      cancelledBy: 'MAINTENANCE',
    }),
    b('t1', 'u-gym-1', d(-2), '09:00', '10:00'),
    // forfota pe azi si poimaine ca sa nu para gol
    ...students
      .slice(1, 7)
      .map((s, i) =>
        b(s.id, 'u-gym-1', d(0), i % 2 ? '19:00' : '20:00', i % 2 ? '20:00' : '21:00'),
      ),
    ...students.slice(4, 8).map((s) => b(s.id, 'u-pool-1', d(0), '20:00', '21:00')),
    b('s5', 'u-football-1', d(0), '21:00', '22:30'),
    ...students.slice(2, 6).map((s) => b(s.id, 'u-pool-1', d(2), '19:00', '20:00')),
  ];
  const blocks: DBlock[] = [
    {
      id: id('m'),
      facilityId: 'f-basketball',
      unitId: 'u-basketball-2',
      startsAt: toInstant(d(3), 8 * 60),
      endsAt: toInstant(d(3), 14 * 60),
      reason: 'Recondiționare podea',
      createdById: 'admin',
    },
  ];
  return { day: today, users, facilities, bookings, blocks };
}

function load(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? 'null') as State | null;
    if (s && s.day === nowLocal().date) return s;
  } catch {
    // storage blocat sau stricat: pornim de la zero
  }
  const s = seed();
  save(s);
  return s;
}

function save(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // fara storage datele tin cat e deschis tab-ul
  }
}

let memory: State | null = null;
const state = () => (memory ??= load());

/** Sterge tot ce s-a facut in demo si pune datele initiale inapoi. */
export function resetDemo() {
  memory = seed();
  save(memory);
}

// --- helpers ca in backend ---

const hasEnded = (date: string, end: number, now = nowLocal()) =>
  date < now.date || (date === now.date && end <= now.minutes);
const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);
const overlaps = (a: { start: number; end: number }, start: number, end: number) =>
  a.start < end && a.end > start;

const facilityDto = (f: DFacility): Facility => ({
  ...f,
  openTime: toHHMM(f.openTime),
  closeTime: toHHMM(f.closeTime),
});
const summary = (u: User) => ({ id: u.id, name: u.name });

function unitOf(s: State, unitId: string) {
  for (const f of s.facilities) {
    const unit = f.units.find((x) => x.id === unitId);
    if (unit) return { facility: f, unit };
  }
  throw err(404, 'NOT_FOUND', 'Terenul nu a fost găsit.');
}

function facilityOf(s: State, facilityId: string) {
  const f = s.facilities.find((x) => x.id === facilityId);
  if (!f) throw err(404, 'NOT_FOUND', 'Baza sportivă nu a fost găsită.');
  return f;
}

function bookingDto(s: State, b: DBooking, now = nowLocal()): Booking {
  const { facility, unit } = unitOf(s, b.unitId);
  const status: BookingStatus =
    b.status === 'ACTIVE' && hasEnded(b.date, b.end, now) ? 'COMPLETED' : b.status;
  return {
    id: b.id,
    user: summary(s.users.find((u) => u.id === b.userId)!),
    facilityId: facility.id,
    facilityName: facility.name,
    unitId: unit.id,
    unitName: unit.name,
    date: b.date,
    startTime: toHHMM(b.start),
    endTime: toHHMM(b.end),
    status,
    cancelledBy: b.cancelledBy,
    createdAt: b.createdAt,
  };
}

const byTime = (a: DBooking, b: DBooking) => a.date.localeCompare(b.date) || a.start - b.start;

function blocksOverlapping(
  s: State,
  facilityId: string,
  unitId: string | undefined,
  from: string,
  to: string,
) {
  return s.blocks.filter(
    (m) =>
      m.facilityId === facilityId &&
      (!unitId || !m.unitId || m.unitId === unitId) &&
      m.startsAt < to &&
      m.endsAt > from,
  );
}

function affected(
  s: State,
  facility: DFacility,
  r: { unitId?: string; startsAt: string; endsAt: string },
) {
  const units = r.unitId ? [r.unitId] : facility.units.map((u) => u.id);
  const now = nowLocal();
  return s.bookings
    .filter(
      (b) =>
        b.status === 'ACTIVE' &&
        units.includes(b.unitId) &&
        !hasEnded(b.date, b.end, now) &&
        toInstant(b.date, b.start) < r.endsAt &&
        toInstant(b.date, b.end) > r.startsAt,
    )
    .sort(byTime);
}

// latenta mica, ca sa se vada starile de incarcare ca la un server adevarat
const delay = <T>(fn: () => T): Promise<T> =>
  new Promise((resolve, reject) =>
    setTimeout(
      () => {
        try {
          resolve(fn());
        } catch (e) {
          reject(e);
        }
      },
      120 + Math.random() * 180,
    ),
  );

export function demoApi(getToken: () => string | null): Api {
  const me = (s: State) => {
    const token = getToken();
    const user = token && s.users.find((u) => `demo:${u.id}` === token);
    if (!user) throw err(401, 'UNAUTHORIZED', 'Autentifică-te pentru a continua.');
    if (user.blocked)
      throw err(403, 'ACCOUNT_BLOCKED', 'Contul tău a fost blocat de administrator.');
    return user;
  };
  const admin = (s: State) => {
    const u = me(s);
    if (u.role !== 'ADMIN')
      throw err(403, 'FORBIDDEN', 'Doar administratorii pot face această operație.');
    return u;
  };
  const write = <T>(fn: (s: State) => T) =>
    delay(() => {
      const s = state();
      const out = fn(s);
      save(s);
      return out;
    });
  const read = <T>(fn: (s: State) => T) => delay(() => fn(state()));

  function login(rawEmail: string, name?: string) {
    return write((s) => {
      const email = rawEmail.trim().toLowerCase();
      const role: Role | null =
        email === 'admin@usm.ro'
          ? 'ADMIN'
          : email.endsWith('@student.usv.ro')
            ? 'STUDENT'
            : email.endsWith('@usm.ro')
              ? 'TEACHER'
              : null;
      if (!role)
        throw err(403, 'DOMAIN_NOT_ALLOWED', 'Folosește un cont @student.usv.ro sau @usm.ro.');
      let user = s.users.find((u) => u.email === email);
      if (user?.blocked)
        throw err(403, 'ACCOUNT_BLOCKED', 'Contul tău a fost blocat de administrator.');
      if (!user) {
        user = { id: id('u'), name: name || email.split('@')[0], email, role, blocked: false };
        s.users.push(user);
      }
      return { token: `demo:${user.id}`, user };
    });
  }

  return {
    devLogin: login,
    googleLogin: () =>
      Promise.reject(err(400, 'VALIDATION_ERROR', 'În modul demo nu există login Google.')),
    me: () => read(me),
    facilities: () => read((s) => (me(s), s.facilities.map(facilityDto))),

    slots: (facilityId, date) =>
      read((s): Slot[] => {
        const user = me(s);
        const f = facilityOf(s, facilityId);
        const now = nowLocal();
        const tooFar = daysBetween(now.date, date) > MAX_DAYS_AHEAD;
        const blocks = blocksOverlapping(
          s,
          f.id,
          undefined,
          toInstant(date, f.openTime),
          toInstant(date, f.closeTime),
        );
        const active = s.bookings.filter((b) => b.status === 'ACTIVE' && b.date === date);
        return f.units.flatMap((unit) => {
          const out: Slot[] = [];
          for (let start = f.openTime; start < f.closeTime; start += SLOT) {
            const end = start + SLOT;
            const [from, to] = [toInstant(date, start), toInstant(date, end)];
            const bookedBy = active
              .filter((b) => b.unitId === unit.id && overlaps(b, start, end))
              .map((b) => summary(s.users.find((u) => u.id === b.userId)!));
            const status =
              date < now.date || (date === now.date && start < now.minutes)
                ? 'PAST'
                : blocks.some(
                      (m) =>
                        (!m.unitId || m.unitId === unit.id) && m.startsAt < to && m.endsAt > from,
                    )
                  ? 'MAINTENANCE'
                  : bookedBy.length >= f.capacityPerSlot
                    ? 'FULL'
                    : tooFar || (user.role === 'STUDENT' && start < STUDENT_EARLIEST_START)
                      ? 'RESTRICTED'
                      : 'FREE';
            out.push({
              unitId: unit.id,
              startTime: toHHMM(start),
              endTime: toHHMM(end),
              capacity: f.capacityPerSlot,
              booked: bookedBy.length,
              status,
              bookedBy,
            });
          }
          return out;
        });
      }),

    dailyLimit: (facilityId, date) =>
      read((s) => {
        const user = me(s);
        const f = facilityOf(s, facilityId);
        const units = f.units.map((u) => u.id);
        const used = s.bookings
          .filter(
            (b) =>
              b.userId === user.id &&
              b.status === 'ACTIVE' &&
              b.date === date &&
              units.includes(b.unitId),
          )
          .reduce((sum, b) => sum + b.end - b.start, 0);
        const limit = user.role === 'STUDENT' ? f.studentDailyLimitMinutes : null;
        return {
          date,
          limitMinutes: limit,
          usedMinutes: used,
          remainingMinutes: limit === null ? null : Math.max(0, limit - used),
        };
      }),

    createBooking: (input) =>
      write((s) => {
        const user = me(s);
        const { facility: f, unit } = unitOf(s, input.unitId);
        const start = toMinutes(input.startTime);
        const end = toEndMinutes(input.endTime);
        const { date } = input;
        const now = nowLocal();
        const active = s.bookings.filter((b) => b.status === 'ACTIVE' && b.date === date);
        const units = f.units.map((u) => u.id);
        const mine = active.filter((b) => b.userId === user.id && units.includes(b.unitId));
        const onUnit = active.filter((b) => b.unitId === unit.id);

        // aceeasi ordine ca checkBookingRules
        if (end <= start || start % SLOT || end % SLOT) {
          throw err(400, 'VALIDATION_ERROR', 'Ora de sfârșit trebuie să fie după ora de început.');
        }
        if (start < f.openTime || end > f.closeTime) {
          throw conflict(
            'OUTSIDE_OPENING_HOURS',
            'Intervalul ales este în afara programului bazei.',
          );
        }
        if (date < now.date || (date === now.date && start < now.minutes)) {
          throw conflict('BOOKING_IN_PAST', 'Intervalul ales a trecut deja.');
        }
        if (daysBetween(now.date, date) > MAX_DAYS_AHEAD) {
          throw conflict(
            'BOOKING_TOO_FAR_AHEAD',
            `Poți rezerva cu cel mult ${MAX_DAYS_AHEAD} zile în avans.`,
          );
        }
        const student = user.role === 'STUDENT';
        if (student && start < STUDENT_EARLIEST_START) {
          throw conflict(
            'STUDENT_TIME_RESTRICTED',
            'Studenții pot rezerva doar intervale de la 18:00.',
          );
        }
        const used = mine.reduce((sum, b) => sum + b.end - b.start, 0);
        if (student && used + end - start > f.studentDailyLimitMinutes) {
          throw conflict(
            'DAILY_LIMIT_EXCEEDED',
            `Ai atins limita de ${f.studentDailyLimitMinutes} de minute pe zi la ${f.name}.`,
          );
        }
        if (mine.some((b) => overlaps(b, start, end))) {
          throw conflict(
            'ALREADY_BOOKED',
            'Ai deja o rezervare la această bază în intervalul ales.',
          );
        }
        for (let t = start; t < end; t += SLOT) {
          if (onUnit.filter((b) => overlaps(b, t, t + SLOT)).length >= f.capacityPerSlot) {
            throw conflict(
              'CAPACITY_EXCEEDED',
              `Intervalul ${toHHMM(t)} – ${toHHMM(t + SLOT)} nu mai are locuri libere.`,
            );
          }
        }
        if (
          blocksOverlapping(s, f.id, unit.id, toInstant(date, start), toInstant(date, end)).length
        ) {
          throw conflict('FACILITY_IN_MAINTENANCE', 'Baza este în mentenanță în intervalul ales.');
        }

        const booking: DBooking = {
          id: id('b'),
          userId: user.id,
          unitId: unit.id,
          date,
          start,
          end,
          status: 'ACTIVE',
          cancelledBy: null,
          createdAt: new Date().toISOString(),
        };
        s.bookings.push(booking);
        return bookingDto(s, booking, now);
      }),

    myBookings: (scope) =>
      read((s) => {
        const user = me(s);
        const now = nowLocal();
        const mine = s.bookings
          .filter(
            (b) => b.userId === user.id && hasEnded(b.date, b.end, now) === (scope === 'past'),
          )
          .sort(byTime);
        if (scope === 'past') mine.reverse();
        return mine.map((b) => bookingDto(s, b, now));
      }),

    cancelBooking: (bookingId) =>
      write((s) => {
        const user = me(s);
        const b = s.bookings.find((x) => x.id === bookingId);
        if (!b) throw err(404, 'NOT_FOUND', 'Rezervarea nu a fost găsită.');
        if (b.userId !== user.id && user.role !== 'ADMIN') {
          throw err(403, 'FORBIDDEN', 'Nu ai acces la rezervarea altui utilizator.');
        }
        const notCancellable = (m: string) => conflict('BOOKING_NOT_CANCELLABLE', m);
        if (b.status === 'CANCELLED') throw notCancellable('Rezervarea este deja anulată.');
        const now = nowLocal();
        if (hasEnded(b.date, b.end, now)) throw notCancellable('Rezervarea s-a încheiat.');
        const toStart = daysBetween(now.date, b.date) * 1440 + b.start - now.minutes;
        if (user.role !== 'ADMIN' && toStart <= 0) {
          throw notCancellable('Rezervarea a început sau termenul de anulare a trecut.');
        }
        b.status = 'CANCELLED';
        b.cancelledBy = b.userId === user.id ? 'USER' : 'ADMIN';
        return bookingDto(s, b, now);
      }),

    allBookings: (filters) =>
      read((s) => {
        admin(s);
        const now = nowLocal();
        return s.bookings
          .filter(
            (b) =>
              (!filters.date || b.date === filters.date) &&
              (!filters.facilityId || unitOf(s, b.unitId).facility.id === filters.facilityId),
          )
          .sort(byTime)
          .map((b) => bookingDto(s, b, now));
      }),

    users: (filters) =>
      read((s) => {
        admin(s);
        return s.users
          .filter((u) => filters.blocked === undefined || u.blocked === filters.blocked)
          .sort((a, b) => a.name.localeCompare(b.name, 'ro'));
      }),

    setBlocked: (userId, blocked) =>
      write((s) => {
        admin(s);
        const u = s.users.find((x) => x.id === userId);
        if (!u) throw err(404, 'NOT_FOUND', 'Utilizatorul nu a fost găsit.');
        u.blocked = blocked;
        return u;
      }),

    maintenancePreview: (facilityId, r) =>
      read((s) => {
        admin(s);
        return affected(s, facilityOf(s, facilityId), r).map((b) => bookingDto(s, b));
      }),

    createMaintenance: (facilityId, r) =>
      write((s) => {
        const actor = admin(s);
        const f = facilityOf(s, facilityId);
        if (r.unitId && !f.units.some((u) => u.id === r.unitId))
          throw err(404, 'NOT_FOUND', 'Terenul nu a fost găsit.');
        if (blocksOverlapping(s, f.id, r.unitId, r.startsAt, r.endsAt).length) {
          throw conflict(
            'MAINTENANCE_OVERLAP',
            'Perioada se suprapune cu o altă perioadă de mentenanță.',
          );
        }
        const block: DBlock = {
          id: id('m'),
          facilityId: f.id,
          unitId: r.unitId ?? null,
          startsAt: r.startsAt,
          endsAt: r.endsAt,
          reason: r.reason ?? null,
          createdById: actor.id,
        };
        s.blocks.push(block);
        for (const b of affected(s, f, r)) {
          b.status = 'CANCELLED';
          b.cancelledBy = 'MAINTENANCE';
        }
        const { createdById: _c, ...rest } = block;
        return { ...rest, createdBy: summary(actor) };
      }),
  };
}
