import { describe, expect, it } from 'vitest';
import { CaregiverJourneySchema } from './caregiver-journey.js';

const validJourney = {
  id: 'demo',
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
  summary: {
    status: 'UNAVAILABLE',
  },
} as const;

describe('CaregiverJourneySchema', () => {
  it('가상의 보호자 여정을 허용한다', () => {
    expect(CaregiverJourneySchema.parse(validJourney)).toBeDefined();
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

  it('의료진 확인 요약에 내용이 없으면 거부한다', () => {
    expect(() =>
      CaregiverJourneySchema.parse({
        ...validJourney,
        summary: {
          status: 'CONFIRMED',
          confirmedAt: '2026-07-30T05:10:00.000Z',
          currentStatus: '수술 종료',
          items: [],
          nextSchedule: '회복실 확인 후 병실 이동 예정',
        },
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
});
