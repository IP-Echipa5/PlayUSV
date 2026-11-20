import { useRef, useState, type ReactNode } from 'react';
import { dayLetter, dayNumber } from '../lib/time';
import { BackChevron } from './icons';

export function NavBar({
  back,
  title,
  onBack,
}: {
  back: string;
  title: string;
  onBack: () => void;
}) {
  return (
    <header className="nav-bar">
      <button type="button" className="nav-back" onClick={onBack}>
        <BackChevron />
        {back}
      </button>
      <h1>{title}</h1>
    </header>
  );
}

export function Segmented<T extends string>(p: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="segmented" role="tablist">
      {p.options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={o.value === p.value}
          className={o.value === p.value ? 'on' : ''}
          onClick={() => p.onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function DayStrip({
  days,
  value,
  onChange,
}: {
  days: string[];
  value: string;
  onChange: (d: string) => void;
}) {
  return (
    <div className="day-strip">
      {days.map((d) => (
        <button
          key={d}
          type="button"
          className={d === value ? 'day on' : 'day'}
          onClick={() => onChange(d)}
        >
          <span className="day-letter">{dayLetter(d)}</span>
          <span className="day-circle">{dayNumber(d)}</span>
        </button>
      ))}
    </div>
  );
}

export function Status({
  loading,
  error,
  onRetry,
}: {
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}) {
  if (error)
    return (
      <p className="note text-red">
        {error}{' '}
        {onRetry && (
          <button type="button" className="text-blue" onClick={onRetry}>
            Încearcă din nou
          </button>
        )}
      </p>
    );
  return loading ? <p className="note">Se încarcă…</p> : null;
}

/** Rand care se gliseaza spre stanga si arata un buton rosu (ca in iOS). */
export function SwipeRow({
  children,
  action,
  onAction,
}: {
  children: ReactNode;
  action: string;
  onAction: () => void;
}) {
  const W = 96;
  const [x, setX] = useState(0);
  const start = useRef<{ px: number; x: number; moved: boolean } | null>(null);
  return (
    <div className="swipe">
      <button
        type="button"
        className="swipe-action"
        style={{ width: W }}
        onClick={onAction}
        tabIndex={x ? 0 : -1}
      >
        {action}
      </button>
      <div
        className="swipe-content"
        style={{ transform: `translateX(${x}px)`, transition: start.current ? 'none' : undefined }}
        onPointerDown={(e) => {
          start.current = { px: e.clientX, x, moved: false };
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s) return;
          const dx = e.clientX - s.px;
          if (Math.abs(dx) > 4) {
            s.moved = true;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }
          setX(Math.max(-W, Math.min(0, s.x + dx)));
        }}
        onPointerUp={() => {
          const s = start.current;
          start.current = null;
          if (s && !s.moved) {
            setX(s.x ? 0 : -W);
            return;
          }
          setX((cur) => (cur < -W / 2 ? -W : 0));
        }}
        onPointerCancel={() => {
          start.current = null;
          setX(0);
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grabber" />
        <header className="sheet-head">
          <button type="button" className="text-blue" onClick={onClose}>
            Anulează
          </button>
          <h2>{title}</h2>
          <span />
        </header>
        <div className="sheet-body">{children}</div>
        <div className="sheet-foot">{footer}</div>
      </section>
    </div>
  );
}
