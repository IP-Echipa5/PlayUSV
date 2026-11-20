import type { ReactNode } from 'react';
import { Chevron } from './icons';

type RowProps = {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  valueClass?: string;
  titleClass?: string;
  chevron?: boolean;
  selected?: boolean;
  disabled?: boolean;
  trailing?: ReactNode;
  onClick?: () => void;
};

/** Un rand dintr-o lista grupata iOS (titlu, subtitlu, valoare la dreapta, chevron). */
export function Row(p: RowProps) {
  const cls = ['row', p.icon && 'has-icon', p.selected && 'selected'].filter(Boolean).join(' ');
  const body = (
    <>
      {p.icon}
      <span className="row-text">
        <span className={`row-title ${p.titleClass ?? ''}`}>{p.title}</span>
        {p.subtitle && <span className="row-subtitle">{p.subtitle}</span>}
      </span>
      {p.value !== undefined && (
        <span className={`row-value ${p.valueClass ?? ''}`}>{p.value}</span>
      )}
      {p.trailing}
      {p.chevron && <Chevron />}
    </>
  );
  return p.onClick ? (
    <button type="button" className={cls} onClick={p.onClick} disabled={p.disabled}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export const initials = (name: string) =>
  name
    .replace(/^(Prof|Conf|Lect|Dr)\.\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

const avatarColors = ['#5856d6', '#ff2d55', '#34c759', '#30b0c7', '#ff9500', '#af52de', '#007aff'];

export function Avatar({ name, size }: { name: string; size?: number }) {
  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
  const style = size
    ? { width: size, height: size, fontSize: size * 0.42, background: '#8e8e93' }
    : { background: avatarColors[hash % avatarColors.length] };
  return (
    <span className="avatar" style={style}>
      {initials(name)}
    </span>
  );
}
