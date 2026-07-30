import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CaregiverJourneyApi } from './api';
import { CaregiverJourneyApp } from './caregiver-journey-app';

const unlinkedJourney: CaregiverJourney = {
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
};

function createFakeApi(
  overrides: Partial<CaregiverJourneyApi> = {},
): CaregiverJourneyApi {
  return {
    getDemo: vi.fn().mockResolvedValue(unlinkedJourney),
    linkDemo: vi.fn().mockResolvedValue({
      ...unlinkedJourney,
      linked: true,
    }),
    completeTask: vi.fn(),
    advanceDemo: vi.fn(),
    ...overrides,
  };
}

describe('CaregiverJourneyApp', () => {
  it('연결 전 환자를 선택하고 보호자로 연결한다', async () => {
    const user = userEvent.setup();
    const api = createFakeApi();

    render(<CaregiverJourneyApp api={api} />);

    expect(
      await screen.findByRole('heading', {
        name: '환자를 선택해 주세요',
      }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '보호자로 연결하기' }),
    );

    expect(api.linkDemo).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole('heading', { name: /수술 준비 중/ }),
    ).toBeInTheDocument();
  });

  it('연결된 보호자에게 현재 상태와 할 일을 먼저 보여준다', async () => {
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);

    expect(
      await screen.findByRole('heading', { name: /수술 준비 중/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('입원 서류 발급')).toBeInTheDocument();
    expect(screen.getByText('다음 안내')).toBeInTheDocument();
  });

  it('병원이 확인한 상태와 일반 과정을 구분해 설명한다', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(
      await screen.findByRole('button', { name: '과정 알아보기' }),
    );

    expect(
      screen.getByRole('heading', { name: '병원 확인 상태' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '일반적인 수술 과정' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '홈으로' }));

    expect(
      screen.getByRole('heading', { name: /수술 준비 중/ }),
    ).toBeInTheDocument();
  });
});

export { createFakeApi, unlinkedJourney };
