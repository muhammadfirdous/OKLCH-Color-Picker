// Color space conversions: OKLCH, LCH, sRGB, P3, Rec2020.
// All sRGB/P3/Rec2020 values are 0..1 (linear) unless noted as gamma-encoded.

export type Model = 'oklch' | 'lch';
export type RGB = [number, number, number];
export type LCHTuple = [number, number, number];
export interface ParsedColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

// ---------- sRGB gamma ----------
export const srgbGamma = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
export const srgbLinear = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

// ---------- OKLab ↔ linear sRGB ----------
export function linearSrgbToOklab(r: number, g: number, b: number): RGB {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l),
    m_ = Math.cbrt(m),
    s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}
export function oklabToLinearSrgb(L: number, a: number, b: number): RGB {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3,
    m = m_ ** 3,
    s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

// ---------- OKLCH ↔ OKLab ----------
export function oklchToOklab(L: number, C: number, H: number): RGB {
  const h = (H * Math.PI) / 180;
  return [L, C * Math.cos(h), C * Math.sin(h)];
}
export function oklabToOklch(L: number, a: number, b: number): LCHTuple {
  const C = Math.hypot(a, b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

// ---------- CIE Lab/LCH (D65) ↔ linear sRGB ----------
const XN = 0.95047,
  YN = 1.0,
  ZN = 1.08883;
export function linearSrgbToXyz(r: number, g: number, b: number): RGB {
  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.072175 * b,
    0.0193339 * r + 0.119192 * g + 0.9503041 * b,
  ];
}
export function xyzToLinearSrgb(x: number, y: number, z: number): RGB {
  return [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ];
}
const labF = (t: number): number =>
  t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116;
const labFInv = (t: number): number =>
  t > 6 / 29 ? t ** 3 : 3 * (6 / 29) ** 2 * (t - 4 / 29);
export function xyzToLab(x: number, y: number, z: number): RGB {
  const fx = labF(x / XN),
    fy = labF(y / YN),
    fz = labF(z / ZN);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
export function labToXyz(L: number, a: number, b: number): RGB {
  const fy = (L + 16) / 116,
    fx = fy + a / 500,
    fz = fy - b / 200;
  return [labFInv(fx) * XN, labFInv(fy) * YN, labFInv(fz) * ZN];
}
export function lchToLab(L: number, C: number, H: number): RGB {
  const h = (H * Math.PI) / 180;
  return [L, C * Math.cos(h), C * Math.sin(h)];
}
export function labToLch(L: number, a: number, b: number): LCHTuple {
  const C = Math.hypot(a, b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

// ---------- Wide-gamut: linear sRGB ↔ XYZ ↔ linear P3 / Rec2020 ----------
type Mat3 = [RGB, RGB, RGB];
const M_XYZ_TO_LIN_P3: Mat3 = [
  [2.4934969, -0.9313836, -0.4027108],
  [-0.829489, 1.7626641, 0.0236247],
  [0.0358458, -0.0761724, 0.9568845],
];
const M_XYZ_TO_LIN_R2020: Mat3 = [
  [1.7166512, -0.3556708, -0.2533663],
  [-0.6666844, 1.6164812, 0.0157685],
  [0.0176399, -0.0427706, 0.9421031],
];
const mul3 = (m: Mat3, v: RGB): RGB => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
];

export function linSrgbToP3(r: number, g: number, b: number): RGB {
  return mul3(M_XYZ_TO_LIN_P3, linearSrgbToXyz(r, g, b));
}
export function linSrgbToRec2020(r: number, g: number, b: number): RGB {
  return mul3(M_XYZ_TO_LIN_R2020, linearSrgbToXyz(r, g, b));
}

// ---------- Gamut checks ----------
const inUnit = (v: number, eps = 0.0001): boolean => v >= -eps && v <= 1 + eps;
export function inSrgb(rgb: RGB): boolean {
  return rgb.every((c) => inUnit(c));
}
export function inP3(rgb: RGB): boolean {
  return linSrgbToP3(...rgb).every((c) => inUnit(c));
}
export function inRec2020(rgb: RGB): boolean {
  return linSrgbToRec2020(...rgb).every((c) => inUnit(c));
}

// ---------- High-level: OKLCH → sRGB hex (with clamp) ----------
export function oklchToSrgb(L: number, C: number, H: number): RGB {
  const [Ll, a, b] = oklchToOklab(L, C, H);
  return oklabToLinearSrgb(Ll, a, b);
}
export function lchToSrgb(L: number, C: number, H: number): RGB {
  const [Ll, a, b] = lchToLab(L, C, H);
  return xyzToLinearSrgb(...labToXyz(Ll, a, b));
}
// model lightness is normalized 0..1 for BOTH models.
// OKLCH uses L directly; LCH's native CIE lightness is 0..100, so we scale.
export function modelToLinSrgb(model: Model, L: number, C: number, H: number): RGB {
  return model === 'oklch' ? oklchToSrgb(L, C, H) : lchToSrgb(L * 100, C, H);
}
// sRGB -> model state (L normalized to 0..1 for both models)
export function srgbToModel(model: Model, r: number, g: number, b: number): LCHTuple {
  if (model === 'oklch') return srgbToOklch(r, g, b);
  const [L, C, H] = srgbToLch(r, g, b);
  return [L / 100, C, H];
}

export function clampUnit(v: number): number {
  return Math.max(0, Math.min(1, v));
}
export function linSrgbToHex(lr: number, lg: number, lb: number): string {
  const r = Math.round(clampUnit(srgbLinear(clampUnit(lr))) * 255);
  const g = Math.round(clampUnit(srgbLinear(clampUnit(lg))) * 255);
  const b = Math.round(clampUnit(srgbLinear(clampUnit(lb))) * 255);
  return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');
}
export function linSrgbToCss(lr: number, lg: number, lb: number, alpha = 1): string {
  const r = Math.round(clampUnit(srgbLinear(clampUnit(lr))) * 255);
  const g = Math.round(clampUnit(srgbLinear(clampUnit(lg))) * 255);
  const b = Math.round(clampUnit(srgbLinear(clampUnit(lb))) * 255);
  return alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}

// ---------- HEX/RGB/HSL → OKLCH/LCH ----------
export function parseHex(str: string): ParsedColor | null {
  let s = str.trim().replace(/^#/, '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  if (s.length === 4) s = s.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(s)) return null;
  const r = parseInt(s.slice(0, 2), 16) / 255;
  const g = parseInt(s.slice(2, 4), 16) / 255;
  const b = parseInt(s.slice(4, 6), 16) / 255;
  const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}
export function parseAnyColor(input: string): ParsedColor | null {
  const s = input.trim();
  // hex
  if (s.startsWith('#') || /^[0-9a-f]{3,8}$/i.test(s)) {
    const p = parseHex(s);
    if (p) return { r: srgbGamma(p.r), g: srgbGamma(p.g), b: srgbGamma(p.b), a: p.a };
  }
  // rgb / rgba
  let m = s.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(/[, /]+/).filter(Boolean);
    if (parts.length >= 3) {
      const parseChan = (x: string) =>
        x.endsWith('%') ? parseFloat(x) / 100 : parseFloat(x) / 255;
      const r = parseChan(parts[0]);
      const g = parseChan(parts[1]);
      const b = parseChan(parts[2]);
      const a =
        parts[3] !== undefined
          ? parts[3].endsWith('%')
            ? parseFloat(parts[3]) / 100
            : parseFloat(parts[3])
          : 1;
      return { r: srgbGamma(r), g: srgbGamma(g), b: srgbGamma(b), a };
    }
  }
  // hsl
  m = s.match(/^hsla?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(/[, /]+/).filter(Boolean);
    if (parts.length >= 3) {
      const h = parseFloat(parts[0]) / 360;
      const sl = parseFloat(parts[1]) / 100;
      const l = parseFloat(parts[2]) / 100;
      const a =
        parts[3] !== undefined
          ? parts[3].endsWith('%')
            ? parseFloat(parts[3]) / 100
            : parseFloat(parts[3])
          : 1;
      const [r, g, b] = hslToRgb(h, sl, l);
      return { r: srgbGamma(r), g: srgbGamma(g), b: srgbGamma(b), a };
    }
  }
  return null;
}
export function hslToRgb(h: number, s: number, l: number): RGB {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hk = (t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [hk(h + 1 / 3), hk(h), hk(h - 1 / 3)];
}

export function srgbToOklch(r: number, g: number, b: number): LCHTuple {
  const [L, A, B] = linearSrgbToOklab(r, g, b);
  return oklabToOklch(L, A, B);
}
export function srgbToLch(r: number, g: number, b: number): LCHTuple {
  const [x, y, z] = linearSrgbToXyz(r, g, b);
  const [L, A, B] = xyzToLab(x, y, z);
  return labToLch(L, A, B);
}

// Find max chroma in sRGB for given (L, H) in OKLCH or LCH (binary search).
export function maxChroma(
  model: Model,
  L: number,
  H: number,
  gamutFn: (rgb: RGB) => boolean = inSrgb,
): number {
  let lo = 0,
    hi = model === 'oklch' ? 0.47 : 195;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const rgb = modelToLinSrgb(model, L, mid, H);
    if (gamutFn(rgb)) lo = mid;
    else hi = mid;
  }
  return lo;
}

export interface ModelConstraints {
  Lmax: number;
  Lstep: number;
  Cmax: number;
  Cstep: number;
  Cdisp: number;
  Hmin: number;
  Hmax: number;
}

// Model constraints. Lightness range is 0..1 for BOTH models.
export const MODELS: Record<Model, ModelConstraints> = {
  oklch: { Lmax: 1, Lstep: 0.0001, Cmax: 0.47, Cstep: 0.001, Cdisp: 3, Hmin: 1, Hmax: 360 },
  lch: { Lmax: 1, Lstep: 0.0001, Cmax: 195, Cstep: 0.1, Cdisp: 1, Hmin: 1, Hmax: 360 },
};

// Closest sRGB fallback by chroma (keeps L and H, shrinks C).
export function fallbackByChroma(model: Model, L: number, C: number, H: number): LCHTuple {
  const maxC = maxChroma(model, L, H, inSrgb);
  return [L, Math.min(C, maxC), H];
}

// linear sRGB (0..1) → gamma sRGB 0..255 ints
export function linSrgbToRgb255(lr: number, lg: number, lb: number): RGB {
  return [
    Math.round(clampUnit(srgbLinear(clampUnit(lr))) * 255),
    Math.round(clampUnit(srgbLinear(clampUnit(lg))) * 255),
    Math.round(clampUnit(srgbLinear(clampUnit(lb))) * 255),
  ];
}
// linear sRGB → HSL (h in degrees, s,l in 0..1)
export function linSrgbToHsl(lr: number, lg: number, lb: number): RGB {
  const r = clampUnit(srgbLinear(clampUnit(lr)));
  const g = clampUnit(srgbLinear(clampUnit(lg)));
  const b = clampUnit(srgbLinear(clampUnit(lb)));
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h: number, s: number;
  if (max === min) {
    h = 0;
    s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return [h, s, l];
}
// Display-P3 (gamma-encoded, 0..1) from linear sRGB
export function linSrgbToDisplayP3(lr: number, lg: number, lb: number): RGB {
  const linP3 = linSrgbToP3(lr, lg, lb);
  return linP3.map((c) => clampUnit(srgbLinear(clampUnit(c)))) as RGB;
}
