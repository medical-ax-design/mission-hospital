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
  it('예약 및 병원 확인 시각을 API 값으로 표시한다', async () => {
    const scheduledJourney: CaregiverJourney = {
      ...unlinkedJourney,
      patient: {
        ...unlinkedJourney.patient,
        scheduledAt: '2026-07-31T02:20:00.000Z',
      },
      treatment: {
        ...unlinkedJourney.treatment,
        updatedAt: '2026-07-30T01:25:00.000Z',
      },
    };
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue(scheduledJourney),
      linkDemo: vi.fn().mockResolvedValue({
        ...scheduledJourney,
        linked: true,
      }),
    });
    const user = userEvent.setup();

    render(<CaregiverJourneyApp api={api} />);

    expect(
      await screen.findByText('7월 31일 오전 11:20 예정'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '보호자로 연결하기' }),
    );

    expect(
      await screen.findByText('병원 확인 오전 10:25'),
    ).toBeInTheDocument();
  });

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

  it('현재 처리할 보호자 업무가 없으면 빈 상태를 안내한다', async () => {
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
        task: null,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);

    expect(
      await screen.findByText('현재 처리할 업무가 없습니다'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /입원 서류 발급/ }),
    ).not.toBeInTheDocument();
  });

  it('이동 안내가 없으면 경로를 만들지 않고 안내 데스크를 안내한다', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
        guide: null,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(
      await screen.findByRole('button', { name: /입원 서류 발급/ }),
    );
    await user.click(
      screen.getByRole('button', { name: '경로 안내 시작' }),
    );

    expect(
      screen.getByRole('heading', {
        name: '등록된 이동 안내가 없습니다.',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('가까운 안내 데스크에 문의해 주세요.'),
    ).toBeInTheDocument();
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

  it('보호자 업무의 준비물과 경로를 확인하고 완료한다', async () => {
    const user = userEvent.setup();
    const completedJourney: CaregiverJourney = {
      ...unlinkedJourney,
      linked: true,
      task: {
        ...unlinkedJourney.task!,
        status: 'COMPLETED',
      },
    };
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
      }),
      completeTask: vi.fn().mockResolvedValue(completedJourney),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(
      await screen.findByRole('button', {
        name: /입원 서류 발급/,
      }),
    );

    expect(
      screen.getByRole('heading', { name: '입원 서류 발급' }),
    ).toBeInTheDocument();
    expect(screen.getByText('보호자 신분증')).toBeInTheDocument();
    expect(screen.getByText('약 15분')).toBeInTheDocument();
    expect(screen.getByText('번호표 필요 없음')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '경로 안내 시작' }),
    );

    expect(
      screen.getByRole('heading', {
        name: '본관 1층 3번 키오스크',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('중앙 엘리베이터로 이동하세요.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '발급되지 않으면 옆 제증명 창구를 방문하세요.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '업무 완료' }));

    expect(api.completeTask).toHaveBeenCalledWith(
      'task-admission-docs',
    );
    expect(
      await screen.findByText('업무를 완료했습니다'),
    ).toBeInTheDocument();
  });

  it('발표 모드에서만 병원 확인 단계를 전환한다', async () => {
    const user = userEvent.setup();
    const linkedJourney = {
      ...unlinkedJourney,
      linked: true,
    };
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue(linkedJourney),
      advanceDemo: vi.fn().mockResolvedValue({
        ...linkedJourney,
        treatment: {
          ...linkedJourney.treatment,
          stage: 'IN_OPERATING_ROOM',
          label: '수술실 입실',
        },
      }),
    });

    const { unmount } = render(<CaregiverJourneyApp api={api} />);

    await screen.findByRole('heading', { name: /수술 준비 중/ });
    expect(
      screen.queryByRole('button', { name: '다음 단계로 전환' }),
    ).not.toBeInTheDocument();

    unmount();
    render(<CaregiverJourneyApp api={api} demoMode />);

    await user.click(
      await screen.findByRole('button', {
        name: '다음 단계로 전환',
      }),
    );

    expect(api.advanceDemo).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole('heading', { name: /수술실 입실/ }),
    ).toBeInTheDocument();
  });

  it('의료진 확인 전에는 요약을 생성하지 않는다', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(
      await screen.findByRole('button', {
        name: /진료 내용 정리/,
      }),
    );

    expect(
      screen.getByRole('heading', {
        name: '의료진 설명을 확인 중입니다',
      }),
    ).toBeInTheDocument();
  });

  it('확인된 설명을 가족 공유 미리보기로 보여준다', async () => {
    const user = userEvent.setup();
    const confirmedJourney: CaregiverJourney = {
      ...unlinkedJourney,
      linked: true,
      treatment: {
        ...unlinkedJourney.treatment,
        stage: 'RECOVERY',
        label: '회복실 이동',
      },
      summary: {
        status: 'CONFIRMED',
        confirmedAt: '2026-07-30T06:35:00.000Z',
        currentStatus: '수술 종료 · 회복실에서 상태 확인 중',
        items: [
          '예정된 수술이 종료되었습니다.',
          '환자는 회복실에서 상태를 확인하고 있습니다.',
          '음식물 제공은 의료진의 다음 안내를 기다려 주세요.',
        ],
        nextSchedule: '회복실 확인 후 병실 이동 예정',
      },
    };
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue(confirmedJourney),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(
      await screen.findByRole('button', {
        name: /진료 내용 정리/,
      }),
    );

    expect(
      screen.getByText('수술 종료 · 회복실에서 상태 확인 중'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('예정된 수술이 종료되었습니다.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('회복실 확인 후 병실 이동 예정'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '의료진 확인 시각 · 오후 3:35 · 발표용 가상 정보',
      ),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '가족에게 공유' }),
    );

    expect(
      screen.getByRole('dialog', { name: '가상 공유 미리보기' }),
    ).toBeInTheDocument();
    expect(screen.getByText('수술 종료')).toBeInTheDocument();
    expect(screen.getByText('회복실 확인 중')).toBeInTheDocument();
    expect(screen.getByText('병실 이동 예정')).toBeInTheDocument();
  });
});

export { createFakeApi, unlinkedJourney };
