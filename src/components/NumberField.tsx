import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  displayValue: number;
  decimals: number;
  onCommit: (parsed: number) => void;
  onStep: (dir: 1 | -1) => void;
}

function format(v: number, decimals: number): string {
  if (!isFinite(v)) return '0';
  return decimals === 0 ? String(Math.round(v)) : v.toFixed(decimals);
}

export default function NumberField({ label, displayValue, decimals, onCommit, onStep }: Props) {
  const [text, setText] = useState(() => format(displayValue, decimals));
  const focused = useRef(false);

  // Reflect external state changes unless the user is actively editing.
  useEffect(() => {
    if (!focused.current) setText(format(displayValue, decimals));
  }, [displayValue, decimals]);

  return (
    <div className="channel-num">
      <span className="kbd">{label}</span>
      <div className="num-input-wrap">
        <input
          type="text"
          value={text}
          onFocus={() => {
            focused.current = true;
          }}
          onBlur={() => {
            focused.current = false;
            setText(format(displayValue, decimals));
          }}
          onChange={(e) => {
            setText(e.target.value);
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onCommit(v);
          }}
        />
        <div className="num-steps">
          <button className="num-step" aria-label="Up" onClick={() => onStep(1)}>
            <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 5l2-2 2 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button className="num-step" aria-label="Down" onClick={() => onStep(-1)}>
            <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M2 3l2 2 2-2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
