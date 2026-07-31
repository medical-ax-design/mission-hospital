import type { HospitalGuideCatalog } from '@ready-on/contracts/hospital-guide';
import type { RestrictionGuidance } from '@ready-on/contracts/restriction-guidance';
import { useState } from 'react';
import {
  BottomNavigation,
  type RootTab,
} from '../../caregiver-journey/components/bottom-navigation';
import { MobileShell } from '../../caregiver-journey/components/mobile-shell';
import { RootPageHeader } from '../../caregiver-journey/components/root-page-header';

interface HospitalGuideHomeScreenProps {
  catalog: HospitalGuideCatalog | null;
  guidance: RestrictionGuidance | null;
  busy: boolean;
  onOpenPurpose: (query: string) => void;
  onOpenDirectory: () => void;
  onOpenRestrictions: () => void;
  onSelectTab: (tab: RootTab) => void;
}

export function HospitalGuideHomeScreen({
  catalog,
  guidance,
  busy,
  onOpenPurpose,
  onOpenDirectory,
  onOpenRestrictions,
  onSelectTab,
}: HospitalGuideHomeScreenProps) {
  const [query, setQuery] = useState('');

  const submitSearch = () => {
    const normalized = query.trim();
    if (normalized) onOpenPurpose(normalized);
  };

  return (
    <MobileShell compactHeader>
      <main className="screen screen--with-navigation hospital-guide-home">
        <RootPageHeader
          description="필요한 업무를 선택하면 공식 처리 방법과 장소를 연결해 드립니다."
          eyebrow="병원 이용 안내"
          title="무엇을 하러 가시나요?"
        />

        <form
          className="hospital-purpose-search"
          onSubmit={(event) => {
            event.preventDefault();
            submitSearch();
          }}
        >
          <label htmlFor="hospital-purpose-query">목적 검색</label>
          <div>
            <input
              id="hospital-purpose-query"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 서류 발급"
              type="search"
              value={query}
            />
            <button disabled={busy || !query.trim()} type="submit">
              검색
            </button>
          </div>
        </form>

        <section
          className="hospital-purpose-section"
          aria-labelledby="hospital-purpose-heading"
        >
          <h2 id="hospital-purpose-heading">주요 목적</h2>
          <button
            aria-label="서류 발급"
            className="hospital-purpose-card"
            disabled={busy}
            onClick={() => onOpenPurpose('서류 발급')}
            type="button"
          >
            <span aria-hidden="true">문서</span>
            <strong>서류 발급</strong>
            <small>암병원 2층 원무수납의 준비물과 처리 순서</small>
          </button>
        </section>

        <button
          aria-label="전체 건물·층별 안내"
          className="hospital-directory-link"
          disabled={!catalog}
          onClick={onOpenDirectory}
          type="button"
        >
          <span>
            <strong>전체 건물·층별 안내</strong>
            <small>
              본관·별관·암병원·양성자치료센터의 공개 층 확인
            </small>
          </span>
          <span aria-hidden="true">›</span>
        </button>

        {guidance && (
          <button
            className="hospital-directory-link hospital-directory-link--warning"
            onClick={onOpenRestrictions}
            type="button"
          >
            <span>
              <strong>검사 준비·주의사항</strong>
              <small>{guidance.headline}</small>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        )}

        {!catalog && (
          <p className="source-note" role="status">
            공식 병원 안내 정보를 불러오고 있습니다.
          </p>
        )}
      </main>
      <BottomNavigation current="service-guide" onSelect={onSelectTab} />
    </MobileShell>
  );
}
