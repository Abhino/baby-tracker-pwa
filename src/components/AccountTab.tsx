import { useRef, useState } from 'react';
import { apiExport, apiImport } from '../lib/api';
import { signOutUser } from '../lib/firebase';
import { fullResync, setUnits, syncNow, useStore } from '../lib/store';
import type { Units } from '../lib/types';

function Seg<K extends keyof Units>({ label, k, opts, units }: { label: string; k: K; opts: [Units[K], string][]; units: Units }) {
  return (
    <div className="fld">
      <label>{label}</label>
      <div className="chips">
        {opts.map(([v, l]) => (
          <button key={String(v)} className={'chip' + (units[k] === v ? ' on' : '')} onClick={() => setUnits({ ...units, [k]: v })}>{l}</button>
        ))}
      </div>
    </div>
  );
}

export function AccountTab() {
  const { user, units, outbox, syncing, error } = useStore();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const doImport = async (f: File) => {
    setBusy(true); setMsg('Importing…');
    try {
      const r = await apiImport(await f.text());
      setMsg(`Read ${r.total} rows. Imported ${r.imported} new entries; ${r.skipped} skipped (types not tracked here) and ${r.parsed - r.imported} were already imported.`);
      void syncNow();
    } catch (e) { setMsg(`Import failed: ${e instanceof Error ? e.message : e}`); }
    setBusy(false);
  };
  const doExport = async () => {
    try {
      const url = URL.createObjectURL(await apiExport());
      const a = document.createElement('a');
      a.href = url; a.download = `baby-log-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { setMsg(`Export failed: ${e instanceof Error ? e.message : e}`); }
  };

  return (
    <>
      <header className="top"><h1 className="serif">Account</h1></header>
      <div className="card pad">
        <div className="dim sm">Signed in as</div>
        <div>{user}</div>
        <div className="dim sm" style={{ marginTop: 10 }}>
          {error ? `Sync problem: ${error}` : syncing ? 'Syncing…' : outbox.length ? `${outbox.length} entries waiting to sync` : 'Everything is synced'}
        </div>
        <div className="row" style={{ marginTop: 12, gap: 8 }}>
          <button className="chip" onClick={() => void syncNow()}>Sync now</button>
          <button className="chip" onClick={() => { if (confirm('Re-download everything from the server?')) fullResync(); }}>Full resync</button>
        </div>
      </div>

      <div className="card pad">
        <Seg label="Volume" k="volume" units={units} opts={[['floz', 'fl oz'], ['ml', 'ml']]} />
        <Seg label="Weight and length" k="growth" units={units} opts={[['metric', 'kg / cm'], ['imperial', 'lb / in']]} />
        <Seg label="Temperature" k="temp" units={units} opts={[['C', '°C'], ['F', '°F']]} />
      </div>

      <div className="card pad">
        <div className="serif big">Your data</div>
        <p className="dim sm">Import a Nara Baby CSV export. Safe to run again: entries already imported are skipped.</p>
        <input ref={file} type="file" accept=".csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) void doImport(f); e.target.value = ''; }} />
        <div className="row" style={{ gap: 8 }}>
          <button className="chip" disabled={busy} onClick={() => file.current?.click()}>Import Nara CSV</button>
          <button className="chip" onClick={() => void doExport()}>Export CSV</button>
        </div>
        {msg && <p className="sm" role="status">{msg}</p>}
      </div>

      <button className="btn ghost" onClick={() => void signOutUser()}>Sign out</button>
    </>
  );
}
