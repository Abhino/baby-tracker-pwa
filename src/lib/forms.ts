import type { Activity, ActivityType, UnitKind } from './types';

export type FormId =
  | 'bottle' | 'solid' | 'pump' | 'diaper' | 'sleep' | 'first'
  | 'weight' | 'height' | 'head' | 'medication' | 'temperature' | 'vaccine';

export interface Field {
  key: string;
  label: string;
  kind: 'chips' | 'text' | 'num';
  options?: [string, string][];
  unit?: UnitKind;
  quick?: boolean;
  placeholder?: string;
  showIf?: (d: Record<string, any>) => boolean;
}
export interface FormDef {
  id: FormId;
  title: string;
  type: ActivityType;
  color: string;
  fields: Field[];
  hasEnd?: boolean;
}

export const COLORS = {
  feed: '#ffcd52', pump: '#f9a99f', diaper: '#f0eadc', sleep: '#b9e0ee',
  first: '#a9dde3', growth: '#b0e08e', health: '#d3d1f5',
};

export const FORMS: Record<FormId, FormDef> = {
  bottle: {
    id: 'bottle', title: 'Bottle', type: 'bottle', color: COLORS.feed,
    fields: [
      { key: 'kind', label: 'Type', kind: 'chips', options: [['breast', 'Breast milk'], ['formula', 'Formula'], ['mixed', 'Mixed']] },
      { key: 'breastMl', label: 'Breast milk', kind: 'num', unit: 'vol', quick: true, showIf: (d) => d.kind !== 'formula' },
      { key: 'formulaMl', label: 'Formula', kind: 'num', unit: 'vol', quick: true, showIf: (d) => d.kind !== 'breast' },
      { key: 'formulaName', label: 'Formula name', kind: 'text', placeholder: 'Optional', showIf: (d) => d.kind !== 'breast' },
    ],
  },
  solid: {
    id: 'solid', title: 'Solids', type: 'solid', color: COLORS.feed,
    fields: [
      { key: 'meal', label: 'Meal', kind: 'chips', options: [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snack', 'Snack']] },
      { key: 'food', label: 'Food', kind: 'text', placeholder: 'Banana, oatmeal' },
    ],
  },
  pump: {
    id: 'pump', title: 'Pump', type: 'pump', color: COLORS.pump,
    fields: [
      { key: 'leftMl', label: 'Left', kind: 'num', unit: 'vol', quick: true },
      { key: 'rightMl', label: 'Right', kind: 'num', unit: 'vol', quick: true },
    ],
  },
  diaper: {
    id: 'diaper', title: 'Diaper', type: 'diaper', color: COLORS.diaper,
    fields: [
      { key: 'kind', label: 'Type', kind: 'chips', options: [['wet', 'Wet'], ['dirty', 'Dirty'], ['mix', 'Mix']] },
      { key: 'color', label: 'Color', kind: 'text', placeholder: 'Optional', showIf: (d) => d.kind !== 'wet' },
      { key: 'texture', label: 'Texture', kind: 'text', placeholder: 'Optional', showIf: (d) => d.kind !== 'wet' },
    ],
  },
  sleep: { id: 'sleep', title: 'Sleep', type: 'sleep', color: COLORS.sleep, fields: [], hasEnd: true },
  first: {
    id: 'first', title: 'Baby first', type: 'first', color: COLORS.first,
    fields: [{ key: 'label', label: 'What happened?', kind: 'text', placeholder: 'Sat up on his own!' }],
  },
  weight: { id: 'weight', title: 'Weight', type: 'growth', color: COLORS.growth, fields: [{ key: 'weightKg', label: 'Weight', kind: 'num', unit: 'weight' }] },
  height: { id: 'height', title: 'Height', type: 'growth', color: COLORS.growth, fields: [{ key: 'heightCm', label: 'Height', kind: 'num', unit: 'length' }] },
  head: { id: 'head', title: 'Head size', type: 'growth', color: COLORS.growth, fields: [{ key: 'headCm', label: 'Head size', kind: 'num', unit: 'length' }] },
  medication: {
    id: 'medication', title: 'Medication', type: 'medication', color: COLORS.health,
    fields: [{ key: 'name', label: 'Medication', kind: 'text', placeholder: 'Vitamin D' }],
  },
  temperature: { id: 'temperature', title: 'Temperature', type: 'temperature', color: COLORS.health, fields: [{ key: 'tempC', label: 'Temperature', kind: 'num', unit: 'temp' }] },
  vaccine: {
    id: 'vaccine', title: 'Vaccine', type: 'vaccine', color: COLORS.health,
    fields: [{ key: 'name', label: 'Vaccine', kind: 'text', placeholder: '2-month shots' }],
  },
};

export function formIdOf(a: Activity): FormId {
  if (a.type === 'growth') return 'weightKg' in a.data ? 'weight' : 'heightCm' in a.data ? 'height' : 'head';
  return a.type as FormId;
}

/** Smart defaults: chips start on the first option, volumes copy the last entry. */
export function defaults(id: FormId, last?: Activity): Record<string, any> {
  const f = FORMS[id];
  const d: Record<string, any> = {};
  for (const fl of f.fields) if (fl.kind === 'chips') d[fl.key] = fl.options![0][0];
  if (id === 'solid') {
    const h = new Date().getHours();
    d.meal = h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 21 ? 'dinner' : 'snack';
  }
  if (last && (id === 'bottle' || id === 'pump')) {
    for (const k of ['kind', 'breastMl', 'formulaMl', 'formulaName', 'leftMl', 'rightMl']) if (last.data[k] !== undefined) d[k] = last.data[k];
  }
  return d;
}

export function validate(id: FormId, d: Record<string, any>): string | null {
  const has = (k: string) => d[k] !== undefined && d[k] !== '' && !Number.isNaN(d[k]);
  switch (id) {
    case 'solid': return has('food') ? null : 'Enter what was eaten';
    case 'pump': return has('leftMl') || has('rightMl') ? null : 'Enter an amount';
    case 'first': return has('label') ? null : 'Enter what happened';
    case 'weight': return has('weightKg') ? null : 'Enter a weight';
    case 'height': return has('heightCm') ? null : 'Enter a height';
    case 'head': return has('headCm') ? null : 'Enter a head size';
    case 'medication':
    case 'vaccine': return has('name') ? null : 'Enter a name';
    case 'temperature': return has('tempC') ? null : 'Enter a temperature';
    default: return null;
  }
}
