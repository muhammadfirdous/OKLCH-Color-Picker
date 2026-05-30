import { useCallback, useState } from 'react';
import * as OK from './lib/color';
import type { Model } from './lib/color';
import type { Axis, PickerState } from './lib/types';
import { currentRGB } from './lib/format';
import { parseColor } from './lib/urlColor';

const defaultState: PickerState = {
  model: 'oklch',
  L: 0.7,
  C: 0.15,
  H: 349,
  alpha: 1,
  showGraphs: true,
  show3D: true,
  showP3: true,
  showR2020: true,
  inputFormat: 'auto',
  fullscreen3D: false,
};

// Seed the color from the URL fragment on first load (OKLCH; default model).
// Malformed/missing fragment -> default, no throw.
function makeInitialState(): PickerState {
  const url = typeof location !== 'undefined' ? parseColor(location.hash) : null;
  if (!url) return defaultState;
  return { ...defaultState, L: url.l, C: url.c, H: url.h, alpha: url.a };
}

function clampAxis(model: Model, axis: Axis, v: number): number {
  const M = OK.MODELS[model];
  const ranges: Record<Axis, [number, number]> = {
    L: [0, M.Lmax],
    C: [0, M.Cmax],
    H: [0, 360],
  };
  const [lo, hi] = ranges[axis];
  return Math.max(lo, Math.min(hi, v));
}

export interface PickerApi {
  state: PickerState;
  patch: (p: Partial<PickerState>) => void;
  setModel: (m: Model) => void;
  setAxis: (axis: Axis, value: number) => void;
  setAlpha: (value: number) => void;
  step: (axis: Axis | 'alpha', dir: 1 | -1) => void;
  setFromRgb: (r: number, g: number, b: number, a: number) => void;
}

export function usePicker(): PickerApi {
  const [state, setState] = useState<PickerState>(makeInitialState);

  const patch = useCallback((p: Partial<PickerState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const setModel = useCallback((m: Model) => {
    setState((s) => {
      if (m === s.model) return s;
      const rgb = currentRGB(s);
      const [L, C, H] = OK.srgbToModel(m, ...rgb);
      return { ...s, model: m, L, C, H };
    });
  }, []);

  const setAxis = useCallback((axis: Axis, value: number) => {
    setState((s) => ({ ...s, [axis]: clampAxis(s.model, axis, value) }));
  }, []);

  const setAlpha = useCallback((value: number) => {
    setState((s) => ({ ...s, alpha: Math.max(0, Math.min(1, value)) }));
  }, []);

  const step = useCallback((axis: Axis | 'alpha', dir: 1 | -1) => {
    setState((s) => {
      if (axis === 'alpha') {
        return { ...s, alpha: Math.max(0, Math.min(1, s.alpha + (dir * 1) / 100)) };
      }
      let stepSize = 1;
      if (axis === 'L') stepSize = 0.01;
      else if (axis === 'C') stepSize = s.model === 'oklch' ? 0.01 : 1;
      else if (axis === 'H') stepSize = 1;
      return { ...s, [axis]: clampAxis(s.model, axis, s[axis] + dir * stepSize) };
    });
  }, []);

  const setFromRgb = useCallback((r: number, g: number, b: number, a: number) => {
    setState((s) => {
      const [L, C, H] = OK.srgbToModel(s.model, r, g, b);
      return { ...s, L, C, H, alpha: a };
    });
  }, []);

  return { state, patch, setModel, setAxis, setAlpha, step, setFromRgb };
}
