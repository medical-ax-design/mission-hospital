import type { PatientSchedule } from '@ready-on/contracts/caregiver-journey';

export interface CalendarDay {
  dateKey: string | null;
  dayNumber: number | null;
  schedules: PatientSchedule[];
}

const hospitalDateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function scheduleDateKey(startsAt: string) {
  const parts = hospitalDateFormatter.formatToParts(new Date(startsAt));
  const year = parts.find(({ type }) => type === 'year')?.value;
  const month = parts.find(({ type }) => type === 'month')?.value;
  const day = parts.find(({ type }) => type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

export function buildCalendarMonth(
  year: number,
  monthIndex: number,
  schedules: PatientSchedule[],
): CalendarDay[] {
  const firstWeekday = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const daysInMonth = new Date(
    Date.UTC(year, monthIndex + 1, 0),
  ).getUTCDate();
  const schedulesByDate = new Map<string, PatientSchedule[]>();

  for (const schedule of schedules) {
    const key = scheduleDateKey(schedule.startsAt);
    const current = schedulesByDate.get(key) ?? [];
    current.push(schedule);
    current.sort((left, right) =>
      left.startsAt.localeCompare(right.startsAt),
    );
    schedulesByDate.set(key, current);
  }

  return Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstWeekday + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return {
        dateKey: null,
        dayNumber: null,
        schedules: [],
      };
    }

    const dateKey = [
      year,
      String(monthIndex + 1).padStart(2, '0'),
      String(dayNumber).padStart(2, '0'),
    ].join('-');

    return {
      dateKey,
      dayNumber,
      schedules: schedulesByDate.get(dateKey) ?? [],
    };
  });
}
