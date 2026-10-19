# OKLCH Color Picker

An interactive color picker and converter for exploring lightness, chroma, hue, and opacity, with channel charts and a 3D color-space view.

[Open the demo](https://oklch-color-picker.vercel.app)

## Features

- Switch between OKLCH and LCH color models.
- Adjust channels with sliders and numeric inputs.
- Explore sRGB, Display P3, and Rec. 2020 gamut visualizations.
- Inspect a 3D view, including a fullscreen mode.
- Share the selected color through the URL fragment.

## Stack

React, TypeScript, Vite, Three.js, Nano Stores, and @colordx/core.

## Run locally

Install Node.js and npm, then:

```bash
git clone https://github.com/muhammadfirdous/OKLCH-Color-Picker.git
cd OKLCH-Color-Picker
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Build and preview

```bash
npm run build
npm run preview
```

The build runs TypeScript project compilation before producing the Vite output in `dist/`.

## Project layout

| Path | Purpose |
| --- | --- |
| `src/components/` | Channel controls, charts, and 3D panels |
| `src/lib/` | Color conversion, formatting, and URL state |
| `src/lib3d/` | 3D model, rendering, camera, and worker code |
| `src/usePicker.ts` | Shared picker state and updates |
| `src/styles.css` | Application styling |

Color appearance depends on browser and display support. The visualization does not calibrate a monitor.
