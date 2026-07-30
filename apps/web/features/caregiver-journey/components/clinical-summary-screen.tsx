import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import { useState } from 'react';
import { MobileShell } from './mobile-shell';

interface ClinicalSummaryScreenProps {
  journey: CaregiverJourney;
  onHome: () => void;
}

export function ClinicalSummaryScreen({
  journey,
  onHome,
}: ClinicalSummaryScreenProps) {
  const [showPreview, setShowPreview] = useState(false);

  if (journey.summary.status === 'UNAVAILABLE') {
    return (
      <MobileShell compactHeader>
        <main className="screen">
          <button className="back-button" onClick={onHome} type="button">
            <span aria-hidden="true">←</span>
            홈으로
          </button>
          <div className="summary-waiting">
            <div className="summary-waiting__mark" aria-hidden="true">
              …
            </div>
            <p className="eyebrow">확인된 내용만 전달해요</p>
            <h1>의료진 설명을 확인 중입니다</h1>
            <p>
              아직 확인된 진료 설명이 없습니다. 의료진이 확인한 뒤에만
              쉬운 문장으로 정리해 드립니다.
            </p>
          </div>
          <aside className="safety-boundary">
            <strong>AI가 의료 내용을 만들지 않습니다</strong>
            <p>
              발표용 프로토타입에서는 의료진이 확인한 가상 기록만
              보여주며 진단이나 치료 판단을 추측하지 않습니다.
            </p>
          </aside>
        </main>
      </MobileShell>
    );
  }

  const summary = journey.summary;

  return (
    <MobileShell compactHeader>
      <main className="screen">
        <button className="back-button" onClick={onHome} type="button">
          <span aria-hidden="true">←</span>
          홈으로
        </button>

        <p className="eyebrow">의료진 확인 완료</p>
        <h1 className="page-title">진료 내용 정리</h1>

        <section className="summary-status" aria-labelledby="summary-status">
          <span aria-hidden="true">✓</span>
          <div>
            <p>현재 상태</p>
            <h2 id="summary-status">{summary.currentStatus}</h2>
          </div>
        </section>

        <section className="summary-section" aria-labelledby="summary-items">
          <h2 id="summary-items">보호자가 알아둘 내용</h2>
          <ul>
            {summary.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="next-schedule" aria-labelledby="next-schedule">
          <p>다음 일정</p>
          <h2 id="next-schedule">{summary.nextSchedule}</h2>
        </section>

        <p className="confirmed-note">
          의료진 확인 시각 · 오후 2:10 · 발표용 가상 정보
        </p>

        <button
          className="primary-button"
          onClick={() => setShowPreview(true)}
          type="button"
        >
          가족에게 공유
        </button>

        {showPreview && (
          <div
            className="dialog-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) {
                setShowPreview(false);
              }
            }}
          >
            <section
              className="share-dialog"
              role="dialog"
              aria-label="가상 공유 미리보기"
              aria-modal="true"
            >
              <div className="share-dialog__handle" aria-hidden="true" />
              <p className="eyebrow">가상 공유 미리보기</p>
              <h2>{journey.patient.displayName} 환자 치료 안내</h2>
              <div className="share-preview">
                <p>
                  <span aria-hidden="true">✓</span>
                  수술 종료
                </p>
                <p>
                  <span aria-hidden="true">●</span>
                  회복실 확인 중
                </p>
                <p>
                  <span aria-hidden="true">→</span>
                  병실 이동 예정
                </p>
              </div>
              <p className="share-disclaimer">
                실제 메시지를 보내지 않는 발표용 미리보기입니다.
              </p>
              <button
                className="primary-button"
                onClick={() => setShowPreview(false)}
                type="button"
              >
                확인
              </button>
            </section>
          </div>
        )}
      </main>
    </MobileShell>
  );
}
