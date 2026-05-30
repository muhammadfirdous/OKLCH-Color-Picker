import type { PickerState } from '../lib/types';
import type { PickerApi } from '../usePicker';
import NumberField from './NumberField';
import RangeSlider from './RangeSlider';
import type { Oklch } from './Chart';

interface Props {
  state: PickerState;
  api: PickerApi;
  oklch: Oklch;
}

export default function AlphaCard({ state, api, oklch }: Props) {
  return (
    <section className="card channel-card">
      <div className="channel-head">
        <div className="channel-title">Alpha</div>
        <NumberField
          label="A"
          displayValue={state.alpha * 100}
          decimals={0}
          onCommit={v => api.setAlpha(v / 100)}
          onStep={d => api.step('alpha', d)}
        />
      </div>
      <RangeSlider
        type="a"
        oklch={oklch}
        value={state.alpha * 100}
        min={0}
        max={100}
        step={1}
        showP3={false}
        showRec2020={false}
        onInput={v => api.setAlpha(v / 100)}
      />
    </section>
  );
}
