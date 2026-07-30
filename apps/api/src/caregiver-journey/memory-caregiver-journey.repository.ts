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
    guide: {
      currentLocation: '수술 대기실',
      destination: '본관 1층 3번 키오스크',
      estimatedTravelMinutes: 6,
      ticketRequired: false,
      steps: [
        '중앙 엘리베이터로 이동하세요.',
        '1층에서 원무 방향으로 이동하세요.',
        '3번 키오스크에서 제증명 발급을 선택하세요.',
      ],
      fallback: '발급되지 않으면 옆 제증명 창구를 방문하세요.',
    },
    summary: {
      status: 'UNAVAILABLE',
    },
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
      procedureName: '오전 대장내시경',
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
    summary: {
      status: 'UNAVAILABLE',
    },
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
