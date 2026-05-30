import type { PickerState } from '../lib/types';
import type { PickerApi } from '../usePicker';
import NumberField from './NumberField';
import Chart, { type Oklch } from './Chart';
import RangeSlider from './RangeSlider';

interface Props {
  title: string;
  axis: 'L' | 'C' | 'H'; // model-space axis for the numeric field
  type: 'c' | 'h' | 'l'; // OKLCH component for the chart + range
  state: PickerState;
  api: PickerApi;
  oklch: Oklch;
  showP3: boolean;
  showRec2020: boolean;
  onPick: (partial: Partial<Oklch>) => void;
  id?: string;
}

function decimalsFor(axis: 'L' | 'C' | 'H', model: PickerState['model']): number {
  if (axis === 'C') return model === 'oklch' ? 3 : 1;
  return axis === 'L' ? 4 : 2;
}

export default function ChannelCard({
  title,
  axis,
  type,
  state,
  api,
  oklch,
  showP3,
  showRec2020,
  onPick,
  id,
}: Props) {
  const maxC = showRec2020 ? C_MAX_REC2020 : C_MAX;
  // The chart in each card holds a *rotated* component (repo: card 'l' → chart
  // 'h', 'c' → 'l', 'h' → 'c'). The slider keeps the card's own component.
  const chartType: 'c' | 'h' | 'l' = type === 'l' ? 'h' : type === 'c' ? 'l' : 'c';
  const cfg =
    type === 'l'
      ? { value: oklch.l, min: 0, max: L_MAX, step: 0.01 }
      : type === 'c'
        ? { value: oklch.c, min: 0, max: maxC, step: 0.01 }
        : { value: oklch.h, min: 0, max: H_MAX, step: 1 };

  return (
    <section className="card channel-card" id={id}>
      <div className="channel-head">
        <div className="channel-title">{title}</div>
        <NumberField
          label={axis}
          displayValue={state[axis]}
          decimals={decimalsFor(axis, state.model)}
          onCommit={v => api.setAxis(axis, v)}
          onStep={d => api.step(axis, d)}
        />
      </div>
      <Chart type={chartType} oklch={oklch} showP3={showP3} showRec2020={showRec2020} onPick={onPick} />
      <RangeSlider
        type={type}
        oklch={oklch}
        value={cfg.value}
        min={cfg.min}
        max={cfg.max}
        step={cfg.step}
        showP3={showP3}
        showRec2020={showRec2020}
        onInput={v => onPick({ [type]: v })}
      />
    </section>
  );
}
