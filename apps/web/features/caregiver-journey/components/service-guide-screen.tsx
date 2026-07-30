import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import type { RestrictionGuidance } from '@ready-on/contracts/restriction-guidance';
import {
  BottomNavigation,
  type RootTab,
} from './bottom-navigation';
import { MobileShell } from './mobile-shell';

interface ServiceGuideScreenProps {
  journey: CaregiverJourney;
  guidance: RestrictionGuidance | null;
  onOpenNavigation: () => void;
  onOpenRestrictions: () => void;
  onSelectTab: (tab: RootTab) => void;
}

export function ServiceGuideScreen({
  journey,
  guidance,
  onOpenNavigation,
  onOpenRestrictions,
  onSelectTab,
}: ServiceGuideScreenProps) {
  return (
    <MobileShell compactHeader>
      <main className="screen screen--with-navigation service-guide">
        <p className="eyebrow">목적을 먼저 선택하세요</p>
        <h1 className="page-title">병원 이용 안내</h1>
        <p className="lead">
          지금 처리할 업무와 환자의 검사 준비를 한곳에서 확인합니다.
        </p>

        <div className="service-guide__cards">
          <button
            className="service-guide-card"
            onClick={onOpenNavigation}
            type="button"
          >
            <span className="service-guide-card__icon" aria-hidden="true">
              길
            </span>
            <span>
              <strong>업무·길찾기</strong>
              <small>
                현재 위치를 선택하고 {journey.patient.displayName} 환자의
                등록된 목적지로 이동
              </small>
            </span>
            <span aria-hidden="true">›</span>
          </button>

          {guidance ? (
            <button
              className="service-guide-card"
              onClick={onOpenRestrictions}
              type="button"
            >
              <span
                className="service-guide-card__icon service-guide-card__icon--orange"
                aria-hidden="true"
              >
                !
              </span>
              <span>
                <strong>검사 준비·주의사항</strong>
                <small>{guidance.headline}</small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          ) : (
            <div className="service-guide-card service-guide-card--empty">
              <span
                className="service-guide-card__icon service-guide-card__icon--orange"
                aria-hidden="true"
              >
                !
              </span>
              <span>
                <strong>검사 준비·주의사항</strong>
                <small>현재 등록된 검사 준비 안내가 없습니다</small>
              </span>
            </div>
          )}
        </div>

        <p className="source-note">
          목적지와 준비사항은 병원에 등록된 정보만 표시합니다.
        </p>
      </main>
      <BottomNavigation current="service-guide" onSelect={onSelectTab} />
    </MobileShell>
  );
}
