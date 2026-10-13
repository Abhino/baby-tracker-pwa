import { useMemo } from 'react';
import { useStore } from '../lib/store';
import { bottleMl, dayHeading, dayStart, durationLabel, pumpMl } from '../lib/describe';
import { fmt, toDisp, unitLabel } from '../lib/units';
import type { Activity, UnitKind, Units } from '../lib/types';

const DAY = 86_400_000;

function Chart({ title, points, kind, units }: { title: string; points: [number, number][]; kind: UnitKind; units: Units }) {
  const pts = points.map(([t, v]) => [t, toDisp(kind, v, units)] as [number, number]);
  const last = pts[pts.length - 1];
  const W = 300, H = 100, P = 8;
  let body = <text x="150" y="55" textAnchor="middle" fill="#8a90a8" fontSize="12">Add another measurement to see a trend</text>;
  if (pts.length >= 2) {
    const t0 = pts[0][0], t1 = last[0];
    const lo = Math.min(...pts.map((p) => p[1])), hi = Math.max(...pts.map((p) => p[1]));
    const x = (t: number) => P + ((t - t0) / (t1 - t0 || 1)) * (W - 2 * P);
    const y = (v: number) => H - P - ((v - lo) / (hi - lo || 1)) * (H - 2 * P);
    body = (
      <>
        <polyline points={pts.map((p) => `${x(p[0])},${y(p[1])}`).join(' ')} fill="none" stroke="#b0e08e" strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={x(p[0])} cy={y(p[1])} r="3.5" fill="#b0e08e" />)}
      </>
    );
  }
  return (
    <div className="card pad">
      <div className="row between"><span className="serif big">{title}</span>{last && <span className="val">{Math.round(last[1] * 100) / 100} {unitLabel(kind, units)}</span>}</div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${title} over time`}>{body}</svg>
    </div>
  );
}

export function TrendsTab() {
  const { acts, units } = useStore();
  const list = useMemo(() => Object.values(acts).filter((a) => !a.deleted), [acts]);
  const now = Date.now();
  const today = dayStart(now);

  const days = Array.from({ length: 7 }, (_, i) => today - i * DAY).map((start) => {
    const of = (f: (a: Activity) => boolean) => list.filter((a) => a.startAt >= start && a.startAt < start + DAY && f(a));
    const bottles = of((a) => a.type === 'bottle');
    return {
      start,
      bottles: bottles.length,
      bottleMl: bottles.reduce((s, a) => s + bottleMl(a), 0),
      pumped: of((a) => a.type === 'pump').reduce((s, a) => s + pumpMl(a), 0),
      diapers: of((a) => a.type === 'diaper').length,
      sleep: of((a) => a.type === 'sleep' && a.endAt !== null).reduce((s, a) => s + (a.endAt! - a.startAt), 0),
    };
  });

  const stock =
    list.filter((a) => a.type === 'pump').reduce((s, a) => s + pumpMl(a), 0) -
    list.filter((a) => a.type === 'bottle').reduce((s, a) => s + (a.data.breastMl ?? 0), 0);
  const series = (key: string) =>
    list.filter((a) => a.type === 'growth' && key in a.data).sort((a, b) => a.startAt - b.startAt).map((a) => [a.startAt, a.data[key]] as [number, number]);

  return (
    <>
      <header className="top"><h1 className="serif">Trends</h1></header>
      <div className="card pad">
        <div className="serif big">Milk stock</div>
        <div className="stock">{fmt('vol', Math.max(0, stock), units)}</div>
        <div className="dim sm">Estimate: everything pumped minus breast milk fed. Doesn’t include freezer stash from before you started logging.</div>
      </div>
      <h2 className="serif sec">Last 7 days</h2>
      <div className="card">
        <div className="trow head"><span>Day</span><span>Bottles</span><span>Pumped</span><span>Diapers</span><span>Sleep</span></div>
        {days.map((d) => (
          <div className="trow" key={d.start}>
            <span>{dayHeading(d.start, now)}</span>
            <span>{d.bottles ? `${d.bottles} · ${fmt('vol', d.bottleMl, units)}` : '–'}</span>
            <span>{d.pumped ? fmt('vol', d.pumped, units) : '–'}</span>
            <span>{d.diapers || '–'}</span>
            <span>{d.sleep ? durationLabel(d.sleep) : '–'}</span>
          </div>
        ))}
      </div>
      <h2 className="serif sec">Growth</h2>
      <Chart title="Weight" points={series('weightKg')} kind="weight" units={units} />
      <Chart title="Height" points={series('heightCm')} kind="length" units={units} />
      <Chart title="Head size" points={series('headCm')} kind="length" units={units} />
    </>
  );
}
