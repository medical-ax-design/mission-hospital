# Wait:ON Phaser Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 외래–검사실 운영 선택을 병원 단면의 캐릭터 움직임과 사운드로 체험하고, 모바일 브라우저에서 저장·이어하기까지 가능한 4일 발표용 프로토타입을 만든다.

**Architecture:** 순수 TypeScript 엔진이 유일한 게임 규칙 소유자이고 `GameSessionController`가 현재 상태와 시계를 소유한다. React는 접근 가능한 HUD와 선택 UI를, Phaser는 병원 단면·캐릭터·트윈·사운드를 담당하며 typed bridge의 `SceneIntent`와 view model로만 통신한다.

**Tech Stack:** React, Phaser, TypeScript, Vite, CSS, Vitest, React Testing Library, Local Storage, Phaser Sound Manager

## Global Constraints

- 모바일 기준 화면은 390×844 CSS 픽셀이고 앱 최대 폭은 480px이다.
- 프로토타입 브라우저 범위는 iOS Safari 16.4 이상과 Android Chrome 111 이상이다.
- `src/game/**`는 React, Phaser, DOM, Web Storage와 현실 시각을 import하지 않는다.
- `GameSessionController`만 현재 `GameState`를 소유한다.
- React만 확인된 `GameCommand`를 controller에 전달한다.
- Phaser는 `SceneIntent`를 React에 전달하고 `HospitalSceneViewModel`만 입력받는다.
- 렌더링 프레임은 게임 시간을 진행하지 않는다.
- 같은 초기 상태와 명령은 같은 결과를 만든다.
- 게임 결정에는 항상 HTML button 대안이 있어야 한다.
- 첫 사용자 입력 전에는 사운드 재생 성공을 요구하지 않는다.
- 사운드 실패와 저장 실패는 플레이를 중단시키지 않는다.
- 브라우저가 숨겨지면 게임 시간과 반복음을 정지한다.
- 실제 환자정보, 실제 진료 판단, 실제 병원 호출음과 응급 경보음을 사용하지 않는다.
- 응급실, 수술실과 병상은 `프로토타입 준비 중` 랜드마크만 표시한다.
- 테스트는 실패 확인 → 최소 구현 → 통과 확인 순서로 작성한다.

---

## File Structure

```text
mission-hospital/
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
├── eslint.config.js
├── scripts/
│   └── generate-audio.mjs
├── public/
│   └── audio/
│       ├── confirm.wav
│       ├── complete.wav
│       ├── move.wav
│       ├── notice.wav
│       └── ambience.wav
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── App.test.tsx
│   │   ├── createAppController.ts
│   │   └── useGameSession.ts
│   ├── game/
│   │   ├── model/
│   │   │   └── types.ts
│   │   ├── scenario/
│   │   │   ├── createPrototypeScenario.ts
│   │   │   └── createPrototypeScenario.test.ts
│   │   ├── scheduler/
│   │   │   ├── reserveTask.ts
│   │   │   └── reserveTask.test.ts
│   │   ├── engine/
│   │   │   ├── applyCommand.ts
│   │   │   ├── applyCommand.test.ts
│   │   │   ├── advanceOneMinute.ts
│   │   │   └── advanceOneMinute.test.ts
│   │   └── selectors/
│   │       ├── hospitalSelectors.ts
│   │       └── hospitalSelectors.test.ts
│   ├── session/
│   │   ├── GameSessionController.ts
│   │   ├── GameSessionController.test.ts
│   │   └── types.ts
│   ├── persistence/
│   │   ├── SaveAdapter.ts
│   │   ├── LocalStorageSaveAdapter.ts
│   │   └── LocalStorageSaveAdapter.test.ts
│   ├── rendering/
│   │   ├── GameBridge.ts
│   │   ├── sceneViewModel.ts
│   │   └── phaser/
│   │       ├── PhaserGameBridge.ts
│   │       ├── BootScene.ts
│   │       ├── HospitalScene.ts
│   │       ├── audioCues.ts
│   │       └── audioCues.test.ts
│   ├── features/
│   │   ├── hospital/HospitalHud.tsx
│   │   ├── hospital/HospitalHud.test.tsx
│   │   ├── assignment/AssignmentPanel.tsx
│   │   ├── assignment/AssignmentPanel.test.tsx
│   │   ├── pause/PauseOverlay.tsx
│   │   └── settings/AudioSettings.tsx
│   ├── test/setup.ts
│   ├── styles/reset.css
│   ├── styles/theme.css
│   └── main.tsx
└── docs/
```

