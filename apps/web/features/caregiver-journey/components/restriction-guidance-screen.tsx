import type {
  RestrictionGuidance,
  RestrictionSearchResult,
} from '@ready-on/contracts/restriction-guidance';
import { useState, type FormEvent } from 'react';
import { MobileShell } from './mobile-shell';

interface RestrictionGuidanceScreenProps {
  guidance: RestrictionGuidance;
  searchResult: RestrictionSearchResult | null;
  actionError: string | null;
  busy: boolean;
  demoMode: boolean;
  onHome: () => void;
  onSearch: (query: string) => void;
  onSaveQuestion: () => void;
  onOpenQuestions: () => void;
  onAdvance: () => void;
}

export function RestrictionGuidanceScreen({
  guidance,
  searchResult,
  actionError,
  busy,
  demoMode,
  onHome,
  onSearch,
  onSaveQuestion,
  onOpenQuestions,
  onAdvance,
}: RestrictionGuidanceScreenProps) {
  const [query, setQuery] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim()) onSearch(query);
  }

  return (
    <MobileShell compactHeader>
      <main className="screen restriction-screen">
        <button className="text-button" onClick={onHome} type="button">
          ← 홈으로
        </button>
        <p className="eyebrow">{guidance.phase.label}</p>
        <h1>지금 피해야 할 것</h1>
        <p>{guidance.headline}</p>

        <ul className="restriction-list">
          {guidance.items.map((item) => (
            <li key={item.id}>
              <strong>{item.itemName}</strong>
              <span>
                {item.resultType === 'DO_NOT_PROVIDE'
                  ? '지금은 제공하지 마세요'
                  : '확인 전에는 제공하지 마세요'}
              </span>
              <p>{item.reason}</p>
              <small>{item.effectiveText}</small>
            </li>
          ))}
        </ul>

        <form className="restriction-search" role="search" onSubmit={submit}>
          <label htmlFor="restriction-query">음식이나 행동 검색</label>
          <div>
            <input
              id="restriction-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="예: 딸기, 커피, 물"
            />
            <button disabled={busy || !query.trim()} type="submit">
              검색
            </button>
          </div>
        </form>

        {actionError && (
          <p className="action-error" role="alert">
            {actionError}
          </p>
        )}

        {searchResult && (
          <section className="search-result" aria-live="polite">
            <p className="eyebrow">{searchResult.query}</p>
            <h2>{searchResult.headline}</h2>
            <p>{searchResult.reason}</p>
            <small>{searchResult.effectiveText}</small>
            <button
              className="primary-button"
              disabled={busy}
              onClick={onSaveQuestion}
              type="button"
            >
              {searchResult.resultType === 'CHECK_BEFORE_PROVIDING'
                ? '의료진에게 물어볼 질문으로 저장'
                : '질문으로 저장'}
            </button>
          </section>
        )}

        <button
          className="secondary-button"
          disabled={busy}
          onClick={onOpenQuestions}
          type="button"
        >
          질문 목록 보기
        </button>

        <a
          className="official-source"
          href={guidance.source.url}
          target="_blank"
          rel="noreferrer"
        >
          {guidance.source.title}
        </a>
        <p className="source-note">
          공식 안내 확인일 {guidance.source.checkedAt} · 데이터{' '}
          {guidance.source.dataVersion}
        </p>

        {demoMode && (
          <aside className="demo-controls" aria-label="제한 단계 발표자 도구">
            <div>
              <strong>제한 단계 전환</strong>
              <small>실제 사용자에게는 보이지 않습니다</small>
            </div>
            <button disabled={busy} onClick={onAdvance} type="button">
              다음 준비 단계
            </button>
          </aside>
        )}
      </main>
    </MobileShell>
  );
}
