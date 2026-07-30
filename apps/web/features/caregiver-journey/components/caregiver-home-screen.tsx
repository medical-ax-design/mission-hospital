import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import { MobileShell } from './mobile-shell';

interface CaregiverHomeScreenProps {
  journey: CaregiverJourney;
  onOpenProgress: () => void;
  onOpenTask: () => void;
}

export function CaregiverHomeScreen({
  journey,
  onOpenProgress,
  onOpenTask,
}: CaregiverHomeScreenProps) {
  const taskCompleted = journey.task.status === 'COMPLETED';

  return (
    <MobileShell compactHeader>
      <main className="screen screen--home">
        <div className="home-intro">
          <div>
            <p className="eyebrow">안녕하세요, 보호자님</p>
            <p className="patient-line">
              {journey.patient.displayName} 환자 ·{' '}
              {journey.patient.procedureName}
            </p>
          </div>
          <button
            className="icon-button"
            aria-label="알림"
            type="button"
          >
            <span aria-hidden="true">●</span>
          </button>
        </div>

        <section className="status-hero" aria-labelledby="current-status">
          <div className="status-hero__meta">
            <span className="live-indicator">
              <i aria-hidden="true" />
              병원 확인
            </span>
            <span>방금 업데이트</span>
          </div>
          <h1 id="current-status">
            지금은 <strong>{journey.treatment.label}</strong>입니다
          </h1>
          <p>{journey.treatment.nextNotice}</p>
          <button
            className="secondary-button secondary-button--on-dark"
            onClick={onOpenProgress}
            type="button"
          >
            과정 알아보기
            <span aria-hidden="true">→</span>
          </button>
        </section>

        <section className="section-block" aria-labelledby="caregiver-task">
          <div className="section-heading">
            <div>
              <p className="eyebrow">지금 할 일</p>
              <h2 id="caregiver-task">보호자 업무</h2>
            </div>
            <span className={taskCompleted ? 'done-badge' : 'time-badge'}>
              {taskCompleted
                ? '완료'
                : `약 ${journey.task.estimatedMinutes}분`}
            </span>
          </div>
          <button
            className="action-card"
            onClick={onOpenTask}
            type="button"
          >
            <span className="action-card__icon" aria-hidden="true">
              {taskCompleted ? '✓' : '문'}
            </span>
            <span className="action-card__copy">
              <strong>{journey.task.title}</strong>
              <small>
                {taskCompleted
                  ? '업무를 완료했습니다'
                  : `${journey.guide?.destination ?? '안내 데스크'}에서 처리`}
              </small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        </section>

        <section className="next-notice" aria-labelledby="next-notice">
          <div className="next-notice__icon" aria-hidden="true">
            i
          </div>
          <div>
            <h2 id="next-notice">다음 안내</h2>
            <p>{journey.treatment.nextNotice}</p>
          </div>
        </section>

        <p className="source-note">
          상태 정보는 병원 시스템에서 확인된 내용만 표시합니다.
        </p>
      </main>
    </MobileShell>
  );
}
