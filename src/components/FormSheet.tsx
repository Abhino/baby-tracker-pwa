import { useMemo, useState } from 'react';
import { blank, remove, save, useStore } from '../lib/store';
import { FORMS, defaults, validate, type FormId } from '../lib/forms';
import { fromDisp, round, toDisp, unitLabel } from '../lib/units';
import type { Activity } from '../lib/types';
import { Sheet } from './Sheet';

const QUICK = { floz: [1, 2, 3, 4, 5, 6], ml: [30, 60, 90, 120, 150, 180] };
const toLocal = (ms: number) => new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function FormSheet({ id, existing, onClose }: { id: FormId; existing?: Activity; onClose: () => void }) {
  const { acts, units } = useStore();
  const def = FORMS[id];
  const last = useMemo(
    () => Object.values(acts).filter((a) => !a.deleted && a.type === def.type && a.id !== existing?.id).sort((a, b) => b.startAt - a.startAt)[0],
    [acts, def.type, existing?.id],
  );
  const initial = () => (existing ? { ...existing.data } : defaults(id, last));
  const [d, setD] = useState<Record<string, any>>(initial);
  const [n, setN] = useState<Record<string, string>>(() => {
    const src = initial();
    const out: Record<string, string> = {};
    for (const f of def.fields) if (f.kind === 'num' && src[f.key] !== undefined) out[f.key] = String(round(toDisp(f.unit!, src[f.key], units), 2));
    return out;
  });
  const now = Date.now();
  const newSleep = id === 'sleep' && !existing;
  const [start, setStart] = useState(toLocal(existing ? existing.startAt : newSleep ? now - 3600000 : now));
  const [end, setEnd] = useState(existing ? (existing.endAt ? toLocal(existing.endAt) : '') : newSleep ? toLocal(now) : '');
  const [note, setNote] = useState(existing?.note ?? '');
  const [err, setErr] = useState('');

  const submit = () => {
    const data: Record<string, any> = { ...d };
    for (const f of def.fields) {
      if (f.kind === 'num') {
        const v = parseFloat((n[f.key] ?? '').replace(',', '.'));
        if (Number.isFinite(v)) data[f.key] = round(fromDisp(f.unit!, v, units), 2);
        else delete data[f.key];
      }
      if (f.kind === 'text' && !String(data[f.key] ?? '').trim()) delete data[f.key];
    }
    for (const f of def.fields) if (f.showIf && !f.showIf(data)) delete data[f.key];
    const problem = validate(id, data);
    if (problem) return setErr(problem);
    const startAt = new Date(start).getTime();
    const endAt = def.hasEnd && end ? new Date(end).getTime() : null;
    if (!Number.isFinite(startAt)) return setErr('Pick a valid time');
    if (endAt !== null && endAt <= startAt) return setErr('End must be after the start');
    if (existing) save({ ...existing, data, note: note.trim(), startAt, endAt });
    else save({ ...blank(def.type, data, startAt), endAt, note: note.trim() });
    onClose();
  };

  return (
    <Sheet title={existing ? `Edit ${def.title.toLowerCase()}` : def.title} color={def.color} onClose={onClose}>
      {def.fields.filter((f) => !f.showIf || f.showIf(d)).map((f) => (
        <div className="fld" key={f.key}>
          <label>{f.label}{f.kind === 'num' ? ` (${unitLabel(f.unit!, units)})` : ''}</label>
          {f.kind === 'chips' && (
            <div className="chips">
              {f.options!.map(([v, l]) => (
                <button key={v} className={'chip' + (d[f.key] === v ? ' on' : '')} onClick={() => setD({ ...d, [f.key]: v })}>{l}</button>
              ))}
            </div>
          )}
          {f.kind === 'text' && (
            <input className="inp" value={d[f.key] ?? ''} placeholder={f.placeholder} onChange={(e) => { setErr(''); setD({ ...d, [f.key]: e.target.value }); }} />
          )}
          {f.kind === 'num' && (
            <>
              <input className="inp" inputMode="decimal" value={n[f.key] ?? ''} placeholder="0" onChange={(e) => { setErr(''); setN({ ...n, [f.key]: e.target.value }); }} />
              {f.quick && (
                <div className="chips" style={{ marginTop: 8 }}>
                  {QUICK[units.volume].map((q) => (
                    <button key={q} className={'chip' + (parseFloat(n[f.key]) === q ? ' on' : '')} onClick={() => setN({ ...n, [f.key]: String(q) })}>{q}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
      <div className="fld">
        <label>{def.hasEnd ? 'Start' : 'Time'}</label>
        <input className="inp" type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
      </div>
      {def.hasEnd && (
        <div className="fld">
          <label>End (leave empty if still asleep)</label>
          <input className="inp" type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      )}
      <div className="fld">
        <label>Note</label>
        <input className="inp" value={note} placeholder="Optional" onChange={(e) => setNote(e.target.value)} />
      </div>
      {err && <div className="err" role="alert">{err}</div>}
      <button className="btn" onClick={submit}>Save</button>
      {existing && (
        <button className="btn ghost danger" style={{ marginTop: 10 }} onClick={() => { if (confirm('Delete this entry?')) { remove(existing); onClose(); } }}>
          Delete
        </button>
      )}
    </Sheet>
  );
}
