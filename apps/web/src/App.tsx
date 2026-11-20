import { useState } from 'react';
import { demoApi } from './api/demo';
import { AuthProvider, useAuth } from './auth';
import type { Facility } from './api/types';
import { useLoad } from './lib/useLoad';
import { DEMO } from './mode';
import { AllBookings, BlockedUsers, Maintenance } from './screens/Admin';
import { Facilities } from './screens/Facilities';
import { FacilityCalendar } from './screens/FacilityCalendar';
import { Login } from './screens/Login';
import { MyBookings } from './screens/MyBookings';
import { Profile, type AdminPage } from './screens/Profile';
import { TabBaze, TabProfil, TabRezervari } from './ui/icons';
import { PhoneFrame } from './ui/PhoneFrame';

type Tab = 'baze' | 'rezervari' | 'profil';
type Pushed = { kind: 'facility'; facility: Facility } | { kind: 'admin'; page: AdminPage };

function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: [Tab, string, React.ReactNode][] = [
    ['baze', 'Baze', <TabBaze key="b" />],
    ['rezervari', 'Rezervări', <TabRezervari key="r" />],
    ['profil', 'Profil', <TabProfil key="p" />],
  ];
  return (
    <nav className="tab-bar">
      {items.map(([t, label, icon]) => (
        <button key={t} type="button" className={t === tab ? 'on' : ''} onClick={() => onChange(t)}>
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// cheia pe id-ul userului: la alt cont pornim de la zero (tab, ecrane deschise)
function Shell() {
  const { user } = useAuth();
  return user ? <Signed key={user.id} /> : <Login />;
}

function Signed() {
  const { api } = useAuth();
  const [tab, setTab] = useState<Tab>('baze');
  const [pushed, setPushed] = useState<Pushed | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const facilities = useLoad(() => api.facilities(), [api]);
  const list = facilities.data ?? [];

  const back = () => setPushed(null);
  if (pushed?.kind === 'facility') {
    return (
      <FacilityCalendar
        facility={pushed.facility}
        onBack={back}
        onBooked={(b) => {
          setFresh(b.id);
          setPushed(null);
          setTab('rezervari');
        }}
      />
    );
  }
  if (pushed?.kind === 'admin') {
    if (pushed.page === 'maintenance') return <Maintenance facilities={list} onBack={back} />;
    if (pushed.page === 'blocked') return <BlockedUsers onBack={back} />;
    return <AllBookings facilities={list} onBack={back} />;
  }

  return (
    <div className="screen-col">
      {tab === 'baze' && (
        <Facilities onOpen={(f) => setPushed({ kind: 'facility', facility: f })} />
      )}
      {tab === 'rezervari' && <MyBookings facilities={list} fresh={fresh} />}
      {tab === 'profil' && <Profile onOpen={(page) => setPushed({ kind: 'admin', page })} />}
      <TabBar tab={tab} onChange={setTab} />
    </div>
  );
}

export function App() {
  return (
    <PhoneFrame>
      <AuthProvider api={DEMO ? demoApi : undefined}>
        <Shell />
      </AuthProvider>
    </PhoneFrame>
  );
}
