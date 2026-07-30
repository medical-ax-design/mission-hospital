import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import type {
  RestrictionGuidance,
  SavedQuestion,
} from '@ready-on/contracts/restriction-guidance';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CaregiverJourneyApi } from './api';
import { CaregiverJourneyApp } from './caregiver-journey-app';

const unlinkedJourney: CaregiverJourney = {
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
  summary: {
    status: 'UNAVAILABLE',
  },
};

const colonoscopyJourney: CaregiverJourney = {
  ...unlinkedJourney,
  scenarioId: 'morning-colonoscopy',
  linked: true,
  patient: {
    ...unlinkedJourney.patient,
    id: 'patient-colonoscopy-demo',
    displayName: '박영희',
    procedureName: '건강검진 오전 대장내시경',
  },
  treatment: {
    ...unlinkedJourney.treatment,
    label: '검사 준비 중',
    nextNotice: '현재 단계의 음식·행동 제한을 확인해 주세요.',
  },
  task: null,
  guide: null,
};

const colonoscopyGuidance: RestrictionGuidance = {
  scenarioId: 'morning-colonoscopy',
  phase: {
    code: 'THREE_DAYS_BEFORE',
    label: '검사 3일 전',
    effectiveText: '검사 3일 전부터 검사 종료 전까지',
  },
  headline: '잡곡, 해조류, 씨 있는 과일과 견과류를 피하세요',
  items: [
    {
      id: 'colonoscopy-seeded-fruit',
      category: 'FOOD',
      itemName: '씨 있는 과일',
      resultType: 'DO_NOT_PROVIDE',
      reason: '병원 공식 검사 준비 안내에서 피하도록 안내한 항목입니다.',
      effectiveText: '검사 3일 전부터 검사 종료 전까지',
    },
  ],
  source: {
    title: '삼성서울병원 오전 대장내시경 준비 안내',
    url: 'https://www.samsunghospital.com/mobile/colonoscopy/method_01.html',
    checkedAt: '2026-07-30',
    dataVersion: '2026-07-30.1',
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
    selectScenario: vi.fn(),
    getRestrictions: vi.fn(),
    searchRestrictions: vi.fn(),
    advanceRestrictionPhase: vi.fn(),
    getQuestions: vi.fn().mockResolvedValue([]),
    saveQuestion: vi.fn(),
    completeQuestion: vi.fn(),
    deleteQuestion: vi.fn().mockResolvedValue(undefined),
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

  it('대장내시경 여정 홈에서 현재 제한 안내를 연다', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue(colonoscopyJourney),
      getRestrictions: vi.fn().mockResolvedValue(colonoscopyGuidance),
    });

    render(<CaregiverJourneyApp api={api} demoMode />);

    expect(
      await screen.findByRole('heading', { name: '현재 주의사항' }),
    ).toBeInTheDocument();
    expect(screen.getByText('검사 3일 전')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '지금 피해야 할 것 보기' }),
    );

    expect(
      screen.getByRole('heading', { name: '지금 피해야 할 것' }),
    ).toBeInTheDocument();
    expect(screen.getByText('씨 있는 과일')).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: '삼성서울병원 오전 대장내시경 준비 안내',
      }),
    ).toBeInTheDocument();
  });

  it('딸기 검색 결과를 허가 표현 없이 보여준다', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue(colonoscopyJourney),
      getRestrictions: vi.fn().mockResolvedValue(colonoscopyGuidance),
      searchRestrictions: vi.fn().mockResolvedValue({
        query: '딸기',
        normalizedQuery: '딸기',
        resultType: 'DO_NOT_PROVIDE',
        headline: '지금은 제공하지 마세요',
        reason: '씨가 장에 남아 검사 시야를 방해할 수 있습니다.',
        effectiveText: '검사 3일 전부터 검사 종료 전까지',
        matchedRuleId: 'colonoscopy-seeded-fruit',
        source: colonoscopyGuidance.source,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);
    await user.click(
      await screen.findByRole('button', {
        name: '지금 피해야 할 것 보기',
      }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: '음식이나 행동 검색' }),
      '딸기',
    );
    await user.click(screen.getByRole('button', { name: '검색' }));

    expect(
      await screen.findByRole('heading', {
        name: '지금은 제공하지 마세요',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/먹어도 됩니다/)).not.toBeInTheDocument();
  });

  it('확인 필요 검색을 질문으로 저장하고 완료한다', async () => {
    const user = userEvent.setup();
    const savedQuestion: SavedQuestion = {
      id: 'question-1',
      query: '커피',
      questionText: '커피 제공 여부를 의료진에게 확인해 주세요.',
      reason: '현재 병원 승인 안내만으로 확인할 수 없습니다.',
      status: 'OPEN',
      createdAt: '2026-07-30T06:00:00.000Z',
      completedAt: null,
    };
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue(colonoscopyJourney),
      getRestrictions: vi.fn().mockResolvedValue(colonoscopyGuidance),
      searchRestrictions: vi.fn().mockResolvedValue({
        query: '커피',
        normalizedQuery: '커피',
        resultType: 'CHECK_BEFORE_PROVIDING',
        headline: '확인 전에는 제공하지 마세요',
        reason: '현재 병원 승인 안내만으로 확인할 수 없습니다.',
        effectiveText: '의료진 확인 전까지',
        matchedRuleId: null,
        source: colonoscopyGuidance.source,
      }),
      saveQuestion: vi.fn().mockResolvedValue(savedQuestion),
      getQuestions: vi.fn().mockResolvedValue([savedQuestion]),
      completeQuestion: vi.fn().mockResolvedValue({
        ...savedQuestion,
        status: 'DONE',
        completedAt: '2026-07-30T06:05:00.000Z',
      }),
    });

    render(<CaregiverJourneyApp api={api} />);
    await user.click(
      await screen.findByRole('button', {
        name: '지금 피해야 할 것 보기',
      }),
    );
    await user.type(
      screen.getByRole('searchbox', { name: '음식이나 행동 검색' }),
      '커피',
    );
    await user.click(screen.getByRole('button', { name: '검색' }));
    await user.click(
      await screen.findByRole('button', {
        name: '의료진에게 물어볼 질문으로 저장',
      }),
    );
    await user.click(
      screen.getByRole('button', { name: '질문 목록 보기' }),
    );

    expect(
      await screen.findByText('커피 제공 여부를 의료진에게 확인해 주세요.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '확인 완료' }));
    expect(api.completeQuestion).toHaveBeenCalledWith('question-1');
    expect(await screen.findByText('확인 완료됨')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: '질문 삭제: 커피 제공 여부를 의료진에게 확인해 주세요.',
      }),
    );
    expect(api.deleteQuestion).toHaveBeenCalledWith('question-1');
    expect(
      screen.queryByText('커피 제공 여부를 의료진에게 확인해 주세요.'),
    ).not.toBeInTheDocument();
  });

  it('검색 실패 후 입력과 화면을 유지해 같은 행동을 재시도한다', async () => {
    const user = userEvent.setup();
    const searchRestrictions = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce({
        query: '커피',
        normalizedQuery: '커피',
        resultType: 'CHECK_BEFORE_PROVIDING',
        headline: '확인 전에는 제공하지 마세요',
        reason: '현재 병원 승인 안내만으로 확인할 수 없습니다.',
        effectiveText: '의료진 확인 전까지',
        matchedRuleId: null,
        source: colonoscopyGuidance.source,
      });
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue(colonoscopyJourney),
      getRestrictions: vi.fn().mockResolvedValue(colonoscopyGuidance),
      searchRestrictions,
    });

    render(<CaregiverJourneyApp api={api} />);
    await user.click(
      await screen.findByRole('button', {
        name: '지금 피해야 할 것 보기',
      }),
    );
    const input = screen.getByRole('searchbox', {
      name: '음식이나 행동 검색',
    });
    await user.type(input, '커피');
    await user.click(screen.getByRole('button', { name: '검색' }));

    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent('요청을 완료하지 못했습니다');
    expect(input).toHaveValue('커피');

    await user.click(screen.getByRole('button', { name: '검색' }));
    expect(
      await screen.findByRole('heading', {
        name: '확인 전에는 제공하지 마세요',
      }),
    ).toBeInTheDocument();
    expect(searchRestrictions).toHaveBeenCalledTimes(2);
  });
});

export { createFakeApi, unlinkedJourney };
