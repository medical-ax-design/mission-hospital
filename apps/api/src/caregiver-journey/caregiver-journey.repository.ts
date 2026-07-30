import type {
  CaregiverJourney,
  DemoScenarioId,
} from '@ready-on/contracts';

export const CAREGIVER_JOURNEY_REPOSITORY = Symbol(
  'CAREGIVER_JOURNEY_REPOSITORY',
);

export interface CaregiverJourneyRepository {
  getDemo(): Promise<CaregiverJourney>;
  saveDemo(journey: CaregiverJourney): Promise<CaregiverJourney>;
  resetDemo(scenarioId: DemoScenarioId): Promise<CaregiverJourney>;
  getDemoScenarioRevision(): number;
}
