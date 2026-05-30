import { useEffect } from 'react';
import { usePicker } from './usePicker';
import LeftColumn from './components/LeftColumn';
import ChannelCard from './components/ChannelCard';
import AlphaCard from './components/AlphaCard';
import ThreeDCard from './components/ThreeDCard';
import FullscreenOverlay from './components/FullscreenOverlay';
import { srgbToOklch, oklchToSrgb, srgbToModel } from './lib/color';
import { currentRGB } from './lib/format';
import { current as current3d, biggestRgb } from './lib3d/stores';
import type { Oklch } from './components/Chart';
import { serializeColor, parseColor, isDefaultColor, type UrlColor } from './lib/urlColor';

export default function App() {
  const api = usePicker();
  const { state } = api;
  const modelUpper = state.model.toUpperCase();

  // The embedded charts/ranges/3D operate in OKLCH (the engine is an OKLCH
  // build). Derive the current color's OKLCH from the picker state, and write
  // edits back through linear sRGB into whatever model the UI is using.
  const oklch: Oklch & { a: number } =
    state.model === 'oklch'
      ? { l: state.L, c: state.C, h: state.H, a: state.alpha * 100 }
      : (() => {
          const [r, g, b] = currentRGB(state);
          const [l, c, h] = srgbToOklch(r, g, b);
          return { l, c, h, a: state.alpha * 100 };
        })();

  function pickOklch(partial: Partial<Oklch>): void {
    const next = { l: oklch.l, c: oklch.c, h: oklch.h, ...partial };
    if (state.model === 'oklch') {
      api.patch({ L: next.l, C: next.c, H: next.h });
    } else {
      const [r, g, b] = oklchToSrgb(next.l, next.c, next.h);
      const [L, C, H] = srgbToModel('lch', r, g, b);
      api.patch({ L, C, H });
    }
  }

  // Drive the embedded 3D engine's stores from the picker state. The engine is
  // an OKLCH build, so feed it the current color's OKLCH coords regardless of
  // the UI model toggle (the 3D always shows the OKLCH gamut solid).
  useEffect(() => {
    const [r, g, b] = currentRGB(state);
    const [l, c, h] = srgbToOklch(r, g, b);
    current3d.set({ l, c, h, a: state.alpha * 100 });
  }, [state.L, state.C, state.H, state.model, state.alpha]);

  useEffect(() => {
    biggestRgb.set(state.showR2020 ? 'rec2020' : state.showP3 ? 'p3' : 'rgb');
  }, [state.showP3, state.showR2020]);

  // Position the chart crosshair guide lines. The repo sets these on <body>
  // (view/chart onPaint); every chart's lines inherit them, so any L/C/H
  // change moves the matching line in every chart at once.
  useEffect(() => {
    const maxC = state.showR2020 ? C_MAX_REC2020 : C_MAX;
    document.body.style.setProperty('--chart-l', `${(100 * oklch.l) / L_MAX}%`);
    document.body.style.setProperty('--chart-c', `${(100 * oklch.c) / maxC}%`);
    document.body.style.setProperty('--chart-h', `${(100 * oklch.h) / H_MAX}%`);
  }, [oklch.l, oklch.c, oklch.h, state.showR2020]);

  // Fill every slider thumb with the current color (alpha applied). One shared
  // color, recomputed whenever any channel changes — including alpha.
  useEffect(() => {
    document.body.style.setProperty(
      '--thumb-color',
      `oklch(${oklch.l} ${oklch.c} ${oklch.h} / ${state.alpha})`,
    );
  }, [oklch.l, oklch.c, oklch.h, state.alpha]);

  // Sync color -> URL fragment (debounced; replaceState so dragging never
  // floods history). The equality check guards the URL->state->URL loop.
  useEffect(() => {
    const color: UrlColor = { a: state.alpha, c: oklch.c, h: oklch.h, l: oklch.l };
    const id = window.setTimeout(() => {
      const desired = isDefaultColor(color) ? '' : `#${serializeColor(color)}`;
      if (location.hash === desired) return;
      history.replaceState(null, '', desired || location.pathname + location.search);
    }, 80);
    return () => window.clearTimeout(id);
  }, [oklch.l, oklch.c, oklch.h, state.alpha]);

  // URL fragment -> color on back/forward nav or manual edit (replaceState
  // above doesn't fire hashchange, so this only runs for real navigation).
  const { setFromRgb } = api;
  useEffect(() => {
    const onHash = (): void => {
      const url = parseColor(location.hash);
      if (!url) return;
      const [r, g, b] = oklchToSrgb(url.l, url.c, url.h);
      setFromRgb(r, g, b, url.a);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [setFromRgb]);

  // Sync the document/body presentation with picker state (kept off React tree
  // so the ported CSS selectors `body.hide-graphs` etc. keep working).
  useEffect(() => {
    document.body.classList.toggle('hide-graphs', !state.showGraphs);
    document.body.classList.toggle('hide-3d', !state.show3D);
    document.body.classList.toggle('lch-mode', state.model === 'lch');
  }, [state.showGraphs, state.show3D, state.model]);

  useEffect(() => {
    document.title = `${modelUpper} Color Picker & Converter`;
  }, [modelUpper]);

  // Lock background scroll + allow Escape to close the fullscreen overlay.
  useEffect(() => {
    if (!state.fullscreen3D) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') api.patch({ fullscreen3D: false });
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [state.fullscreen3D, api]);

  return (
    <>
      <header className="topbar">
        <h1>{modelUpper} Color Picker &amp; Converter</h1>
        <a
          href="https://github.com/muhammadfirdous/OKLCH-Color-Picker.git"
          className="gh"
          aria-label="GitHub"
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.6 3.3-1.2 3.3-1.2.7 1.7.3 2.9.1 3.1.8.8 1.2 1.9 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.9 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
          </svg>
        </a>
      </header>

      <main className="grid">
        <LeftColumn state={state} api={api} />

        <div className="col-mid">
          <ChannelCard
            id="L_panel"
            title="Lightness"
            axis="L"
            type="l"
            state={state}
            api={api}
            oklch={oklch}
            showP3={state.showP3}
            showRec2020={state.showR2020}
            onPick={pickOklch}
          />
          <ThreeDCard onExpand={() => api.patch({ fullscreen3D: true })} />
          <AlphaCard state={state} api={api} oklch={oklch} />
        </div>

        <div className="col-right">
          <ChannelCard
            id="C_panel"
            title="Chroma"
            axis="C"
            type="c"
            state={state}
            api={api}
            oklch={oklch}
            showP3={state.showP3}
            showRec2020={state.showR2020}
            onPick={pickOklch}
          />
          <ChannelCard
            id="H_panel"
            title="Hue"
            axis="H"
            type="h"
            state={state}
            api={api}
            oklch={oklch}
            showP3={state.showP3}
            showRec2020={state.showR2020}
            onPick={pickOklch}
          />
        </div>
      </main>

      {state.fullscreen3D && (
        <FullscreenOverlay state={state} onClose={() => api.patch({ fullscreen3D: false })} />
      )}
    </>
  );
}
