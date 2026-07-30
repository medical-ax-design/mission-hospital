import type { TreatmentStage } from '@ready-on/contracts/caregiver-journey';

export type TreatmentMotionVariant =
  | 'prepare'
  | 'entry'
  | 'operation'
  | 'recovery'
  | 'transfer';

export interface TreatmentStagePresentation {
  stage: TreatmentStage;
  statusLabel: string;
  timelineLabel: string;
  timelineDescription: string;
  mediaTitle: string;
  mediaDescription: string;
  posterSrc: string;
  videoSources?: readonly {
    src: string;
    type: 'video/webm' | 'video/mp4';
  }[];
  motionVariant: TreatmentMotionVariant;
}

export const TREATMENT_STAGE_ORDER = [
  'PREPARING',
  'IN_OPERATING_ROOM',
  'IN_PROGRESS',
  'RECOVERY',
  'COMPLETED',
] as const satisfies readonly TreatmentStage[];

export const TREATMENT_STAGE_PRESENTATION: Record<
  TreatmentStage,
  TreatmentStagePresentation
> = {
  PREPARING: {
    stage: 'PREPARING',
    statusLabel: '수술 준비 중',
    timelineLabel: '수술 준비',
    timelineDescription: '수술 전 준비와 확인을 진행합니다.',
    mediaTitle: '수술 전 확인을 준비하고 있어요',
    mediaDescription:
      '수술실과 장비를 준비하고 필요한 확인을 진행하는 일반적인 장면입니다.',
    posterSrc: '/media/treatment/preparing.png',
    motionVariant: 'prepare',
  },
  IN_OPERATING_ROOM: {
    stage: 'IN_OPERATING_ROOM',
    statusLabel: '수술실 입실',
    timelineLabel: '수술실 입실',
    timelineDescription: '환자가 수술실에 입실한 상태입니다.',
    mediaTitle: '수술실 입실이 확인됐어요',
    mediaDescription: '수술실 입구와 준비된 복도를 표현한 일반적인 장면입니다.',
    posterSrc: '/media/treatment/operating-room-entry.png',
    motionVariant: 'entry',
  },
  IN_PROGRESS: {
    stage: 'IN_PROGRESS',
    statusLabel: '수술 진행 중',
    timelineLabel: '수술 진행',
    timelineDescription: '수술이 시작된 상태입니다.',
    mediaTitle: '의료진이 수술을 진행하고 있어요',
    mediaDescription:
      '수술실 외부의 진행 표시와 의료진 협업을 비자극적으로 표현한 장면입니다.',
    posterSrc: '/media/treatment/in-progress.png',
    motionVariant: 'operation',
  },
  RECOVERY: {
    stage: 'RECOVERY',
    statusLabel: '회복실 이동',
    timelineLabel: '회복실',
    timelineDescription: '회복실에서 상태를 확인합니다.',
    mediaTitle: '회복실에서 상태를 확인하고 있어요',
    mediaDescription: '차분한 회복 공간에서 일반적인 관찰과 확인을 표현한 장면입니다.',
    posterSrc: '/media/treatment/recovery.png',
    motionVariant: 'recovery',
  },
  COMPLETED: {
    stage: 'COMPLETED',
    statusLabel: '수술 일정 종료',
    timelineLabel: '병실 이동',
    timelineDescription: '의료진 확인 후 병실로 이동합니다.',
    mediaTitle: '다음 안내에 따라 병실로 이동해요',
    mediaDescription: '병실 이동을 준비하는 조용한 복도를 표현한 일반적인 장면입니다.',
    posterSrc: '/media/treatment/ward-transfer.png',
    motionVariant: 'transfer',
  },
};

export function getTreatmentStageIndex(stage: TreatmentStage): number {
  return TREATMENT_STAGE_ORDER.indexOf(stage);
}

export function getAdjacentTreatmentStage(
  stage: TreatmentStage,
  offset: -1 | 1,
): TreatmentStage {
  const index = getTreatmentStageIndex(stage);
  const nextIndex = Math.min(
    TREATMENT_STAGE_ORDER.length - 1,
    Math.max(0, index + offset),
  );
  return TREATMENT_STAGE_ORDER[nextIndex];
}
