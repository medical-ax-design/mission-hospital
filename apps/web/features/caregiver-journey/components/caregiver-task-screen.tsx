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

  const guide = journey.guide;

  return (
    <MobileShell compactHeader>
      <main className="screen">
        <button className="back-button" onClick={onHome} type="button">
          <span aria-hidden="true">←</span>
          홈으로
        </button>

        <p className="eyebrow">지금 할 일 하나만 안내할게요</p>
        <h1 className="page-title">{journey.task.title}</h1>

        <div className="task-meta" aria-label="업무 예상 정보">
          <span>약 {journey.task.estimatedMinutes}분</span>
          <span>
            {guide?.ticketRequired
              ? '번호표 필요'
              : '번호표 필요 없음'}
          </span>
        </div>

        <section className="destination-card" aria-labelledby="destination">
          <p>처리 장소</p>
          <h2 id="destination">
            {guide?.destination ?? '가까운 안내 데스크'}
          </h2>
          <small>
            현재 위치 · {guide?.currentLocation ?? '위치 확인 필요'}
          </small>
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
            환자가 치료 중인 동안 보호자가 대신 처리할 수 있는
            발표용 예시 업무입니다. 실제 이용 가능 여부는 병원 안내를
            따라야 합니다.
          </p>
        </section>

        <button
          className="primary-button sticky-action"
          onClick={onStartGuide}
          type="button"
        >
          경로 안내 시작
        </button>
      </main>
    </MobileShell>
  );
}
