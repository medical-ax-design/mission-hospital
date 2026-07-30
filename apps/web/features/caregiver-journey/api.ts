import {
  CaregiverJourneyResponseSchema,
  type CaregiverJourney,
} from '@ready-on/contracts';

export interface CaregiverJourneyApi {
  getDemo(): Promise<CaregiverJourney>;
  linkDemo(): Promise<CaregiverJourney>;
  completeTask(taskId: string): Promise<CaregiverJourney>;
  advanceDemo(): Promise<CaregiverJourney>;
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
  };
}
