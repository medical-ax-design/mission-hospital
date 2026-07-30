import type { PatientSchedule } from '@ready-on/contracts/caregiver-journey';
import { describe, expect, it } from 'vitest';
import {
  buildCalendarMonth,
  buildDateStrip,
  scheduleDateKey,
  shiftDateKey,
} from './calendar-model';

const schedules: PatientSchedule[] = [
  {
    id: 'later',
    type: 'SURGERY',
    title: '위암 수술',
    startsAt: '2026-07-30T01:30:00.000Z',
    building: 'MAIN',
    floor: '2F',
    location: '수술환자가족대기실',
    preparation: ['보호자 대기 장소를 확인해 주세요.'],
  },
  {
    id: 'earlier',
    type: 'ADMISSION',
    title: '입원 수속',
    startsAt: '2026-07-30T00:00:00.000Z',
    building: 'MAIN',
    floor: '1F',
    location: '입원수속 창구',
    preparation: ['보호자 신분증을 준비해 주세요.'],
  },
];

describe('calendar model', () => {
  it('UTC 시각을 서울 병원 날짜 키로 변환한다', () => {
    expect(scheduleDateKey('2026-07-30T15:30:00.000Z')).toBe(
      '2026-07-31',
    );
  });

  it('2026년 7월을 일요일부터 시작하는 42개 셀로 만든다', () => {
    const month = buildCalendarMonth(2026, 6, schedules);

    expect(month).toHaveLength(42);
    expect(month[0]).toMatchObject({
      dateKey: null,
      dayNumber: null,
    });
    expect(month[3]).toMatchObject({
      dateKey: '2026-07-01',
      dayNumber: 1,
    });
    expect(month[32]).toMatchObject({
      dateKey: '2026-07-30',
      dayNumber: 30,
    });
  });

  it('같은 날짜의 일정을 시각순으로 정렬한다', () => {
    const month = buildCalendarMonth(2026, 6, schedules);
    const july30 = month.find(
      ({ dateKey }) => dateKey === '2026-07-30',
    );

    expect(july30?.schedules.map(({ id }) => id)).toEqual([
      'earlier',
      'later',
    ]);
  });

  it('월 경계를 포함한 5일 날짜 스트립을 만든다', () => {
    const strip = buildDateStrip('2026-07-31', schedules);

    expect(strip.map(({ dateKey }) => dateKey)).toEqual([
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ]);
    expect(strip[1]?.schedules.map(({ id }) => id)).toEqual([
      'earlier',
      'later',
    ]);
  });

  it('날짜 키를 하루 단위로 이동한다', () => {
    expect(shiftDateKey('2026-07-31', 1)).toBe('2026-08-01');
    expect(shiftDateKey('2026-08-01', -1)).toBe('2026-07-31');
  });
});
