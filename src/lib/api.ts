import { getToken } from './firebase';
import type { Activity } from './types';

const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

async function call(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const r = await fetch(BASE + path, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`${r.status} ${(await r.text().catch(() => '')).slice(0, 120)}`);
  return r;
}

export interface SyncResult { changes: Activity[]; cursor: number; hasMore: boolean }

export async function apiSync(since: number, changes: Activity[]): Promise<SyncResult> {
  const r = await call('/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ since, changes }),
  });
  return r.json();
}
export async function apiImport(csv: string) {
  const r = await call('/import/nara-csv', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: csv });
  return (await r.json()) as { total: number; parsed: number; imported: number; skipped: number };
}
export async function apiExport(): Promise<Blob> {
  return (await call('/export.csv')).blob();
}
