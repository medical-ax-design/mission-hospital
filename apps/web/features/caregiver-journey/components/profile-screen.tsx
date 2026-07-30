import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import {
  BottomNavigation,
  type RootTab,
} from './bottom-navigation';
import { MobileShell } from './mobile-shell';
import { RootPageHeader } from './root-page-header';

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
        <RootPageHeader
          accessory={
            <span className="profile-avatar" aria-hidden="true">
              {journey.caregiver.displayName.slice(0, 1)}
            </span>
          }
          description="보호자 연결 정보와 공유 범위를 확인합니다."
          eyebrow="보호자 계정"
          title="내 정보"
        />

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
              <dt>공유 범위</dt>
              <dd>일정·병원 확인 상태</dd>
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
