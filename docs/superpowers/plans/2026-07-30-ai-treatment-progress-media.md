# AI Treatment Progress Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 보호자가 병원이 확인한 수술 단계를 비자극적인 AI 재구성 장면으로 이해하고, 발표 모드에서 5단계 변화를 안전하게 시연할 수 있게 한다.

**Architecture:** 병원 치료 상태 계약은 변경하지 않고 프런트엔드에 단계별 표현 콘텐츠 맵을 둔다. 일반 사용자는 API에서 받은 상태만 보며, `?demo=1`의 치료 과정 화면만 `sessionStorage` 기반 발표 상태를 사용한다. AI 포스터 기반 모션을 기본으로 제공하고 선택적인 WebM/MP4 소스를 받을 수 있는 미디어 카드로 감싼다.

**Tech Stack:** Next.js 16, React 19, TypeScript 5.9, Vitest 3, Testing Library, CSS motion, static WebP/PNG assets

## Global Constraints

- AI 카드에 `AI로 재구성한 일반 과정`을 항상 표시한다.
- AI 카드에 `현재 환자의 실시간 영상이 아닙니다`를 항상 표시한다.
- 출혈, 절개, 장기, 수술 부위, 환자 얼굴을 표현하지 않는다.
- 치료 예상 종료 시간이나 결과를 표현하지 않는다.
- 프로덕션 상태의 단일 원본은 병원 API 응답이다.
- 발표용 상태는 `?demo=1`에서만 사용하고 `발표용 병원 상태 시연`으로 표시한다.
- 발표용 상태 변경은 서버 API를 호출하거나 다른 브라우저의 상태를 바꾸지 않는다.
- `prefers-reduced-motion: reduce`에서는 자동 진행과 장면 모션을 중단한다.
- 미디어가 실패해도 병원 확인 상태와 수술 과정 타임라인을 확인할 수 있어야 한다.
- 새 런타임 의존성을 추가하지 않는다.

---

## File Map

### Create

- `apps/web/features/caregiver-journey/treatment-stage-presentation.ts`
  - 5개 치료 단계의 순서, 상태 문구, 설명, 포스터 경로, 모션 변형을 관리한다.
- `apps/web/features/caregiver-journey/treatment-stage-presentation.test.ts`
  - 단계 순서와 표시 콘텐츠의 완전성을 검증한다.
- `apps/web/features/caregiver-journey/components/treatment-stage-media.tsx`
  - AI 표시, 포스터 모션, 재생·정지, 이미지 실패 대체 장면을 렌더링한다.
- `apps/web/features/caregiver-journey/components/treatment-stage-media.test.tsx`
  - AI 고지, 단계 콘텐츠, 재생 상태, 이미지 실패 대체를 검증한다.
- `apps/web/features/caregiver-journey/use-treatment-demo-stage.ts`
  - 브라우저별 데모 단계, 이전·다음, 8초 자동 진행, 세션 저장을 관리한다.
- `apps/web/features/caregiver-journey/use-treatment-demo-stage.test.tsx`
  - 데모 비활성, 세션 복원, 이동 경계, 자동 진행, 탭 비활성화를 검증한다.
- `apps/web/features/caregiver-journey/components/treatment-demo-controls.tsx`
  - 치료 과정 화면 하단의 상시 노출 발표 제어 막대를 렌더링한다.
- `apps/web/public/media/treatment/preparing.png`
- `apps/web/public/media/treatment/operating-room-entry.png`
- `apps/web/public/media/treatment/in-progress.png`
- `apps/web/public/media/treatment/recovery.png`
- `apps/web/public/media/treatment/ward-transfer.png`

### Modify

- `apps/web/features/caregiver-journey/components/treatment-progress-screen.tsx`
  - AI 미디어 카드와 데모 제어 막대를 조합하고 활성 단계를 하나의 값으로 사용한다.
- `apps/web/features/caregiver-journey/components/caregiver-home-screen.tsx`
  - 홈의 서버 상태 전환 버튼과 `onAdvance` 의존성을 제거한다.
