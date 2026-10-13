export type ActivityType =
  | 'bottle' | 'solid' | 'pump' | 'diaper' | 'sleep' | 'first'
  | 'growth' | 'medication' | 'temperature' | 'vaccine';

export interface Activity {
  id: string;
  type: ActivityType;
  startAt: number;
  endAt: number | null;
  data: Record<string, any>;
  note: string;
  createdBy: string;
  updatedAt: number;
  deleted: boolean;
  legacyId?: string;
}

export interface Units {
  volume: 'floz' | 'ml';
  growth: 'metric' | 'imperial';
  temp: 'C' | 'F';
}
export type UnitKind = 'vol' | 'weight' | 'length' | 'temp';
