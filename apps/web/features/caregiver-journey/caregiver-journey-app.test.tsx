import type { CaregiverJourney } from '@ready-on/contracts/caregiver-journey';
import type {
  RestrictionGuidance,
  SavedQuestion,
} from '@ready-on/contracts/restriction-guidance';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { CaregiverJourneyApi } from './api';
import { CaregiverJourneyApp } from './caregiver-journey-app';
import {
  documentIssuanceResultFixture,
  hospitalGuideCatalogFixture,
} from '../hospital-guide/hospital-guide-test-fixtures';

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
  guide: null,
  schedules: [
    {
      id: 'schedule-admission',
      type: 'ADMISSION',
      title: '입원 수속',
      startsAt: '2026-07-30T00:00:00.000Z',
      building: 'MAIN',
      floor: '1F',
      location: '입원수속 창구',
      preparation: ['보호자 신분증을 준비해 주세요.'],
    },
    {
      id: 'schedule-surgery',
      type: 'SURGERY',
      title: '위암 수술',
      startsAt: '2026-07-30T01:30:00.000Z',
      building: 'CANCER',
      floor: '3F',
      location: '수술환자가족대기실',
      preparation: ['보호자 대기 장소를 확인해 주세요.'],
    },
    {
      id: 'schedule-follow-up',
      type: 'APPOINTMENT',
      title: '퇴원 후 외래 진료',
      startsAt: '2026-08-07T01:00:00.000Z',
      building: 'CANCER',
      floor: '1F',
      location: '위/췌담도센터',
      preparation: ['퇴원 안내문을 준비해 주세요.'],
    },
  ],
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
    getHospitalGuideCatalog: vi
      .fn()
      .mockResolvedValue(hospitalGuideCatalogFixture),
    searchHospitalGuidePurpose: vi
      .fn()
      .mockResolvedValue(documentIssuanceResultFixture),
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
    expect(
      screen.getByText('암병원 2층 원무수납까지 안내해 드려요'),
    ).toBeInTheDocument();
    expect(screen.queryByText('약 15분')).not.toBeInTheDocument();
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

  it('보호자 업무에서 공식 지도 기반 길찾기를 바로 연다', async () => {
    const user = userEvent.setup();
    const neverResolves = new Promise<never>(() => {});
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
        guide: null,
      }),
      getHospitalGuideCatalog: vi.fn(() => neverResolves),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(
      await screen.findByRole('button', { name: /입원 서류 발급/ }),
    );

    expect(
      screen.getByRole('heading', {
        name: '원무수납 길찾기',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('수술환자가족대기실에서 엘리베이터까지'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('route-line')).toBeInTheDocument();
    expect(screen.getByTestId('route-user-marker')).toBeInTheDocument();
    expect(screen.getByTestId('route-end-marker')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '← 홈으로' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '서류 발급' }),
    ).not.toBeInTheDocument();
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

  it('발표 모드 치료 화면에서만 로컬 단계 제어를 제공한다', async () => {
    const user = userEvent.setup();
    const linkedJourney = { ...unlinkedJourney, linked: true };
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue(linkedJourney),
    });

    const { unmount } = render(<CaregiverJourneyApp api={api} />);
    await user.click(
      await screen.findByRole('button', { name: '과정 알아보기' }),
    );
    expect(
      screen.queryByRole('complementary', {
        name: '발표용 데모 제어',
      }),
    ).not.toBeInTheDocument();

    unmount();
    sessionStorage.clear();
    render(<CaregiverJourneyApp api={api} demoMode />);
    await user.click(
      await screen.findByRole('button', { name: '과정 알아보기' }),
    );

    const controls = screen.getByRole('complementary', {
      name: '발표용 데모 제어',
    });
    expect(controls).toBeInTheDocument();
    expect(within(controls).getByText('1 / 5')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: '수술 준비 일반 과정 AI 재구성 장면',
      }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '다음' }));

    expect(within(controls).getByText('2 / 5')).toBeInTheDocument();
    const statusCard = screen.getByRole('region', {
      name: '발표용 병원 상태 시연',
    });
    expect(within(statusCard).getByText('수술실 입실')).toBeInTheDocument();
    const timelineSteps = within(
      screen.getByRole('region', {
        name: '일반적인 수술 과정',
      }),
    ).getAllByRole('listitem');
    expect(timelineSteps[1]).toHaveAttribute('aria-current', 'step');
    expect(
      screen.getByRole('img', {
        name: '수술실 입실 일반 과정 AI 재구성 장면',
      }),
    ).toHaveAttribute(
      'src',
      '/media/treatment/operating-room-entry.png',
    );
    expect(screen.getByText('AI로 재구성한 일반 과정')).toBeInTheDocument();
    expect(
      screen.getByText('현재 환자의 실시간 영상이 아닙니다'),
    ).toBeInTheDocument();
    expect(api.advanceDemo).not.toHaveBeenCalled();
  });

  it('네 개의 주요 탭을 제공한다', async () => {
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);

    expect(
      await screen.findByRole('navigation', { name: '주요 메뉴' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '홈' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('button', { name: '일정' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '이용 안내' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '내 정보' }),
    ).toBeInTheDocument();
  });

  it('내 정보 탭에서 보호자와 연결 환자를 확인한다', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(
      await screen.findByRole('button', { name: '내 정보' }),
    );

    expect(
      screen.getByRole('heading', { name: '내 정보' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '김서연' }),
    ).toBeInTheDocument();
    expect(screen.getByText('김정우 환자의 딸')).toBeInTheDocument();
    expect(screen.getByText('68세')).toBeInTheDocument();
    expect(screen.getByText('일정·병원 확인 상태')).toBeInTheDocument();
    expect(
      screen.queryByText(unlinkedJourney.patient.procedureName),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '내 정보' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  it('일정 탭에서 환자 일정 날짜와 빈 날짜를 확인한다', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(await screen.findByRole('button', { name: '일정' }));

    expect(
      screen.getByRole('heading', { name: '환자 일정' }),
    ).toBeInTheDocument();
    expect(screen.getByText('2026년 7월')).toBeInTheDocument();

    const selectedDate = screen.getByRole('button', {
      name: '30일 목, 일정 2개',
    });
    expect(selectedDate).toHaveAttribute('aria-pressed', 'true');

    expect(screen.getByText('입원 수속')).toBeInTheDocument();
    expect(screen.getByText('위암 수술')).toBeInTheDocument();
    expect(
      screen.getByText('수술환자가족대기실'),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '29일 수, 일정 없음' }),
    );

    expect(
      screen.getByText('등록된 병원 일정이 없습니다'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '29일 수, 일정 없음' }),
    ).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: '달력 보기' }));
    expect(
      screen.getByRole('button', {
        name: '30일, 김정우 환자 일정 2개',
      }),
    ).toBeInTheDocument();
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

  it('홈에서 서류 발급을 검색하면 길찾기를 바로 연다', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.type(
      await screen.findByRole('textbox', {
        name: '병원 이용 목적 찾기',
      }),
      '서류 발급',
    );
    await user.click(
      screen.getByRole('button', { name: '목적 검색' }),
    );

    expect(
      await screen.findByRole('heading', { name: '원무수납 길찾기' }),
    ).toBeInTheDocument();
  });

  it('이용 안내의 서류 발급에서 길찾기를 바로 연다', async () => {
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
      await screen.findByRole('button', { name: '이용 안내' }),
    );
    expect(
      await screen.findByRole('heading', {
        name: '무엇을 하러 가시나요?',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '전체 건물·층별 안내' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '서류 발급' }));

    expect(
      await screen.findByRole('heading', { name: '원무수납 길찾기' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('수술환자가족대기실에서 엘리베이터까지'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('route-line')).toBeInTheDocument();
  });

  it('이용 안내에서 목적 선택과 전체 층 안내를 구분한다', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(
      await screen.findByRole('button', { name: '이용 안내' }),
    );

    expect(
      screen.getByRole('heading', { name: '무엇을 하러 가시나요?' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '서류 발급' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '전체 건물·층별 안내' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /환자 일정 장소 길찾기/ }),
    ).not.toBeInTheDocument();
  });

  it('병원 승인 경로가 없는 이용 안내에는 붉은 선을 노출하지 않는다', async () => {
    const user = userEvent.setup();
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
      }),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(
      await screen.findByRole('button', { name: '이용 안내' }),
    );
    expect(screen.queryByTestId('route-line')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('route-user-marker'),
    ).not.toBeInTheDocument();
  });

  it('네 건물의 지하층과 고층을 탐색한다', async () => {
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
      await screen.findByRole('button', { name: '이용 안내' }),
    );
    await user.click(
      await screen.findByRole('button', {
        name: '전체 건물·층별 안내',
      }),
    );

    expect(screen.getByRole('tab', { name: '본관' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: '별관' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '암병원' })).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: '양성자치료센터' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '지하 3층' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '20층' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: '암병원' }));
    await user.click(screen.getByRole('button', { name: '11층' }));

    expect(
      screen.getByRole('heading', { name: '암병원 11층' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: '삼성서울병원 공식 층별 안내 원문',
      }),
    ).toHaveAttribute(
      'href',
      'https://www.samsunghospital.com/_newhome/info/guide/cancer/11F.html',
    );
  });

  it('병원 안내 API가 응답하지 않아도 입원 서류 발급 길찾기를 연다', async () => {
    const user = userEvent.setup();
    const neverResolves = new Promise<never>(() => {});
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
        guide: null,
      }),
      getHospitalGuideCatalog: vi.fn(() => neverResolves),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(
      await screen.findByRole('button', {
        name: '입원 서류 발급 암병원 2층 원무수납까지 안내해 드려요',
      }),
    );
    expect(
      screen.getByRole('heading', {
        name: '원무수납 길찾기',
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId('route-line')).toBeInTheDocument();
  });

  it('수술환자가족대기실에서 암병원 2층 원무수납까지 실제 층 전환 경로를 안내한다', async () => {
    const user = userEvent.setup();
    const neverResolves = new Promise<never>(() => {});
    const api = createFakeApi({
      getDemo: vi.fn().mockResolvedValue({
        ...unlinkedJourney,
        linked: true,
        guide: null,
      }),
      getHospitalGuideCatalog: vi.fn(() => neverResolves),
    });

    render(<CaregiverJourneyApp api={api} />);

    await user.click(
      await screen.findByRole('button', {
        name: '입원 서류 발급 암병원 2층 원무수납까지 안내해 드려요',
      }),
    );

    expect(
      screen.getByRole('heading', {
        name: '원무수납 길찾기',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('수술환자가족대기실에서 엘리베이터까지'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('route-line')).toBeInTheDocument();
    expect(
      screen.getByTestId('route-direction-arrow'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('route-user-marker')).toBeInTheDocument();
    expect(screen.getByTestId('route-end-marker')).toBeInTheDocument();

    const zoomButton = screen.getByRole('button', {
      name: '전체 지도 보기',
    });
    await user.click(zoomButton);
    expect(zoomButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(
      screen.getByRole('button', {
        name: '이동 수단에 도착했어요',
      }),
    );
    expect(screen.getByText('3층 → 2층')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: '2층에 도착했어요' }),
    );
    expect(
      screen.getByText('엘리베이터에서 원무수납까지'),
    ).toBeInTheDocument();
    expect(screen.getByText('원무수납')).toBeInTheDocument();
  });

});

export { createFakeApi, unlinkedJourney };
