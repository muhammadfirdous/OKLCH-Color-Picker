// Shareable color state in the URL fragment, oklch.com-style:
//   #L,C,H,A   e.g. #70.49,0.15,250,1   (L is 0-100, A is 0-1, A optional)
// Values are OKLCH. This module is pure (no DOM) so it round-trips cleanly.

export interface UrlColor {
  l: number; // 0..1 (OKLCH lightness, as the picker stores it)
  c: number; // 0..C_MAX
  h: number; // 0..360
  a: number; // 0..1
}

// Matches usePicker's initial color (OKLCH).
export const DEFAULT_URL_COLOR: UrlColor = { a: 1, c: 0.15, h: 349, l: 0.7 };

const C_MAX = 0.47;

const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
const round = (n: number, dp: number): number => parseFloat(n.toFixed(dp));

// Stable precision so parse -> serialize is a no-op: L 2dp (after *100), C 3dp,
// H 1dp, A 2dp. A is dropped when it rounds to 1.
export function serializeColor(color: UrlColor): string {
  const L = round(clamp(color.l, 0, 1) * 100, 2);
  const C = round(clamp(color.c, 0, C_MAX), 3);
  const H = round(clamp(color.h, 0, 360), 1);
  const A = round(clamp(color.a, 0, 1), 2);
  const head = `${L},${C},${H}`;
  return A < 1 ? `${head},${A}` : head;
}

// Returns null only when the fragment can't yield L,C,H at all (empty, or fewer
// than 3 parts). Individual garbage/out-of-range fields fall back per-field.
export function parseColor(hash: string): UrlColor | null {
  const raw = hash.replace(/^#/, '').trim();
  if (!raw) return null;
  const parts = raw.split(',');
  if (parts.length < 3) return null;

  const field = (i: number, def: number, lo: number, hi: number, scale = 1): number => {
    const v = parseFloat(parts[i]);
    return Number.isFinite(v) ? clamp(v * scale, lo, hi) : def;
  };

  return {
    l: field(0, DEFAULT_URL_COLOR.l, 0, 1, 0.01), // URL L is 0..100
    c: field(1, DEFAULT_URL_COLOR.c, 0, C_MAX),
    h: field(2, DEFAULT_URL_COLOR.h, 0, 360),
    a: parts.length >= 4 ? field(3, 1, 0, 1) : 1,
  };
}

export function isDefaultColor(color: UrlColor): boolean {
  return serializeColor(color) === serializeColor(DEFAULT_URL_COLOR);
}
