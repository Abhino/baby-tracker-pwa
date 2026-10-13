import { useEffect, useState } from 'react';
import { Icon, type IconName } from './icons';
import { missingConfig, signIn, signOutUser, watchAuth } from './lib/firebase';
import { initStore, setUser, startSyncLoop, useStore } from './lib/store';
import { ActivityTab } from './components/ActivityTab';
import { HistoryTab } from './components/HistoryTab';
import { TrendsTab } from './components/TrendsTab';
import { AccountTab } from './components/AccountTab';

type Tab = 'activity' | 'history' | 'trends' | 'account';
const TABS: [Tab, string, IconName][] = [
  ['activity', 'Activity', 'activity'],
  ['history', 'History', 'history'],
  ['trends', 'Trends', 'trends'],
  ['account', 'Account', 'account'],
];

function SignIn() {
  const [err, setErr] = useState('');
  return (
    <div className="center">
      <h1 className="serif">Baby Log</h1>
      <p className="dim">Sign in with the Google account your family list knows.</p>
      <button className="btn" style={{ maxWidth: 280 }} onClick={() => signIn().catch((e) => setErr(e.code === 'auth/popup-closed-by-user' ? '' : e.message))}>
        Continue with Google
      </button>
      {err && <p className="err">{err}</p>}
    </div>
  );
}

export default function App() {
  const s = useStore();
  const [tab, setTab] = useState<Tab>('activity');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    void initStore();
    const un = watchAuth((u) => setUser(u?.email?.toLowerCase() ?? null));
    const stop = startSyncLoop();
    return () => { un(); stop(); };
  }, []);

  if (missingConfig.length) {
    return (
      <div className="center">
        <h1 className="serif">Setup needed</h1>
        <p className="dim">This build is missing: {missingConfig.join(', ')}.</p>
        <p className="dim sm">Add them under repo Settings → Secrets and variables → Actions → Variables, then re-run the deploy workflow.</p>
      </div>
    );
  }
  if (!s.ready || !s.authReady) return <div className="center dim">Loading…</div>;
  if (!s.user) return <SignIn />;
  if (s.denied) {
    return (
      <div className="center">
        <h1 className="serif">Not on the list</h1>
        <p className="dim">{s.user} isn’t allowed to use this app. Ask the owner to add it, then sign in again.</p>
        <button className="btn" style={{ maxWidth: 280 }} onClick={() => void signOutUser()}>Sign out</button>
      </div>
    );
  }

  const goHistory = (f: string) => { setFilter(f); setTab('history'); window.scrollTo(0, 0); };
  return (
    <>
      <main className="app">
        {tab === 'activity' && <ActivityTab onHistory={goHistory} />}
        {tab === 'history' && <HistoryTab filter={filter} setFilter={setFilter} />}
        {tab === 'trends' && <TrendsTab />}
        {tab === 'account' && <AccountTab />}
      </main>
      <nav className="tabbar" aria-label="Main">
        <div className="tabs">
          {TABS.map(([id, label, icon]) => (
            <button key={id} className={tab === id ? 'on' : ''} aria-current={tab === id ? 'page' : undefined} onClick={() => { setTab(id); window.scrollTo(0, 0); }}>
              <Icon name={icon} size={24} />{label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