- `apps/web/features/caregiver-journey/caregiver-journey-app.tsx`
  - 치료 과정 화면에 `demoMode`를 전달하고 홈의 상태 전환 호출을 제거한다.
- `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`
  - 통합 흐름을 새 발표 제어 방식으로 검증한다.
- `apps/web/app/globals.css`
  - AI 미디어 카드, 장면 모션, 고정 데모 막대, 하단 안전 여백, 동작 줄이기 스타일을 추가한다.
- `docs/PRD.md`
  - AI 재구성 과정 미디어와 발표 모드 범위를 추가한다.
- `docs/UX_SPEC.md`
  - 카드 순서, 상시 AI 고지, 단계 동기화, 데모 제어 동작을 추가한다.
- `docs/SECURITY_PRIVACY.md`
  - 실제 환자 영상 오인 방지와 AI 미디어 안전 경계를 추가한다.

---

### Task 1: 치료 단계 표현 모델

**Files:**
- Create: `apps/web/features/caregiver-journey/treatment-stage-presentation.ts`
- Create: `apps/web/features/caregiver-journey/treatment-stage-presentation.test.ts`

**Interfaces:**
- Consumes: `TreatmentStage` from `@ready-on/contracts/caregiver-journey`
- Produces:
  - `TREATMENT_STAGE_ORDER: readonly TreatmentStage[]`
  - `TREATMENT_STAGE_PRESENTATION: Record<TreatmentStage, TreatmentStagePresentation>`
  - `getTreatmentStageIndex(stage: TreatmentStage): number`
  - `getAdjacentTreatmentStage(stage: TreatmentStage, offset: -1 | 1): TreatmentStage`

- [ ] **Step 1: Write the failing presentation-model tests**

```ts
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
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
npx vitest run --project @ready-on/web apps/web/features/caregiver-journey/treatment-stage-presentation.test.ts
```

Expected: FAIL because `treatment-stage-presentation.ts` does not exist.

- [ ] **Step 3: Implement the stage presentation map**

```ts
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
    mediaDescription: '수술실과 장비를 준비하고 필요한 확인을 진행하는 일반적인 장면입니다.',
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
    mediaDescription: '수술실 외부의 진행 표시와 의료진 협업을 비자극적으로 표현한 장면입니다.',
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

export function getTreatmentStageIndex(stage: TreatmentStage) {
  return TREATMENT_STAGE_ORDER.indexOf(stage);
}

export function getAdjacentTreatmentStage(
  stage: TreatmentStage,
  offset: -1 | 1,
) {
  const index = getTreatmentStageIndex(stage);
  const nextIndex = Math.min(
    TREATMENT_STAGE_ORDER.length - 1,
    Math.max(0, index + offset),
  );
  return TREATMENT_STAGE_ORDER[nextIndex];
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
npx vitest run --project @ready-on/web apps/web/features/caregiver-journey/treatment-stage-presentation.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit the presentation model**

```bash
git add apps/web/features/caregiver-journey/treatment-stage-presentation.ts apps/web/features/caregiver-journey/treatment-stage-presentation.test.ts
git commit -m "feat: define treatment stage presentation"
```

---

### Task 2: 비자극적 AI 포스터와 미디어 카드

**Files:**
- Create: `apps/web/public/media/treatment/preparing.png`
- Create: `apps/web/public/media/treatment/operating-room-entry.png`
- Create: `apps/web/public/media/treatment/in-progress.png`
- Create: `apps/web/public/media/treatment/recovery.png`
- Create: `apps/web/public/media/treatment/ward-transfer.png`
- Create: `apps/web/features/caregiver-journey/components/treatment-stage-media.tsx`
- Create: `apps/web/features/caregiver-journey/components/treatment-stage-media.test.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes:
  - `TreatmentStagePresentation`
  - `motionEnabled?: boolean`
- Produces:
  - `TreatmentStageMedia({ content }: { content: TreatmentStagePresentation }): JSX.Element`

