import { describe, expect, it } from 'vitest';
import {
  RestrictionGuidanceResponseSchema,
  RestrictionSearchResponseSchema,
} from './restriction-guidance.js';

const source = {
  title: '삼성서울병원 대장내시경 안내',
  url: 'https://www.samsunghospital.com/',
  checkedAt: '2026-07-30',
  dataVersion: '2026-07-30.1',
};

describe('restriction guidance contracts', () => {
  it('현재 단계의 공식 제한 목록을 허용한다', () => {
    const response = RestrictionGuidanceResponseSchema.parse({
      guidance: {
        scenarioId: 'morning-colonoscopy',
        phase: {
          code: 'THREE_DAYS_BEFORE',
          label: '검사 3일 전',
          effectiveText: '검사 3일 전부터 검사 종료 전까지',
        },
        headline: '씨 있는 과일과 잡곡류를 피하세요',
        items: [
          {
            id: 'seeded-fruit',
            category: 'FOOD',
            itemName: '씨 있는 과일',
            resultType: 'DO_NOT_PROVIDE',
            reason: '검사 전 장 정결을 방해할 수 있습니다.',
            effectiveText: '검사 3일 전부터 검사 종료 전까지',
          },
        ],
        source,
      },
    });

    expect(response.guidance.items[0]?.resultType).toBe(
      'DO_NOT_PROVIDE',
    );
  });

  it('허가 결과를 계약에서 거부한다', () => {
    expect(() =>
      RestrictionSearchResponseSchema.parse({
        result: {
          query: '커피',
          normalizedQuery: '커피',
          resultType: 'ALLOW',
          headline: '마셔도 됩니다',
          reason: '문제없습니다.',
          effectiveText: '현재',
          matchedRuleId: null,
          source,
        },
      }),
    ).toThrow();
  });

  it('공식 규칙이 없는 검색은 확인 필요 결과를 허용한다', () => {
    const response = RestrictionSearchResponseSchema.parse({
      result: {
        query: '커피',
        normalizedQuery: '커피',
        resultType: 'CHECK_BEFORE_PROVIDING',
        headline: '확인 전에는 제공하지 마세요',
        reason: '현재 병원 승인 안내만으로 확인할 수 없습니다.',
        effectiveText: '의료진 확인 전까지',
        matchedRuleId: null,
        source,
      },
    });

    expect(response.result.matchedRuleId).toBeNull();
  });

  it('출처 메타데이터가 없는 결과를 거부한다', () => {
    expect(() =>
      RestrictionSearchResponseSchema.parse({
        result: {
          query: '딸기',
          normalizedQuery: '딸기',
          resultType: 'DO_NOT_PROVIDE',
          headline: '지금은 제공하지 마세요',
          reason: '씨 있는 과일에 해당합니다.',
          effectiveText: '검사 3일 전부터',
          matchedRuleId: 'seeded-fruit',
        },
      }),
    ).toThrow();
  });
});
