interface TreatmentDemoControlsProps {
  stageIndex: number;
  stageCount: number;
  isAutoPlaying: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleAutoPlay: () => void;
}

export function TreatmentDemoControls(
  props: TreatmentDemoControlsProps,
) {
  return (
    <aside
      className="treatment-demo-controls"
      aria-label="발표용 데모 제어"
    >
      <div>
        <strong>발표용 데모</strong>
        <span aria-live="polite">
          {props.stageIndex + 1} / {props.stageCount}
        </span>
      </div>
      <div className="treatment-demo-controls__actions">
        <button
          type="button"
          disabled={!props.canGoPrevious}
          onClick={props.onPrevious}
        >
          이전
        </button>
        <button type="button" onClick={props.onToggleAutoPlay}>
          {props.isAutoPlaying ? '자동 진행 정지' : '자동 진행'}
        </button>
        <button
          type="button"
          disabled={!props.canGoNext}
          onClick={props.onNext}
        >
          다음
        </button>
      </div>
    </aside>
  );
}
