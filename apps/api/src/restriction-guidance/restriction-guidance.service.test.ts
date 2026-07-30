import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryCaregiverJourneyRepository } from '../caregiver-journey/memory-caregiver-journey.repository.js';
import { RestrictionGuidanceService } from './restriction-guidance.service.js';

describe('RestrictionGuidanceService', () => {
  let repository: MemoryCaregiverJourneyRepository;
  let service: RestrictionGuidanceService;

  beforeEach(async () => {
    repository = new MemoryCaregiverJourneyRepository();
    await repository.resetDemo('morning-colonoscopy');
    service = new RestrictionGuidanceService(repository);
  });

  it('현재 단계에 해당하는 공식 제한만 반환한다', async () => {
    const guidance = await service.getGuidance();

    expect(guidance.phase.code).toBe('THREE_DAYS_BEFORE');
    expect(guidance.items.map((item) => item.itemName)).toContain(
      '씨 있는 과일',
    );
    expect(guidance.items.map((item) => item.itemName)).not.toContain(
      '물',
    );
  });

  it('별칭 딸기를 씨 있는 과일 제한으로 찾는다', async () => {
    const result = await service.search(' 딸기 ');

    expect(result).toMatchObject({
      normalizedQuery: '딸기',
      resultType: 'DO_NOT_PROVIDE',
      matchedRuleId: 'colonoscopy-seeded-fruit',
      reason: '병원 공식 검사 준비 안내에서 피하도록 안내한 항목입니다.',
    });
  });

  it('규칙이 없는 커피는 허가하지 않고 확인 필요로 반환한다', async () => {
    const result = await service.search('커피');

    expect(result).toMatchObject({
      resultType: 'CHECK_BEFORE_PROVIDING',
      matchedRuleId: null,
      headline: '확인 전에는 제공하지 마세요',
    });
  });

  it('절대 금식 단계에서는 물을 제한한다', async () => {
    await service.advancePhase();
    await service.advancePhase();

    const result = await service.search('물');

    expect(result.resultType).toBe('DO_NOT_PROVIDE');
    expect(result.matchedRuleId).toBe('colonoscopy-water');
    expect(result.effectiveText).toBe(
      '검사 당일 오전 5시부터 검사 종료 전까지',
    );
  });

  it('절대 금식 단계의 약은 예약 안내 확인을 요청한다', async () => {
    await service.advancePhase();
    await service.advancePhase();

    const result = await service.search('혈압약');

    expect(result.resultType).toBe('CHECK_BEFORE_PROVIDING');
    expect(result.reason).toContain('예약 안내');
  });

  it.each(['음료', '사탕', '전자담배'])(
    '공식 안내에 직접 없는 %s은 금지로 확장하지 않는다',
    async (query) => {
      await service.advancePhase();
      await service.advancePhase();

      const result = await service.search(query);

      expect(result.resultType).toBe('CHECK_BEFORE_PROVIDING');
      expect(result.matchedRuleId).toBeNull();
    },
  );

  it('같은 열린 질문은 중복 저장하지 않는다', async () => {
    const first = await service.saveQuestion('커피');
    const second = await service.saveQuestion(' 커피 ');

    expect(second.id).toBe(first.id);
    expect(await service.listQuestions()).toHaveLength(1);
  });

  it('검색어에 조사를 붙이지 않고 자연스러운 질문을 만든다', async () => {
    const question = await service.saveQuestion('커피');

    expect(question.questionText).toBe(
      '커피 제공 여부를 의료진에게 확인해 주세요.',
    );
  });

  it('질문을 확인 완료로 변경한다', async () => {
    const question = await service.saveQuestion('커피');
    const completed = await service.completeQuestion(question.id);

    expect(completed.status).toBe('DONE');
    expect(completed.completedAt).not.toBeNull();
  });

  it('존재하지 않는 질문 완료는 거부한다', async () => {
    await expect(
      service.completeQuestion('unknown-question'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('시나리오를 다시 선택하면 제한 단계와 질문을 초기화한다', async () => {
    await service.advancePhase();
    await service.saveQuestion('커피');
    await repository.resetDemo('gastric-surgery');
    await repository.resetDemo('morning-colonoscopy');

    expect((await service.getGuidance()).phase.code).toBe(
      'THREE_DAYS_BEFORE',
    );
    expect(await service.listQuestions()).toEqual([]);
  });
});
