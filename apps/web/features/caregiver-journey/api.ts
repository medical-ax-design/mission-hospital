import {
  CaregiverJourneyResponseSchema,
  type CaregiverJourney,
  type DemoScenarioId,
} from '@ready-on/contracts/caregiver-journey';
import {
  RestrictionGuidanceResponseSchema,
  RestrictionSearchResponseSchema,
  SavedQuestionListResponseSchema,
  SavedQuestionResponseSchema,
  type RestrictionGuidance,
  type RestrictionSearchResult,
  type SavedQuestion,
} from '@ready-on/contracts/restriction-guidance';

export interface CaregiverJourneyApi {
  getDemo(): Promise<CaregiverJourney>;
  linkDemo(): Promise<CaregiverJourney>;
  completeTask(taskId: string): Promise<CaregiverJourney>;
  advanceDemo(): Promise<CaregiverJourney>;
  selectScenario(scenarioId: DemoScenarioId): Promise<CaregiverJourney>;
  getRestrictions(): Promise<RestrictionGuidance>;
  searchRestrictions(query: string): Promise<RestrictionSearchResult>;
  advanceRestrictionPhase(): Promise<RestrictionGuidance>;
  getQuestions(): Promise<SavedQuestion[]>;
  saveQuestion(query: string): Promise<SavedQuestion>;
  completeQuestion(questionId: string): Promise<SavedQuestion>;
  deleteQuestion(questionId: string): Promise<void>;
}

export class CaregiverJourneyApiError extends Error {
  constructor(readonly status: number) {
    super(`보호자 여정 요청에 실패했습니다. (${status})`);
    this.name = 'CaregiverJourneyApiError';
  }
}

export function createCaregiverJourneyApi(
  baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ??
    'http://localhost:3001',
): CaregiverJourneyApi {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  async function requestJourney(path: string, init: RequestInit) {
    const response = await fetch(`${normalizedBaseUrl}${path}`, init);

    if (!response.ok) {
      throw new CaregiverJourneyApiError(response.status);
    }

    return CaregiverJourneyResponseSchema.parse(await response.json())
      .journey;
  }

  async function requestJson(path: string, init: RequestInit) {
    const response = await fetch(`${normalizedBaseUrl}${path}`, init);
    if (!response.ok) {
      throw new CaregiverJourneyApiError(response.status);
    }
    return response.json();
  }

  return {
    getDemo() {
      return requestJourney('/caregiver-journeys/demo', {
        method: 'GET',
      });
    },
    linkDemo() {
      return requestJourney('/caregiver-journeys/demo/link', {
        method: 'POST',
      });
    },
    completeTask(taskId: string) {
      return requestJourney(
        `/caregiver-journeys/demo/tasks/${encodeURIComponent(taskId)}/complete`,
        { method: 'POST' },
      );
    },
    advanceDemo() {
      return requestJourney('/caregiver-journeys/demo/advance', {
        method: 'POST',
      });
    },
    selectScenario(scenarioId) {
      return requestJourney(
        `/caregiver-journeys/demo/scenarios/${encodeURIComponent(scenarioId)}/select`,
        { method: 'POST' },
      );
    },
    async getRestrictions() {
      const body = await requestJson(
        '/caregiver-journeys/demo/restrictions',
        { method: 'GET' },
      );
      return RestrictionGuidanceResponseSchema.parse(body).guidance;
    },
    async searchRestrictions(query) {
      const body = await requestJson(
        `/caregiver-journeys/demo/restrictions/search?q=${encodeURIComponent(query)}`,
        { method: 'GET' },
      );
      return RestrictionSearchResponseSchema.parse(body).result;
    },
    async advanceRestrictionPhase() {
      const body = await requestJson(
        '/caregiver-journeys/demo/restrictions/advance',
        { method: 'POST' },
      );
      return RestrictionGuidanceResponseSchema.parse(body).guidance;
    },
    async getQuestions() {
      const body = await requestJson(
        '/caregiver-journeys/demo/questions',
        { method: 'GET' },
      );
      return SavedQuestionListResponseSchema.parse(body).questions;
    },
    async saveQuestion(query) {
      const body = await requestJson(
        '/caregiver-journeys/demo/questions',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        },
      );
      return SavedQuestionResponseSchema.parse(body).question;
    },
    async completeQuestion(questionId) {
      const body = await requestJson(
        `/caregiver-journeys/demo/questions/${encodeURIComponent(questionId)}/complete`,
        { method: 'POST' },
      );
      return SavedQuestionResponseSchema.parse(body).question;
    },
    async deleteQuestion(questionId) {
      await requestJson(
        `/caregiver-journeys/demo/questions/${encodeURIComponent(questionId)}`,
        { method: 'DELETE' },
      );
    },
  };
}
