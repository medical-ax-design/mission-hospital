import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import {
  BottomNavigation,
  type RootTab,
} from './bottom-navigation';
import { MobileShell } from './mobile-shell';

interface ProfileScreenProps {
  journey: CaregiverJourney;
  onSelectTab: (tab: RootTab) => void;
}

export function ProfileScreen({
  journey,
  onSelectTab,
}: ProfileScreenProps) {
  return (
    <MobileShell compactHeader>
      <main className="screen screen--with-navigation profile-screen">
        <header className="subpage-heading">
          <div>
            <p className="eyebrow">보호자 계정</p>
            <h1>내 정보</h1>
          </div>
          <span className="profile-avatar" aria-hidden="true">
            {journey.caregiver.displayName.slice(0, 1)}
          </span>
        </header>

        <section
          className="profile-caregiver-card"
          aria-labelledby="caregiver-profile"
        >
          <span className="profile-caregiver-card__avatar" aria-hidden="true">
            {journey.caregiver.displayName.slice(0, 1)}
          </span>
          <div>
            <small>보호자</small>
            <h2 id="caregiver-profile">{journey.caregiver.displayName}</h2>
            <p>{journey.patient.displayName} 환자의 {journey.caregiver.relationship}</p>
          </div>
        </section>

        <section
          className="linked-patient-card"
          aria-labelledby="linked-patient"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">현재 연결</p>
              <h2 id="linked-patient">환자 정보</h2>
            </div>
            <span className="connection-badge">
              <i aria-hidden="true" />
              연결됨
            </span>
          </div>
          <dl>
            <div>
              <dt>환자</dt>
              <dd>{journey.patient.displayName}</dd>
            </div>
            <div>
              <dt>나이</dt>
              <dd>{journey.patient.age}세</dd>
            </div>
            <div>
              <dt>현재 여정</dt>
              <dd>{journey.patient.procedureName}</dd>
            </div>
          </dl>
        </section>

        <section className="profile-notice" aria-labelledby="profile-notice">
          <span aria-hidden="true">i</span>
          <div>
            <h2 id="profile-notice">안심하고 이용하세요</h2>
            <p>
              환자가 동의한 범위의 일정과 병원 확인 상태만 보호자에게
              표시합니다.
            </p>
          </div>
        </section>
      </main>
      <BottomNavigation current="profile" onSelect={onSelectTab} />
    </MobileShell>
  );
}
