import type { ReactNode } from 'react';

/** On a wide screen the app sits in a 393x852 phone (the Figma frame); on a phone it fills the screen. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="stage">
      <div className="phone">
        <div className="status-bar" aria-hidden>
          <span>9:41</span>
          <svg width="78" height="13" viewBox="0 0 78 13">
            <g fill="currentColor">
              <rect x="0" y="8" width="3" height="5" rx="1" />
              <rect x="5" y="6" width="3" height="7" rx="1" />
              <rect x="10" y="3" width="3" height="10" rx="1" />
              <rect x="15" y="0" width="3" height="13" rx="1" />
              <path d="M33 3.5a9 9 0 0 1 12 0l-1.6 1.7a6.6 6.6 0 0 0-8.8 0zM36 6.7a4.6 4.6 0 0 1 6 0L39 10z" />
              <rect x="52" y="1" width="23" height="11" rx="3" fill="none" stroke="currentColor" />
              <rect x="54" y="3" width="19" height="7" rx="1.5" />
              <rect x="76" y="4.5" width="1.5" height="4" rx="0.7" />
            </g>
          </svg>
        </div>
        <div className="phone-body">{children}</div>
        <div className="home-indicator" aria-hidden />
      </div>
    </div>
  );
}
