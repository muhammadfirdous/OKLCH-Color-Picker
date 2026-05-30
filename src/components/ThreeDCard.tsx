import ThreeDView from './ThreeDView';

interface Props {
  onExpand: () => void;
}

export default function ThreeDCard({ onExpand }: Props) {
  return (
    <section className="card threed-card" id="threeD_card">
      <div className="threed-head">
        <div className="channel-title">3D</div>
        <button className="threed-expand" aria-label="Expand" onClick={onExpand}>
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path
              d="M3 7v2h2M9 5V3H7M3 9l3-3M9 3l-3 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      <div className="threed-wrap">
        <ThreeDView />
      </div>
    </section>
  );
}
