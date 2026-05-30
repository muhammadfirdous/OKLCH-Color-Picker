import { atom, map } from 'nanostores';

// Minimal stores the upstream model.ts subscribes to. The React app drives
// these from its picker state (see App.tsx).
export interface LchValue {
  a: number;
  c: number;
  h: number;
  l: number;
}

export type RgbMode = 'p3' | 'rec2020' | 'rgb';

export const current = map<LchValue>({ a: 100, c: 0.15, h: 349, l: 0.7 });

export const biggestRgb = atom<RgbMode>('rgb');
