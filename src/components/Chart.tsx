import { useEffect, useRef } from 'react';
import { colordx } from '@colordx/core';
import { getCleanCtx } from '../lib3d/canvas';
import { getBorders } from '../lib3d/dom';
import type { BorderColor, PaintData, PaintedData } from '../lib3d/chartWorker';
import ChartWorker from '../lib3d/chartWorker.ts?worker';

export interface Oklch {
  c: number;
  h: number;
  l: number;
}

interface Props {
  type: 'c' | 'h' | 'l';
  oklch: Oklch;
  showP3: boolean;
  showRec2020: boolean;
  onPick: (partial: Partial<Oklch>) => void;
}

function parseBorderColor(css: string): BorderColor {
  const c = colordx(css).toRgb();
  return { alpha: c.alpha, b: c.b / 255, g: c.g / 255, r: c.r / 255 };
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(min, v), max);

export default function Chart({ type, oklch, showP3, showRec2020, onPick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;

  const maxC = showRec2020 ? C_MAX_REC2020 : C_MAX;
  // Held component for this chart's plane.
  const held = type === 'l' ? oklch.l : type === 'c' ? oklch.c : oklch.h;

  useEffect(() => {
    const worker = new ChartWorker();
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Repaint whenever the held value, gamut toggles, or color change.
  useEffect(() => {
    const canvas = canvasRef.current;
    const worker = workerRef.current;
    if (!canvas || !worker) return;
    // Measure, but only resize when the box actually changed. Setting
    // canvas.width/height clears the canvas, which would blank it until the
    // async worker result arrives (the flicker while dragging). Leaving the
    // size untouched keeps the previous frame visible until the new one lands.
    const dpr = Math.ceil(window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (width < 2 || height < 2) return;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const [cssP3, cssRec2020] = getBorders();
    const onMessage = (e: MessageEvent<PaintedData>) => {
      const img = new ImageData(new Uint8ClampedArray(e.data.pixels), e.data.width, height);
      const ctx = getCleanCtx(canvas);
      ctx.putImageData(img, e.data.from, 0);
    };
    worker.addEventListener('message', onMessage, { once: true });
    const msg: PaintData = {
      borderP3: parseBorderColor(cssP3),
      borderRec2020: parseBorderColor(cssRec2020),
      from: 0,
      height,
      showP3,
      showRec2020,
      to: width - 1,
      type,
      value: held,
      width,
    };
    worker.postMessage(msg);
    return () => worker.removeEventListener('message', onMessage);
  }, [type, held, showP3, showRec2020]);

  function pick(clientX: number, clientY: number): void {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(rect.height - (clientY - rect.top), 0, rect.height);
    if (type === 'l') {
      onPickRef.current({ c: (maxC * y) / rect.height, h: (H_MAX * x) / rect.width });
    } else if (type === 'c') {
      onPickRef.current({ h: (H_MAX * x) / rect.width, l: (L_MAX * y) / rect.height });
    } else {
      onPickRef.current({ c: (maxC * y) / rect.height, l: (L_MAX * x) / rect.width });
    }
  }

  function onMouseDown(e: React.MouseEvent): void {
    e.preventDefault();
    pick(e.clientX, e.clientY);
    const move = (e2: MouseEvent) => pick(e2.clientX, e2.clientY);
    const up = (e2: MouseEvent) => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
      pick(e2.clientX, e2.clientY);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  // Crosshair guide lines (one per varying axis). Positions inherit the
  // --chart-l/c/h custom properties App sets on <body> (repo behavior).
  const lines =
    type === 'l'
      ? [
          { cls: 'is-c is-x', label: 'C' },
          { cls: 'is-h is-y', label: 'H' },
        ]
      : type === 'c'
        ? [
            { cls: 'is-l is-x', label: 'L' },
            { cls: 'is-h is-y', label: 'H' },
          ]
        : [
            { cls: 'is-c is-x', label: 'C' },
            { cls: 'is-l is-y', label: 'L' },
          ];

  return (
    <div className={`chart is-${type}`}>
      <canvas className="chart_canvas" ref={canvasRef} onMouseDown={onMouseDown} />
      {lines.map(l => (
        <div key={l.cls} className={`chart_line ${l.cls}`}>
          <span className="chart_label">{l.label}</span>
        </div>
      ))}
    </div>
  );
}
