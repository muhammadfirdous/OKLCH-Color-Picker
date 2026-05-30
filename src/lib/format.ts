import * as OK from './color';
import type { RGB } from './color';
import type { FormatId, PickerState } from './types';

export function fmt(v: number, decimals: number): string {
  if (typeof v !== 'number' || !isFinite(v)) return '0';
  if (Number.isInteger(v) && decimals === 0) return String(v);
  return (+v.toFixed(decimals)).toString();
}
const toHex2 = (n: number): string =>
  Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

export function currentRGB(state: PickerState): RGB {
  return OK.modelToLinSrgb(state.model, state.L, state.C, state.H);
}
export function safeRGB(state: PickerState): RGB {
  const rgb = currentRGB(state);
  if (OK.inSrgb(rgb)) return rgb;
  const fb = OK.fallbackByChroma(state.model, state.L, state.C, state.H);
  return OK.modelToLinSrgb(state.model, fb[0], fb[1], fb[2]);
}

export function formatColorAs(format: FormatId, state: PickerState): string {
  const rgb = currentRGB(state);
  const inSr = OK.inSrgb(rgb);
  const useRgb = inSr ? rgb : safeRGB(state);
  const a = state.alpha;
  const aSlash = a < 1 ? ` / ${fmt(a, 2)}` : '';
  const r255 = OK.linSrgbToRgb255(...useRgb);
  const hex6 = '#' + r255.map((n) => n.toString(16).padStart(2, '0')).join('');

  switch (format) {
    case 'auto':
      return a < 1 ? `rgba(${r255[0]}, ${r255[1]}, ${r255[2]}, ${fmt(a, 2)})` : hex6;
    case 'hex':
      return a < 1 ? hex6 + toHex2(a * 255) : hex6;
    case 'rgba':
      return `rgba(${r255[0]}, ${r255[1]}, ${r255[2]}, ${fmt(a, 2)})`;
    case 'hsl': {
      const [h, s, l] = OK.linSrgbToHsl(...useRgb);
      return `hsl(${fmt(h, 2)} ${fmt(s * 100, 2)}% ${fmt(l * 100, 2)}%${aSlash})`;
    }
    case 'display-p3': {
      const p3 = OK.linSrgbToDisplayP3(...rgb);
      return `color(display-p3 ${fmt(p3[0], 4)} ${fmt(p3[1], 4)} ${fmt(p3[2], 4)}${aSlash})`;
    }
    case 'lch': {
      const [L, C, H] = OK.srgbToLch(...rgb);
      return `lch(${fmt(L, 2)} ${fmt(C, 2)} ${fmt(H, 2)}${aSlash})`;
    }
    case 'lab': {
      const [L, C, H] = OK.srgbToLch(...rgb);
      const [Ll, aa, bb] = OK.lchToLab(L, C, H);
      return `lab(${fmt(Ll, 2)} ${fmt(aa, 2)} ${fmt(bb, 2)}${aSlash})`;
    }
    case 'oklab': {
      const [L, C, H] = OK.srgbToOklch(...rgb);
      const [Ll, aa, bb] = OK.oklchToOklab(L, C, H);
      return `oklab(${fmt(Ll, 3)} ${fmt(aa, 3)} ${fmt(bb, 3)}${aSlash})`;
    }
    case 'linear-rgb':
      return `Linear RGB vec(${fmt(rgb[0], 5)}, ${fmt(rgb[1], 5)}, ${fmt(rgb[2], 5)}, ${fmt(a, 2)})`;
    case 'raw-nums': {
      const Cdec = state.model === 'oklch' ? 3 : 1;
      return `${fmt(state.L, 4)}, ${fmt(state.C, Cdec)}, ${fmt(state.H, 2)}, ${fmt(a, 2)}`;
    }
    case 'figma-p3': {
      const p3 = OK.linSrgbToDisplayP3(...rgb);
      return `#${toHex2(p3[0] * 255)}${toHex2(p3[1] * 255)}${toHex2(p3[2] * 255)}${toHex2(a * 255)}`;
    }
  }
  return hex6;
}

