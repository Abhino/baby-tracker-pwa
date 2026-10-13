import type { ReactNode } from 'react';
import { Icon, type IconName } from '../icons';

export function Sheet({ title, color, onClose, children }: { title: string; color: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-hd" style={{ background: color }}>
          <span>{title}</span>
          <button className="x" onClick={onClose} aria-label="Close">Close</button>
        </div>
        <div className="sheet-bd">{children}</div>
      </div>
    </div>
  );
}

export interface Choice { label: string; icon: IconName; run: () => void }
export function Chooser({ title, color, choices, onClose }: { title: string; color: string; choices: Choice[]; onClose: () => void }) {
  return (
    <Sheet title={title} color={color} onClose={onClose}>
      {choices.map((c) => (
        <button key={c.label} className="choice" onClick={() => { onClose(); c.run(); }}>
          <span className="blob" style={{ background: color }}><Icon name={c.icon} size={22} /></span>
          {c.label}
        </button>
      ))}
    </Sheet>
  );
}
