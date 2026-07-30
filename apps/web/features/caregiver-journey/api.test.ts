import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CaregiverJourneyApiError,
  createCaregiverJourneyApi,
} from './api';

const journeyResponse = {
  journey: {
    id: 'demo',
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
});
