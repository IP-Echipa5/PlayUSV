import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../auth';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

type Gsi = {
  accounts: {
    id: {
      initialize(o: { client_id: string; callback: (r: { credential: string }) => void }): void;
      renderButton(el: HTMLElement, o: Record<string, unknown>): void;
    };
  };
};

export function Logo() {
  return (
    <div className="logo" aria-hidden>
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none" stroke="#fff" strokeWidth="4.5">
        <rect x="6" y="13" width="44" height="30" rx="6" />
        <circle cx="28" cy="28" r="7.5" />
        <path d="M28 13v30" />
      </svg>
    </div>
  );
}

export function Login() {
  const { api, signIn, notice } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [devOpen, setDevOpen] = useState(false);
  const [email, setEmail] = useState('');
  const googleBtn = useRef<HTMLDivElement>(null);

  // Google Identity Services, doar daca e setat VITE_GOOGLE_CLIENT_ID.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleBtn.current) return;
    const el = googleBtn.current;
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      const google = (window as unknown as { google: Gsi }).google;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: ({ credential }) =>
          api.googleLogin(credential).then(signIn, (e: Error) => setError(e.message)),
      });
      google.accounts.id.renderButton(el, {
        theme: 'filled_blue',
        size: 'large',
        shape: 'rectangular',
        width: 345,
        text: 'continue_with',
        locale: 'ro',
      });
    };
    document.head.appendChild(script);
    return () => script.remove();
  }, [api, signIn]);

  async function devLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      signIn(await api.devLogin(email.trim()));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <main className="login">
      <div className="login-hero">
        <Logo />
        <h1>Campus Sports Booking</h1>
        <p>Rezervă bazinul, sala de fitness și terenurile universității în câteva secunde.</p>
      </div>
      <div className="login-actions">
        {(notice || error) && <p className="note text-red center">{error ?? notice}</p>}
        {GOOGLE_CLIENT_ID ? (
          <div ref={googleBtn} className="google-btn" />
        ) : devOpen ? (
          <form className="dev-login" onSubmit={devLogin}>
            <input
              type="email"
              required
              autoFocus
              placeholder="nume@student.usv.ro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="btn" type="submit">
              Intră (dev-login)
            </button>
          </form>
        ) : (
          <button type="button" className="btn" onClick={() => setDevOpen(true)}>
            Continuă cu Google
          </button>
        )}
        <p className="note center">Doar conturi @student.usv.ro și @usm.ro</p>
      </div>
    </main>
  );
}
