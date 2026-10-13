import { useMemo, useState } from 'react';
import { Icon } from '../icons';
import { useStore } from '../lib/store';
import { formIdOf } from '../lib/forms';
import { clock, dayHeading, dayStart, describe } from '../lib/describe';
import type { Activity, ActivityType } from '../lib/types';
import { FormSheet } from './FormSheet';

export const FILTERS: [string, string, ActivityType[] | null][] = [
  ['all', 'All', null],
  ['feed', 'Feed', ['bottle', 'solid']],
  ['pump', 'Pump', ['pump']],
  ['diaper', 'Diaper', ['diaper']],
  ['sleep', 'Sleep', ['sleep']],
  ['first', 'Firsts', ['first']],
  ['growth', 'Growth', ['growth']],
  ['health', 'Health', ['medication', 'temperature', 'vaccine']],
];

export function HistoryTab({ filter, setFilter }: { filter: string; setFilter: (f: string) => void }) {
  const { acts, units } = useStore();
  const [limit, setLimit] = useState(80);
  const [edit, setEdit] = useState<Activity | null>(null);
  const types = FILTERS.find((f) => f[0] === filter)?.[2] ?? null;
  const list = useMemo(
    () => Object.values(acts).filter((a) => !a.deleted && (!types || types.includes(a.type))).sort((a, b) => b.startAt - a.startAt),
    [acts, types],
  );
  const now = Date.now();
  const shown = list.slice(0, limit);

  const groups: { key: number; items: Activity[] }[] = [];
  for (const a of shown) {
    const k = dayStart(a.startAt);
    if (!groups.length || groups[groups.length - 1].key !== k) groups.push({ key: k, items: [] });
    groups[groups.length - 1].items.push(a);
  }

  return (
    <>
      <header className="top"><h1 className="serif">History</h1></header>
      <div className="filters">
        {FILTERS.map(([id, label]) => (
          <button key={id} className={'chip' + (filter === id ? ' on' : '')} onClick={() => { setFilter(id); setLimit(80); }}>{label}</button>
        ))}
      </div>
      {list.length === 0 && <div className="empty">Nothing here yet.</div>}
      {groups.map((g) => (
        <section key={g.key} className="day">
          <h2 className="serif">{dayHeading(g.key, now)}</h2>
          <div className="card">
            {g.items.map((a) => {
              const d = describe(a, units);
              const time = a.type === 'sleep' && a.endAt ? `${clock(a.startAt)}–${clock(a.endAt)}` : clock(a.startAt);
              return (
                <button key={a.id} className="hrow" onClick={() => setEdit(a)}>
                  <span className="blob" style={{ background: d.color, width: 38, height: 38 }}><Icon name={d.icon} size={19} /></span>
                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <div className="trunc">{d.title}</div>
                    {(d.detail || a.note) && <div className="dim sm trunc">{[d.detail, a.note].filter(Boolean).join(' · ')}</div>}
                  </div>
                  <div className="dim sm">{time}</div>
                </button>
              );
            })}
          </div>
        </section>
      ))}
      {list.length > limit && <button className="btn ghost" onClick={() => setLimit(limit + 80)}>Show more</button>}
      {edit && <FormSheet id={formIdOf(edit)} existing={edit} onClose={() => setEdit(null)} />}
    </>
  );
}
