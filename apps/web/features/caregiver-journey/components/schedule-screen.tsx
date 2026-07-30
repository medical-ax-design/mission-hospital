import type {
  CaregiverJourney,
  HospitalBuilding,
  PatientSchedule,
} from '@ready-on/contracts/caregiver-journey';
import { useMemo, useState } from 'react';
import {
  buildCalendarMonth,
  scheduleDateKey,
} from '../calendar-model';
import { formatHospitalTime } from '../format-hospital-time';
import {
  BottomNavigation,
  type RootTab,
} from './bottom-navigation';
import { MobileShell } from './mobile-shell';

interface ScheduleScreenProps {
  journey: CaregiverJourney;
  onSelectTab: (tab: RootTab) => void;
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

const buildingLabels: Record<HospitalBuilding, string> = {
  MAIN: '본관',
  ANNEX: '별관',
  CANCER: '암병원',
};

function monthFromSchedule(schedule: PatientSchedule) {
  const [yearText = '1970', monthText = '01'] = scheduleDateKey(
    schedule.startsAt,
  ).split('-');
  const year = Number(yearText);
  const month = Number(monthText);

  return { year, monthIndex: month - 1 };
}

export function ScheduleScreen({
  journey,
  onSelectTab,
}: ScheduleScreenProps) {
  const firstSchedule = journey.schedules[0]!;
  const initialMonth = monthFromSchedule(firstSchedule);
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(
    scheduleDateKey(firstSchedule.startsAt),
  );

  const days = useMemo(
    () =>
      buildCalendarMonth(
        visibleMonth.year,
        visibleMonth.monthIndex,
        journey.schedules,
      ),
    [journey.schedules, visibleMonth],
  );
  const selectedSchedules =
    days.find(({ dateKey }) => dateKey === selectedDate)?.schedules ?? [];

  const moveMonth = (offset: number) => {
    const next = new Date(
      Date.UTC(visibleMonth.year, visibleMonth.monthIndex + offset, 1),
    );
    setVisibleMonth({
      year: next.getUTCFullYear(),
      monthIndex: next.getUTCMonth(),
    });
    setSelectedDate('');
  };

  return (
    <MobileShell compactHeader>
      <main className="screen screen--with-navigation schedule-screen">
        <p className="eyebrow">
          {journey.patient.displayName} 환자와 공유된 일정
        </p>
        <h1 className="page-title">환자 일정</h1>

        <section className="calendar" aria-label="월간 환자 일정">
          <div className="calendar__header">
            <button
              aria-label="이전 달"
              onClick={() => moveMonth(-1)}
              type="button"
            >
              ‹
            </button>
            <h2>
              {visibleMonth.year}년 {visibleMonth.monthIndex + 1}월
            </h2>
            <button
              aria-label="다음 달"
              onClick={() => moveMonth(1)}
              type="button"
            >
              ›
            </button>
          </div>

          <div className="calendar__weekdays" aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="calendar__grid">
            {days.map((day, index) =>
              day.dateKey ? (
                <button
                  aria-label={
                    day.schedules.length > 0
                      ? `${day.dayNumber}일, ${journey.patient.displayName} 환자 일정 ${day.schedules.length}개`
                      : `${day.dayNumber}일, 일정 없음`
                  }
                  aria-pressed={selectedDate === day.dateKey}
                  className="calendar-day"
                  key={day.dateKey}
                  onClick={() => setSelectedDate(day.dateKey ?? '')}
                  type="button"
                >
                  <span>{day.dayNumber}</span>
                  {day.schedules.length > 0 && (
                    <i aria-hidden="true">환</i>
                  )}
                </button>
              ) : (
                <span
                  aria-hidden="true"
                  className="calendar-day calendar-day--empty"
                  key={`empty-${index}`}
                />
              ),
            )}
          </div>
        </section>

        <section className="schedule-detail" aria-live="polite">
          <h2>선택한 날짜</h2>
          {selectedSchedules.length > 0 ? (
            <div className="schedule-detail__list">
              {selectedSchedules.map((schedule) => (
                <article className="schedule-card" key={schedule.id}>
                  <div>
                    <time dateTime={schedule.startsAt}>
                      {formatHospitalTime(schedule.startsAt)}
                    </time>
                    <strong>{schedule.title}</strong>
                  </div>
                  <p>
                    <span>
                      {buildingLabels[schedule.building]} {schedule.floor}
                    </span>
                    <span aria-hidden="true"> · </span>
                    <span>{schedule.location}</span>
                  </p>
                  <ul>
                    {schedule.preparation.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          ) : (
            <p className="schedule-detail__empty">
              등록된 병원 일정이 없습니다
            </p>
          )}
        </section>
      </main>
      <BottomNavigation current="schedule" onSelect={onSelectTab} />
    </MobileShell>
  );
}
