import type {
  CaregiverJourney,
  HospitalBuilding,
  PatientSchedule,
} from '@ready-on/contracts/caregiver-journey';
import { useMemo, useState } from 'react';
import {
  buildCalendarMonth,
  buildDateStrip,
  scheduleDateKey,
} from '../calendar-model';
import { formatHospitalTime } from '../format-hospital-time';
import {
  BottomNavigation,
  type RootTab,
} from './bottom-navigation';
import { MobileShell } from './mobile-shell';
import { RootPageHeader } from './root-page-header';

interface ScheduleScreenProps {
  journey: CaregiverJourney;
  onSelectTab: (tab: RootTab) => void;
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

const buildingLabels: Record<HospitalBuilding, string> = {
  MAIN: '본관',
  ANNEX: '별관',
  CANCER: '암병원',
  PROTON: '양성자치료센터',
};

const scheduleTypeLabels: Record<PatientSchedule['type'], string> = {
  APPOINTMENT: '진료',
  EXAM: '검사',
  ADMISSION: '입원',
  SURGERY: '수술',
  ADMIN: '행정',
};

const selectedDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'UTC',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

function monthFromSchedule(schedule: PatientSchedule) {
  const [yearText = '1970', monthText = '01'] = scheduleDateKey(
    schedule.startsAt,
  ).split('-');
  const year = Number(yearText);
  const month = Number(monthText);

  return { year, monthIndex: month - 1 };
}

function monthFromDateKey(dateKey: string) {
  const [yearText = '1970', monthText = '01'] = dateKey.split('-');
  return {
    year: Number(yearText),
    monthIndex: Number(monthText) - 1,
  };
}

function formatSelectedDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return selectedDateFormatter.format(
    new Date(Date.UTC(year!, month! - 1, day!)),
  );
}

export function ScheduleScreen({
  journey,
  onSelectTab,
}: ScheduleScreenProps) {
  const firstSchedule = journey.schedules[0]!;
  const initialMonth = monthFromSchedule(firstSchedule);
  const initialDate = scheduleDateKey(firstSchedule.startsAt);
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  const days = useMemo(
    () =>
      buildCalendarMonth(
        visibleMonth.year,
        visibleMonth.monthIndex,
        journey.schedules,
      ),
    [journey.schedules, visibleMonth],
  );
  const dateStrip = useMemo(
    () => buildDateStrip(selectedDate, journey.schedules),
    [journey.schedules, selectedDate],
  );
  const selectedSchedules = useMemo(
    () =>
      journey.schedules
        .filter(
          ({ startsAt }) => scheduleDateKey(startsAt) === selectedDate,
        )
        .sort((left, right) =>
          left.startsAt.localeCompare(right.startsAt),
        ),
    [journey.schedules, selectedDate],
  );

  const selectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    setVisibleMonth(monthFromDateKey(dateKey));
  };

  const moveMonth = (offset: number) => {
    const next = new Date(
      Date.UTC(visibleMonth.year, visibleMonth.monthIndex + offset, 1),
    );
    setVisibleMonth({
      year: next.getUTCFullYear(),
      monthIndex: next.getUTCMonth(),
    });
    setSelectedDate(
      [
        next.getUTCFullYear(),
        String(next.getUTCMonth() + 1).padStart(2, '0'),
        '01',
      ].join('-'),
    );
  };

  return (
    <MobileShell compactHeader>
      <main className="screen screen--with-navigation schedule-screen">
        <RootPageHeader
          accessory={
            <span className="patient-mini-badge" aria-hidden="true">
              {journey.patient.displayName.slice(0, 1)}
            </span>
          }
          description={`${journey.patient.displayName} 환자와 공유된 일정입니다.`}
          eyebrow="일정"
          title="환자 일정"
        />

        <section className="selected-date-card" aria-live="polite">
          <div>
            <small>
              {visibleMonth.year}년 {visibleMonth.monthIndex + 1}월
            </small>
            <strong>{formatSelectedDate(selectedDate)}</strong>
            <span>{journey.patient.displayName} 환자의 병원 일정</span>
          </div>
          <b>총 {selectedSchedules.length}개</b>
        </section>

        <div className="date-strip" aria-label="날짜 선택">
          {dateStrip.map((day) => (
            <button
              aria-label={
                day.schedules.length > 0
                  ? `${day.dayNumber}일 ${day.weekday}, 일정 ${day.schedules.length}개`
                  : `${day.dayNumber}일 ${day.weekday}, 일정 없음`
              }
              aria-pressed={selectedDate === day.dateKey}
              key={day.dateKey}
              onClick={() => selectDate(day.dateKey)}
              type="button"
            >
              <small>{day.weekday}</small>
              <strong>{day.dayNumber}</strong>
              {day.schedules.length > 0 && (
                <i aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        <button
          aria-expanded={calendarExpanded}
          className="calendar-toggle"
          onClick={() => setCalendarExpanded((current) => !current)}
          type="button"
        >
          {calendarExpanded ? '달력 접기' : '달력 보기'}
          <span aria-hidden="true">{calendarExpanded ? '⌃' : '⌄'}</span>
        </button>

        {calendarExpanded && (
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
                    onClick={() => selectDate(day.dateKey ?? '')}
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
        )}

        <section className="schedule-detail" aria-live="polite">
          <div className="schedule-detail__heading">
            <h2>{formatSelectedDate(selectedDate)} 일정</h2>
            {selectedDate !== initialDate && (
              <button
                onClick={() => selectDate(initialDate)}
                type="button"
              >
                오늘로 돌아가기
              </button>
            )}
          </div>
          {selectedSchedules.length > 0 ? (
            <div className="schedule-detail__list">
              {selectedSchedules.map((schedule) => (
                <article className="schedule-row" key={schedule.id}>
                  <div className="schedule-row__time">
                    <time dateTime={schedule.startsAt}>
                      {formatHospitalTime(schedule.startsAt)}
                    </time>
                    <small>예정</small>
                  </div>
                  <div className="schedule-card">
                    <small className="schedule-card__type">
                      {scheduleTypeLabels[schedule.type]}
                    </small>
                    <strong>{schedule.title}</strong>
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
                  </div>
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
