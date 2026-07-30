import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CaregiverJourneyApiError,
  createCaregiverJourneyApi,
} from './api';

const journeyResponse = {
  journey: {
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
    schedules: [
      {
        id: 'schedule-surgery',
        type: 'SURGERY',
        title: '위암 수술',
        startsAt: '2026-07-30T01:30:00.000Z',
        building: 'MAIN',
        floor: '2F',
        location: '수술센터',
        preparation: ['보호자 대기 장소를 확인해 주세요.'],
      },
    ],
  },
};

const guidanceResponse = {
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
        id: 'colonoscopy-seeded-fruit',
        category: 'FOOD',
        itemName: '씨 있는 과일',
        resultType: 'DO_NOT_PROVIDE',
        reason: '씨가 장에 남을 수 있습니다.',
        effectiveText: '검사 3일 전부터 검사 종료 전까지',
      },
    ],
    source: {
      title: '삼성서울병원 오전 대장내시경 준비 안내',
      url: 'https://www.samsunghospital.com/mobile/colonoscopy/method_01.html',
      checkedAt: '2026-07-30',
      dataVersion: '2026-07-30.1',
    },
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('caregiver journey API client', () => {
  it('가상 보호자 여정을 조회한다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(journeyResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const api = createCaregiverJourneyApi('https://api.example.test');
    const journey = await api.getDemo();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/caregiver-journeys/demo',
      { method: 'GET' },
    );
    expect(journey.id).toBe('demo');
  });

  it('업무 식별자를 인코딩해 완료 요청을 보낸다', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(journeyResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const api = createCaregiverJourneyApi('https://api.example.test');
    await api.completeTask('task/with space');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/caregiver-journeys/demo/tasks/task%2Fwith%20space/complete',
      { method: 'POST' },
    );
  });

  it('성공하지 않은 응답을 명시적인 API 오류로 변환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
    );

    const api = createCaregiverJourneyApi('https://api.example.test');

    await expect(api.getDemo()).rejects.toEqual(
      new CaregiverJourneyApiError(503),
    );
  });

  it('계약과 다른 응답은 화면에 전달하지 않는다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ journey: { id: 'broken' } }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );

    const api = createCaregiverJourneyApi('https://api.example.test');

    await expect(api.getDemo()).rejects.toMatchObject({
      name: 'ZodError',
    });
  });

  it('시나리오와 검색어를 인코딩해 제한 안내를 조회한다', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(journeyResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            result: {
              query: '딸기/키위',
              normalizedQuery: '딸기/키위',
              resultType: 'CHECK_BEFORE_PROVIDING',
              headline: '확인 전에는 제공하지 마세요',
              reason: '현재 병원 승인 안내만으로 확인할 수 없습니다.',
              effectiveText: '의료진 확인 전까지',
              matchedRuleId: null,
              source: guidanceResponse.guidance.source,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const api = createCaregiverJourneyApi('https://api.example.test');
    await api.selectScenario('morning-colonoscopy');
    await api.searchRestrictions('딸기/키위');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://api.example.test/caregiver-journeys/demo/scenarios/morning-colonoscopy/select',
      { method: 'POST' },
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://api.example.test/caregiver-journeys/demo/restrictions/search?q=%EB%94%B8%EA%B8%B0%2F%ED%82%A4%EC%9C%84',
      { method: 'GET' },
    );
  });

  it('제한 안내 응답이 계약과 다르면 거부한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            guidance: {
              ...guidanceResponse.guidance,
              source: undefined,
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    );

    const api = createCaregiverJourneyApi('https://api.example.test');

    await expect(api.getRestrictions()).rejects.toMatchObject({
      name: 'ZodError',
    });
  });
});
