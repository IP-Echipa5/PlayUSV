function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

// durata tokenului: numar + s/m/h/d (ex. 30m, 12h, 7d)
function duration(name: string, fallback: string): string {
  const value = process.env[name] ?? fallback;
  if (!/^\d+[smhd]$/.test(value)) throw new Error(`${name} invalid: ${value} (ex. 12h, 7d)`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  isDev: process.env.NODE_ENV === 'development',
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: duration('JWT_EXPIRES_IN', '7d'),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  // originile frontend-ului, separate prin virgula (ex. http://localhost:5173)
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean),
  // Not yet decided by the client; see README.
  maxDaysAhead: Number(process.env.BOOKING_MAX_DAYS_AHEAD ?? 14),
  cancelCutoffMinutes: Number(process.env.CANCEL_CUTOFF_MINUTES ?? 0),
};
