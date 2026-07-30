import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CaregiverJourney,
  TreatmentStage,
} from '@ready-on/contracts';
import {
  CAREGIVER_JOURNEY_REPOSITORY,
  type CaregiverJourneyRepository,
} from './caregiver-journey.repository.js';

const stageOrder: TreatmentStage[] = [
  'PREPARING',
  'IN_OPERATING_ROOM',
  'IN_PROGRESS',
  'RECOVERY',
  'COMPLETED',
];

const treatmentCopy: Record<
  TreatmentStage,
  Pick<CaregiverJourney['treatment'], 'label' | 'nextNotice'>
> = {
  PREPARING: {
    label: '수술 준비 중',
    nextNotice: '수술실 입실이 확인되면 알려드립니다.',
  },
  IN_OPERATING_ROOM: {
    label: '수술실 입실',
    nextNotice: '수술 시작이 확인되면 알려드립니다.',
  },
  IN_PROGRESS: {
    label: '수술 진행 중',
    nextNotice: '상태가 변경되면 알려드립니다.',
  },
  RECOVERY: {
    label: '회복실 이동',
    nextNotice: '병실 이동이 확인되면 알려드립니다.',
  },
  COMPLETED: {
    label: '수술 일정 종료',
    nextNotice: '병실에서 다음 안내를 확인해 주세요.',
  },
};

const confirmedSummary: Extract<
  CaregiverJourney['summary'],
  { status: 'CONFIRMED' }
> = {
  status: 'CONFIRMED',
  confirmedAt: '2026-07-30T05:10:00.000Z',
  currentStatus: '수술 종료 · 회복실에서 상태 확인 중',
  items: [
    '예정된 수술이 종료되었습니다.',
    '환자는 회복실에서 상태를 확인하고 있습니다.',
    '음식물 제공은 의료진의 다음 안내를 기다려 주세요.',
  ],
  nextSchedule: '회복실 확인 후 병실 이동 예정',
};

@Injectable()
export class CaregiverJourneyService {
  constructor(
    @Inject(CAREGIVER_JOURNEY_REPOSITORY)
    private readonly repository: CaregiverJourneyRepository,
  ) {}

  getDemo() {
    return this.repository.getDemo();
  }

  async linkDemo() {
    const journey = await this.repository.getDemo();
    return this.repository.saveDemo({
      ...journey,
      linked: true,
    });
  }

  async completeTask(taskId: string) {
    const journey = await this.repository.getDemo();

    if (!journey.task || journey.task.id !== taskId) {
      throw new NotFoundException('보호자 업무를 찾을 수 없습니다.');
    }

    return this.repository.saveDemo({
      ...journey,
      task: {
        ...journey.task,
        status: 'COMPLETED',
      },
    });
  }

  async advanceDemo() {
    const journey = await this.repository.getDemo();
    const currentIndex = stageOrder.indexOf(journey.treatment.stage);
    const nextStage =
      stageOrder[currentIndex + 1] ?? journey.treatment.stage;
    const nextCopy = treatmentCopy[nextStage];

    return this.repository.saveDemo({
      ...journey,
      treatment: {
        stage: nextStage,
        label: nextCopy.label,
        updatedAt: new Date().toISOString(),
        nextNotice: nextCopy.nextNotice,
      },
      summary:
        nextStage === 'RECOVERY' || nextStage === 'COMPLETED'
          ? confirmedSummary
          : journey.summary,
    });
  }
}
