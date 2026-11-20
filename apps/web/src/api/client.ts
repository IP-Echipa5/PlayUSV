import type {
  Booking,
  BookingCreate,
  DailyLimit,
  Facility,
  MaintenanceBlock,
  MaintenanceRange,
  Session,
  Slot,
  User,
} from './types';

/** Error body of the API: always `{ code, message }`. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

/** Everything the screens need from the backend. */
export interface Api {
  devLogin(email: string, name?: string): Promise<Session>;
  googleLogin(idToken: string): Promise<Session>;
  me(): Promise<User>;
  facilities(): Promise<Facility[]>;
  slots(facilityId: string, date: string): Promise<Slot[]>;
  dailyLimit(facilityId: string, date: string): Promise<DailyLimit>;
  createBooking(input: BookingCreate): Promise<Booking>;
  myBookings(scope: 'upcoming' | 'past'): Promise<Booking[]>;
  cancelBooking(id: string): Promise<Booking>;
  allBookings(filters: { date?: string; facilityId?: string }): Promise<Booking[]>;
  users(filters: { blocked?: boolean }): Promise<User[]>;
  setBlocked(userId: string, blocked: boolean): Promise<User>;
  maintenancePreview(facilityId: string, range: MaintenanceRange): Promise<Booking[]>;
  createMaintenance(
    facilityId: string,
    range: MaintenanceRange & { reason?: string },
  ): Promise<MaintenanceBlock>;
}

const query = (params: Record<string, string | boolean | undefined>) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
};

export function httpApi(getToken: () => string | null, base = '/api'): Api {
  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const token = getToken();
    let res: Response;
    try {
      res = await fetch(base + path, {
        method,
        headers: {
          ...(body !== undefined && { 'Content-Type': 'application/json' }),
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'Serverul nu răspunde. Verifică dacă backend-ul rulează.',
      );
    }
    if (res.status === 204) return undefined as T;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new ApiError(
        res.status,
        data?.code ?? 'INTERNAL_ERROR',
        data?.message ?? 'A apărut o eroare neașteptată.',
      );
    }
    return data as T;
  }

  return {
    devLogin: (email, name) => call('POST', '/auth/dev-login', { email, name }),
    googleLogin: (idToken) => call('POST', '/auth/google', { idToken }),
    me: () => call('GET', '/users/me'),
    facilities: () => call('GET', '/facilities'),
    slots: (id, date) => call('GET', `/facilities/${id}/slots${query({ date })}`),
    dailyLimit: (id, date) => call('GET', `/facilities/${id}/daily-limit${query({ date })}`),
    createBooking: (input) => call('POST', '/bookings', input),
    myBookings: (scope) => call('GET', `/bookings/me${query({ scope })}`),
    cancelBooking: (id) => call('POST', `/bookings/${id}/cancel`),
    allBookings: (f) => call('GET', `/bookings${query(f)}`),
    users: (f) => call('GET', `/users${query(f)}`),
    setBlocked: (id, blocked) => call('PATCH', `/users/${id}/block`, { blocked }),
    maintenancePreview: (id, r) => call('GET', `/facilities/${id}/maintenance/preview${query(r)}`),
    createMaintenance: (id, r) => call('POST', `/facilities/${id}/maintenance`, r),
  };
}
