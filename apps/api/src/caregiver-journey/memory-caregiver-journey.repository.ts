import {
  CaregiverJourneySchema,
  type CaregiverJourney,
  type DemoScenarioId,
} from '@ready-on/contracts';
import type { CaregiverJourneyRepository } from './caregiver-journey.repository.js';

function createSurgeryJourney(): CaregiverJourney {
  return CaregiverJourneySchema.parse({
    id: 'demo',
    scenarioId: 'gastric-surgery',
    linked: false,
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
      stage: 'PREPARING',
      label: '수술 준비 중',
      updatedAt: '2026-07-30T00:00:00.000Z',
      nextNotice: '수술실 입실이 확인되면 알려드립니다.',
    },
    task: {
      id: 'task-admission-docs',
      title: '입원 서류 발급',
      status: 'AVAILABLE',
      estimatedMinutes: 15,
      requiredItems: ['보호자 신분증'],
    },
    guide: null,
    schedules: [
      {
        id: 'schedule-admission',
        type: 'ADMISSION',
        title: '입원 수속',
        startsAt: '2026-07-30T00:00:00.000Z',
        building: 'MAIN',
        floor: '1F',
        location: '입원수속 창구',
        preparation: ['보호자 신분증을 준비해 주세요.'],
      },
      {
        id: 'schedule-surgery',
        type: 'SURGERY',
        title: '위암 수술',
        startsAt: '2026-07-30T01:30:00.000Z',
        building: 'CANCER',
        floor: '3F',
        location: '수술환자가족대기실',
        preparation: ['보호자 대기 장소를 확인해 주세요.'],
      },
      {
        id: 'schedule-follow-up',
        type: 'APPOINTMENT',
        title: '퇴원 후 외래 진료',
        startsAt: '2026-08-07T01:00:00.000Z',
        building: 'CANCER',
        floor: '1F',
        location: '위/췌담도센터',
        preparation: ['퇴원 안내문과 복약 목록을 준비해 주세요.'],
      },
    ],
  });
}

function createColonoscopyJourney(): CaregiverJourney {
  return CaregiverJourneySchema.parse({
    id: 'demo',
    scenarioId: 'morning-colonoscopy',
    linked: false,
    patient: {
      id: 'patient-colonoscopy-demo',
      displayName: '박영희',
      age: 67,
      procedureName: '건강검진 오전 대장내시경',
      scheduledAt: '2026-07-31T00:00:00.000Z',
    },
    caregiver: {
      displayName: '이민수',
      relationship: '아들',
    },
    treatment: {
      stage: 'PREPARING',
      label: '검사 준비 중',
      updatedAt: '2026-07-28T00:00:00.000Z',
      nextNotice: '현재 단계의 음식·행동 제한을 확인해 주세요.',
    },
    task: null,
    guide: null,
    schedules: [
      {
        id: 'schedule-preparation-check',
        type: 'ADMIN',
        title: '검사 준비사항 확인',
        startsAt: '2026-07-28T01:00:00.000Z',
        building: 'CANCER',
        floor: '1F',
        location: '검사 안내 데스크',
        preparation: ['금식 시작 시각을 확인해 주세요.'],
      },
      {
        id: 'schedule-colonoscopy',
        type: 'EXAM',
        title: '오전 대장내시경',
        startsAt: '2026-07-31T00:00:00.000Z',
        building: 'CANCER',
        floor: '1F',
        location: '내시경실',
        preparation: ['병원이 안내한 금식 지침을 확인해 주세요.'],
      },
      {
        id: 'schedule-result',
        type: 'APPOINTMENT',
        title: '검사 결과 상담',
        startsAt: '2026-08-07T00:30:00.000Z',
        building: 'CANCER',
        floor: '1F',
        location: '대장센터',
        preparation: ['검사 후 받은 안내문을 준비해 주세요.'],
      },
    ],
  });
}

function createDemoJourney(scenarioId: DemoScenarioId) {
  return scenarioId === 'morning-colonoscopy'
    ? createColonoscopyJourney()
    : createSurgeryJourney();
}

export class MemoryCaregiverJourneyRepository
  implements CaregiverJourneyRepository
{
  private journey = createDemoJourney('gastric-surgery');
  private scenarioRevision = 0;

  async getDemo() {
    return structuredClone(this.journey);
  }

  async saveDemo(journey: CaregiverJourney) {
    this.journey = CaregiverJourneySchema.parse(journey);
    return structuredClone(this.journey);
  }

  async resetDemo(scenarioId: DemoScenarioId) {
    this.journey = createDemoJourney(scenarioId);
    this.scenarioRevision += 1;
    return structuredClone(this.journey);
  }

  getDemoScenarioRevision() {
    return this.scenarioRevision;
  }
}
