import type {
  CaregiverJourney,
  TreatmentStage,
} from '@ready-on/contracts/caregiver-journey';
import { MobileShell } from './mobile-shell';

const stages: Array<{
  stage: TreatmentStage;
  label: string;
  description: string;
}> = [
  {
    stage: 'PREPARING',
    label: '수술 준비',
    description: '수술 전 준비와 확인을 진행합니다.',
  },
  {
    stage: 'IN_OPERATING_ROOM',
    label: '수술실 입실',
    description: '환자가 수술실에 입실한 상태입니다.',
  },
  {
    stage: 'IN_PROGRESS',
    label: '수술 진행',
    description: '수술이 시작된 상태입니다.',
  },
  {
    stage: 'RECOVERY',
    label: '회복실',
    description: '회복실에서 상태를 확인합니다.',
  },
  {
    stage: 'COMPLETED',
    label: '병실 이동',
    description: '의료진 확인 후 병실로 이동합니다.',
  },
];

interface TreatmentProgressScreenProps {
  journey: CaregiverJourney;
  onHome: () => void;
}

export function TreatmentProgressScreen({
  journey,
  onHome,
}: TreatmentProgressScreenProps) {
  const currentIndex = stages.findIndex(
    ({ stage }) => stage === journey.treatment.stage,
  );

  return (
    <MobileShell compactHeader>
      <main className="screen">
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
            <h2 id="verified-status-title">병원 확인 상태</h2>
            <p className="verified-status__value">
              {journey.treatment.label}
            </p>
            <small>상태 변경 시 이 화면도 함께 업데이트됩니다.</small>
          </div>
        </section>

        <section className="process-section" aria-labelledby="process-title">
          <div className="section-heading section-heading--stacked">
            <p className="eyebrow">이해를 돕는 안내</p>
            <h2 id="process-title">일반적인 수술 과정</h2>
          </div>
          <ol className="process-timeline">
            {stages.map((item, index) => {
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
                  key={item.stage}
                  aria-current={active ? 'step' : undefined}
                >
                  <span className="process-step__marker">
                    {completed ? '✓' : index + 1}
                  </span>
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.description}</p>
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
    </MobileShell>
  );
}
