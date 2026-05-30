import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build-time globals for the embedded oklch-picker 3D engine (OKLCH build).
const colorDefine = {
  LCH: JSON.stringify(false),
  COLOR_FN: JSON.stringify('oklch'),
  L_MAX: JSON.stringify(1),
  L_MAX_COLOR: JSON.stringify(1),
  C_MAX: JSON.stringify(0.37),
  C_MAX_REC2020: JSON.stringify(0.47),
  C_RANDOM: JSON.stringify(0.1),
  H_MAX: JSON.stringify(360),
};

export default defineConfig({
  plugins: [react()],
  define: colorDefine,
});
