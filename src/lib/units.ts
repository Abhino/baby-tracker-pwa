import type { UnitKind, Units } from './types';

const FLOZ = 29.5735;
const LB = 2.20462;
const IN = 2.54;
export const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

// Everything is stored in ml / kg / cm / °C and converted only for display.
export function toDisp(k: UnitKind, v: number, u: Units): number {
  switch (k) {
    case 'vol': return u.volume === 'floz' ? v / FLOZ : v;
    case 'weight': return u.growth === 'imperial' ? v * LB : v;
    case 'length': return u.growth === 'imperial' ? v / IN : v;
    case 'temp': return u.temp === 'F' ? (v * 9) / 5 + 32 : v;
  }
}
export function fromDisp(k: UnitKind, v: number, u: Units): number {
  switch (k) {
    case 'vol': return u.volume === 'floz' ? v * FLOZ : v;
    case 'weight': return u.growth === 'imperial' ? v / LB : v;
    case 'length': return u.growth === 'imperial' ? v * IN : v;
    case 'temp': return u.temp === 'F' ? ((v - 32) * 5) / 9 : v;
  }
}
export function unitLabel(k: UnitKind, u: Units): string {
  switch (k) {
    case 'vol': return u.volume === 'floz' ? 'fl oz' : 'ml';
    case 'weight': return u.growth === 'imperial' ? 'lb' : 'kg';
    case 'length': return u.growth === 'imperial' ? 'in' : 'cm';
    case 'temp': return u.temp === 'F' ? '°F' : '°C';
  }
}
export function fmt(k: UnitKind, v: number, u: Units): string {
  const digits = k === 'vol' ? (u.volume === 'floz' ? 1 : 0) : k === 'weight' ? 2 : 1;
  return `${round(toDisp(k, v, u), digits)} ${unitLabel(k, u)}`;
}
