import { useState } from 'react';
import { useAuth } from '../auth';
import type { Booking, Facility } from '../api/types';
import { addDays, shortDay, today } from '../lib/time';
import { useLoad } from '../lib/useLoad';
import { FacilityIcon } from '../ui/icons';
import { Segmented, Status, SwipeRow } from '../ui/parts';
import { Row } from '../ui/Row';

const statusText = (b: Booking) =>
  b.status === 'CANCELLED'
    ? b.cancelledBy === 'MAINTENANCE'
      ? 'Mentenanță'
      : 'Anulată'
    : b.status === 'COMPLETED'
      ? 'Finalizată'
      : '';

export function MyBookings({
  facilities,
  fresh,
}: {
  facilities: Facility[];
  fresh: string | null;
}) {
  const { api, guard } = useAuth();
  const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');
  const { data, error, loading, reload } = useLoad(() => api.myBookings(scope), [api, scope]);
  const [msg, setMsg] = useState<string | null>(null);
  const typeOf = (b: Booking) => facilities.find((f) => f.id === b.facilityId)?.type ?? 'GYM';

  async function cancel(b: Booking) {
    setMsg(null);
    try {
      await guard(api.cancelBooking(b.id));
      setMsg(`Ai anulat rezervarea de la ${b.facilityName}.`);
      reload();
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  const list = data ?? [];
  const active = list.filter((b) => b.status === 'ACTIVE');
  const weekEnd = addDays(today(), 6);
  const groups =
    scope === 'upcoming'
      ? [
          {
            title: 'Săptămâna aceasta',
            items: active.filter((b) => b.date <= weekEnd),
            swipe: true,
          },
          { title: 'Mai târziu', items: active.filter((b) => b.date > weekEnd), swipe: true },
          { title: 'Anulate', items: list.filter((b) => b.status === 'CANCELLED'), swipe: false },
        ]
      : [{ title: 'Istoric', items: list, swipe: false }];

  const multiUnit = (b: Booking) =>
    (facilities.find((f) => f.id === b.facilityId)?.units.length ?? 0) > 1;
  const sub = (b: Booking) =>
    `${shortDay(b.date)} · ${b.startTime} – ${b.endTime}${multiUnit(b) ? ` · ${b.unitName}` : ''}`;

  return (
    <main className="screen">
      <h1 className="large-title">Rezervări</h1>
      <Segmented
        options={[
          { value: 'upcoming', label: 'Viitoare' },
          { value: 'past', label: 'Istoric' },
        ]}
        value={scope}
        onChange={setScope}
      />
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {msg && <p className="note text-blue">{msg}</p>}
      {data && !list.length && (
        <p className="note">
          {scope === 'upcoming'
            ? 'Nu ai rezervări viitoare. Alege o bază din tab-ul Baze.'
            : 'Nu ai rezervări în istoric.'}
        </p>
      )}
      {groups
        .filter((g) => g.items.length)
        .map((g, gi) => (
          <section key={g.title}>
            <div className="section-header">{g.title}</div>
            <div className="list">
              {g.items.map((b) => {
                const row = (
                  <Row
                    icon={<FacilityIcon type={typeOf(b)} muted={b.status !== 'ACTIVE'} />}
                    title={b.facilityName}
                    titleClass={b.status === 'CANCELLED' ? 'text-secondary' : ''}
                    subtitle={sub(b)}
                    value={b.id === fresh && b.status === 'ACTIVE' ? 'Nouă' : statusText(b)}
                    valueClass={b.id === fresh ? 'text-green' : ''}
                  />
                );
                return g.swipe ? (
                  <SwipeRow key={b.id} action="Anulează" onAction={() => cancel(b)}>
                    {row}
                  </SwipeRow>
                ) : (
                  <div key={b.id}>{row}</div>
                );
              })}
            </div>
            {g.swipe && gi === 0 && (
              <p className="note">Glisează spre stânga pe o rezervare ca s-o anulezi.</p>
            )}
          </section>
        ))}
    </main>
  );
}