// Always-OKLCH output (independent of the model toggle), e.g.
// `oklch(0.7049 0.15 349)` — valid CSS and round-trips through the R input.
export function oklchString(state: PickerState): string {
  let l: number, c: number, h: number;
  if (state.model === 'oklch') {
    [l, c, h] = [state.L, state.C, state.H];
  } else {
    [l, c, h] = OK.srgbToOklch(...currentRGB(state));
  }
  const aDisp = state.alpha < 1 ? ` / ${fmt(state.alpha, 2)}` : '';
  return `oklch(${fmt(l, 4)} ${fmt(c, 3)} ${fmt(h, 2)}${aDisp})`;
}

export interface PreviewInfo {
  background: string;
  fallback: boolean;
  fallbackLabel: string;
  note: string;
}

export function previewInfo(state: PickerState): PreviewInfo {
  const rgb = currentRGB(state);
  const inSr = OK.inSrgb(rgb);
  if (inSr) {
    return {
      background: OK.linSrgbToCss(rgb[0], rgb[1], rgb[2], state.alpha),
      fallback: false,
      fallbackLabel: '',
      note: 'Paste HEX/RGB/HSL to convert to ' + state.model.toUpperCase(),
    };
  }
  const fbRgb = safeRGB(state);
  const inP3v = OK.inP3(rgb);
  const inR = OK.inRec2020(rgb);
  let fallbackLabel: string;
  if (!inR) fallbackLabel = 'Unavailable<br/>on any device';
  else if (!inP3v) fallbackLabel = 'Only Rec2020<br/>displays';
  else fallbackLabel = 'Only P3<br/>displays';
  return {
    background: OK.linSrgbToCss(fbRgb[0], fbRgb[1], fbRgb[2], state.alpha),
    fallback: true,
    fallbackLabel,
    note: 'Closest fallback (by chroma) in sRGB',
  };
}

// Parse a token that may be a percentage. `%` is read as a fraction of `scale`
// (oklch L: scale 1 -> 70% = 0.7; lch L: scale 100 -> 70% = 70).
const pctOr = (tok: string, scale: number): number =>
  tok.trim().endsWith('%') ? (parseFloat(tok) / 100) * scale : parseFloat(tok);

// Parse the R-input box value into linear sRGB + alpha. Returns null on any
// non-finite component so the caller can revert the field cleanly.
export function parseRInput(text: string): OK.ParsedColor | null {
  const parsed = parseRInputRaw(text);
  if (!parsed) return null;
  const { r, g, b, a } = parsed;
  return [r, g, b, a].every(Number.isFinite) ? parsed : null;
}

function parseRInputRaw(text: string): OK.ParsedColor | null {
  const s = text.trim();
  const parsed = OK.parseAnyColor(s);
  if (parsed) return parsed;

  let m = s.match(/^oklch\(([^)]+)\)$/i);
  if (m) {
    const t = m[1].split(/[ ,/]+/).filter(Boolean);
    const rgb = OK.oklchToSrgb(pctOr(t[0], 1), parseFloat(t[1]), parseFloat(t[2]));
    return { r: rgb[0], g: rgb[1], b: rgb[2], a: t[3] !== undefined ? pctOr(t[3], 1) : 1 };
  }
  m = s.match(/^lch\(([^)]+)\)$/i);
  if (m) {
    const t = m[1].split(/[ ,/]+/).filter(Boolean);
    const rgb = OK.lchToSrgb(pctOr(t[0], 100), parseFloat(t[1]), parseFloat(t[2]));
    return { r: rgb[0], g: rgb[1], b: rgb[2], a: t[3] !== undefined ? pctOr(t[3], 1) : 1 };
  }
  m = s.match(/^oklab\(([^)]+)\)$/i);
  if (m) {
    const t = m[1].split(/[ ,/]+/).filter(Boolean);
    const rgb = OK.modelToLinSrgb(
      'oklch',
      ...OK.oklabToOklch(pctOr(t[0], 1), parseFloat(t[1]), parseFloat(t[2])),
    );
    return { r: rgb[0], g: rgb[1], b: rgb[2], a: t[3] !== undefined ? pctOr(t[3], 1) : 1 };
  }
  m = s.match(/^lab\(([^)]+)\)$/i);
  if (m) {
    const t = m[1].split(/[ ,/]+/).filter(Boolean);
    const rgb = OK.lchToSrgb(...OK.labToLch(pctOr(t[0], 100), parseFloat(t[1]), parseFloat(t[2])));
    return { r: rgb[0], g: rgb[1], b: rgb[2], a: t[3] !== undefined ? pctOr(t[3], 1) : 1 };
  }
  return null;
}
