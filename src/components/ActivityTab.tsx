import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../icons';
import { blank, save, useStore } from '../lib/store';
import { COLORS, formIdOf, type FormId } from '../lib/forms';
import { ago, bottleMl, clock, describe, durationLabel, shortDate, stamp } from '../lib/describe';
import { fmt } from '../lib/units';
import type { Activity } from '../lib/types';
import { Chooser, type Choice } from './Sheet';
import { FormSheet } from './FormSheet';

function useNow(ms: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

function Card({ title, color, onPlus, children }: { title: string; color: string; onPlus: () => void; children: ReactNode }) {
  return (
    <section className="card">
      <div className="card-hd" style={{ background: color }}>{title}</div>
      <button className="plus" onClick={onPlus} aria-label={`Add ${title}`}><Icon name="plus" size={26} /></button>
      {children}
    </section>
  );
}
const Blob = ({ icon, color, size = 52 }: { icon: IconName; color: string; size?: number }) => (
  <span className="blob" style={{ background: color, width: size, height: size }}><Icon name={icon} size={size * 0.5} /></span>
);
function Summary({ icon, color, line1, line2, right }: { icon: IconName; color: string; line1: string; line2: string; right?: ReactNode }) {
  return (
    <div className="summary">
      <Blob icon={icon} color={color} />
      <div style={{ flex: 1 }}><div className="serif big">{line1}</div><div className="dim">{line2}</div></div>
      {right}
    </div>
  );
}
const Link = ({ label, onClick, icon = 'right' }: { label: string; onClick: () => void; icon?: IconName }) => (
  <button className="link" onClick={onClick}><span>{label}</span><Icon name={icon} size={20} /></button>
);
function LatestRow({ icon, color, label, date, value, onClick }: { icon: IconName; color: string; label: string; date: string; value: string; onClick: () => void }) {
  return (
    <button className="lrow" onClick={onClick}>
      <Blob icon={icon} color={color} size={44} />
      <div style={{ flex: 1, textAlign: 'left' }}><div className="serif big">{label}</div><div className="dim sm">{date}</div></div>
      <div className="val">{value}</div><Icon name="right" size={18} />
    </button>
  );
}

type Open = { t: 'form'; id: FormId; existing?: Activity } | { t: 'choose'; which: 'feed' | 'sleep' | 'growth' | 'health' } | null;

export function ActivityTab({ onHistory }: { onHistory: (f: string) => void }) {
  const { acts, units, outbox, error, syncing } = useStore();
  const now = useNow(15000);
  const [open, setOpen] = useState<Open>(null);
  const [showFeeds, setShowFeeds] = useState(false);

  const list = useMemo(() => Object.values(acts).filter((a) => !a.deleted).sort((a, b) => b.startAt - a.startAt), [acts]);
  const ofType = (...t: Activity['type'][]) => list.filter((a) => t.includes(a.type));
  const form = (id: FormId) => setOpen({ t: 'form', id });
  const edit = (a: Activity) => setOpen({ t: 'form', id: formIdOf(a), existing: a });
  const latestWith = (type: Activity['type'], key?: string) => ofType(type).find((a) => !key || key in a.data);

  const feeds = ofType('bottle', 'solid');
  const lastDiaper = ofType('diaper')[0];
  const lastPump = ofType('pump')[0];
  const sleeps = ofType('sleep');
  const running = sleeps.find((s) => s.endAt === null);
  const lastSleep = sleeps.find((s) => s.endAt !== null);
  const firsts = ofType('first');

  const choices: Record<string, Choice[]> = {
    feed: [{ label: 'Bottle', icon: 'bottle', run: () => form('bottle') }, { label: 'Solids', icon: 'spoon', run: () => form('solid') }],
    sleep: [
      ...(running ? [] : [{ label: 'Start sleep now', icon: 'moon' as IconName, run: () => save(blank('sleep')) }]),
      { label: 'Add past sleep', icon: 'history', run: () => form('sleep') },
    ],
    growth: [{ label: 'Weight', icon: 'scale', run: () => form('weight') }, { label: 'Height', icon: 'ruler', run: () => form('height') }, { label: 'Head size', icon: 'tape', run: () => form('head') }],
    health: [{ label: 'Medication', icon: 'pill', run: () => form('medication') }, { label: 'Temperature', icon: 'thermo', run: () => form('temperature') }, { label: 'Vaccine', icon: 'syringe', run: () => form('vaccine') }],
  };
  const chooserTitle = { feed: 'Feed', sleep: 'Sleep', growth: 'Growth', health: 'Health' };
  const chooserColor = { feed: COLORS.feed, sleep: COLORS.sleep, growth: COLORS.growth, health: COLORS.health };

  const healthRow = (type: Activity['type'], label: string, icon: IconName, value: (a: Activity) => string) => {
    const a = latestWith(type);
    return <LatestRow icon={icon} color={COLORS.health} label={label} date={a ? shortDate(a.startAt) : 'Not logged'} value={a ? value(a) : '–'} onClick={() => onHistory('health')} />;
  };
  const growthRow = (key: string, label: string, icon: IconName, kind: 'weight' | 'length') => {
    const a = latestWith('growth', key);
    return <LatestRow icon={icon} color={COLORS.growth} label={label} date={a ? shortDate(a.startAt) : 'Not logged'} value={a ? fmt(kind, a.data[key], units) : '–'} onClick={() => onHistory('growth')} />;
  };

  return (
    <>
      <header className="top">
        <h1 className="serif">{new Date(now).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</h1>
        {(outbox.length > 0 || error) && (
          <div className="sync">{error ? 'Can’t reach the server. Entries are saved on this phone.' : syncing ? 'Syncing…' : `${outbox.length} waiting to sync`}</div>
        )}
      </header>

      <Card title="Feed" color={COLORS.feed} onPlus={() => setOpen({ t: 'choose', which: 'feed' })}>
        <Summary icon={feeds[0]?.type === 'solid' ? 'spoon' : 'bottle'} color="#d9a93a" line1="Last feeding" line2={feeds[0] ? ago(feeds[0].startAt, now) : 'Nothing logged yet'} />
        {feeds.length > 0 && <Link label={showFeeds ? 'Show less' : 'Show more'} icon={showFeeds ? 'up' : 'down'} onClick={() => setShowFeeds(!showFeeds)} />}
        {showFeeds && feeds.slice(0, 8).map((a) => {
          const dsc = describe(a, units);
          return (
            <button key={a.id} className="entry" onClick={() => edit(a)}>
              <span className="yel"><Icon name={dsc.icon} size={22} /></span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div>{stamp(a.startAt, now)}{a.type === 'bottle' && <> &nbsp;{dsc.title}</>}</div>
                {a.type === 'bottle' && bottleMl(a) > 0 && (
                  <div className="vol"><span className="bar" style={{ width: Math.min(120, 12 + bottleMl(a) * 0.5) }} />{dsc.detail}</div>
                )}
                {a.type === 'solid' && (
                  <>
                    {String(a.data.food).split(/[,\n]/).map((f) => f.trim()).filter(Boolean).map((f, i) => <div key={i} className="b">{f}</div>)}
                    {dsc.detail && <div className="dim sm">{dsc.detail}</div>}
                  </>
                )}
                {a.note && <div className="dim sm">{a.note}</div>}
              </div>
            </button>
          );
        })}
        {showFeeds && <Link label="View history" onClick={() => onHistory('feed')} />}
      </Card>

      <Card title="Pump" color={COLORS.pump} onPlus={() => form('pump')}>
        <Summary icon="drop" color="#e08a80" line1="Last session" line2={lastPump ? `${ago(lastPump.startAt, now)} · ${describe(lastPump, units).detail}` : 'Nothing logged yet'} />
        <Link label="View history" onClick={() => onHistory('pump')} />
      </Card>

      <Card title="Diaper" color={COLORS.diaper} onPlus={() => form('diaper')}>
        <Summary icon="diaper" color="#a9a493" line1="Last change" line2={lastDiaper ? ago(lastDiaper.startAt, now) : 'Nothing logged yet'}
          right={lastDiaper && <span className="serif kind">{String(lastDiaper.data.kind)}</span>} />
        <Link label="View history" onClick={() => onHistory('diaper')} />
      </Card>

      <Card title="Sleep" color={COLORS.sleep} onPlus={() => setOpen({ t: 'choose', which: 'sleep' })}>
        {running ? (
          <Summary icon="moon" color="#7fa6bb" line1="Sleeping" line2={`${durationLabel(now - running.startAt)} so far · since ${clock(running.startAt)}`}
            right={<button className="pill" onClick={() => save({ ...running, endAt: Date.now() })}>Wake up</button>} />
        ) : (
          <Summary icon="moon" color="#7fa6bb" line1={lastSleep ? 'Woke up' : 'No sleep yet'} line2={lastSleep ? `${ago(lastSleep.endAt!, now)} · slept ${durationLabel(lastSleep.endAt! - lastSleep.startAt)}` : 'Tap + to start'} />
        )}
        <Link label="View history" onClick={() => onHistory('sleep')} />
      </Card>

      <Card title="Baby firsts" color={COLORS.first} onPlus={() => form('first')}>
        {firsts[0] ? (
          <button className="lrow" onClick={() => edit(firsts[0])}>
            <Blob icon="star" color="#6fb3bd" size={44} />
            <div style={{ flex: 1, textAlign: 'left' }}><div className="serif big">{firsts[0].data.label}</div><div className="dim sm">{shortDate(firsts[0].startAt)}</div></div>
            <Icon name="right" size={18} />
          </button>
        ) : <div className="empty">Record the moments you don’t want to forget.</div>}
        <Link label="Show all" onClick={() => onHistory('first')} />
      </Card>

      <Card title="Growth" color={COLORS.growth} onPlus={() => setOpen({ t: 'choose', which: 'growth' })}>
        {growthRow('weightKg', 'Weight', 'scale', 'weight')}
        {growthRow('heightCm', 'Height', 'ruler', 'length')}
        {growthRow('headCm', 'Head size', 'tape', 'length')}
        <Link label="Show all" onClick={() => onHistory('growth')} />
      </Card>

      <Card title="Health" color={COLORS.health} onPlus={() => setOpen({ t: 'choose', which: 'health' })}>
        {healthRow('medication', 'Medication', 'pill', (a) => String(a.data.name))}
        {healthRow('temperature', 'Temperature', 'thermo', (a) => fmt('temp', a.data.tempC, units))}
        {healthRow('vaccine', 'Vaccines', 'syringe', (a) => String(a.data.name))}
        <Link label="Show all" onClick={() => onHistory('health')} />
      </Card>

      {open?.t === 'choose' && <Chooser title={chooserTitle[open.which]} color={chooserColor[open.which]} choices={choices[open.which]} onClose={() => setOpen(null)} />}
      {open?.t === 'form' && <FormSheet id={open.id} existing={open.existing} onClose={() => setOpen(null)} />}
    </>
  );
}
