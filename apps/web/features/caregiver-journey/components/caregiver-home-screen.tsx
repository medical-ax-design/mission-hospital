import type {
  CaregiverJourney,
  DemoScenarioId,
} from '@ready-on/contracts/caregiver-journey';
import type { RestrictionGuidance } from '@ready-on/contracts/restriction-guidance';
import { useState } from 'react';
import { scheduleDateKey } from '../calendar-model';
import { formatHospitalTime } from '../format-hospital-time';
import {
  BottomNavigation,
  type RootTab,
} from './bottom-navigation';
import { MobileShell } from './mobile-shell';

interface CaregiverHomeScreenProps {
  journey: CaregiverJourney;
  guidance: RestrictionGuidance | null;
  busy: boolean;
  demoMode: boolean;
  onOpenProgress: () => void;
  onOpenTask: () => void;
  onOpenRestrictions: () => void;
  onOpenPurpose: (query: string) => void;
  onSelectTab: (tab: RootTab) => void;
  onSelectScenario: (scenarioId: DemoScenarioId) => void;
}

export function CaregiverHomeScreen({
  journey,
  guidance,
  busy,
  demoMode,
  onOpenProgress,
  onOpenTask,
  onOpenRestrictions,
  onOpenPurpose,
  onSelectTab,
  onSelectScenario,
}: CaregiverHomeScreenProps) {
  const taskCompleted = journey.task?.status === 'COMPLETED';
  const [purposeQuery, setPurposeQuery] = useState('');
  const journeyDate = scheduleDateKey(journey.schedules[0]!.startsAt);
  const todaySchedules = journey.schedules
    .filter(
      ({ startsAt }) => scheduleDateKey(startsAt) === journeyDate,
    )
    .slice(0, 3);

  return (
    <MobileShell compactHeader>
      <main className="screen screen--home screen--with-navigation">
        <div className="home-hero">
          <div className="home-intro">
            <div>
              <p className="eyebrow">안녕하세요, 보호자님</p>
              <h1>
                오늘 병원 일도
                <br />
                <strong>차근차근 도와드릴게요.</strong>
              </h1>
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

          <form
            className="home-purpose-search"
            onSubmit={(event) => {
              event.preventDefault();
              const query = purposeQuery.trim();
              if (query) onOpenPurpose(query);
            }}
          >
            <label htmlFor="home-purpose-query">
              병원 이용 목적 찾기
            </label>
            <div>
              <input
                id="home-purpose-query"
                onChange={(event) =>
                  setPurposeQuery(event.currentTarget.value)
                }
                placeholder="무엇을 처리하시나요?"
                value={purposeQuery}
              />
              <button
                aria-label="목적 검색"
                disabled={!purposeQuery.trim()}
                type="submit"
              >
                →
              </button>
            </div>
          </form>
        </div>

        <section className="status-hero" aria-labelledby="current-status">
          <div className="status-hero__meta">
            <span className="live-indicator">
              <i aria-hidden="true" />
              병원 확인
            </span>
            <span>
              병원 확인 {formatHospitalTime(journey.treatment.updatedAt)}
            </span>
          </div>
          <h2 id="current-status">
            지금은 <strong>{journey.treatment.label}</strong>입니다
          </h2>
          <p>{journey.treatment.nextNotice}</p>
          {journey.scenarioId === 'gastric-surgery' && (
            <button
              className="secondary-button secondary-button--on-dark"
              onClick={onOpenProgress}
              type="button"
            >
              과정 알아보기
              <span aria-hidden="true">→</span>
            </button>
          )}
        </section>

        {guidance && (
          <section
            className="restriction-card"
            aria-labelledby="current-restrictions"
          >
            <p className="eyebrow">{guidance.phase.label}</p>
            <h2 id="current-restrictions">현재 주의사항</h2>
            <p>{guidance.headline}</p>
            <small>{guidance.phase.effectiveText}</small>
            <button
              className="primary-button"
              onClick={onOpenRestrictions}
              type="button"
            >
              지금 피해야 할 것 보기
            </button>
          </section>
        )}

        <section className="section-block" aria-labelledby="caregiver-task">
          <div className="section-heading">
            <div>
              <p className="eyebrow">지금 할 일</p>
              <h2 id="caregiver-task">보호자 업무</h2>
            </div>
            {taskCompleted && (
              <span className="done-badge">완료</span>
            )}
          </div>
          {journey.task ? (
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
                    : '암병원 2층 원무수납까지 안내해 드려요'}
                </small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          ) : (
            <div className="action-card">
              <span className="action-card__icon" aria-hidden="true">
                ✓
              </span>
              <span className="action-card__copy">
                <strong>현재 처리할 업무가 없습니다</strong>
                <small>새로운 업무가 확인되면 알려드립니다</small>
              </span>
            </div>
          )}
        </section>

        <section className="home-schedule" aria-labelledby="today-schedule">
          <div className="section-heading">
            <div>
              <p className="eyebrow">오늘</p>
              <h2 id="today-schedule">오늘 일정</h2>
            </div>
            <button
              className="text-button"
              onClick={() => onSelectTab('schedule')}
              type="button"
            >
              전체보기
            </button>
          </div>
          <div className="home-schedule__list">
            {todaySchedules.map((schedule, index) => (
              <article key={schedule.id}>
                <time dateTime={schedule.startsAt}>
                  {formatHospitalTime(schedule.startsAt)}
                </time>
                <span aria-hidden="true">
                  {index === 0 ? '다음' : ''}
                </span>
                <div>
                  <strong>{schedule.title}</strong>
                  <small>
                    {schedule.floor} · {schedule.location}
                  </small>
                </div>
              </article>
            ))}
          </div>
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

        {demoMode && (
          <aside className="demo-controls" aria-label="발표자 도구">
            <div>
              <strong>발표자 도구</strong>
              <small>실제 사용자에게는 보이지 않습니다</small>
            </div>
            <button
              disabled={busy}
              onClick={() => onSelectScenario('gastric-surgery')}
              type="button"
            >
              위암 수술 여정
            </button>
            <button
              disabled={busy}
              onClick={() => onSelectScenario('morning-colonoscopy')}
              type="button"
            >
              대장내시경 여정
            </button>
          </aside>
        )}

        <p className="source-note">
          상태 정보는 병원 시스템에서 확인된 내용만 표시합니다.
        </p>
      </main>
      <BottomNavigation current="home" onSelect={onSelectTab} />
    </MobileShell>
  );
}
