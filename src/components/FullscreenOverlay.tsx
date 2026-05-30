import type { PickerState } from '../lib/types';
import ThreeDView from './ThreeDView';

interface Props {
  state: PickerState;
  onClose: () => void;
}

export default function FullscreenOverlay({ state, onClose }: Props) {
  return (
    <div className="fs-overlay">
      <div className="fs-title">{state.model.toUpperCase()} 3D model</div>
      <button className="fs-close" aria-label="Close" onClick={onClose}>
        <svg
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        >
          <path d="M3 3l8 8M11 3l-8 8" />
        </svg>
      </button>
      <ThreeDView fullscreen canvasId="threeDFull" />
      <div className="fs-hint">
        Drag to rotate &nbsp;·&nbsp; Scroll to zoom &nbsp;·&nbsp; Right button to move
      </div>
    </div>
  );
}
