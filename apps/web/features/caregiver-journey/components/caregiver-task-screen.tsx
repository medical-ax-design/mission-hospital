import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import { MobileShell } from './mobile-shell';

interface CaregiverTaskScreenProps {
  journey: CaregiverJourney;
  onHome: () => void;
  onStartGuide: () => void;
}

export function CaregiverTaskScreen({
  journey,
  onHome,
  onStartGuide,
}: CaregiverTaskScreenProps) {
  if (!journey.task) {
    return (
      <MobileShell compactHeader>
        <main className="screen state-screen">
          <h1>현재 처리할 업무가 없습니다</h1>
          <p>새로운 업무가 확인되면 알려드립니다.</p>
          <button
            className="primary-button"
            onClick={onHome}
            type="button"
          >
            홈으로
          </button>
        </main>
      </MobileShell>
    );
  }

  return (
    <MobileShell compactHeader>
      <main className="screen">
        <button className="back-button" onClick={onHome} type="button">
          <span aria-hidden="true">←</span>
          홈으로
        </button>

        <p className="eyebrow">지금 할 일 하나만 안내할게요</p>
        <h1 className="page-title">{journey.task.title}</h1>

        <section className="destination-card" aria-labelledby="destination">
          <p>처리 방법 확인</p>
          <h2 id="destination">온라인·모바일·병원 방문</h2>
          <small>삼성서울병원 공식 안내에서 확인합니다.</small>
        </section>

        <section className="detail-section" aria-labelledby="required-items">
          <div className="detail-section__heading">
            <span aria-hidden="true">✓</span>
            <h2 id="required-items">챙겨 주세요</h2>
          </div>
          <ul className="check-list">
            {journey.task.requiredItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="detail-section" aria-labelledby="before-moving">
          <div className="detail-section__heading">
            <span aria-hidden="true">i</span>
            <h2 id="before-moving">이동 전 확인</h2>
          </div>
          <p className="detail-copy">
            서류 종류와 신청자 관계에 따라 준비물과 발급 방법이
            달라질 수 있습니다. 공식 처리 방법을 먼저 확인해 주세요.
          </p>
        </section>

        <button
          className="primary-button sticky-action"
          onClick={onStartGuide}
          type="button"
        >
          공식 처리 방법 확인
        </button>
      </main>
    </MobileShell>
  );
}
