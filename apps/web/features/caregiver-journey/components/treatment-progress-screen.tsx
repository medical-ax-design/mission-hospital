import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import {
  getTreatmentStageIndex,
  TREATMENT_STAGE_ORDER,
  TREATMENT_STAGE_PRESENTATION,
} from '../treatment-stage-presentation';
import { useTreatmentDemoStage } from '../use-treatment-demo-stage';
import { MobileShell } from './mobile-shell';
import { TreatmentDemoControls } from './treatment-demo-controls';
import { TreatmentStageMedia } from './treatment-stage-media';

interface TreatmentProgressScreenProps {
  journey: CaregiverJourney;
  demoMode: boolean;
  onHome: () => void;
}

export function TreatmentProgressScreen({
  journey,
  demoMode,
  onHome,
}: TreatmentProgressScreenProps) {
  const demo = useTreatmentDemoStage(journey.treatment.stage, demoMode);
  const activeStage = demo.stage;
  const activeContent = TREATMENT_STAGE_PRESENTATION[activeStage];
  const currentIndex = getTreatmentStageIndex(activeStage);

  return (
    <MobileShell compactHeader>
      <main
        className={
          demoMode ? 'screen screen--with-treatment-demo' : 'screen'
        }
      >
        <button className="back-button" onClick={onHome} type="button">
          <span aria-hidden="true">←</span>
          홈으로
        </button>

        <p className="eyebrow">치료 진행 상황</p>
        <h1 className="page-title">
          기다리는 동안,
          <br />
          지금 과정을 알려드릴게요
        </h1>

        <section
          className="verified-status"
          aria-labelledby="verified-status-title"
        >
          <div>
            <span className="verified-status__icon" aria-hidden="true">
              ✓
            </span>
          </div>
          <div>
            <h2 id="verified-status-title">
              {demoMode ? '발표용 병원 상태 시연' : '병원 확인 상태'}
            </h2>
            <p className="verified-status__value">
              {activeContent.statusLabel}
            </p>
            <small>상태 변경 시 이 화면도 함께 업데이트됩니다.</small>
          </div>
        </section>

        <TreatmentStageMedia key={activeStage} content={activeContent} />

        <section className="process-section" aria-labelledby="process-title">
          <div className="section-heading section-heading--stacked">
            <p className="eyebrow">이해를 돕는 안내</p>
            <h2 id="process-title">일반적인 수술 과정</h2>
          </div>
          <ol className="process-timeline">
            {TREATMENT_STAGE_ORDER.map((stage, index) => {
              const item = TREATMENT_STAGE_PRESENTATION[stage];
              const active = index === currentIndex;
              const completed = index < currentIndex;

              return (
                <li
                  className={
                    active
                      ? 'process-step process-step--active'
                      : completed
                        ? 'process-step process-step--completed'
                        : 'process-step'
                  }
                  key={stage}
                  aria-current={active ? 'step' : undefined}
                >
                  <span className="process-step__marker">
                    {completed ? '✓' : index + 1}
                  </span>
                  <div>
                    <strong>{item.timelineLabel}</strong>
                    <p>{item.timelineDescription}</p>
                    {active && <em>현재 확인 단계</em>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="education-note">
          <strong>안내용 정보예요</strong>
          <p>
            위 과정은 이해를 돕기 위한 일반적인 설명이며 실제 치료
            판단이나 예상 종료 시간을 의미하지 않습니다.
          </p>
        </aside>
      </main>
      {demoMode && (
        <TreatmentDemoControls
          stageIndex={demo.stageIndex}
          stageCount={demo.stageCount}
          isAutoPlaying={demo.isAutoPlaying}
          canGoPrevious={demo.stageIndex > 0}
          canGoNext={demo.stageIndex < demo.stageCount - 1}
          onPrevious={demo.goPrevious}
          onNext={demo.goNext}
          onToggleAutoPlay={demo.toggleAutoPlay}
        />
      )}
    </MobileShell>
  );
}
