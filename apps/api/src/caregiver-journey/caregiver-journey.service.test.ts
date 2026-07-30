import { BadRequestException, NotFoundException } from '@nestjs/common';
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
    expect(result.schedules).toHaveLength(3);
  });

  it('보호자 업무를 완료한다', async () => {
    const result = await service.completeTask('task-admission-docs');

    expect(result.task?.status).toBe('COMPLETED');
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

  it('대장내시경 여정에 수술 단계를 적용하지 않는다', async () => {
    const repository = new MemoryCaregiverJourneyRepository();
    await repository.resetDemo('morning-colonoscopy');
    const colonoscopyService = new CaregiverJourneyService(repository);

    await expect(
      colonoscopyService.advanceDemo(),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect((await colonoscopyService.getDemo()).treatment.label).toBe(
      '검사 준비 중',
    );
  });

  it('치료 단계를 전환해도 등록된 환자 일정을 유지한다', async () => {
    const initial = await service.getDemo();
    const next = await service.advanceDemo();

    expect(next.schedules).toEqual(initial.schedules);
  });

  it('완료 이후에는 진행 단계를 되돌리지 않는다', async () => {
    for (let index = 0; index < 4; index += 1) {
      await service.advanceDemo();
    }

    const completed = await service.advanceDemo();

    expect(completed.treatment.stage).toBe('COMPLETED');
  });
});
