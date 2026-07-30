import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CaregiverJourney,
  DemoScenarioId,
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

  selectDemoScenario(scenarioId: DemoScenarioId) {
    return this.repository.resetDemo(scenarioId);
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
    if (journey.scenarioId !== 'gastric-surgery') {
      throw new BadRequestException(
        '수술 시나리오에서만 치료 단계를 전환할 수 있습니다.',
      );
    }
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
    });
  }
}
