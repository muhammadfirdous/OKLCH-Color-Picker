// Gamut border colors, read from CSS custom props on <body> (with fallbacks).
export function getBorders(): [string, string] {
  let styles = window.getComputedStyle(document.body);
  return [
    styles.getPropertyValue('--border-p3').trim() || '#000',
    styles.getPropertyValue('--border-rec2020').trim() || '#999',
  ];
}
