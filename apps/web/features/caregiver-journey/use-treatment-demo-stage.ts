'use client';

import {
  TreatmentStageSchema,
  type TreatmentStage,
} from '@ready-on/contracts/caregiver-journey';
import { useCallback, useEffect, useState } from 'react';
import {
  getAdjacentTreatmentStage,
  getTreatmentStageIndex,
  TREATMENT_STAGE_ORDER,
} from './treatment-stage-presentation';

const STORAGE_KEY = 'waiton:treatment-demo-stage:v1';
const AUTO_ADVANCE_MS = 8_000;

function reducedMotionRequested() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function useTreatmentDemoStage(
  initialStage: TreatmentStage,
  enabled: boolean,
) {
  const [stage, setStage] = useState(initialStage);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setStage(initialStage);
      setIsAutoPlaying(false);
      return;
    }

    const parsed = TreatmentStageSchema.safeParse(
      sessionStorage.getItem(STORAGE_KEY),
    );
    setStage(parsed.success ? parsed.data : initialStage);
  }, [enabled, initialStage]);

  const updateStage = useCallback(
    (nextStage: TreatmentStage) => {
      setStage(nextStage);
      if (enabled) {
        sessionStorage.setItem(STORAGE_KEY, nextStage);
      }
    },
    [enabled],
  );

  const move = useCallback(
    (offset: -1 | 1) => {
      if (!enabled) {
        return;
      }

      setIsAutoPlaying(false);
      updateStage(getAdjacentTreatmentStage(stage, offset));
    },
    [enabled, stage, updateStage],
  );

  useEffect(() => {
    if (!enabled || !isAutoPlaying) {
      return;
    }
    if (stage === 'COMPLETED') {
      setIsAutoPlaying(false);
      return;
    }

    const timer = window.setTimeout(() => {
      updateStage(getAdjacentTreatmentStage(stage, 1));
    }, AUTO_ADVANCE_MS);

    return () => window.clearTimeout(timer);
  }, [enabled, isAutoPlaying, stage, updateStage]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const stopWhenHidden = () => {
      if (document.hidden) {
        setIsAutoPlaying(false);
      }
    };

    document.addEventListener('visibilitychange', stopWhenHidden);
    return () =>
      document.removeEventListener('visibilitychange', stopWhenHidden);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window.matchMedia !== 'function') {
      return;
    }

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopForReducedMotion = () => {
      if (query.matches) {
        setIsAutoPlaying(false);
      }
    };

    query.addEventListener('change', stopForReducedMotion);
    return () => query.removeEventListener('change', stopForReducedMotion);
  }, [enabled]);

  const stageIndex = getTreatmentStageIndex(
    enabled ? stage : initialStage,
  );

  return {
    stage: enabled ? stage : initialStage,
    stageIndex,
    stageCount: TREATMENT_STAGE_ORDER.length,
    isAutoPlaying,
    goPrevious: () => move(-1),
    goNext: () => move(1),
    toggleAutoPlay: () => {
      if (
        !enabled ||
        stage === 'COMPLETED' ||
        reducedMotionRequested()
      ) {
        return;
      }
      setIsAutoPlaying((value) => !value);
    },
  };
}
