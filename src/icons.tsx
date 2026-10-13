const P = {
  bottle: '<path d="M9 3h6M10 3v3M14 3v3M8 9a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2zM8 13h8"/>',
  spoon: '<ellipse cx="12" cy="8" rx="4" ry="5"/><path d="M12 13v8"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  diaper: '<path d="M3 6h18v4c0 5-4 9-9 9s-9-4-9-9zM8 17l4-5 4 5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 10a4 4 0 0 1 8 0z"/>',
  ruler: '<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M11 8v2M15 8v3M19 8v2"/>',
  tape: '<ellipse cx="12" cy="10" rx="9" ry="4.5"/><path d="M3 10v4c0 2.5 4 4.5 9 4.5s9-2 9-4.5v-4"/>',
  pill: '<rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="M9 9l6 6"/>',
  thermo: '<path d="M10 14V5a2 2 0 0 1 4 0v9a4 4 0 1 1-4 0z"/>',
  syringe: '<path d="M17 3l4 4M15 5l4 4M7 13l7-7 4 4-7 7-4-1zM3 21l4-4"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  up: '<path d="M5 15l7-7 7 7"/>',
  down: '<path d="M5 9l7 7 7-7"/>',
  activity: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  history: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  trends: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
} as const;
export type IconName = keyof typeof P;

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: P[name] }}
    />
  );
}