- [ ] **Step 1: Read the image generation skill before creating visual assets**

Run:

```bash
sed -n '1,260p' /Users/hanjeonghyun/.codex/skills/.system/imagegen/SKILL.md
```

Expected: the complete image generation workflow and verification requirements are visible.

- [ ] **Step 2: Generate five consistent non-graphic AI poster assets**

Use the image generation tool once per stage with this shared style:

```text
Create a calm, non-graphic hospital process illustration for a Korean caregiver mobile app.
Wide 16:9 composition, clean modern hospital interior, soft sage green and warm white palette,
subtle cinematic depth, trustworthy and reassuring, no readable text, no logo, no patient face,
no blood, no incision, no exposed body, no surgery close-up, no identifiable real hospital.
Keep the center and lower-left areas visually quiet for UI overlays.
Stage-specific scene: [insert one scene below].
```

Stage-specific scenes:

1. `preparing.png`: orderly operating-suite preparation area, covered equipment and a checklist tablet, staff seen only from behind.
2. `operating-room-entry.png`: quiet operating-room corridor with a closed door and a gentle entry indicator, no patient visible.
3. `in-progress.png`: operating-room exterior status light and indistinct staff silhouettes behind privacy glass, no procedure visible.
4. `recovery.png`: calm recovery area with made beds and abstract observation equipment, no numbers or clinical readings.
5. `ward-transfer.png`: bright quiet corridor leading toward a prepared patient room, empty transport chair at a distance.

Save the final files at the exact paths listed above. Verify each generated image visually before continuing.

- [ ] **Step 3: Write the failing media-card tests**

```tsx
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TREATMENT_STAGE_PRESENTATION } from '../treatment-stage-presentation';
import { TreatmentStageMedia } from './treatment-stage-media';

describe('TreatmentStageMedia', () => {
  it('always identifies AI reconstruction and non-live footage', () => {
    render(
      <TreatmentStageMedia
        content={TREATMENT_STAGE_PRESENTATION.IN_PROGRESS}
      />,
    );

    expect(screen.getByText('AI로 재구성한 일반 과정')).toBeInTheDocument();
    expect(
      screen.getByText('현재 환자의 실시간 영상이 아닙니다'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: '의료진이 수술을 진행하고 있어요',
      }),
    ).toBeInTheDocument();
  });

  it('pauses and resumes the scene motion', () => {
    render(
      <TreatmentStageMedia
        content={TREATMENT_STAGE_PRESENTATION.PREPARING}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '장면 일시정지' }));
    expect(
      screen.getByRole('button', { name: '장면 재생' }),
    ).toBeInTheDocument();
  });

  it('keeps a labelled fallback when the poster fails', () => {
    render(
      <TreatmentStageMedia
        content={TREATMENT_STAGE_PRESENTATION.RECOVERY}
      />,
    );

    fireEvent.error(screen.getByRole('img'));
    expect(
      screen.getByLabelText('회복실 단계 기본 안내 장면'),
    ).toBeInTheDocument();
  });

  it('accepts future generated video sources without changing the card API', () => {
    const content = {
      ...TREATMENT_STAGE_PRESENTATION.IN_PROGRESS,
      videoSources: [
        {
          src: '/media/treatment/in-progress.webm',
          type: 'video/webm' as const,
        },
      ],
    };
    const { container } = render(<TreatmentStageMedia content={content} />);
    expect(container.querySelector('video')).toHaveAttribute(
      'poster',
      content.posterSrc,
    );
    expect(container.querySelector('source')).toHaveAttribute(
      'type',
      'video/webm',
    );
  });
});
```

- [ ] **Step 4: Run the media-card test and verify it fails**

Run:

```bash
npx vitest run --project @ready-on/web apps/web/features/caregiver-journey/components/treatment-stage-media.test.tsx
```

Expected: FAIL because `TreatmentStageMedia` does not exist.

- [ ] **Step 5: Implement the media card**

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import type { TreatmentStagePresentation } from '../treatment-stage-presentation';

