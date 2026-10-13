import { useSyncExternalStore } from 'react';
import { get, set } from 'idb-keyval';
import { apiSync } from './api';
import type { Activity, ActivityType, Units } from './types';

const OVERLAP = 2_000_000; // 2s in the server's microsecond cursor; covers out-of-order commits

export interface State {
  acts: Record<string, Activity>;
  outbox: string[]; // ids with local changes the server hasn't confirmed
  cursor: number;
  ready: boolean;
  authReady: boolean;
  user: string | null;
  denied: boolean;
  syncing: boolean;
  error: string;
  units: Units;
}

const DEFAULT_UNITS: Units = { volume: 'floz', growth: 'metric', temp: 'C' };
function loadUnits(): Units {
  try { return { ...DEFAULT_UNITS, ...JSON.parse(localStorage.getItem('units') ?? '{}') }; }
  catch { return DEFAULT_UNITS; }
}

let state: State = {
  acts: {}, outbox: [], cursor: 0, ready: false, authReady: false,
  user: null, denied: false, syncing: false, error: '', units: loadUnits(),
};
const listeners = new Set<() => void>();
function setState(p: Partial<State>) {
  state = { ...state, ...p };
  listeners.forEach((l) => l());
}
export const getState = () => state;
export const useStore = () =>
  useSyncExternalStore((l) => { listeners.add(l); return () => void listeners.delete(l); }, getState);

const persist = () => {
  void set('acts', state.acts);
  void set('outbox', state.outbox);
  void set('cursor', state.cursor);
};

export async function initStore() {
  const [acts, outbox, cursor] = await Promise.all([get('acts'), get('outbox'), get('cursor')]);
  setState({ acts: acts ?? {}, outbox: outbox ?? [], cursor: cursor ?? 0, ready: true });
}
export function setUser(email: string | null) {
  setState({ user: email, authReady: true, denied: false });
  if (email) scheduleSync(100);
}
export function setUnits(units: Units) {
  localStorage.setItem('units', JSON.stringify(units));
  setState({ units });
}

// ---- local writes (never wait on the network) ----
export const uid = () => Date.now().toString(36) + '-' + crypto.randomUUID().slice(0, 8);

export function blank(type: ActivityType, data: Record<string, any> = {}, startAt = Date.now()): Activity {
  return { id: uid(), type, startAt, endAt: null, data, note: '', createdBy: state.user ?? '', updatedAt: 0, deleted: false };
}
export function save(a: Activity) {
  const prev = state.acts[a.id];
  const next = { ...a, updatedAt: Math.max(Date.now(), (prev?.updatedAt ?? 0) + 1) };
  setState({
    acts: { ...state.acts, [a.id]: next },
    outbox: state.outbox.includes(a.id) ? state.outbox : [...state.outbox, a.id],
  });
  persist();
  scheduleSync();
}
export const remove = (a: Activity) => save({ ...a, deleted: true });

// ---- sync ----
let inflight = false;
let timer: ReturnType<typeof setTimeout> | undefined;
export function scheduleSync(ms = 400) {
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), ms);
}

export async function syncNow() {
  if (inflight || !state.user || !navigator.onLine) return;
  inflight = true;
  setState({ syncing: true });
  try {
    let since = Math.max(0, state.cursor - OVERLAP);
    for (let page = 0; page < 40; page++) {
      const sent = state.outbox.slice(0, 200).map((id) => state.acts[id]).filter(Boolean);
      const sentAt = new Map(sent.map((a) => [a.id, a.updatedAt]));
      const res = await apiSync(since, sent);

      const acts = { ...state.acts }; // read after the await: local edits may have happened meanwhile
      for (const s of res.changes) {
        const l = acts[s.id];
        if (!l || l.updatedAt <= s.updatedAt) acts[s.id] = s;
      }
      const outbox = state.outbox.filter((id) => !(sentAt.has(id) && acts[id]?.updatedAt === sentAt.get(id)));
      setState({ acts, outbox, cursor: Math.max(state.cursor, res.cursor), error: '', denied: false });
      persist();
      since = res.cursor;
      if (!res.hasMore && !(state.outbox.length > 0 && sent.length > 0)) break;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    setState({ error: msg, denied: /^403/.test(msg) });
  } finally {
    inflight = false;
    setState({ syncing: false });
  }
}
export function fullResync() {
  setState({ cursor: 0 });
  void syncNow();
}

export function startSyncLoop() {
  const tick = () => { if (document.visibilityState === 'visible') void syncNow(); };
  const id = setInterval(tick, 20_000);
  document.addEventListener('visibilitychange', tick);
  window.addEventListener('online', tick);
  return () => {
    clearInterval(id);
    document.removeEventListener('visibilitychange', tick);
    window.removeEventListener('online', tick);
  };
}
