import { useEffect, useId, useRef, useState } from 'react';
import { build, toNativeString } from '../lib3d/colors';
import { paintRange } from '../lib3d/rangePaint';
import type { Oklch } from './Chart';

interface Props {
  type: 'a' | 'c' | 'h' | 'l';
  oklch: Oklch;
  value: number; // current component value (OKLCH units, or 0..100 for alpha)
  min: number;
  max: number;
  step: number;
  showP3: boolean;
  showRec2020: boolean;
  onInput: (value: number) => void;
}

export default function RangeSlider({
  type,
  oklch,
  value,
  min,
  max,
  step,
  showP3,
  showRec2020,
  onInput,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listId = useId();
  const [stops, setStops] = useState<number[]>([]);

  // Paint the gamut strip for L/C/H (alpha uses a CSS gradient instead).
  useEffect(() => {
    if (type === 'a') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const next = paintRange(canvas, type, oklch, step, showP3, showRec2020);
    setStops(next);
  }, [type, oklch.l, oklch.c, oklch.h, step, showP3, showRec2020]);

  let trackStyle: React.CSSProperties | undefined;
  if (type === 'a') {
    const base = build(oklch.l, oklch.c, oklch.h);
    const from = toNativeString({ ...base, alpha: 0 });
    const to = toNativeString({ ...base, alpha: 1 });
    trackStyle = { ['--range-a-from' as string]: from, ['--range-a-to' as string]: to };
  }

  return (
    <div className={`range is-${type}`} style={trackStyle}>
      {type !== 'a' && <canvas className="range_space" ref={canvasRef} />}
      <input
        className="range_input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        list={type === 'a' ? undefined : listId}
        onInput={e => onInput(parseFloat((e.target as HTMLInputElement).value))}
        onChange={e => onInput(parseFloat((e.target as HTMLInputElement).value))}
      />
      {type !== 'a' && (
        <datalist id={listId}>
          {stops.map((s, i) => (
            <option key={`${s}-${i}`} value={s} />
          ))}
        </datalist>
      )}
    </div>
  );
}