### Boundary Contracts

```ts
type GameCommand =
  | {
      type: "assign-staff"
      commandId: string
      staffId: string
      departmentId: DepartmentId
    }
  | { type: "set-speed"; commandId: string; speed: 0 | 1 | 2 }
  | { type: "pause"; commandId: string }
  | { type: "resume"; commandId: string }

type SceneIntent =
  | { type: "focus-department"; departmentId: DepartmentId }
  | {
      type: "request-staff-assignment"
      staffId: string
      departmentId: DepartmentId
    }
  | { type: "resume-audio" }

interface GameBridge {
  mount(container: HTMLElement): void
  render(viewModel: HospitalSceneViewModel): void
  setAudioSettings(settings: AudioSettings): void
  destroy(): void
}
```

---

### Task 1: 문서 동기화와 React–Phaser 테스트 환경

**Files:**
- Modify: `docs/TECHNICAL_DESIGN.md`
- Modify: `docs/PRODUCTION_PLAN.md`
- Modify: `docs/superpowers/plans/2026-07-28-waiton-prototype-foundation.md`
- Modify: `docs/superpowers/plans/2026-07-28-waiton-prototype-foundation-ko.md`
- Create: `package.json`
- Create: `package-lock.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `eslint.config.js`
- Create: `src/test/setup.ts`
- Create: `src/app/App.test.tsx`
- Create: `src/app/App.tsx`
- Create: `src/main.tsx`
- Create: `src/styles/reset.css`
- Create: `src/styles/theme.css`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `lint`, `test`, `test:run`, `audio:generate`
- Produces: `App(): JSX.Element`

- [ ] **Step 1: 승인 설계를 기존 문서에 반영**

`TECHNICAL_DESIGN.md`의 기술 구성을 React + Phaser로 바꾸고 rendering/bridge/session 경계를 추가한다. `PRODUCTION_PLAN.md`의 5일 일정을 승인된 4일 일정으로 교체한다. 기존 React 단독 계획 두 파일의 제목 아래에 다음 문구를 추가한다.

```markdown
> **상태: 대체됨.** 이 계획은 `2026-07-28-waiton-phaser-prototype.md`로 대체되었으며 구현에 사용하지 않는다.
```

- [ ] **Step 2: 패키지와 도구 설치**

```bash
npm init -y
npm install react react-dom phaser
npm install -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh @types/react @types/react-dom
npm pkg set type="module"
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="tsc -b && vite build"
npm pkg set scripts.lint="eslint ."
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:run="vitest run"
npm pkg set scripts.audio:generate="node scripts/generate-audio.mjs"
```

- [ ] **Step 3: 테스트 설정과 실패 테스트 작성**

```tsx
import { render, screen } from "@testing-library/react"
import { App } from "./App"