function getReducedMotionPreference() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function TreatmentStageMedia({
  content,
}: {
  content: TreatmentStagePresentation;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(
    getReducedMotionPreference,
  );
  const [playing, setPlaying] = useState(() => !reducedMotion);
  const [posterFailed, setPosterFailed] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const hasVideo = Boolean(content.videoSources?.length) && !videoFailed;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => {
      setReducedMotion(query.matches);
      if (query.matches) {
        videoRef.current?.pause();
        setPlaying(false);
      }
    };
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const togglePlayback = () => {
    if (!hasVideo || !videoRef.current) {
      setPlaying((value) => !value);
      return;
    }
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
      return;
    }
    void videoRef.current
      .play()
      .then(() => setPlaying(true))
      .catch(() => setVideoFailed(true));
  };

  return (
    <section className="treatment-media" aria-labelledby="treatment-media-title">
      <div
        className={`treatment-media__scene treatment-media__scene--${content.motionVariant}`}
        data-playing={playing}
      >
        <span className="treatment-media__ai-badge">
          AI로 재구성한 일반 과정
        </span>
        {hasVideo ? (
          <video
            ref={videoRef}
            autoPlay={!reducedMotion}
            loop
            muted
            playsInline
            poster={content.posterSrc}
            onError={() => setVideoFailed(true)}
          >
            {content.videoSources?.map((source) => (
              <source key={source.src} src={source.src} type={source.type} />
            ))}
          </video>
        ) : posterFailed ? (
          <div
            className="treatment-media__fallback"
            aria-label={`${content.timelineLabel} 단계 기본 안내 장면`}
          />
        ) : (
          <img
            alt={`${content.timelineLabel} 일반 과정 AI 재구성 장면`}
            src={content.posterSrc}
            onError={() => setPosterFailed(true)}
          />
        )}
        <button
          className="treatment-media__toggle"
          type="button"
          aria-label={
            reducedMotion
              ? '동작 줄이기 설정으로 장면 정지'
              : playing
                ? '장면 일시정지'
                : '장면 재생'
          }
          disabled={reducedMotion}
          onClick={togglePlayback}
        >
          <span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span>
        </button>
      </div>
      <div className="treatment-media__copy">
        <h2 id="treatment-media-title">{content.mediaTitle}</h2>
        <p>{content.mediaDescription}</p>
        <strong>현재 환자의 실시간 영상이 아닙니다</strong>
      </div>
    </section>
  );
}
```

Implement CSS with these exact behavior rules:

```css
.treatment-media {
  margin-top: 20px;
  overflow: hidden;
  border: 1px solid #c8ddd2;
  border-radius: 22px;
  background: #f4faf6;
}

