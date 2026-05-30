import { useEffect, useRef } from 'react';
import { initCanvas, type Model } from '../lib3d/model';
import { registerCamera, syncCamerasFrom } from '../lib3d/cameras';

interface Props {
  fullscreen?: boolean;
  canvasId?: string;
}

// Runs the upstream oklch-picker 3D engine (three.js + delaunator + colordx).
// The mesh + slice lines are driven by the `current` / `biggestRgb` nanostores,
// which App keeps in sync with the picker state.
export default function ThreeDView({ fullscreen = false, canvasId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let model: Model | undefined;
    // Defer one frame so the canvas has its laid-out size before init.
    const raf = requestAnimationFrame(() => {
      model = initCanvas(canvas, fullscreen);
      registerCamera(model.camera, fullscreen ? 'full' : 'mini');
      if (fullscreen) syncCamerasFrom('mini');
    });
    return () => {
      cancelAnimationFrame(raf);
      model?.stop();
    };
  }, [fullscreen]);

  return <canvas ref={canvasRef} id={canvasId} />;
}