describe("App", () => {
  it("renders the fictional simulation safety notice", () => {
    render(<App />)
    expect(screen.getByRole("heading", { name: "Wait:ON" })).toBeInTheDocument()
    expect(screen.getByText(/가상의 병원 운영 시뮬레이션/)).toBeInTheDocument()
    expect(screen.getByText(/실제 진료 순서나 의료 판단/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: 실패 확인**

```bash
npm run test:run -- src/app/App.test.tsx
```

Expected: FAIL because `App.tsx` does not exist.

- [ ] **Step 5: 최소 앱 셸 구현**

```tsx
export function App() {
  return (
    <main className="app-shell">
      <h1>Wait:ON</h1>
      <p>가상의 병원 운영 시뮬레이션</p>
      <p>실제 진료 순서나 의료 판단을 나타내지 않습니다.</p>
    </main>
  )
}
```

- [ ] **Step 6: 설정 검증**

```bash
npm run test:run
npm run lint
npm run build
```

- [ ] **Step 7: 커밋**

```bash
git add docs package.json package-lock.json index.html tsconfig*.json vite.config.ts eslint.config.js src
git commit -m "build: scaffold React Phaser prototype"
```

---

### Task 2: 직렬화 가능한 시나리오와 게임 상태

**Files:**
- Create: `src/game/model/types.ts`
- Create: `src/game/scenario/createPrototypeScenario.ts`
- Create: `src/game/scenario/createPrototypeScenario.test.ts`

**Interfaces:**
- Produces: `GameState`, `Patient`, `Staff`, `Task`, `StateChange`, `GameCommand`, `CommandResult`
- Produces: `createPrototypeScenario(): GameState`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { createPrototypeScenario } from "./createPrototypeScenario"

describe("createPrototypeScenario", () => {
  it("creates the fixed outpatient-lab scenario", () => {
    const state = createPrototypeScenario()
    expect(state.gameTime).toBe(510)
    expect(state.scenarioId).toBe("prototype-outpatient-lab")
    expect(Object.keys(state.patients)).toHaveLength(3)
    expect(Object.keys(state.staff)).toHaveLength(3)
    expect(state.staff["nurse-float"]?.departmentId).toBe("outpatient")
    expect(JSON.parse(JSON.stringify(state))).toEqual(state)
  })
})
```

- [ ] **Step 2: 실패 확인**

```bash
npm run test:run -- src/game/scenario/createPrototypeScenario.test.ts
```

- [ ] **Step 3: 공개 타입 구현**

```ts
export type DepartmentId = "outpatient" | "lab"
export type StaffRole = "doctor" | "nurse" | "lab-tech"
export type StaffStatus = "available" | "moving" | "working" | "resting"
export type PatientStatus =
  | "scheduled"
  | "waiting"
  | "in-service"
  | "transferring"
  | "completed"
export type TaskType =
  | "outpatient-consult"
  | "lab-test"
  | "result-review"
  | "staff-move"
export type TaskStatus =
  | "scheduled"
  | "waiting"
  | "ready"
  | "running"
  | "blocked"
  | "completed"

export type GameState = {
  schemaVersion: 1
  scenarioId: "prototype-outpatient-lab"
  randomSeed: number
  gameTime: number
  speed: 0 | 1 | 2
  phase: "playing" | "paused" | "result"
  patients: Record<string, Patient>
  staff: Record<string, Staff>
  departments: Record<DepartmentId, Department>
  tasks: Record<string, Task>
  metrics: Metrics
  changes: StateChange[]
}
```

- [ ] **Step 4: 고정 시나리오 구현**

`08:30(510)`에 시작하고 환자는 510, 520, 530에 도착한다. 경로는 외래 진료 → 검사 → 결과 확인이다. 외래 의사, 검사 담당자와 순환 간호사를 만들고 어떤 작업도 초기 실행하지 않는다.

- [ ] **Step 5: 통과 확인과 커밋**

```bash
npm run test:run -- src/game/scenario/createPrototypeScenario.test.ts
git add src/game
git commit -m "feat: define outpatient lab scenario"
```

---

### Task 3: 원자적 작업 예약과 닫힌 게임 루프

**Files:**
- Create: `src/game/scheduler/reserveTask.ts`
- Create: `src/game/scheduler/reserveTask.test.ts`
- Create: `src/game/engine/applyCommand.ts`
- Create: `src/game/engine/applyCommand.test.ts`
- Create: `src/game/engine/advanceOneMinute.ts`
- Create: `src/game/engine/advanceOneMinute.test.ts`

**Interfaces:**
- Produces: `reserveTask(state: GameState, taskId: string): ReservationResult`
- Produces: `applyCommand(state: GameState, command: GameCommand): CommandResult`
- Produces: `advanceOneMinute(state: GameState): GameState`

- [ ] **Step 1: 원자적 예약 실패 테스트 작성**

```ts
function scenarioWithReadyConsult() {
  const state = createPrototypeScenario()
  state.tasks["consult-p1"] = {
    id: "consult-p1",
    type: "outpatient-consult",
    status: "ready",
    departmentId: "outpatient",
    patientId: "patient-1",
    readyAt: 510,
    duration: 12,
    remaining: 12,
    priority: 10,
    requirements: [{ type: "staff-role", role: "doctor", count: 1 }],
    dependencyIds: [],
    reservedStaffIds: [],
    targetDepartmentId: null,
    blockedReason: null,
  }
  return state
}

it("does not reserve any staff when one requirement is unavailable", () => {
  const state = scenarioWithReadyConsult()
  state.staff["doctor-outpatient"]!.status = "working"
  const result = reserveTask(state, "consult-p1")
  expect(result.started).toBe(false)
  expect(result.state.tasks["consult-p1"]?.status).toBe("blocked")
  expect(
    Object.values(result.state.staff).every(
      (staff) => staff.reservedTaskId === null,
    ),
  ).toBe(true)
})
```

- [ ] **Step 2: 실패 확인 후 예약 구현**

```bash
npm run test:run -- src/game/scheduler/reserveTask.test.ts
```

예약 후보를 ID 오름차순으로 정렬하고 모든 요구 인력을 찾은 뒤에만 task와 staff를 함께 변경한다.

- [ ] **Step 3: 간호사 재배치 실패 테스트 작성**

```ts
it("starts a five-minute nurse move with both effects", () => {
  const result = applyCommand(createPrototypeScenario(), {
    type: "assign-staff",
    commandId: "cmd-1",
    staffId: "nurse-float",
    departmentId: "lab",
  })
  expect(result.accepted).toBe(true)
  expect(result.state.staff["nurse-float"]?.status).toBe("moving")
  expect(result.changes.map((change) => change.kind)).toEqual([
    "staff.move.started",
    "department.support.removed",
  ])
})
```

- [ ] **Step 4: 명령 구현**

근무·휴식 중 이동을 거절하고, 승인 시 `move-{commandId}` 작업과 두 개의 의미 기반 `StateChange`를 생성한다.

- [ ] **Step 5: 1분 틱 실패 테스트 작성**

```ts
it("moves the first patient through the complete route", () => {
  let state = createPrototypeScenario()
  for (let minute = 0; minute < 60; minute += 1) {
    state = advanceOneMinute(state)
  }
  expect(state.patients["patient-1"]?.status).toBe("completed")
})

it("does not advance while paused", () => {
  const state = { ...createPrototypeScenario(), phase: "paused" as const }
  expect(advanceOneMinute(state)).toBe(state)
})
```

- [ ] **Step 6: 고정 틱 구현**

시각 증가 → 환자 도착 → 실행 작업 진행 → 완료·해제 → 다음 작업 → 의료진 이동 → 차단 재평가 → 우선순위 정렬 → 원자적 예약 → 대기·만족도 → 지표 순서를 구현한다.

- [ ] **Step 7: 결정론 검증과 커밋**

```bash
npm run test:run -- src/game
git add src/game
git commit -m "feat: close deterministic hospital loop"
```

---

### Task 4: 저장 어댑터와 단일 상태 controller

**Files:**
- Create: `src/persistence/SaveAdapter.ts`
- Create: `src/persistence/LocalStorageSaveAdapter.ts`
- Create: `src/persistence/LocalStorageSaveAdapter.test.ts`
- Create: `src/session/types.ts`
- Create: `src/session/GameSessionController.ts`
- Create: `src/session/GameSessionController.test.ts`

**Interfaces:**
- Produces: `SessionSaveData`
- Produces: `SaveAdapter`
- Produces: `DEFAULT_SETTINGS: AudioSettings`
- Produces: `createSessionSaveData(gameState?: GameState): SessionSaveData`
- Produces: `new GameSessionController({ initialData, saveAdapter })`
- Produces: `GameSessionController.subscribe(listener): () => void`
- Produces: `GameSessionController.getSnapshot(): SessionSnapshot`
- Produces: `GameSessionController.dispatch(command): CommandResult`

- [ ] **Step 1: 저장 fallback 실패 테스트**

```ts
class MemoryStorage implements Storage {
  private values = new Map<string, string>()
  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

it("loads previous when current is corrupt", async () => {
  const storage = new MemoryStorage()
  const adapter = new LocalStorageSaveAdapter(storage)
  const initial = createSessionSaveData()
  await adapter.save(initial)
  await adapter.save({
    ...initial,
    gameState: { ...initial.gameState, gameTime: 511 },
  })
  storage.setItem("waiton.save.current", "{")
  expect(await adapter.load()).toEqual(initial)
})
```

- [ ] **Step 2: 저장 어댑터 구현**

```ts
export interface SaveAdapter {
  load(): Promise<SessionSaveData | null>
  save(data: SessionSaveData): Promise<void>
  clear(): Promise<void>
}
```

현재 정상 저장본을 previous로 이동한 뒤 새 current를 기록하고, 버전·시나리오·checksum을 검증한다.

- [ ] **Step 3: controller 실패 테스트**

```ts
it("publishes accepted commands before an async save finishes", () => {
  const saveAdapter: SaveAdapter = {
    load: async () => null,
    save: () => new Promise<void>(() => undefined),
    clear: async () => undefined,
  }
  const controller = new GameSessionController({
    initialData: createSessionSaveData(),
    saveAdapter,
  })
  controller.dispatch({
    type: "assign-staff",
    commandId: "move-1",
    staffId: "nurse-float",
    departmentId: "lab",
  })
  expect(controller.getSnapshot().gameState.staff["nurse-float"]?.status)
    .toBe("moving")
  expect(controller.getSnapshot().saveStatus).toBe("saving")
})
```

- [ ] **Step 4: controller 구현**

controller는 current state, settings, save status, listener와 하나의 실제 interval을 가진다. save promise는 한 개만 실행하며 저장 중 변경이 생기면 최신 snapshot 한 개를 pending으로 보관한다.

- [ ] **Step 5: 숨김·종료 처리**

`pauseForBackground()`는 pause 명령을 적용하고 저장을 요청한다. 브라우저 event listener 연결은 app 계층에서 수행한다.

- [ ] **Step 6: 통과 확인과 커밋**

```bash
npm run test:run -- src/persistence src/session
git add src/persistence src/session
git commit -m "feat: add resumable game session"
```

---

### Task 5: Selector, 장면 view model과 typed bridge

**Files:**
- Create: `src/game/selectors/hospitalSelectors.ts`
- Create: `src/game/selectors/hospitalSelectors.test.ts`
- Create: `src/rendering/sceneViewModel.ts`
- Create: `src/rendering/GameBridge.ts`

**Interfaces:**
- Produces: `selectDepartmentSummary(state, departmentId)`
- Produces: `previewStaffAssignment(state, staffId, departmentId)`
- Produces: `createHospitalSceneViewModel(state): HospitalSceneViewModel`
- Produces: `GameBridge`, `SceneIntent`, `AudioSettings`

- [ ] **Step 1: 파생 상태 실패 테스트**

```ts
it("previews improvement and cost before moving the nurse", () => {
  expect(
    previewStaffAssignment(
      createPrototypeScenario(),
      "nurse-float",
      "lab",
    ),
  ).toEqual({
    accepted: true,
    improves: ["검사실 처리시간"],
    cautions: ["외래 지원 중단", "이동 준비 5분"],
    reason: null,
  })
})
```

- [ ] **Step 2: selector 구현**

대기·실행 작업의 남은 시간을 유효 처리 용량으로 나눠 예상 대기를 올림하고, blockedReason을 대표 원인으로 반환한다.

- [ ] **Step 3: 장면 view model 테스트와 구현**

```ts
it("contains only rendering data and stable entity ids", () => {
  const view = createHospitalSceneViewModel(createPrototypeScenario())
  expect(view.departments.map((item) => item.id)).toEqual([
    "outpatient",
    "lab",
  ])
  expect(view.patients).toHaveLength(3)
  expect(JSON.parse(JSON.stringify(view))).toEqual(view)
})
```

- [ ] **Step 4: 통과 확인과 커밋**

```bash
npm run test:run -- src/game/selectors src/rendering
git add src/game/selectors src/rendering
git commit -m "feat: add hospital rendering contracts"
```

---

### Task 6: Phaser 병원 장면과 안전한 사운드

**Files:**
- Create: `scripts/generate-audio.mjs`
- Create: `public/audio/*.wav`
- Create: `src/rendering/phaser/audioCues.ts`
- Create: `src/rendering/phaser/audioCues.test.ts`
- Create: `src/rendering/phaser/BootScene.ts`
- Create: `src/rendering/phaser/HospitalScene.ts`
- Create: `src/rendering/phaser/PhaserGameBridge.ts`

**Interfaces:**
- Consumes: `GameBridge`, `SceneIntent`, `HospitalSceneViewModel`
- Produces: `mapChangesToAudioCues(changes): AudioCue[]`
- Produces: `PhaserGameBridge`

- [ ] **Step 1: cue mapper 실패 테스트**

```ts
function change(kind: StateChange["kind"]): StateChange {
  return {
    id: `change-${kind}`,
    causeId: "test",
    causeType: "system",
    targetId: "test",
    kind,
    gameTime: 510,
    message: kind,
  }
}

it("maps semantic changes without exposing audio paths to the engine", () => {
  expect(mapChangesToAudioCues([
    change("staff.move.started"),
    change("task.completed"),
  ])).toEqual(["staff.move", "task.complete"])
})
```

- [ ] **Step 2: cue mapper 구현**

```ts
const CUE_BY_CHANGE = {
  "staff.move.started": "staff.move",
  "task.completed": "task.complete",
  "bottleneck.increased": "bottleneck.notice",
  "choice.confirmed": "ui.confirm",
} as const
```

- [ ] **Step 3: 코드 생성 음원 작성**

`generate-audio.mjs`는 Node 표준 라이브러리만 사용해 44.1kHz mono PCM WAV를 생성한다. confirm, complete, move, notice는 0.12~0.35초의 낮은 음량 톤이고 ambience는 4초 루프다. 사이렌, 심전도와 호출음 패턴은 사용하지 않는다.

```bash
npm run audio:generate
```

- [ ] **Step 4: BootScene 구현**

5개 음원을 preload하고 로드 오류가 있어도 HospitalScene 시작을 막지 않는다.

- [ ] **Step 5: HospitalScene 구현**

Phaser Graphics로 두 개의 활성 부서와 세 개의 준비 중 랜드마크를 그린다. 환자·의료진은 ID 기반 원·사각형 캐릭터로 만들고 view model 변화 때 tween한다. 모션 줄이기에서는 위치를 즉시 변경한다.

- [ ] **Step 6: bridge 구현**

React가 제공한 container에 Phaser Game을 한 번 mount하고, scene ready 전의 최신 view model 한 개를 보관한다. department object pointer 이벤트는 `SceneIntent`만 발생시킨다.

- [ ] **Step 7: 통과 확인과 커밋**

```bash
npm run test:run -- src/rendering
npm run build
git add scripts public src/rendering
git commit -m "feat: render playable Phaser hospital"
```

---

### Task 7: React HUD, 배치 선택과 접근성 대안

**Files:**
- Create: `src/app/createAppController.ts`
- Create: `src/app/useGameSession.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Create: `src/features/hospital/HospitalHud.tsx`
- Create: `src/features/hospital/HospitalHud.test.tsx`
- Create: `src/features/assignment/AssignmentPanel.tsx`
- Create: `src/features/assignment/AssignmentPanel.test.tsx`
- Create: `src/features/pause/PauseOverlay.tsx`
- Create: `src/features/settings/AudioSettings.tsx`
- Modify: `src/styles/theme.css`

**Interfaces:**
- Consumes: controller, selectors, `GameBridge`
- Produces: start/continue, HUD, assignment, pause and audio setting flows

- [ ] **Step 1: 배치 전 영향 실패 테스트**

```tsx
it("requires confirmation after showing both sides", async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn()
  render(
    <AssignmentPanel
      preview={{
        accepted: true,
        improves: ["검사실 처리시간"],
        cautions: ["외래 지원 중단", "이동 준비 5분"],
        reason: null,
      }}
      onConfirm={onConfirm}
    />,
  )
  expect(screen.getByText("검사실 처리시간")).toBeInTheDocument()
  expect(screen.getByText("외래 지원 중단")).toBeInTheDocument()
  expect(screen.getByText("이동 준비 5분")).toBeInTheDocument()
  await user.click(screen.getByRole("button", { name: "배치 확정" }))
  expect(onConfirm).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: HUD와 패널 구현**

병원 시각, 두 부서 대기, 병목 이유, 만족도와 일시정지를 표시한다. 외래·검사실 HTML button은 Phaser 장면 선택과 동일한 패널을 연다.

- [ ] **Step 3: bridge 생명주기 구현**

Phaser Game은 container mount 때 한 번 생성하고 React render 때 view model만 전달한다. unmount 때 destroy한다.

- [ ] **Step 4: 오디오 설정 구현**

음소거, master volume과 모션 줄이기를 controller settings로 저장하고 bridge에 전달한다. `게임 시작` 또는 `이어하기` 탭에서 오디오 unlock intent를 처리한다.

- [ ] **Step 5: 모바일 CSS 구현**

최대 폭 480px, 최소 높이 100dvh, 44px 터치 영역, 16px 기본 글자, focus-visible outline, reduced-motion 규칙을 추가한다.

- [ ] **Step 6: 통과 확인과 커밋**

```bash
npm run test:run -- src/app src/features
npm run lint
npm run build
git add src/app src/features src/styles
git commit -m "feat: add accessible prototype controls"
```

---

### Task 8: 이어하기, 백그라운드와 통합 회귀

**Files:**
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/createAppController.ts`
- Modify: `src/session/GameSessionController.test.ts`
- Modify: `README.md`

**Interfaces:**
- Produces: playable start → assignment → pause → reload → continue flow

- [ ] **Step 1: 이어하기 실패 테스트**

```tsx
function createMemorySaveAdapter(
  initial: SessionSaveData,
): SaveAdapter {
  let stored: SessionSaveData | null = initial
  return {
    load: async () => stored,
    save: async (value) => {
      stored = value
    },
    clear: async () => {
      stored = null
    },
  }
}

function createFakeBridge(): GameBridge {
  return {
    mount: () => undefined,
    render: () => undefined,
    setAudioSettings: () => undefined,
    destroy: () => undefined,
  }
}

it("offers continue and restores in a paused phase", async () => {
  const moved = applyCommand(createPrototypeScenario(), {
    type: "assign-staff",
    commandId: "move-1",
    staffId: "nurse-float",
    departmentId: "lab",
  }).state
  const adapter = createMemorySaveAdapter({
    schemaVersion: 1,
    gameState: moved,
    settings: DEFAULT_SETTINGS,
  })
  const user = userEvent.setup()
  render(<App saveAdapter={adapter} bridge={createFakeBridge()} />)
  await user.click(
    await screen.findByRole("button", { name: "이어하기" }),
  )
  expect(screen.getByText("병원 운영이 일시정지되었습니다."))
    .toBeInTheDocument()
})
```

- [ ] **Step 2: 배경 전환 회귀 테스트**

visibility hidden과 pagehide가 controller pause/save를 한 번 요청하고, rejected command는 저장을 요청하지 않는 테스트를 추가한다.

- [ ] **Step 3: 시작·이어하기 구현**

정상 저장본이 있을 때만 이어하기를 표시한다. 새 게임은 기존 저장 대체 확인 후 즉시 저장한다. 이어하기는 paused 상태로 복원한다.

- [ ] **Step 4: README 실행 안내**

````markdown
## Development

```bash
npm install
npm run audio:generate
npm run dev
```

## Verification

```bash
npm run test:run
npm run lint
npm run build
```
````

- [ ] **Step 5: 전체 회귀와 커밋**

```bash
npm run test:run
npm run lint
npm run build
git add README.md src
git commit -m "test: verify prototype resume flow"
```

---

### Task 9: 모바일 브라우저 검증과 배포

**Files:**
- Modify: `docs/PLAYTEST_PLAN.md`
- Create through Sites: `.openai/hosting.json`

**Interfaces:**
- Consumes: verified `dist/`
- Produces: production deployment URL and recorded acceptance result

- [ ] **Step 1: 최종 자동 검증**

```bash
npm run test:run
npm run lint
npm run build
test -f dist/index.html
```

- [ ] **Step 2: 390×844 브라우저 수동 검증**

```bash
npm run dev -- --host 127.0.0.1
```

확인:

1. 08:30 새 게임
2. 외래와 검사실 랜드마크
3. 환자 이동
4. 간호사 배치의 장점 하나와 주의점 두 개
5. 첫 탭 후 효과음
6. 음소거
7. 일시정지
8. 백그라운드 복귀 오버레이
9. 새로고침 후 이어하기
10. 무음과 모션 줄이기

- [ ] **Step 3: PLAYTEST_PLAN에 실제 결과 기록 위치 추가**

브라우저, 기기, 통과 여부, 발견한 S0/S1 문제와 수정 커밋을 기록하는 표를 추가한다.

- [ ] **Step 4: Sites 빌드·호스팅 절차 실행**

`.openai/hosting.json`이 없으므로 Sites에서 프로젝트를 한 번만 생성한다. 검증된 정확한 source state를 push하고 saved version을 만든 뒤 production deployment를 수행한다. 비종료 상태면 deployment status를 확인한다.

- [ ] **Step 5: 배포 후 스모크 테스트와 커밋**

배포 URL에서 시작 화면, Phaser 장면, 첫 효과음 unlock과 새 게임을 확인한다.

```bash
git add docs/PLAYTEST_PLAN.md .openai/hosting.json
git commit -m "docs: record prototype deployment"
```

---

## Plan Self-Review Checklist

- [x] 승인 설계의 React·Phaser·엔진 경계가 모든 task에 유지된다.
- [x] 모든 상태 변경은 controller → engine 명령으로 처리된다.
- [x] Phaser Scene이 GameState를 직접 수정하지 않는다.
- [x] 시뮬레이션 틱과 Phaser frame이 분리된다.
- [x] 저장 payload가 게임 상태와 사용자 설정을 모두 포함한다.
- [x] 사운드가 의미 기반 StateChange에서 매핑된다.
- [x] Canvas 조작에 대응하는 HTML button이 있다.
- [x] 자동 저장, previous fallback과 백그라운드 일시정지가 테스트된다.
- [x] 4일 범위 밖 기능이 task에 포함되지 않는다.
- [x] 문서 동기화와 배포가 구현 작업에 포함된다.
- [x] placeholder와 정의되지 않은 인터페이스가 없다.
