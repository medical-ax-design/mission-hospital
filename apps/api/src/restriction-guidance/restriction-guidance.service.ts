import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  RestrictionCategory,
  RestrictionGuidance,
  RestrictionPhaseCode,
  RestrictionSearchResult,
  SavedQuestion,
} from '@ready-on/contracts';
import {
  CAREGIVER_JOURNEY_REPOSITORY,
  type CaregiverJourneyRepository,
} from '../caregiver-journey/caregiver-journey.repository.js';

const source = {
  title: '삼성서울병원 오전 대장내시경 준비 안내',
  url: 'https://www.samsunghospital.com/mobile/colonoscopy/method_01.html',
  checkedAt: '2026-07-30',
  dataVersion: '2026-07-30.1',
} as const;

const phases: Record<
  RestrictionPhaseCode,
  RestrictionGuidance['phase'] & { headline: string }
> = {
  THREE_DAYS_BEFORE: {
    code: 'THREE_DAYS_BEFORE',
    label: '검사 3일 전',
    effectiveText: '검사 3일 전부터 검사 종료 전까지',
    headline: '잡곡, 해조류, 씨 있는 과일과 견과류를 피하세요',
  },
  DAY_BEFORE: {
    code: 'DAY_BEFORE',
    label: '검사 전날',
    effectiveText: '검사 전날 오후 7시부터',
    headline: '오후 7시 이후 일반 식사를 하지 마세요',
  },
  ABSOLUTE_FASTING: {
    code: 'ABSOLUTE_FASTING',
    label: '절대 금식',
    effectiveText: '자정부터 검사 종료 전까지',
    headline: '물, 약, 껌, 은단, 담배를 포함해 금식하세요',
  },
};

type Rule = RestrictionGuidance['items'][number] & {
  phase: RestrictionPhaseCode;
  aliases: string[];
};

const rules: Rule[] = [
  {
    id: 'colonoscopy-grains',
    phase: 'THREE_DAYS_BEFORE',
    category: 'FOOD',
    itemName: '잡곡류',
    aliases: ['잡곡밥', '검은쌀', '현미밥', '깨죽', '현미'],
    resultType: 'DO_NOT_PROVIDE',
    reason: '검사 전 장 정결을 방해할 수 있는 곡류입니다.',
    effectiveText: '검사 3일 전부터 검사 종료 전까지',
  },
  {
    id: 'colonoscopy-vegetables',
    phase: 'THREE_DAYS_BEFORE',
    category: 'FOOD',
    itemName: '섬유질 많은 채소·해조류',
    aliases: ['김치', '나물', '해조류', '김', '미역', '버섯', '콩나물'],
    resultType: 'DO_NOT_PROVIDE',
    reason: '섬유질이 남아 검사 시야를 방해할 수 있습니다.',
    effectiveText: '검사 3일 전부터 검사 종료 전까지',
  },
  {
    id: 'colonoscopy-seeded-fruit',
    phase: 'THREE_DAYS_BEFORE',
    category: 'FOOD',
    itemName: '씨 있는 과일',
    aliases: ['딸기', '키위', '포도', '수박', '참외'],
    resultType: 'DO_NOT_PROVIDE',
    reason: '씨가 장에 남아 검사 시야를 방해할 수 있습니다.',
    effectiveText: '검사 3일 전부터 검사 종료 전까지',
  },
  {
    id: 'colonoscopy-seeds-nuts',
    phase: 'THREE_DAYS_BEFORE',
    category: 'FOOD',
    itemName: '씨·견과류',
    aliases: ['고추씨', '옥수수', '견과류', '땅콩', '호두', '아몬드'],
    resultType: 'DO_NOT_PROVIDE',
    reason: '씨와 견과류가 장에 남을 수 있습니다.',
    effectiveText: '검사 3일 전부터 검사 종료 전까지',
  },
  {
    id: 'colonoscopy-meal-after-seven',
    phase: 'DAY_BEFORE',
    category: 'FOOD',
    itemName: '오후 7시 이후 일반 식사',
    aliases: ['저녁', '일반식', '밥', '식사'],
    resultType: 'DO_NOT_PROVIDE',
    reason: '오전 검사를 위한 병원 준비 안내에 따른 제한입니다.',
    effectiveText: '검사 전날 오후 7시부터',
  },
  {
    id: 'colonoscopy-water',
    phase: 'ABSOLUTE_FASTING',
    category: 'FOOD',
    itemName: '물',
    aliases: ['물', '생수', '음료'],
    resultType: 'DO_NOT_PROVIDE',
    reason: '절대 금식 단계에는 물도 포함됩니다.',
    effectiveText: '자정부터 검사 종료 전까지',
  },
  {
    id: 'colonoscopy-medication',
    phase: 'ABSOLUTE_FASTING',
    category: 'MEDICATION',
    itemName: '약',
    aliases: ['약', '혈압약', '당뇨약', '영양제'],
    resultType: 'CHECK_BEFORE_PROVIDING',
    reason: '복약은 예약 안내와 의료진의 환자별 지시를 확인해야 합니다.',
    effectiveText: '복용 전 의료진 확인까지',
  },
  {
    id: 'colonoscopy-gum',
    phase: 'ABSOLUTE_FASTING',
    category: 'FOOD',
    itemName: '껌·은단',
    aliases: ['껌', '은단', '사탕'],
    resultType: 'DO_NOT_PROVIDE',
    reason: '절대 금식 단계에는 껌과 은단도 포함됩니다.',
    effectiveText: '자정부터 검사 종료 전까지',
  },
  {
    id: 'colonoscopy-smoking',
    phase: 'ABSOLUTE_FASTING',
    category: 'ACTIVITY',
    itemName: '담배',
    aliases: ['담배', '흡연', '전자담배'],
    resultType: 'DO_NOT_PROVIDE',
    reason: '절대 금식 단계에는 흡연도 제한됩니다.',
    effectiveText: '자정부터 검사 종료 전까지',
  },
];

