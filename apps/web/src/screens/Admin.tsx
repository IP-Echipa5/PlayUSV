import { useMemo, useState } from 'react';
import { useAuth } from '../auth';
import type { Booking, Facility, User } from '../api/types';
import { addDays, shortDay, toInstant, toMinutes, today } from '../lib/time';
import { useLoad } from '../lib/useLoad';
import { FacilityIcon } from '../ui/icons';
import { DayStrip, NavBar, Status } from '../ui/parts';
import { Avatar, Row } from '../ui/Row';
import { roleLabel } from './Profile';

/** "2026-11-21T08:00" din input-ul datetime-local -> ISO, ora fiind ora Bucurestiului. */
const localToIso = (v: string) => toInstant(v.slice(0, 10), toMinutes(v.slice(11, 16)));
const pretty = (v: string) =>
  `${shortDay(v.slice(0, 10)).replace(/^(\p{L}{3})\p{L}*/u, '$1')} · ${v.slice(11, 16)}`;

export function Maintenance({
  facilities,
  onBack,
}: {
  facilities: Facility[];
  onBack: () => void;
}) {
  const { api, guard } = useAuth();
  // optiuni: toata baza sau un singur teren
  const options = useMemo(
    () =>
      facilities.flatMap((f) => [
        {
          key: f.id,
          facility: f,
          unitId: undefined as string | undefined,
          label: f.name,
          sub: f.units.length > 1 ? 'Toate terenurile' : f.units[0]?.name,
        },
        ...(f.units.length > 1
          ? f.units.map((u) => ({
              key: `${f.id}:${u.id}`,
              facility: f,
              unitId: u.id,
              label: f.name,
              sub: u.name,
            }))
          : []),
      ]),
    [facilities],
  );
  const tomorrow = addDays(today(), 1);
  const [key, setKey] = useState(options[0]?.key);
  const [from, setFrom] = useState(`${tomorrow}T08:00`);
  const [to, setTo] = useState(`${tomorrow}T14:00`);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const opt = options.find((o) => o.key === key) ?? options[0];
  const valid = !!opt && from < to;
  const range = valid
    ? { unitId: opt.unitId, startsAt: localToIso(from), endsAt: localToIso(to) }
    : null;

  const preview = useLoad(
    () =>
      range ? api.maintenancePreview(opt.facility.id, range) : Promise.resolve([] as Booking[]),
    [api, key, from, to],
  );

  async function block() {
    if (!range) return;
    setBusy(true);
    setMsg(null);
    try {
      await guard(
        api.createMaintenance(opt.facility.id, { ...range, reason: reason.trim() || undefined }),
      );
      const n = preview.data?.length ?? 0;
      setMsg({
        ok: true,
        text: `Baza e blocată. ${n ? `Am anulat ${n} ${n === 1 ? 'rezervare' : 'rezervări'}.` : 'Nu era nicio rezervare în perioada asta.'}`,
      });
      preview.reload();
    } catch (e) {
      setMsg({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  if (!opt) return null;
  return (
    <div className="screen-col">
      <NavBar back="Profil" title="Mentenanță" onBack={onBack} />
      <div className="screen with-bottom-bar">
        <div className="section-header">Bază sportivă</div>
        <div className="list">
          <label className="row has-icon picker">
            <FacilityIcon type={opt.facility.type} />
            <span className="row-text">
              <span className="row-title">{opt.label}</span>
              <span className="row-subtitle">{opt.sub}</span>
            </span>
            <select value={key} onChange={(e) => setKey(e.target.value)} aria-label="Bază sportivă">
              {options.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label} – {o.sub}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="section-header">Perioadă</div>
        <div className="list">
          <label className="row picker">
            <span className="row-text">Începe</span>
            <span className="row-value text-blue">{pretty(from)}</span>
            <input
              type="datetime-local"
              step={1800}
              value={from}
              onChange={(e) => e.target.value && setFrom(e.target.value)}
            />
          </label>
          <label className="row picker">
            <span className="row-text">Se termină</span>
            <span className={`row-value ${from < to ? 'text-blue' : 'text-red'}`}>
              {pretty(to)}
            </span>
            <input
              type="datetime-local"
              step={1800}
              value={to}
              onChange={(e) => e.target.value && setTo(e.target.value)}
            />
          </label>
          <label className="row">
            <span className="row-text">Motiv</span>
            <input
              className="inline-input"
              placeholder="Recondiționare podea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
        </div>
        {!valid && <p className="note text-red">Sfârșitul trebuie să fie după început.</p>}
        <div className="section-header">
          Rezervări ce vor fi anulate ({preview.data?.length ?? 0})
        </div>
        <Status loading={preview.loading && !preview.data} error={preview.error} />
        {!!preview.data?.length && (
          <div className="list">
            {preview.data.map((b) => (
              <Row
                key={b.id}
                icon={<Avatar name={b.user.name} />}
                title={b.user.name}
                subtitle={`${shortDay(b.date)} · ${b.startTime} – ${b.endTime}`}
              />
            ))}
          </div>
        )}
        <p className="note">Rezervările din perioada blocată vor fi anulate automat.</p>
        {msg && <p className={`note ${msg.ok ? 'text-green' : 'text-red'}`}>{msg.text}</p>}
      </div>
      <div className="bottom-bar plain">
        <button type="button" className="btn danger" disabled={!valid || busy} onClick={block}>
          {busy ? 'Se blochează…' : 'Blochează baza'}
        </button>
      </div>
    </div>
  );
}

export function BlockedUsers({ onBack }: { onBack: () => void }) {
  const { api, guard, user: me } = useAuth();
  const { data, error, loading, reload } = useLoad(() => api.users({}), [api]);
  const [q, setQ] = useState('');

  async function toggle(u: User) {
    const verb = u.blocked ? 'deblochezi' : 'blochezi';
    if (!window.confirm(`Sigur ${verb} contul lui ${u.name}?`)) return;
    try {
      await guard(api.setBlocked(u.id, !u.blocked));
      reload();
    } catch (e) {
      window.alert((e as Error).message);
    }
  }

  const all = (data ?? []).filter((u) => u.id !== me?.id);
  const match = (u: User) => `${u.name} ${u.email}`.toLowerCase().includes(q.trim().toLowerCase());
  const blocked = all.filter((u) => u.blocked);
  const others = all.filter((u) => !u.blocked && match(u));

  return (
    <div className="screen-col">
      <NavBar back="Profil" title="Conturi blocate" onBack={onBack} />
      <div className="screen">
        <Status loading={loading && !data} error={error} onRetry={reload} />
        <div className="section-header">Blocate ({blocked.length})</div>
        {blocked.length ? (
          <div className="list">
            {blocked.map((u) => (
              <Row
                key={u.id}
                icon={<Avatar name={u.name} />}
                title={u.name}
                subtitle={`${roleLabel[u.role]} · ${u.email}`}
                value="Deblochează"
                valueClass="text-blue"
                onClick={() => toggle(u)}
              />
            ))}
          </div>
        ) : (
          <p className="note">Niciun cont blocat.</p>
        )}
        <div className="section-header">Toți utilizatorii</div>
        <label className="search">
          <input
            type="search"
            placeholder="Caută după nume sau email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <div className="list">
          {others.slice(0, 30).map((u) => (
            <Row
              key={u.id}
              icon={<Avatar name={u.name} />}
              title={u.name}
              subtitle={`${roleLabel[u.role]} · ${u.email}`}
              value="Blochează"
              valueClass="text-red"
              onClick={() => toggle(u)}
            />
          ))}
        </div>
        <p className="note">Un cont blocat nu mai poate intra și nu mai poate rezerva.</p>
      </div>
    </div>
  );
}

export function AllBookings({
  facilities,
  onBack,
}: {
  facilities: Facility[];
  onBack: () => void;
}) {
  const { api, guard } = useAuth();
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(today(), i)), []);
  const [date, setDate] = useState(days[0]);
  const { data, error, loading, reload } = useLoad(() => api.allBookings({ date }), [api, date]);

  async function cancel(b: Booking) {
    if (!window.confirm(`Anulezi rezervarea lui ${b.user.name} (${b.startTime} – ${b.endTime})?`))
      return;
    try {
      await guard(api.cancelBooking(b.id));
      reload();
    } catch (e) {
      window.alert((e as Error).message);
    }
  }

  return (
    <div className="screen-col">
      <NavBar back="Profil" title="Toate rezervările" onBack={onBack} />
      <div className="screen">
        <DayStrip days={days} value={date} onChange={setDate} />
        <Status loading={loading && !data} error={error} onRetry={reload} />
        {data && !data.length && <p className="note">Nicio rezervare în ziua asta.</p>}
        {facilities.map((f) => {
          const items = (data ?? [])
            .filter((b) => b.facilityId === f.id)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
          if (!items.length) return null;
          return (
            <section key={f.id}>
              <div className="section-header">
                {f.name} ({items.filter((b) => b.status === 'ACTIVE').length})
              </div>
              <div className="list">
                {items.map((b) => (
                  <Row
                    key={b.id}
                    icon={<Avatar name={b.user.name} />}
                    title={b.user.name}
                    subtitle={`${b.startTime} – ${b.endTime}${f.units.length > 1 ? ` · ${b.unitName}` : ''}`}
                    value={
                      b.status === 'ACTIVE'
                        ? 'Anulează'
                        : b.status === 'CANCELLED'
                          ? 'Anulată'
                          : 'Finalizată'
                    }
                    valueClass={b.status === 'ACTIVE' ? 'text-red' : ''}
                    disabled={b.status !== 'ACTIVE'}
                    onClick={b.status === 'ACTIVE' ? () => cancel(b) : undefined}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
