import { support } from './support';

export function getCleanCtx(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  let ctx = canvas.getContext('2d', {
    colorSpace: support.get().p3 ? 'display-p3' : 'srgb',
  } as CanvasRenderingContext2DSettings)!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return ctx;
}

export function initCanvasSize(canvas: HTMLCanvasElement): [number, number] {
  let pixelRatio = Math.ceil(window.devicePixelRatio);
  let rect = canvas.getBoundingClientRect();
  let width = rect.width * pixelRatio;
  let height = rect.height * pixelRatio;
  canvas.width = width;
  canvas.height = height;
  return [width, height];
}
