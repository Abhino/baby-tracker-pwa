import type { Activity, Units } from './types';
import { COLORS } from './forms';
import { fmt } from './units';
import type { IconName } from '../icons';

export interface Desc { title: string; detail: string; icon: IconName; color: string }

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const KIND: Record<string, string> = { breast: 'Breast milk', formula: 'Formula', mixed: 'Mixed', wet: 'Wet', dirty: 'Dirty', mix: 'Mix' };

export const bottleMl = (a: Activity) => (a.data.breastMl ?? 0) + (a.data.formulaMl ?? 0);
export const pumpMl = (a: Activity) => (a.data.leftMl ?? 0) + (a.data.rightMl ?? 0);

export function durationLabel(ms: number): string {
  const m = Math.max(0, Math.round(ms / 60000));
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function describe(a: Activity, u: Units): Desc {
  const d = a.data;
  switch (a.type) {
    case 'bottle': {
      const ml = bottleMl(a);
      return { title: KIND[d.kind] ?? 'Bottle', detail: ml ? fmt('vol', ml, u) : '', icon: 'bottle', color: COLORS.feed };
    }
    case 'solid':
      return { title: String(d.food ?? 'Solids'), detail: cap(d.meal ?? ''), icon: 'spoon', color: COLORS.feed };
    case 'pump':
      return { title: 'Pump', detail: `L ${fmt('vol', d.leftMl ?? 0, u)}, R ${fmt('vol', d.rightMl ?? 0, u)}`, icon: 'drop', color: COLORS.pump };
    case 'diaper':
      return { title: KIND[d.kind] ?? 'Diaper', detail: [d.color, d.texture].filter(Boolean).join(', '), icon: 'diaper', color: COLORS.diaper };
    case 'sleep':
      return { title: 'Sleep', detail: a.endAt ? durationLabel(a.endAt - a.startAt) : 'In progress', icon: 'moon', color: COLORS.sleep };
    case 'first':
      return { title: String(d.label ?? 'Baby first'), detail: '', icon: 'star', color: COLORS.first };
    case 'growth':
      if ('weightKg' in d) return { title: 'Weight', detail: fmt('weight', d.weightKg, u), icon: 'scale', color: COLORS.growth };
      if ('heightCm' in d) return { title: 'Height', detail: fmt('length', d.heightCm, u), icon: 'ruler', color: COLORS.growth };
      return { title: 'Head size', detail: fmt('length', d.headCm, u), icon: 'tape', color: COLORS.growth };
    case 'medication':
      return { title: String(d.name ?? 'Medication'), detail: 'Medication', icon: 'pill', color: COLORS.health };
    case 'temperature':
      return { title: 'Temperature', detail: fmt('temp', d.tempC, u), icon: 'thermo', color: COLORS.health };
    case 'vaccine':
      return { title: String(d.name ?? 'Vaccine'), detail: 'Vaccine', icon: 'syringe', color: COLORS.health };
  }
}

const startOfDay = (ms: number) => { const d = new Date(ms); d.setHours(0, 0, 0, 0); return d.getTime(); };
const DAY = 86_400_000;

export function clock(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase();
}
/** "Today 2:10pm", "YD 8:05pm", "Sep 28 8:05pm" */
export function stamp(ms: number, now: number): string {
  const diff = Math.round((startOfDay(now) - startOfDay(ms)) / DAY);
  const day = diff === 0 ? 'Today' : diff === 1 ? 'YD' : new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric' });
  return `${day} ${clock(ms)}`;
}
export function ago(ms: number, now: number): string {
  const m = Math.floor((now - ms) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  if (m < 1440) return `${Math.floor(m / 60)}h ${m % 60}m ago`;
  const d = Math.floor(m / 1440);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}
export function dayHeading(ms: number, now: number): string {
  const diff = Math.round((startOfDay(now) - startOfDay(ms)) / DAY);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return new Date(ms).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
export const dayStart = startOfDay;
export const shortDate = (ms: number) => new Date(ms).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
