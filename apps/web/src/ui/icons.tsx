import type { FacilityType } from '../api/types';

type P = { size?: number };

export const Chevron = () => (
  <svg className="chevron" width="8" height="13" viewBox="0 0 8 13" aria-hidden>
    <path
      d="M1.5 1.5 6.5 6.5l-5 5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const BackChevron = () => (
  <svg width="12" height="20" viewBox="0 0 12 20" aria-hidden>
    <path
      d="M10 2 2 10l8 8"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Check = () => (
  <svg width="16" height="13" viewBox="0 0 16 13" aria-hidden className="text-blue">
    <path
      d="M1.5 7 6 11.5 14.5 1.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Search = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
    <circle cx="6.5" cy="6.5" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="m10.5 10.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export function FacilityGlyph({ type, size = 19 }: { type: FacilityType } & P) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden {...stroke}>
      {type === 'POOL' && (
        <>
          <path d="M2 8c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 4 0" />
          <path d="M2 13c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 4 0" />
        </>
      )}
      {type === 'GYM' && (
        <>
          <path d="M6 10h8" />
          <rect x="3" y="6" width="3" height="8" rx="1" />
          <rect x="14" y="6" width="3" height="8" rx="1" />
          <path d="M1.5 10h1.5M17 10h1.5" />
        </>
      )}
      {type === 'FOOTBALL' && (
        <>
          <circle cx="10" cy="10" r="8" />
          <path d="m10 6 3 2.2-1.1 3.6H8.1L7 8.2zM10 6V2.5M13 8.2l3.5-1.2M11.9 11.8l2 3M8.1 11.8l-2 3M7 8.2 3.5 7" />
        </>
      )}
      {type === 'BASKETBALL' && (
        <>
          <circle cx="10" cy="10" r="8" />
          <path d="M2 10h16M10 2v16M4.5 4.3c2.2 2.8 2.2 8.6 0 11.4M15.5 4.3c-2.2 2.8-2.2 8.6 0 11.4" />
        </>
      )}
    </svg>
  );
}

export const facilityColor: Record<FacilityType, string> = {
  POOL: 'var(--cyan)',
  GYM: 'var(--purple)',
  FOOTBALL: 'var(--green)',
  BASKETBALL: 'var(--orange)',
};

export const FacilityIcon = ({ type, muted }: { type: FacilityType; muted?: boolean }) => (
  <span
    className="icon-tile"
    style={{ background: muted ? 'var(--disabled)' : facilityColor[type] }}
  >
    <FacilityGlyph type={type} />
  </span>
);

export const TabBaze = () => (
  <svg width="25" height="22" viewBox="0 0 25 22" aria-hidden {...stroke}>
    <rect x="2" y="3" width="21" height="16" rx="3" />
    <circle cx="12.5" cy="11" r="3.5" />
    <path d="M12.5 3v16" />
  </svg>
);

export const TabRezervari = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden {...stroke}>
    <rect x="2" y="4" width="18" height="16" rx="3" />
    <path d="M2 9h18M7 2v4M15 2v4M7.5 14l2.5 2.5 4.5-5" />
  </svg>
);

export const TabProfil = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden {...stroke}>
    <circle cx="11" cy="7" r="4.5" />
    <path d="M2.5 20.5c1-4.5 4.4-7 8.5-7s7.5 2.5 8.5 7" />
  </svg>
);

export const Wrench = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden {...stroke}>
    <path d="M12.5 2.5a4.5 4.5 0 0 0-4.3 5.9L2.5 14.1a2 2 0 0 0 2.9 2.9l5.7-5.7a4.5 4.5 0 0 0 5.9-4.3l-2.6 2.6-2.8-.7-.7-2.8z" />
  </svg>
);

export const NoEntry = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden {...stroke}>
    <circle cx="10" cy="10" r="7.5" />
    <path d="m4.7 15.3 10.6-10.6" />
  </svg>
);

export const Calendar = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" aria-hidden {...stroke}>
    <rect x="2.5" y="4" width="15" height="13.5" rx="2.5" />
    <path d="M2.5 8.5h15M6.5 2v3.5M13.5 2v3.5" />
  </svg>
);