.treatment-media__scene {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  background: linear-gradient(145deg, #dbece3, #edf4f0);
}

.treatment-media__scene img,
.treatment-media__scene video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.treatment-media__ai-badge,
.treatment-media__toggle {
  position: absolute;
  z-index: 2;
}

.treatment-media__ai-badge {
  top: 12px;
  left: 12px;
  padding: 6px 9px;
  border-radius: 999px;
  color: #fff;
  background: rgb(8 76 56 / 88%);
  font-size: 10px;
  font-weight: 800;
}

.treatment-media__toggle {
  right: 12px;
  bottom: 12px;
  width: 44px;
  border: 0;
  border-radius: 50%;
  color: #fff;
  background: rgb(23 36 31 / 76%);
}

.treatment-media__copy {
  padding: 17px 18px 19px;
}

.treatment-media__copy h2 {
  margin: 0;
  font-size: 17px;
}

.treatment-media__copy p {
  margin: 7px 0 12px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.55;
}

.treatment-media__copy strong {
  color: var(--green-dark);
  font-size: 11px;
}

.treatment-media__fallback {
  width: 100%;
  height: 100%;
  background:
    radial-gradient(circle at 72% 38%, rgb(10 104 74 / 24%) 0 8%, transparent 9%),
    linear-gradient(145deg, #d9ebe2, #f3f8f5);
}

.treatment-media__scene img {
  animation: treatment-scene-breathe 8s ease-in-out infinite alternate;
}

.treatment-media__scene[data-playing="false"] img,
.treatment-media__scene[data-playing="false"]::after {
  animation-play-state: paused;
}

@keyframes treatment-scene-breathe {
  from { transform: scale(1); }
  to { transform: scale(1.035); }
}

@keyframes treatment-scene-light {
  0%, 100% { opacity: 0.08; transform: translateX(-12%); }
  50% { opacity: 0.22; transform: translateX(12%); }
}

.treatment-media__scene::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 25%, #d8f3e6 50%, transparent 75%);
  content: "";
  pointer-events: none;
  animation: treatment-scene-light 6s ease-in-out infinite;
}

.treatment-media__scene--operation::after {
  background: radial-gradient(circle at 82% 18%, rgb(102 211 162 / 22%), transparent 28%);
  animation-duration: 4.8s;
}

.treatment-media__scene--recovery::after,
.treatment-media__scene--transfer::after {
  animation-duration: 7s;
}

@media (prefers-reduced-motion: reduce) {
  .treatment-media__scene img,
  .treatment-media__scene::after {
    animation: none;
  }
}
```

Use the shared overlay for `prepare` and `entry`; use the exact slower overrides
above for `operation`, `recovery`, and `transfer`. All overlays remain at or
below `0.22` opacity and all durations remain at or above `4s`.

- [ ] **Step 6: Run the test and verify it passes**

Run:

```bash
npx vitest run --project @ready-on/web apps/web/features/caregiver-journey/components/treatment-stage-media.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 7: Commit the AI media card and assets**

```bash
git add apps/web/public/media/treatment apps/web/features/caregiver-journey/components/treatment-stage-media.tsx apps/web/features/caregiver-journey/components/treatment-stage-media.test.tsx apps/web/app/globals.css
git commit -m "feat: add AI treatment stage media"
```

---

### Task 3: 브라우저별 데모 단계 제어

**Files:**
- Create: `apps/web/features/caregiver-journey/use-treatment-demo-stage.ts`
- Create: `apps/web/features/caregiver-journey/use-treatment-demo-stage.test.tsx`
- Create: `apps/web/features/caregiver-journey/components/treatment-demo-controls.tsx`

**Interfaces:**
- Consumes:
  - `initialStage: TreatmentStage`
  - `enabled: boolean`
- Produces:
  - `stage: TreatmentStage`
  - `stageIndex: number`
  - `stageCount: number`
  - `isAutoPlaying: boolean`
  - `goPrevious(): void`
  - `goNext(): void`
  - `toggleAutoPlay(): void`

- [ ] **Step 1: Write the failing demo-stage hook tests**

```tsx
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTreatmentDemoStage } from './use-treatment-demo-stage';

const originalMatchMedia = window.matchMedia;
const originalDocumentHidden = document.hidden;

describe('useTreatmentDemoStage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: originalDocumentHidden,
    });
  });

  it('does not override the server stage when demo is disabled', () => {
    sessionStorage.setItem(
      'waiton:treatment-demo-stage:v1',
      'IN_PROGRESS',
    );
    const { result } = renderHook(() =>
      useTreatmentDemoStage('PREPARING', false),
    );
    expect(result.current.stage).toBe('PREPARING');
  });

  it('moves within five stages and persists the demo stage', () => {
    const { result } = renderHook(() =>
      useTreatmentDemoStage('PREPARING', true),
    );
    act(() => result.current.goNext());
    expect(result.current.stage).toBe('IN_OPERATING_ROOM');
    expect(sessionStorage.getItem('waiton:treatment-demo-stage:v1')).toBe(
      'IN_OPERATING_ROOM',
    );
    act(() => result.current.goPrevious());
    expect(result.current.stage).toBe('PREPARING');
  });

  it('restores a valid stored stage and rejects an invalid one', () => {
    sessionStorage.setItem(
      'waiton:treatment-demo-stage:v1',
      'RECOVERY',
    );
    const valid = renderHook(() =>
      useTreatmentDemoStage('PREPARING', true),
    );
    expect(valid.result.current.stage).toBe('RECOVERY');
    valid.unmount();

    sessionStorage.setItem(
      'waiton:treatment-demo-stage:v1',
      'UNKNOWN_STAGE',
    );
    const invalid = renderHook(() =>
      useTreatmentDemoStage('PREPARING', true),
    );
    expect(invalid.result.current.stage).toBe('PREPARING');
  });

  it('advances every eight seconds and stops at the final stage', () => {
    const { result } = renderHook(() =>
      useTreatmentDemoStage('RECOVERY', true),
    );
    act(() => result.current.toggleAutoPlay());
    act(() => vi.advanceTimersByTime(8_000));
    expect(result.current.stage).toBe('COMPLETED');
    expect(result.current.isAutoPlaying).toBe(false);
  });

  it('does not start automatic progress when reduced motion is requested', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    });
    const { result } = renderHook(() =>
      useTreatmentDemoStage('PREPARING', true),
    );
    act(() => result.current.toggleAutoPlay());
    expect(result.current.isAutoPlaying).toBe(false);
  });

  it('stops automatic progress when the browser tab becomes hidden', () => {
    const { result } = renderHook(() =>
      useTreatmentDemoStage('PREPARING', true),
    );
    act(() => result.current.toggleAutoPlay());
    expect(result.current.isAutoPlaying).toBe(true);

    Object.defineProperty(document, 'hidden', {
      configurable: true,
      value: true,
    });
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current.isAutoPlaying).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused hook test and verify it fails**

Run:

```bash
npx vitest run --project @ready-on/web apps/web/features/caregiver-journey/use-treatment-demo-stage.test.tsx
```

Expected: FAIL because `useTreatmentDemoStage` does not exist.

- [ ] **Step 3: Implement the demo-stage hook**

```ts
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
      if (enabled) sessionStorage.setItem(STORAGE_KEY, nextStage);
    },
    [enabled],
  );

  const move = useCallback(
    (offset: -1 | 1) => {
      if (!enabled) return;
      setIsAutoPlaying(false);
      updateStage(getAdjacentTreatmentStage(stage, offset));
    },
    [enabled, stage, updateStage],
  );

  useEffect(() => {
    if (!enabled || !isAutoPlaying) return;
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
    if (!enabled) return;
    const stopWhenHidden = () => {
      if (document.hidden) setIsAutoPlaying(false);
    };
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () =>
      document.removeEventListener('visibilitychange', stopWhenHidden);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const stopForReducedMotion = () => {
      if (query.matches) setIsAutoPlaying(false);
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
```

- [ ] **Step 4: Run the hook tests and verify they pass**

Run:

```bash
npx vitest run --project @ready-on/web apps/web/features/caregiver-journey/use-treatment-demo-stage.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 5: Write the demo controls component**

```tsx
interface TreatmentDemoControlsProps {
  stageIndex: number;
  stageCount: number;
  isAutoPlaying: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleAutoPlay: () => void;
}

export function TreatmentDemoControls(props: TreatmentDemoControlsProps) {
  return (
    <aside className="treatment-demo-controls" aria-label="발표용 데모 제어">
      <div>
        <strong>발표용 데모</strong>
        <span aria-live="polite">
          {props.stageIndex + 1} / {props.stageCount}
        </span>
      </div>
      <div className="treatment-demo-controls__actions">
        <button
          type="button"
          disabled={!props.canGoPrevious}
          onClick={props.onPrevious}
        >
          이전
        </button>
        <button type="button" onClick={props.onToggleAutoPlay}>
          {props.isAutoPlaying ? '자동 진행 정지' : '자동 진행'}
        </button>
        <button
          type="button"
          disabled={!props.canGoNext}
          onClick={props.onNext}
        >
          다음
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 6: Commit the demo-stage control**

```bash
git add apps/web/features/caregiver-journey/use-treatment-demo-stage.ts apps/web/features/caregiver-journey/use-treatment-demo-stage.test.tsx apps/web/features/caregiver-journey/components/treatment-demo-controls.tsx
git commit -m "feat: add local treatment demo controls"
```

---

### Task 4: 치료 진행 화면 통합

**Files:**
- Modify: `apps/web/features/caregiver-journey/components/treatment-progress-screen.tsx`
- Modify: `apps/web/features/caregiver-journey/components/caregiver-home-screen.tsx`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.tsx`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes:
  - `TreatmentStageMedia`
  - `TreatmentDemoControls`
  - `useTreatmentDemoStage(initialStage, demoMode)`
  - `TREATMENT_STAGE_PRESENTATION`
- Produces:
  - `TreatmentProgressScreen` with new `demoMode: boolean` prop

- [ ] **Step 1: Replace the old presentation-mode integration test**

Remove the test that clicks the home button named `다음 단계로 전환` and add:

```tsx
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

  expect(
    screen.getByRole('complementary', {
      name: '발표용 데모 제어',
    }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '다음' }));
  expect(
    screen.getByRole('heading', {
      name: '발표용 병원 상태 시연',
    }),
  ).toBeInTheDocument();
  expect(screen.getAllByText('수술실 입실').length).toBeGreaterThan(0);
  expect(api.advanceDemo).not.toHaveBeenCalled();
});
```

Add a second integration assertion that `AI로 재구성한 일반 과정` and
`현재 환자의 실시간 영상이 아닙니다` remain visible after the stage change.

- [ ] **Step 2: Run the integration test and verify it fails**

Run:

```bash
npx vitest run --project @ready-on/web apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx -t "발표 모드 치료 화면"
```

Expected: FAIL because the progress screen has no demo controls or AI media.

- [ ] **Step 3: Integrate the active stage into the progress screen**

Change the props to:

```ts
interface TreatmentProgressScreenProps {
  journey: CaregiverJourney;
  demoMode: boolean;
  onHome: () => void;
}
```

Inside the component:

```ts
const demo = useTreatmentDemoStage(
  journey.treatment.stage,
  demoMode,
);
const activeStage = demo.stage;
const activeContent = TREATMENT_STAGE_PRESENTATION[activeStage];
const currentIndex = getTreatmentStageIndex(activeStage);
```

Use `activeContent.statusLabel` for the status value. Use
`발표용 병원 상태 시연` as the status-card heading when `demoMode` is true and
`병원 확인 상태` otherwise. Render `TreatmentStageMedia` immediately after the
status card. Build the timeline from `TREATMENT_STAGE_ORDER` and its presentation
map rather than the old local `stages` array.

Render `TreatmentStageMedia` with `key={activeStage}` so a changed stage resets
failed-media and playback state. Render `TreatmentDemoControls` after the main
content only when `demoMode` is true. Derive `canGoPrevious` and `canGoNext`
from `demo.stageIndex`.

- [ ] **Step 4: Remove the old server-changing control from the home**

Remove `onAdvance` from `CaregiverHomeScreenProps`, component destructuring, and
the `다음 단계로 전환` button. Keep the two scenario selection buttons in the
existing 발표자 도구 because they select which complete journey to present.

Pass `demoMode={demoMode}` to `TreatmentProgressScreen` in
`caregiver-journey-app.tsx` and remove the `onAdvance` callback passed to
`CaregiverHomeScreen`. Do not remove `advanceDemo()` from the API interface or
backend in this feature.

- [ ] **Step 5: Add fixed-control layout and safe bottom spacing**

Add `screen--with-treatment-demo` when `demoMode` is true. Its bottom padding
must be at least `152px`. Use the following fixed mobile-shell-aligned styles:

```css
.screen--with-treatment-demo {
  padding-bottom: 152px;
}

.treatment-demo-controls {
  position: fixed;
  bottom: 0;
  left: 50%;
  z-index: 10;
  width: min(100%, 430px);
  padding: 10px 18px calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid #cbbbe4;
  background: rgb(249 246 255 / 97%);
  box-shadow: 0 -12px 30px rgb(40 28 63 / 12%);
  transform: translateX(-50%);
  backdrop-filter: blur(14px);
}

.treatment-demo-controls > div:first-child,
.treatment-demo-controls__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.treatment-demo-controls > div:first-child {
  margin-bottom: 7px;
  color: #574276;
  font-size: 11px;
}

.treatment-demo-controls__actions button {
  min-height: 44px;
  flex: 1;
  border: 0;
  border-radius: 11px;
  color: #fff;
  background: #6a4a98;
  font-size: 11px;
  font-weight: 800;
}

.treatment-demo-controls__actions button:disabled {
  color: #91889e;
  background: #e7e2ed;
}
```

- [ ] **Step 6: Run the web integration tests**

Run:

```bash
npx vitest run --project @ready-on/web apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx
```

Expected: all caregiver journey tests PASS.

- [ ] **Step 7: Commit the integrated treatment progress experience**

```bash
git add apps/web/features/caregiver-journey/components/treatment-progress-screen.tsx apps/web/features/caregiver-journey/components/caregiver-home-screen.tsx apps/web/features/caregiver-journey/caregiver-journey-app.tsx apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx apps/web/app/globals.css
git commit -m "feat: integrate AI treatment progress demo"
```

---

### Task 5: 제품 문서와 전체 검증

**Files:**
- Modify: `docs/PRD.md`
- Modify: `docs/UX_SPEC.md`
- Modify: `docs/SECURITY_PRIVACY.md`

**Interfaces:**
- Consumes: approved design at `docs/superpowers/specs/2026-07-30-ai-treatment-progress-media-design.md`
- Produces: product, UX, and safety documentation aligned with the implementation

- [ ] **Step 1: Update the product documents with exact boundaries**

Add the following facts without changing existing hospital-guide policies:

- PRD: treatment progress includes optional AI reconstructed educational media.
- PRD: media never changes, predicts, or verifies the hospital treatment state.
- UX: AI card sits between hospital status and the general timeline.
- UX: demo controls appear only for `?demo=1` on the treatment progress screen.
- Safety: AI disclosure and non-live disclosure are persistent.
- Safety: no patient identity, graphic procedure, expected duration, or result inference.
- Safety: poster/basic-scene fallback is mandatory.

- [ ] **Step 2: Run formatting and test verification**

Run:

```bash
git diff --check
npm test
npm run typecheck
npm run build
```

Expected:

- `git diff --check`: no output and exit 0
- `npm test`: all projects PASS
- `npm run typecheck`: all workspaces exit 0
- `npm run build`: web and API builds exit 0

- [ ] **Step 3: Run local visual QA**

Start the API and web app using the repository development commands. Open
`http://localhost:3000/?demo=1`, select the 위암 수술 여정, enter `과정
알아보기`, and verify:

1. AI badge and non-live disclosure are visible without interaction.
2. all five stages change the status, image, description, and timeline together.
3. the bottom control never covers the last notice.
4. the final stage disables `다음` and stops automatic progress.
5. at a 320px viewport no horizontal scrolling occurs.
6. with reduced motion enabled the poster remains still.
7. at least one image failure shows the labelled fallback instead of a broken image.

- [ ] **Step 4: Commit the aligned documentation**

```bash
git add docs/PRD.md docs/UX_SPEC.md docs/SECURITY_PRIVACY.md
git commit -m "docs: document AI treatment progress safety"
```

- [ ] **Step 5: Review the final branch diff before handoff**

Run:

```bash
git status --short
git diff --stat HEAD~5..HEAD
git log -5 --oneline
```

Expected: clean worktree, five focused implementation commits, and only the
planned treatment-media, test, style, asset, and documentation files changed.
