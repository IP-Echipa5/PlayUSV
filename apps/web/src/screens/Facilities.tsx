import { useState } from 'react';
import { useAuth } from '../auth';
import type { Facility } from '../api/types';
import { useLoad } from '../lib/useLoad';
import { FacilityIcon, Search } from '../ui/icons';
import { Status } from '../ui/parts';
import { Row } from '../ui/Row';

export function facilitySubtitle(f: Facility) {
  const size =
    f.capacityPerSlot > 1
      ? `${f.capacityPerSlot} pers./interval`
      : f.units.length === 1
        ? '1 teren'
        : `${f.units.length} terenuri`;
  return `${f.openTime} – ${f.closeTime} · ${size}`;
}

export function Facilities({ onOpen }: { onOpen: (f: Facility) => void }) {
  const { api } = useAuth();
  const { data, error, loading, reload } = useLoad(() => api.facilities(), [api]);
  const [q, setQ] = useState('');
  const shown = (data ?? []).filter((f) => f.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <main className="screen">
      <h1 className="large-title">Baze sportive</h1>
      <label className="search">
        <Search />
        <input
          type="search"
          placeholder="Caută o bază"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </label>
      <div className="section-header">Bazele universității</div>
      <Status loading={loading && !data} error={error} onRetry={reload} />
      {shown.length > 0 && (
        <div className="list">
          {shown.map((f) => (
            <Row
              key={f.id}
              icon={<FacilityIcon type={f.type} />}
              title={f.name}
              subtitle={facilitySubtitle(f)}
              chevron
              onClick={() => onOpen(f)}
            />
          ))}
        </div>
      )}
      {data && !shown.length && <p className="note">Nicio bază nu se potrivește cu „{q}”.</p>}
      <p className="note">
        Studenții pot rezerva intervale de la 18:00. Un interval durează 30 de minute.
      </p>
    </main>
  );
}
