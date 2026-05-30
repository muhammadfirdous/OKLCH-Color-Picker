import { formatColorAs } from '../lib/format';
import { FORMATS } from '../lib/types';
import type { FormatId, PickerState } from '../lib/types';

interface Props {
  state: PickerState;
  onSelect: (id: FormatId) => void;
}

export default function FormatMenu({ state, onSelect }: Props) {
  return (
    <div className="format-menu">
      {FORMATS.map((f) => {
        const val = formatColorAs(f.id, state);
        const selected = f.id === state.inputFormat;
        return (
          <div
            key={f.id}
            className={`fmt-item${selected ? ' selected' : ''}`}
            title={val}
            onClick={() => onSelect(f.id)}
          >
            {val}
          </div>
        );
      })}
    </div>
  );
}
