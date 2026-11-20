import { resetDemo } from '../api/demo';
import { useAuth } from '../auth';
import { DEMO } from '../mode';
import type { Role } from '../api/types';
import { useLoad } from '../lib/useLoad';
import { Calendar, NoEntry, Wrench } from '../ui/icons';
import { Avatar, Row } from '../ui/Row';

export const roleLabel: Record<Role, string> = {
  STUDENT: 'Student',
  TEACHER: 'Profesor',
  ADMIN: 'Administrator',
};

export type AdminPage = 'maintenance' | 'blocked' | 'all';

export function Profile({ onOpen }: { onOpen: (p: AdminPage) => void }) {
  const { api, user, signOut } = useAuth();
  const admin = user?.role === 'ADMIN';
  const blocked = useLoad(
    () => (admin ? api.users({ blocked: true }) : Promise.resolve([])),
    [api, admin],
  );
  if (!user) return null;

  const tile = (bg: string, icon: React.ReactNode) => (
    <span className="icon-tile" style={{ background: bg }}>
      {icon}
    </span>
  );

  return (
    <main className="screen">
      <h1 className="large-title">Profil</h1>
      <div className="list">
        <div className="row has-icon account">
          <Avatar name={user.name} size={56} />
          <span className="row-text">
            <span className="row-title account-name">{user.name}</span>
            <span className="row-subtitle">
              {roleLabel[user.role]} · {user.email}
            </span>
          </span>
        </div>
      </div>
      {admin && (
        <>
          <div className="section-header">Administrare</div>
          <div className="list">
            <Row
              icon={tile('var(--orange)', <Wrench />)}
              title="Mentenanță baze"
              chevron
              onClick={() => onOpen('maintenance')}
            />
            <Row
              icon={tile('var(--red)', <NoEntry />)}
              title="Conturi blocate"
              value={blocked.data ? String(blocked.data.length) : ''}
              chevron
              onClick={() => onOpen('blocked')}
            />
            <Row
              icon={tile('var(--blue)', <Calendar />)}
              title="Toate rezervările"
              chevron
              onClick={() => onOpen('all')}
            />
          </div>
          <p className="note">
            Secțiunea Administrare apare doar pentru conturile de administrator.
          </p>
        </>
      )}
      {DEMO && (
        <>
          <div className="section-header">Demo</div>
          <div className="list">
            <button
              type="button"
              className="row text-blue"
              onClick={() => {
                resetDemo();
                signOut('Datele demo au fost resetate.');
              }}
            >
              Resetează datele demo
            </button>
          </div>
          <p className="note">Pune la loc bazele, conturile și rezervările de la început.</p>
        </>
      )}
      <div className="list logout">
        <button type="button" className="row center text-red" onClick={() => signOut()}>
          Deconectare
        </button>
      </div>
    </main>
  );
}
