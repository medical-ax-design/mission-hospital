import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { CaregiverJourneyService } from './caregiver-journey.service.js';
import { MemoryCaregiverJourneyRepository } from './memory-caregiver-journey.repository.js';

describe('CaregiverJourneyService', () => {
  let service: CaregiverJourneyService;

  beforeEach(() => {
    service = new CaregiverJourneyService(
      new MemoryCaregiverJourneyRepository(),
    );
  });

  it('가상 보호자를 환자에게 연결한다', async () => {
    const result = await service.linkDemo();

    expect(result.linked).toBe(true);
    expect(result.treatment.stage).toBe('PREPARING');
  });

  it('보호자 업무를 완료한다', async () => {
    const result = await service.completeTask('task-admission-docs');

    expect(result.task.status).toBe('COMPLETED');
  });

  it('존재하지 않는 보호자 업무는 거부한다', async () => {
    await expect(service.completeTask('unknown-task')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('치료 진행 단계를 정해진 순서로 전환한다', async () => {
    const stages = [];

    for (let index = 0; index < 4; index += 1) {
      stages.push((await service.advanceDemo()).treatment.stage);
    }

    expect(stages).toEqual([
      'IN_OPERATING_ROOM',
      'IN_PROGRESS',
      'RECOVERY',
      'COMPLETED',
    ]);
  });

  it('회복실 전에는 의료진 확인 요약을 공개하지 않는다', async () => {
    await service.advanceDemo();
    const inProgress = await service.advanceDemo();

    expect(inProgress.summary.status).toBe('UNAVAILABLE');
  });

  it('회복실 진입 시 의료진 확인 가상 요약을 공개한다', async () => {
    await service.advanceDemo();
    await service.advanceDemo();
    const recovery = await service.advanceDemo();

    expect(recovery.summary.status).toBe('CONFIRMED');
    if (recovery.summary.status === 'CONFIRMED') {
      expect(recovery.summary.items).toContain(
        '예정된 수술이 종료되었습니다.',
      );
    }
  });

  it('완료 이후에는 진행 단계를 되돌리지 않는다', async () => {
    for (let index = 0; index < 4; index += 1) {
      await service.advanceDemo();
    }

    const completed = await service.advanceDemo();

    expect(completed.treatment.stage).toBe('COMPLETED');
    expect(completed.summary.status).toBe('CONFIRMED');
  });
});
