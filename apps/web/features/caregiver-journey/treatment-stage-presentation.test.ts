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

  it('clamps previous and next movement at the boundaries', () => {
    expect(getAdjacentTreatmentStage('PREPARING', -1)).toBe('PREPARING');
    expect(getAdjacentTreatmentStage('PREPARING', 1)).toBe(
      'IN_OPERATING_ROOM',
    );
    expect(getAdjacentTreatmentStage('COMPLETED', 1)).toBe('COMPLETED');
  });
});
