import { useMemo, useState } from 'react';
import { useAuth } from '../auth';
import type { Booking, Facility, Slot } from '../api/types';
import { addDays, duration, longDay, toEndMinutes, toMinutes, today } from '../lib/time';
import { useLoad } from '../lib/useLoad';
import { Check } from '../ui/icons';
import { DayStrip, NavBar, Segmented, Status } from '../ui/parts';
import { Row } from '../ui/Row';
import { ConfirmSheet } from './ConfirmSheet';

type Range = { from: number; to: number }; // indici in lista de sloturi a terenului

function slotLabel(s: Slot, mine: boolean, studentOnly: boolean) {
  if (mine) return { text: 'Rezervat de tine', cls: 'text-green' };
  switch (s.status) {
    case 'FULL':
      return { text: 'Complet', cls: 'text-red' };
    case 'MAINTENANCE':
      return { text: 'Mentenanță', cls: 'text-orange' };
    case 'RESTRICTED':
      return { text: studentOnly ? 'Doar de la 18:00' : 'Prea departe', cls: 'text-muted' };
    case 'PAST':
      return { text: 'A trecut', cls: 'text-muted' };
    default:
      return { text: s.capacity > 1 ? `${s.booked}/${s.capacity} locuri` : 'Liber', cls: '' };
  }
}

export function FacilityCalendar({
  facility,
  onBack,
  onBooked,
}: {
  facility: Facility;
  onBack: () => void;
  onBooked: (b: Booking) => void;
}) {
  const { api, user } = useAuth();
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today(), i)), []);
  const [date, setDate] = useState(days[0]);
  const [unitId, setUnitId] = useState(facility.units[0]?.id);
  const [range, setRange] = useState<Range | null>(null);
  const [confirm, setConfirm] = useState(false);
  const student = user?.role === 'STUDENT';

  const slots = useLoad(() => api.slots(facility.id, date), [api, facility.id, date]);
  const limit = useLoad(
    () => (student ? api.dailyLimit(facility.id, date) : Promise.resolve(null)),
    [api, facility.id, date, student],
  );

  // Sloturile terenului ales, fara cele trecute; din cele interzise inainte de 18:00 il pastram doar pe ultimul, ca indiciu.
  const unitSlots = useMemo(() => {
    const all = (slots.data ?? []).filter((s) => s.unitId === unitId && s.status !== 'PAST');
    const firstOpen = all.findIndex((s) => s.status !== 'RESTRICTED');
    return firstOpen > 1 ? all.slice(firstOpen - 1) : all;
  }, [slots.data, unitId]);

  const isMine = (s: Slot) => s.bookedBy.some((b) => b.id === user?.id);
  const bookable = (s: Slot) => s.status === 'FREE' && !isMine(s);

  function pick(i: number) {
    if (!bookable(unitSlots[i])) return;
    setRange((r) => {
      if (!r) return { from: i, to: i };
      if (i === r.to + 1) return { from: r.from, to: i };
      if (i === r.from - 1) return { from: i, to: r.to };
      if (i >= r.from && i <= r.to) return r.from === r.to ? null : { from: i, to: i };
      return { from: i, to: i };
    });
  }

  const chosen = range ? unitSlots.slice(range.from, range.to + 1) : [];
  const start = chosen[0]?.startTime;
  const end = chosen[chosen.length - 1]?.endTime;
  const minutes = start && end ? toEndMinutes(end) - toMinutes(start) : 0;
  const short = facility.name.split(' ')[0].toLowerCase();

  return (
    <div className="screen-col">
      <NavBar back="Baze" title={facility.name} onBack={onBack} />
      <div className="screen with-bottom-bar">
        <DayStrip
          days={days}
          value={date}
          onChange={(d) => {
            setDate(d);
            setRange(null);
          }}
        />
        {facility.units.length > 1 && (
          <Segmented
            options={facility.units.map((u) => ({ value: u.id, label: u.name }))}
            value={unitId}
            onChange={(u) => {
              setUnitId(u);
              setRange(null);
            }}
          />
        )}
        <div className="section-header">{longDay(date)} · intervale de 30 min</div>
        <Status loading={slots.loading && !slots.data} error={slots.error} onRetry={slots.reload} />
        {unitSlots.length > 0 && (
          <div className="list">
            {unitSlots.map((s, i) => {
              const sel = !!range && i >= range.from && i <= range.to;
              const l = slotLabel(s, isMine(s), student);
              return (
                <Row
                  key={s.startTime}
                  title={`${s.startTime} – ${s.endTime}`}
                  titleClass={sel ? 'bold' : bookable(s) || isMine(s) ? '' : 'text-muted'}
                  value={l.text}
                  valueClass={l.cls}
                  selected={sel}
                  trailing={sel ? <Check /> : undefined}
                  disabled={!bookable(s)}
                  onClick={() => pick(i)}
                />
              );
            })}
          </div>
        )}
        {slots.data && !unitSlots.length && (
          <p className="note">Nu mai sunt intervale azi. Alege altă zi.</p>
        )}
        {limit.data && limit.data.limitMinutes !== null && (
          <p className="note">
            Limita ta zilnică la {short}: {duration(limit.data.limitMinutes)}.{' '}
            {date === today() ? 'Azi' : 'În ziua aleasă'} ai folosit{' '}
            {duration(limit.data.usedMinutes)}.
          </p>
        )}
      </div>
      <div className="bottom-bar">
        <div className="bottom-bar-line">
          <strong>{start ? `${start} – ${end}` : 'Alege un interval'}</strong>
          <span className="row-value">{minutes ? duration(minutes) : ''}</span>
        </div>
        <button type="button" className="btn" disabled={!start} onClick={() => setConfirm(true)}>
          Continuă
        </button>
      </div>
      {confirm && start && end && (
        <ConfirmSheet
          facility={facility}
          unitId={unitId}
          date={date}
          slots={chosen}
          remaining={limit.data?.remainingMinutes ?? null}
          onClose={() => setConfirm(false)}
          onBooked={(b) => {
            setConfirm(false);
            setRange(null);
            slots.reload();
            limit.reload();
            onBooked(b);
          }}
        />
      )}
    </div>
  );
}
