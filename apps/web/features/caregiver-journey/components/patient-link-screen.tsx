import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import { formatHospitalSchedule } from '../format-hospital-time';
import { MobileShell } from './mobile-shell';

interface PatientLinkScreenProps {
  journey: CaregiverJourney;
  busy: boolean;
  onLink: () => void;
}

export function PatientLinkScreen({
  journey,
  busy,
  onLink,
}: PatientLinkScreenProps) {
  return (
    <MobileShell>
      <main className="screen screen--link">
        <p className="eyebrow">오늘의 보호자 동행</p>
        <h1>환자를 선택해 주세요</h1>
        <p className="lead">
          환자 동의를 거친 보호자만 치료 진행 상황과 할 일을 확인할
          수 있습니다.
        </p>

        <section className="patient-card" aria-label="연결할 환자">
          <div className="patient-card__avatar" aria-hidden="true">
            김
          </div>
          <div className="patient-card__body">
            <p className="patient-card__name">
              {journey.patient.displayName}{' '}
              <span>{journey.patient.age}세</span>
            </p>
            <p>{journey.patient.procedureName}</p>
            <p className="muted">
              {formatHospitalSchedule(journey.patient.scheduledAt)}
            </p>
          </div>
          <span className="relationship-badge">
            {journey.caregiver.relationship}
          </span>
        </section>

        <div className="privacy-note">
          <span aria-hidden="true">✓</span>
          <p>
            이 화면은 발표용 가상 환자 정보입니다. 실제 서비스에서는
            환자 동의와 보호자 본인 확인 후 연결됩니다.
          </p>
        </div>

        <button
          className="primary-button"
          disabled={busy}
          onClick={onLink}
          type="button"
        >
          {busy ? '연결하고 있습니다' : '보호자로 연결하기'}
        </button>
      </main>
    </MobileShell>
  );
}