const phaseOrder: RestrictionPhaseCode[] = [
  'THREE_DAYS_BEFORE',
  'DAY_BEFORE',
  'ABSOLUTE_FASTING',
];

function normalizeQuery(query: string) {
  return query.trim().toLocaleLowerCase('ko-KR');
}

@Injectable()
export class RestrictionGuidanceService {
  private phase: RestrictionPhaseCode = 'THREE_DAYS_BEFORE';
  private questions: SavedQuestion[] = [];
  private questionSequence = 0;
  private activeScenarioRevision: number | null = null;

  constructor(
    @Inject(CAREGIVER_JOURNEY_REPOSITORY)
    private readonly journeyRepository: CaregiverJourneyRepository,
  ) {}

  private async ensureContext() {
    const journey = await this.journeyRepository.getDemo();
    if (journey.scenarioId !== 'morning-colonoscopy') {
      throw new BadRequestException(
        '대장내시경 발표 시나리오를 먼저 선택해 주세요.',
      );
    }
    const revision = this.journeyRepository.getDemoScenarioRevision();
    if (this.activeScenarioRevision !== revision) {
      this.activeScenarioRevision = revision;
      this.phase = 'THREE_DAYS_BEFORE';
      this.questions = [];
    }
  }

  async getGuidance(): Promise<RestrictionGuidance> {
    await this.ensureContext();
    const phase = phases[this.phase];
    return {
      scenarioId: 'morning-colonoscopy',
      phase,
      headline: phase.headline,
      items: rules
        .filter((rule) => rule.phase === this.phase)
        .map(({ phase: _phase, aliases: _aliases, ...item }) => item),
      source,
    };
  }

  async search(query: string): Promise<RestrictionSearchResult> {
    await this.ensureContext();
    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) {
      throw new BadRequestException('검색어를 입력해 주세요.');
    }

    const match = rules.find(
      (rule) =>
        rule.phase === this.phase &&
        [rule.itemName, ...rule.aliases]
          .map(normalizeQuery)
          .includes(normalizedQuery),
    );

    if (!match) {
      return {
        query: query.trim(),
        normalizedQuery,
        resultType: 'CHECK_BEFORE_PROVIDING',
        headline: '확인 전에는 제공하지 마세요',
        reason: '현재 병원 승인 안내만으로 확인할 수 없습니다.',
        effectiveText: '의료진 확인 전까지',
        matchedRuleId: null,
        source,
      };
    }

    return {
      query: query.trim(),
      normalizedQuery,
      resultType: match.resultType,
      headline:
        match.resultType === 'DO_NOT_PROVIDE'
          ? '지금은 제공하지 마세요'
          : '확인 전에는 제공하지 마세요',
      reason: match.reason,
      effectiveText: match.effectiveText,
      matchedRuleId: match.id,
      source,
    };
  }

  async advancePhase() {
    await this.ensureContext();
    const index = phaseOrder.indexOf(this.phase);
    this.phase = phaseOrder[index + 1] ?? this.phase;
    return this.getGuidance();
  }

  async listQuestions() {
    await this.ensureContext();
    return structuredClone(this.questions);
  }

  async saveQuestion(query: string) {
    const result = await this.search(query);
    const existing = this.questions.find(
      (question) =>
        question.status === 'OPEN' &&
        normalizeQuery(question.query) === result.normalizedQuery,
    );
    if (existing) {
      return structuredClone(existing);
    }

    const now = new Date().toISOString();
    const question: SavedQuestion = {
      id: `question-${++this.questionSequence}`,
      query: result.query,
      questionText: `${result.query} 제공 여부를 의료진에게 확인해 주세요.`,
      reason: result.reason,
      status: 'OPEN',
      createdAt: now,
      completedAt: null,
    };
    this.questions.push(question);
    return structuredClone(question);
  }

  async completeQuestion(questionId: string) {
    await this.ensureContext();
    const question = this.questions.find(({ id }) => id === questionId);
    if (!question) {
      throw new NotFoundException('저장한 질문을 찾을 수 없습니다.');
    }
    question.status = 'DONE';
    question.completedAt = new Date().toISOString();
    return structuredClone(question);
  }

  async deleteQuestion(questionId: string) {
    await this.ensureContext();
    const index = this.questions.findIndex(({ id }) => id === questionId);
    if (index < 0) {
      throw new NotFoundException('저장한 질문을 찾을 수 없습니다.');
    }
    this.questions.splice(index, 1);
  }
}
