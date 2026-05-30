// Synchronous 1D gamut-strip painter for the L/C/H range sliders. Ported from
// the upstream view/range/index.ts `paint()` + per-type orchestration, with
// showP3/showRec2020 passed in instead of read from stores.
import { getCleanCtx, initCanvasSize } from './canvas';
import { build, canvasFormat, generateGetSpace, type Lch, Space, toRgbString } from './colors';
import { getBorders } from './dom';

export interface CurrentOklch {
  c: number;
  h: number;
  l: number;
}

function paint(
  canvas: HTMLCanvasElement,
  type: 'c' | 'h' | 'l',
  width: number,
  height: number,
  sliderStep: number,
  showP3: boolean,
  showRec2020: boolean,
  getColor: (x: number) => Lch
): number[] {
  let ctx = getCleanCtx(canvas);
  let halfHeight = Math.floor(height / 2);
  let [borderP3, borderRec2020] = getBorders();
  let getSpace = generateGetSpace(showP3, showRec2020);

  let stops: number[] = [];
  function addStop(x: number, round: (num: number) => number): void {
    let origin = getColor(x);
    let value = origin[type] ?? 0;
    stops.push(round(value / sliderStep) * sliderStep);
  }

  let prevSpace = getSpace(getColor(0));
  for (let x = 0; x <= width; x++) {
    let color = getColor(x);
    let space = getSpace(color);
    if (space !== Space.Out) {
      ctx.fillStyle = canvasFormat(color);
      if (space === Space.sRGB) {
        ctx.fillRect(x, 0, 1, height);
      } else {
        ctx.fillRect(x, 0, 1, halfHeight);
        ctx.fillStyle = toRgbString(color);
        ctx.fillRect(x, halfHeight, 1, halfHeight + 1);
      }
      if (prevSpace !== space) {
        if (
          prevSpace === Space.Out ||
          (prevSpace === Space.Rec2020 && space === Space.P3) ||
          (prevSpace === Space.P3 && space === Space.sRGB)
        ) {
          addStop(x, Math.ceil);
        } else {
          addStop(x - 1, Math.floor);
        }
        if (space === Space.P3 && prevSpace !== Space.Rec2020) {
          ctx.fillStyle = borderP3;
          ctx.fillRect(x, 0, 1, height);
        } else if (space === Space.sRGB && prevSpace === Space.P3) {
          ctx.fillStyle = borderP3;
          ctx.fillRect(x - 1, 0, 1, height);
        } else if (space === Space.Rec2020) {
          ctx.fillStyle = borderRec2020;
          ctx.fillRect(x, 0, 1, height);
        } else if (prevSpace === Space.Rec2020) {
          ctx.fillStyle = borderRec2020;
          ctx.fillRect(x - 1, 0, 1, height);
        }
      }
    } else {
      if (prevSpace !== Space.Out) {
        addStop(x - 1, Math.floor);
      }
      if (type === 'c') {
        return stops;
      }
    }
    prevSpace = space;
  }
  return stops;
}

export function paintRange(
  canvas: HTMLCanvasElement,
  type: 'c' | 'h' | 'l',
  current: CurrentOklch,
  sliderStep: number,
  showP3: boolean,
  showRec2020: boolean
): number[] {
  let [width, height] = initCanvasSize(canvas);
  let { c, h, l } = current;
  let getColor: (x: number) => Lch;
  if (type === 'l') {
    let factor = L_MAX_COLOR / width;
    getColor = x => build(x * factor, c, h);
  } else if (type === 'c') {
    let factor = (showRec2020 ? C_MAX_REC2020 : C_MAX) / width;
    getColor = x => build(l, x * factor, h);
  } else {
    let factor = H_MAX / width;
    getColor = x => build(l, c, x * factor);
  }
  return paint(canvas, type, width, height, sliderStep, showP3, showRec2020, getColor);
}
