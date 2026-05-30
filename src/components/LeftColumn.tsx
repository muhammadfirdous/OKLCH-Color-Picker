import { useEffect, useRef, useState } from 'react';
import { oklchString, previewInfo, parseRInput } from '../lib/format';
import type { PickerState } from '../lib/types';
import type { PickerApi } from '../usePicker';
import RInput from './RInput';

interface Props {
  state: PickerState;
  api: PickerApi;
}

// An editable color string (parses any supported format on commit, reverts on
// invalid) with a one-click copy button.
function OutputField({
  label,
  name,
  value,
  api,
}: {
  label: string;
  name: string;
  value: string;
  api: PickerApi;
}) {
  const [text, setText] = useState(value);
  const [copied, setCopied] = useState(false);
  const focused = useRef(false);

  // Mirror the live value unless the user is actively editing.
  useEffect(() => {
    if (!focused.current) setText(value);
  }, [value]);

  function commit(): void {
    const parsed = parseRInput(text);
    if (parsed) api.setFromRgb(parsed.r, parsed.g, parsed.b, parsed.a);
    else setText(value); // revert invalid input
  }

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable (e.g. insecure context) */
    }
  }

  return (
    <div className="field-row with-picker">
      <span className="kbd">{label}</span>
      <div className="input-wrap">
        <input
          type="text"
          value={text}
          aria-label={`${name} value`}
          spellCheck={false}
          autoComplete="off"
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            commit();
          }}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
        <button
          className="picker-btn"
          aria-label={`Copy ${name} value`}
          title={`Copy ${name} value`}
          onClick={copy}
        >
          {copied ? (
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2.5 6.5l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
              <path d="M2.5 8V2.5h5.5" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

interface ToggleDef {
  key: 'show3D' | 'showGraphs' | 'showP3' | 'showR2020';
  label: string;
}

const TOGGLES: ToggleDef[] = [
  { key: 'show3D', label: 'Show 3D' },
  { key: 'showGraphs', label: 'Show graphs' },
  { key: 'showP3', label: 'Show P3' },
  { key: 'showR2020', label: 'Show Rec2020' },
];

export default function LeftColumn({ state, api }: Props) {
  const info = previewInfo(state);

  return (
    <div className="col-input">
      <section className="card input-card">
        <div className="preview-wrap">
          <div className="preview" style={{ background: info.background }} />
          <div
            className={`preview-fallback${info.fallback ? ' show' : ''}`}
            style={{ ['--fb-color' as string]: info.background }}
          >
            <div
              className="fb-msg fb-label"
              dangerouslySetInnerHTML={{ __html: info.fallbackLabel }}
            />
            <div className="fb-color">
              <div className="fb-pill">Fallback</div>
            </div>
          </div>
        </div>

        <OutputField label="O" name="OKLCH" value={oklchString(state)} api={api} />

        <div className="field-row with-picker">
          <span className="kbd">R</span>
          <RInput state={state} api={api} />
        </div>

        <p className="hint">{info.note}</p>

        <div className="mode-toggle">
          <button
            className={state.model === 'oklch' ? 'active' : ''}
            onClick={() => api.setModel('oklch')}
          >
            OKLCH
          </button>
          <button
            className={state.model === 'lch' ? 'active' : ''}
            onClick={() => api.setModel('lch')}
          >
            LCH
          </button>
        </div>

        <div className="attribution">
          Made by <strong>Muhammad Firdous</strong>
          <div className="robots">
            <div className="robot" />
            <div className="robot" />
          </div>
        </div>
      </section>

      <a href="#" className="card info-card">
        <span className="ico">?</span>
        <span>Why OKLCH is better than RGB and HSL</span>
        <svg
          className="ext"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M5 3h6v6M11 3l-7 7" strokeLinecap="round" />
        </svg>
      </a>

      <a href="#" className="card info-card">
        <span className="ico ico-palette">
          d<small>p</small>
        </span>
        <span>Build palette with OKLCH and APCA</span>
        <svg
          className="ext"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M5 3h6v6M11 3l-7 7" strokeLinecap="round" />
        </svg>
      </a>

      <div className="toggle-list">
        {TOGGLES.map((t) => (
          <label className="toggle-row" key={t.key}>
            {t.label}
            <span className="switch">
              <input
                type="checkbox"
                checked={state[t.key]}
                onChange={(e) => api.patch({ [t.key]: e.target.checked })}
              />
              <span className="slider" />
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
