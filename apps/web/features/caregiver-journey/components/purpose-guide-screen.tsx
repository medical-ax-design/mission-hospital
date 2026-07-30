import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import { MobileShell } from './mobile-shell';

interface PurposeGuideScreenProps {
  journey: CaregiverJourney;
  busy: boolean;
  onBack: () => void;
  onComplete: () => void;
}

export function PurposeGuideScreen({
  journey,
  busy,
  onBack,
  onComplete,
}: PurposeGuideScreenProps) {
  const guide = journey.guide;

  if (!guide) {
    return (
      <MobileShell compactHeader>
        <main className="screen state-screen">
          <h1>등록된 이동 안내가 없습니다.</h1>
          <p>가까운 안내 데스크에 문의해 주세요.</p>
          <button
            className="primary-button"
            onClick={onBack}
            type="button"
          >
            업무로 돌아가기
          </button>
        </main>
      </MobileShell>
    );
  }

  return (
    <MobileShell compactHeader>
      <main className="screen">
        <button className="back-button" onClick={onBack} type="button">
          <span aria-hidden="true">←</span>
          업무로 돌아가기
        </button>

        <p className="eyebrow">목적 기반 병원 이용 가이드</p>
        <h1 className="guide-title" id="guide-destination">
          {guide.destination}
        </h1>
        <p className="guide-subtitle">
          {guide.currentLocation}에서 도보 약{' '}
          {guide.estimatedTravelMinutes}분
        </p>

        <figure className="schematic-map">
          <figcaption>
            이동 경로 예시 · 실제 병원 지도가 아닙니다
          </figcaption>
          <div className="schematic-map__canvas" aria-hidden="true">
            <div className="map-room map-room--start">
              수술
              <br />
              대기실
            </div>
            <div className="map-route">
              <i />
              <i />
              <i />
              <span>엘리베이터</span>
            </div>
            <div className="map-room map-room--end">
              3번
              <br />
              키오스크
            </div>
          </div>
        </figure>

        <section className="route-section" aria-labelledby="route-steps">
          <div className="section-heading">
            <h2 id="route-steps">이 순서대로 이동하세요</h2>
            <span className="time-badge">
              {guide.ticketRequired ? '번호표 필요' : '바로 이용'}
            </span>
          </div>
          <ol className="route-list">
            {guide.steps.map((step, index) => (
              <li key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <aside className="fallback-note">
          <strong>처리가 되지 않는다면</strong>
          <p>{guide.fallback}</p>
        </aside>

        <button
          className="primary-button sticky-action"
          disabled={busy}
          onClick={onComplete}
          type="button"
        >
          {busy ? '완료를 반영하고 있습니다' : '업무 완료'}
        </button>
      </main>
    </MobileShell>
  );
}
