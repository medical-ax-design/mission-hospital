import { describe, expect, it } from 'vitest';
import {
  getAdjacentTreatmentStage,
  TREATMENT_STAGE_ORDER,
  TREATMENT_STAGE_PRESENTATION,
} from './treatment-stage-presentation';

describe('treatment stage presentation', () => {
  it('defines all five stages in hospital order', () => {
    expect(TREATMENT_STAGE_ORDER).toEqual([
      'PREPARING',
      'IN_OPERATING_ROOM',
      'IN_PROGRESS',
      'RECOVERY',
      'COMPLETED',
    ]);
    for (const stage of TREATMENT_STAGE_ORDER) {
      expect(TREATMENT_STAGE_PRESENTATION[stage]).toMatchObject({
        stage,
        statusLabel: expect.any(String),
        mediaTitle: expect.any(String),
        mediaDescription: expect.any(String),
        posterSrc: expect.stringMatching(/^\/media\/treatment\//),
      });
    }
  });

  it('returns adjacent stages and clamps movement at both boundaries', () => {
    const transitions = [
      ['PREPARING', 'PREPARING', 'IN_OPERATING_ROOM'],
      ['IN_OPERATING_ROOM', 'PREPARING', 'IN_PROGRESS'],
      ['IN_PROGRESS', 'IN_OPERATING_ROOM', 'RECOVERY'],
      ['RECOVERY', 'IN_PROGRESS', 'COMPLETED'],
      ['COMPLETED', 'RECOVERY', 'COMPLETED'],
    ] as const;

    for (const [stage, previousStage, nextStage] of transitions) {
      expect(getAdjacentTreatmentStage(stage, -1)).toBe(previousStage);
      expect(getAdjacentTreatmentStage(stage, 1)).toBe(nextStage);
    }
  });
});
