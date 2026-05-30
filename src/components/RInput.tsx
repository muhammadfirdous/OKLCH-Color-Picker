import { useEffect, useRef, useState } from 'react';
import { formatColorAs, parseRInput } from '../lib/format';
import type { FormatId, PickerState } from '../lib/types';
import type { PickerApi } from '../usePicker';
import FormatMenu from './FormatMenu';

interface Props {
  state: PickerState;
  api: PickerApi;
}

export default function RInput({ state, api }: Props) {
  const value = formatColorAs(state.inputFormat, state);
  const [text, setText] = useState(value);
  const focused = useRef(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Mirror the formatted value into the box unless the user is editing.
  useEffect(() => {
    if (!focused.current) setText(value);
  }, [value]);

  // Close the format menu on any outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [menuOpen]);

  function commit() {
    const parsed = parseRInput(text);
    if (parsed) api.setFromRgb(parsed.r, parsed.g, parsed.b, parsed.a);
    else setText(value); // revert invalid input
  }

  function selectFormat(id: FormatId) {
    api.patch({ inputFormat: id });
    setMenuOpen(false);
  }

  return (
    <div className="input-wrap" ref={wrapRef}>
      <input
        type="text"
        value={text}
        placeholder="#000000"
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
        aria-label="Choose format"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((o) => !o);
        }}
      >
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 4l3 4 3-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {menuOpen && <FormatMenu state={state} onSelect={selectFormat} />}
    </div>
  );
}
