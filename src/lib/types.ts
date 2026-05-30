import type { Model } from './color';

export type Axis = 'L' | 'C' | 'H';

export interface PickerState {
  model: Model;
  L: number;
  C: number;
  H: number;
  alpha: number;
  showGraphs: boolean;
  show3D: boolean;
  showP3: boolean;
  showR2020: boolean;
  inputFormat: FormatId;
  fullscreen3D: boolean;
}

export type FormatId =
  | 'auto'
  | 'hex'
  | 'rgba'
  | 'hsl'
  | 'display-p3'
  | 'lch'
  | 'lab'
  | 'oklab'
  | 'linear-rgb'
  | 'raw-nums'
  | 'figma-p3';

export interface FormatDef {
  id: FormatId;
  label: string;
}

export const FORMATS: FormatDef[] = [
  { id: 'auto', label: 'Auto hex/rgba' },
  { id: 'hex', label: '#hex' },
  { id: 'rgba', label: 'rgba(...)' },
  { id: 'hsl', label: 'hsl(...)' },
  { id: 'display-p3', label: 'color(display-p3 ...)' },
  { id: 'lch', label: 'lch(...)' },
  { id: 'lab', label: 'lab(...)' },
  { id: 'oklab', label: 'oklab(...)' },
  { id: 'linear-rgb', label: 'Linear RGB vec(...)' },
  { id: 'raw-nums', label: 'numeric components' },
  { id: 'figma-p3', label: 'Figma P3 #hex' },
];
