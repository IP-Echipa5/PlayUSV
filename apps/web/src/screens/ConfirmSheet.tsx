import { useState } from 'react';
import { useAuth } from '../auth';
import type { Booking, Facility, Slot, UserSummary } from '../api/types';
import { duration, longDay, toEndMinutes, toMinutes, today } from '../lib/time';
import { Sheet } from '../ui/parts';
import { Avatar, Row } from '../ui/Row';

type Props = {
  facility: Facility;
  unitId: string;
  date: string;
  slots: Slot[];
  remaining: number | null;
  onClose: () => void;
  onBooked: (b: Booking) => void;
};

export function ConfirmSheet({
  facility,
  unitId,
  date,
  slots,
  remaining,
  onClose,
  onBooked,
}: Props) {
  const { api, guard } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTime = slots[0].startTime;
  const endTime = slots[slots.length - 1].endTime;
  const minutes = toEndMinutes(endTime) - toMinutes(startTime);
  const unit = facility.units.find((u) => u.id === unitId);

  // Cine mai e in intervalele alese (doar numele, backend-ul nu trimite emailul).
  const people = [
    ...new Map(
      slots.flatMap((s) => s.bookedBy).map((p): [string, UserSummary] => [p.id, p]),
    ).values(),
  ];
  const most = Math.max(...slots.map((s) => s.booked));

  async function book() {
    setBusy(true);
    setError(null);
    try {
      onBooked(await guard(api.createBooking({ unitId, date, startTime, endTime })));
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  const over = remaining !== null && minutes > remaining;
  const when = date === today() ? 'azi' : 'în ziua aleasă';
  const place = facility.name.split(' ')[0].toLowerCase();

  return (
    <Sheet
      title="Confirmare"
      onClose={onClose}
      footer={
        <button type="button" className="btn" disabled={busy || over} onClick={book}>
          {busy ? 'Se rezervă…' : 'Rezervă'}
        </button>
      }
    >
      <div className="section-header">Detalii rezervare</div>
      <div className="list">
        <Row title="Bază" value={facility.name} />
        {facility.units.length > 1 && unit && <Row title="Teren" value={unit.name} />}
        <Row title="Zi" value={longDay(date)} />
        <Row title="Interval" value={`${startTime} – ${endTime}`} />
        <Row title="Durată" value={duration(minutes)} />
      </div>
      {over ? (
        <p className="note text-red">
          Depășești limita zilnică:{' '}
          {remaining ? `mai ai doar ${duration(remaining)}` : 'nu mai ai minute'} {when} la {place}.
          Alege un interval mai scurt sau altă zi.
        </p>
      ) : (
        remaining !== null && (
          <p className="note">
            După această rezervare îți mai rămân {duration(remaining - minutes)} {when} la {place}.
          </p>
        )
      )}
      {error && <p className="note text-red">{error}</p>}
      {facility.capacityPerSlot > 1 && (
        <>
          <div className="section-header">
            Au mai rezervat ({most}/{facility.capacityPerSlot})
          </div>
          {people.length ? (
            <div className="list">
              {people.map((p) => (
                <Row key={p.id} icon={<Avatar name={p.name} />} title={p.name} />
              ))}
            </div>
          ) : (
            <p className="note">Încă nu a rezervat nimeni. Ești primul.</p>
          )}
          <p className="note">Se afișează doar numele, nu și adresa de email.</p>
        </>
      )}
    </Sheet>
  );
}
