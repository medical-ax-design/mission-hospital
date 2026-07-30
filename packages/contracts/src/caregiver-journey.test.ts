import { describe, expect, it } from 'vitest';
import { CaregiverJourneySchema } from './caregiver-journey.js';

const validJourney = {
  id: 'demo',
  scenarioId: 'gastric-surgery',
  linked: true,
  patient: {
    id: 'patient-demo',
    displayName: '김정우',
    age: 68,
    procedureName: '위암 수술',
    scheduledAt: '2026-07-30T00:00:00.000Z',
  },
  caregiver: {
    displayName: '김서연',
    relationship: '딸',
  },
  treatment: {
    stage: 'IN_PROGRESS',
    label: '수술 진행 중',
    updatedAt: '2026-07-30T00:40:00.000Z',
    nextNotice: '상태가 변경되면 알려드립니다.',
  },
  task: {
    id: 'task-admission-docs',
    title: '입원 서류 발급',
    status: 'AVAILABLE',
    estimatedMinutes: 15,
    requiredItems: ['보호자 신분증'],
  },
  guide: {
    currentLocation: '수술 대기실',
    destination: '본관 1층 3번 키오스크',
    estimatedTravelMinutes: 6,
    ticketRequired: false,
    steps: ['중앙 엘리베이터로 이동', '1층 원무 방향으로 이동'],
    fallback: '발급되지 않으면 옆 제증명 창구를 방문하세요.',
  },
  schedules: [
    {
      id: 'schedule-surgery',
      type: 'SURGERY',
      title: '위암 수술',
      startsAt: '2026-07-30T00:00:00.000Z',
      building: 'CANCER',
      floor: '3F',
      location: '수술환자가족대기실',
      preparation: ['보호자 대기 장소를 확인해 주세요.'],
    },
  ],
} as const;

describe('CaregiverJourneySchema', () => {
  it('환자 일정을 포함한 여정을 허용한다', () => {
    const journey = CaregiverJourneySchema.parse(validJourney);

    expect(journey.schedules[0]?.type).toBe('SURGERY');
  });

  it('현재 업무, 이동 안내, 확인 시각이 없는 여정을 허용한다', () => {
    const journey = CaregiverJourneySchema.parse({
      ...validJourney,
      treatment: {
        ...validJourney.treatment,
        updatedAt: null,
      },
      task: null,
      guide: null,
    });

    expect(journey.treatment.updatedAt).toBeNull();
    expect(journey.task).toBeNull();
    expect(journey.guide).toBeNull();
  });

  it.each([
    ['등록되지 않은 건물', { building: 'UNKNOWN' }],
    ['빈 준비사항', { preparation: [] }],
    ['잘못된 시작 시각', { startsAt: '2026-07-30 09:00' }],
  ])('%s을 가진 일정은 거부한다', (_, invalidSchedule) => {
    expect(() =>
      CaregiverJourneySchema.parse({
        ...validJourney,
        schedules: [
          {
            ...validJourney.schedules[0],
            ...invalidSchedule,
          },
        ],
      }),
    ).toThrow();
  });

  it('등록된 치료 진행 상태가 아니면 거부한다', () => {
    expect(() =>
      CaregiverJourneySchema.parse({
        ...validJourney,
        treatment: {
          ...validJourney.treatment,
          stage: 'UNKNOWN',
        },
      }),
    ).toThrow();
  });

  it('등록되지 않은 발표 시나리오는 거부한다', () => {
    expect(() =>
      CaregiverJourneySchema.parse({
        ...validJourney,
        scenarioId: 'unknown-scenario',
      }),
    ).toThrow();
  });
});
