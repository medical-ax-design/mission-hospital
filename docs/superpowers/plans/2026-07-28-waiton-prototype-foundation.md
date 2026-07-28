# Wait:ON Prototype Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile web prototype foundation with a complete outpatient-to-lab gameplay loop, deterministic scheduling, immediate action feedback, and resumable local saves.

**Architecture:** Keep the simulation as a pure TypeScript engine that does not import React, browser APIs, or persistence code. React sends typed commands to the engine and renders selector results; persistence stores versioned snapshots through an adapter. The first vertical slice uses three fictional patients, one outpatient doctor, one lab technician, and one movable nurse to prove that reallocating capacity improves one department while creating a visible trade-off in another.

**Tech Stack:** React, TypeScript, Vite, CSS/SVG, Vitest, React Testing Library, browser local storage

## Global Constraints

- Target mobile portrait browsers; the primary viewport is 390×844 CSS pixels.
- Use the installed Node.js 25.9.0 and npm 11.12.1; commit the generated `package-lock.json`.
- TypeScript runs in strict mode.
- `src/game/**` must not import React, DOM APIs, storage APIs, or wall-clock time.
- The MVP uses no server, no account, no analytics, no real patient data, and no generative AI.
- Every patient, staff member, department, and event is fictional.
- The prototype must state that its rules do not represent real medical priority or advice.
- The simulation is deterministic for the same initial state, random seed, and command sequence.
- User commands update in-memory state immediately; persistence never blocks visible feedback.
- Event reading and user decisions have no countdown timer.
- Backgrounding pauses the simulation; returning requires an explicit resume action.
- Do not use Tailwind, a global state library, Canvas, WebGL, or a game engine in this phase.
- No hard game-over state is introduced.
- Follow test-driven development: failing test, observed failure, minimal implementation, observed pass.

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
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── App.test.tsx
│   │   └── useGameSession.ts
│   ├── game/
│   │   ├── model/
│   │   │   ├── types.ts
│   │   │   └── constants.ts
│   │   ├── scenario/
│   │   │   ├── createPrototypeScenario.ts
│   │   │   └── createPrototypeScenario.test.ts
│   │   ├── scheduler/
│   │   │   ├── evaluateRequirements.ts
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
│   ├── persistence/
│   │   ├── SaveAdapter.ts
│   │   ├── LocalStorageSaveAdapter.ts
│   │   ├── LocalStorageSaveAdapter.test.ts
│   │   ├── saveEnvelope.ts
│   │   └── saveEnvelope.test.ts
│   ├── features/
│   │   ├── hospital-overview/
│   │   │   ├── HospitalOverview.tsx
│   │   │   └── HospitalOverview.test.tsx
│   │   ├── department/
│   │   │   └── DepartmentPanel.tsx
│   │   ├── staff-assignment/
│   │   │   └── StaffAssignmentPanel.tsx
│   │   ├── feedback/
│   │   │   └── ChangeSummary.tsx
│   │   └── pause-resume/
│   │       └── PauseOverlay.tsx
│   ├── styles/
│   │   ├── reset.css
│   │   └── theme.css
│   ├── test/
│   │   └── setup.ts
│   └── main.tsx
└── docs/
    └── superpowers/
        └── plans/
```

### Boundary Rules

- `game/model` owns serializable domain types only.
- `game/scenario` creates initial data and contains no rules.
- `game/scheduler` answers whether tasks can start and reserves resources atomically.
- `game/engine` is the only code allowed to mutate simulation state through immutable return values.
- `game/selectors` converts internal state into display-ready summaries without mutating state.
- `persistence` serializes and validates snapshots but does not advance the game.
- `features` contains React UI grouped by user-visible responsibility.
- `app/useGameSession.ts` coordinates engine commands, clock ticks, pause/resume, and saves.

---

### Task 1: Web Application and Test Harness

**Files:**
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
- Produces: `App(): JSX.Element`
- Produces: npm scripts `dev`, `build`, `lint`, `test`, and `test:run`

- [ ] **Step 1: Initialize the package and install runtime dependencies**

Run:

```bash
npm init -y
npm install react react-dom
npm install -D typescript vite @vitejs/plugin-react vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh @types/react @types/react-dom
```

Expected: `package.json` and `package-lock.json` exist and npm exits with code 0.

- [ ] **Step 2: Add exact npm scripts**

Run:

```bash
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="tsc -b && vite build"
npm pkg set scripts.lint="eslint ."
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:run="vitest run"
npm pkg set type="module"
```

Expected `package.json` scripts:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 3: Create TypeScript, Vite, ESLint, HTML, and test setup**

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true,
  },
})
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest"
```

Create `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

Create `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "Bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

Create `eslint.config.js`:

```js
import js from "@eslint/js"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import tseslint from "typescript-eslint"

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        document: "readonly",
        window: "readonly",
        localStorage: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        vi: "readonly"
      }
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true }
      ]
    }
  }
)
```

Create `index.html` with `<div id="root"></div>` and module script `/src/main.tsx`.

- [ ] **Step 4: Write the failing application-shell test**

Create `src/app/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import { App } from "./App"

describe("App", () => {
  it("identifies the prototype as a fictional hospital simulation", () => {
    render(<App />)

    expect(
      screen.getByRole("heading", { name: "Wait:ON" }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/가상의 병원 운영 시뮬레이션/),
    ).toBeInTheDocument()
  })
})
```

- [ ] **Step 5: Run the test and observe the expected failure**

Run:

```bash
npm run test:run -- src/app/App.test.tsx
```

Expected: FAIL because `src/app/App.tsx` does not exist.

- [ ] **Step 6: Implement the minimal app shell**

Create `src/app/App.tsx`:

```tsx
export function App() {
  return (
    <main>
      <h1>Wait:ON</h1>
      <p>가상의 병원 운영 시뮬레이션</p>
      <p>실제 진료 순서나 의료 판단을 나타내지 않습니다.</p>
    </main>
  )
}
```

Create `src/main.tsx`:

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./app/App"
import "./styles/reset.css"
import "./styles/theme.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: Run test, lint, and build**

Run:

```bash
npm run test:run
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 8: Commit the scaffold**

```bash
git add package.json package-lock.json index.html tsconfig*.json vite.config.ts eslint.config.js src
git commit -m "build: scaffold WaitON web prototype"
```

---

### Task 2: Serializable Domain Model and Prototype Scenario

**Files:**
- Create: `src/game/model/types.ts`
- Create: `src/game/model/constants.ts`
- Create: `src/game/scenario/createPrototypeScenario.test.ts`
- Create: `src/game/scenario/createPrototypeScenario.ts`

**Interfaces:**
- Produces: `GameState`
- Produces: `GameCommand`
- Produces: `CommandResult`
- Produces: `createPrototypeScenario(): GameState`
- Produces: constants `OUTPATIENT_ID`, `LAB_ID`, `FLOAT_NURSE_ID`

- [ ] **Step 1: Define the failing scenario contract**

Create `src/game/scenario/createPrototypeScenario.test.ts`:

```ts
import { createPrototypeScenario } from "./createPrototypeScenario"

describe("createPrototypeScenario", () => {
  it("creates the deterministic outpatient-lab vertical slice", () => {
    const state = createPrototypeScenario()

    expect(state.gameTime).toBe(510)
    expect(state.randomSeed).toBe(20260728)
    expect(Object.keys(state.patients)).toHaveLength(3)
    expect(Object.keys(state.staff)).toHaveLength(3)
    expect(state.staff["nurse-float"]?.departmentId).toBe("outpatient")
    expect(state.metrics).toEqual({
      satisfaction: 75,
      averageWait: 0,
      fatigue: 15,
      safety: 90,
      guidanceAccuracy: 70,
      efficiency: 70,
    })
  })
})
```

- [ ] **Step 2: Run the scenario test and observe failure**

Run:

```bash
npm run test:run -- src/game/scenario/createPrototypeScenario.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Define serializable model types**

Create `src/game/model/types.ts` with these exact public types:

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
  | "reserved"
  | "running"
  | "completed"
  | "blocked"
  | "cancelled"

export type Requirement =
  | { type: "time-reached"; at: number }
  | { type: "task-completed"; taskId: string }
  | { type: "staff-role"; role: StaffRole; count: number }

export type Patient = {
  id: string
  displayName: string
  arrivalTime: number
  route: TaskType[]
  routeIndex: number
  departmentId: DepartmentId
  status: PatientStatus
  waitStartedAt: number | null
  waitTolerance: number
  satisfaction: number
}

export type Staff = {
  id: string
  displayName: string
  role: StaffRole
  skills: DepartmentId[]
  departmentId: DepartmentId
  targetDepartmentId: DepartmentId | null
  status: StaffStatus
  fatigue: number
  availableAt: number
  reservedTaskId: string | null
}

export type Department = {
  id: DepartmentId
  displayName: string
  baseCapacity: number
  supportBonus: number
}

export type Task = {
  id: string
  type: TaskType
  status: TaskStatus
  departmentId: DepartmentId
  patientId: string | null
  readyAt: number
  duration: number
  remaining: number
  priority: number
  requirements: Requirement[]
  dependencyIds: string[]
  reservedStaffIds: string[]
  targetDepartmentId: DepartmentId | null
  blockedReason: string | null
}

export type Metrics = {
  satisfaction: number
  averageWait: number
  fatigue: number
  safety: number
  guidanceAccuracy: number
  efficiency: number
}

export type StateChange = {
  id: string
  causeId: string
  causeType: "player" | "schedule" | "system"
  targetId: string
  field: string
  before: string | number
  after: string | number
  gameTime: number
  message: string
}

export type GameState = {
  schemaVersion: 1
  scenarioId: "prototype-outpatient-lab"
  randomSeed: 20260728
  gameTime: number
  speed: 0 | 1 | 2
  phase: "playing" | "paused" | "result"
  patients: Record<string, Patient>
  staff: Record<string, Staff>
  departments: Record<DepartmentId, Department>
  tasks: Record<string, Task>
  metrics: Metrics
  changes: StateChange[]
  tutorialStep: number
}

export type GameCommand =
  | {
      type: "assign-staff"
      commandId: string
      staffId: string
      departmentId: DepartmentId
    }
  | { type: "set-speed"; commandId: string; speed: 0 | 1 | 2 }
  | { type: "pause"; commandId: string }
  | { type: "resume"; commandId: string }

export type CommandResult = {
  accepted: boolean
  state: GameState
  changes: StateChange[]
  rejection: null | {
    reason: string
    suggestion: string
  }
}
```

- [ ] **Step 4: Implement the deterministic scenario factory**

Create `src/game/scenario/createPrototypeScenario.ts`.

Required scenario:

- `08:30` is game minute `510`.
- Patients arrive at `510`, `520`, and `530`.
- Each patient route is outpatient consult → lab test → result review.
- Staff are `doctor-outpatient`, `nurse-float`, and `tech-lab`.
- The nurse starts in outpatient and can work in both departments.
- The doctor can work only in outpatient.
- The lab technician can work only in lab.
- Outpatient capacity is `1`, lab capacity is `1`, and nurse support bonus is represented separately.
- No task is running at initialization.

- [ ] **Step 5: Run the scenario test**

Run:

```bash
npm run test:run -- src/game/scenario/createPrototypeScenario.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the model and scenario**

```bash
git add src/game/model src/game/scenario
git commit -m "feat: define prototype hospital scenario"
```

---

### Task 3: Task Requirements and Atomic Staff Reservation

**Files:**
- Create: `src/game/scheduler/evaluateRequirements.ts`
- Create: `src/game/scheduler/reserveTask.test.ts`
- Create: `src/game/scheduler/reserveTask.ts`

**Interfaces:**
- Consumes: `GameState`, `Task`, and `Requirement`
- Produces: `evaluateRequirements(state: GameState, task: Task): { ready: boolean; reason: string | null }`
- Produces: `reserveTask(state: GameState, taskId: string): { state: GameState; started: boolean }`

- [ ] **Step 1: Write the failing reservation tests**

Create `src/game/scheduler/reserveTask.test.ts`:

```ts
import { createPrototypeScenario } from "../scenario/createPrototypeScenario"
import { reserveTask } from "./reserveTask"

describe("reserveTask", () => {
  it("reserves an available doctor for an outpatient task", () => {
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

    const result = reserveTask(state, "consult-p1")

    expect(result.started).toBe(true)
    expect(result.state.tasks["consult-p1"]?.status).toBe("running")
    expect(result.state.staff["doctor-outpatient"]?.reservedTaskId).toBe(
      "consult-p1",
    )
  })

  it("does not partially reserve resources when a requirement is missing", () => {
    const state = createPrototypeScenario()
    state.staff["doctor-outpatient"]!.status = "working"
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

    const result = reserveTask(state, "consult-p1")

    expect(result.started).toBe(false)
    expect(result.state.tasks["consult-p1"]?.status).toBe("blocked")
    expect(result.state.tasks["consult-p1"]?.blockedReason).toBe(
      "외래 의사를 기다리는 중",
    )
    expect(
      Object.values(result.state.staff).every(
        (staff) => staff.reservedTaskId === null,
      ),
    ).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests and observe failure**

Run:

```bash
npm run test:run -- src/game/scheduler/reserveTask.test.ts
```

Expected: FAIL because `reserveTask` does not exist.

- [ ] **Step 3: Implement requirement evaluation**

`evaluateRequirements` must:

- Reject a task before `readyAt`.
- Reject when a dependency is not completed.
- Count only staff in the task department with status `available`.
- Return the first actionable Korean reason.

Exact reason mapping:

```ts
const roleReason = {
  doctor: "외래 의사를 기다리는 중",
  nurse: "간호사 지원을 기다리는 중",
  "lab-tech": "검사 담당자를 기다리는 중",
} as const
```

- [ ] **Step 4: Implement atomic reservation**

`reserveTask` must:

1. Clone only the changed task and staff records.
2. Sort eligible staff IDs lexicographically for deterministic selection.
3. Gather every required staff ID before changing state.
4. Mark the task `blocked` without changing staff if any requirement fails.
5. On success, mark selected staff `working`, set `reservedTaskId`, and mark the task `running`.

- [ ] **Step 5: Run focused and full tests**

Run:

```bash
npm run test:run -- src/game/scheduler/reserveTask.test.ts
npm run test:run
```

Expected: PASS.

- [ ] **Step 6: Commit the scheduler**

```bash
git add src/game/scheduler
git commit -m "feat: add deterministic task reservation"
```

---

### Task 4: Staff Assignment Command and Immediate Feedback

**Files:**
- Create: `src/game/engine/applyCommand.test.ts`
- Create: `src/game/engine/applyCommand.ts`

**Interfaces:**
- Consumes: `GameState`, `GameCommand`
- Produces: `applyCommand(state: GameState, command: GameCommand): CommandResult`
- Produces: a running `staff-move` task with duration 5 for accepted assignments

- [ ] **Step 1: Write failing command tests**

Create `src/game/engine/applyCommand.test.ts`:

```ts
import { createPrototypeScenario } from "../scenario/createPrototypeScenario"
import { applyCommand } from "./applyCommand"

describe("applyCommand", () => {
  it("starts a five-minute nurse move and reports the trade-off immediately", () => {
    const state = createPrototypeScenario()

    const result = applyCommand(state, {
      type: "assign-staff",
      commandId: "cmd-1",
      staffId: "nurse-float",
      departmentId: "lab",
    })

    expect(result.accepted).toBe(true)
    expect(result.state.staff["nurse-float"]?.status).toBe("moving")
    expect(result.state.staff["nurse-float"]?.targetDepartmentId).toBe("lab")
    expect(result.changes.map((change) => change.message)).toEqual([
      "간호사가 검사실로 이동합니다.",
      "이동 준비 동안 외래 지원이 중단됩니다.",
    ])
    expect(
      Object.values(result.state.tasks).some(
        (task) =>
          task.type === "staff-move" &&
          task.status === "running" &&
          task.remaining === 5,
      ),
    ).toBe(true)
  })

  it("rejects moving staff who are already working", () => {
    const state = createPrototypeScenario()
    state.staff["nurse-float"]!.status = "working"

    const result = applyCommand(state, {
      type: "assign-staff",
      commandId: "cmd-2",
      staffId: "nurse-float",
      departmentId: "lab",
    })

    expect(result.accepted).toBe(false)
    expect(result.rejection).toEqual({
      reason: "진행 중인 업무가 있습니다.",
      suggestion: "업무 완료 후 이동을 예약하세요.",
    })
  })
})
```

- [ ] **Step 2: Run the command tests and observe failure**

Run:

```bash
npm run test:run -- src/game/engine/applyCommand.test.ts
```

Expected: FAIL because `applyCommand` does not exist.

- [ ] **Step 3: Implement pause, resume, and speed commands**

Rules:

- `pause` sets `phase` to `paused` and speed to `0`.
- `resume` sets `phase` to `playing` and speed to `1`.
- `set-speed` accepts `0`, `1`, or `2`; speed `0` also pauses.
- Every accepted command returns a `StateChange`.

- [ ] **Step 4: Implement staff assignment**

Rules:

- Only staff whose `skills` include the target department can move.
- Staff already at the target are rejected with `이미 해당 부서에 있습니다.`
- Working or resting staff cannot move immediately.
- Accepted movement creates `move-{commandId}` with `remaining: 5`.
- The moving staff are not available to either department.
- State changes use `causeId: command.commandId` and `causeType: "player"`.

- [ ] **Step 5: Run tests**

Run:

```bash
npm run test:run -- src/game/engine/applyCommand.test.ts
npm run test:run
```

Expected: PASS.

- [ ] **Step 6: Commit the command layer**

```bash
git add src/game/engine/applyCommand.ts src/game/engine/applyCommand.test.ts
git commit -m "feat: add staff assignment commands"
```

---

### Task 5: Deterministic Clock and Closed Patient Flow

**Files:**
- Create: `src/game/engine/advanceOneMinute.test.ts`
- Create: `src/game/engine/advanceOneMinute.ts`

**Interfaces:**
- Consumes: `GameState`
- Consumes: `reserveTask(state, taskId)`
- Produces: `advanceOneMinute(state: GameState): GameState`

- [ ] **Step 1: Write the failing clock and flow tests**

Create `src/game/engine/advanceOneMinute.test.ts`:

```ts
import { applyCommand } from "./applyCommand"
import { advanceOneMinute } from "./advanceOneMinute"
import { createPrototypeScenario } from "../scenario/createPrototypeScenario"

function advance(state: ReturnType<typeof createPrototypeScenario>, minutes: number) {
  let current = state
  for (let index = 0; index < minutes; index += 1) {
    current = advanceOneMinute(current)
  }
  return current
}

describe("advanceOneMinute", () => {
  it("moves an arrived patient through outpatient, lab, and result review", () => {
    const finalState = advance(createPrototypeScenario(), 60)

    expect(finalState.patients["patient-1"]?.status).toBe("completed")
    expect(
      Object.values(finalState.tasks).filter(
        (task) => task.patientId === "patient-1",
      ).map((task) => task.type),
    ).toEqual(["outpatient-consult", "lab-test", "result-review"])
  })

  it("finishes a nurse move after five game minutes", () => {
    const commanded = applyCommand(createPrototypeScenario(), {
      type: "assign-staff",
      commandId: "move-1",
      staffId: "nurse-float",
      departmentId: "lab",
    }).state

    const finalState = advance(commanded, 5)

    expect(finalState.staff["nurse-float"]?.departmentId).toBe("lab")
    expect(finalState.staff["nurse-float"]?.status).toBe("available")
  })

  it("does not advance while paused", () => {
    const state = createPrototypeScenario()
    state.phase = "paused"
    state.speed = 0

    expect(advanceOneMinute(state)).toEqual(state)
  })
})
```

- [ ] **Step 2: Run tests and observe failure**

Run:

```bash
npm run test:run -- src/game/engine/advanceOneMinute.test.ts
```

Expected: FAIL because `advanceOneMinute` does not exist.

- [ ] **Step 3: Implement the exact tick order**

`advanceOneMinute` performs:

1. Return the same state object if phase is not `playing`.
2. Increment game time by one.
3. Activate patients whose `arrivalTime <= gameTime`.
4. Complete running tasks whose remaining time reaches zero.
5. Release reserved staff.
6. Create the next patient-route task after a completion.
7. Finish staff movement and update department.
8. Re-evaluate waiting and blocked tasks.
9. Sort ready tasks by priority descending, then ID ascending.
10. Start tasks through `reserveTask`.
11. Increase waiting time and apply satisfaction changes.
12. Recalculate metrics and append state changes.

- [ ] **Step 4: Apply nurse support at task start**

Task durations:

```ts
const BASE_DURATION = {
  "outpatient-consult": 12,
  "lab-test": 15,
  "result-review": 8,
  "staff-move": 5,
} as const
```

If the float nurse is available in the task department when a patient task starts, subtract `3` minutes from the task duration. Never reduce below `5`.

- [ ] **Step 5: Apply waiting and satisfaction rules**

- A waiting patient has `waitStartedAt`.
- Every five minutes beyond `waitTolerance`, subtract `3` satisfaction once.
- Clamp patient satisfaction and aggregate metrics to `0..100`.
- Calculate average wait from completed patient tasks only.
- Append a change record for each satisfaction adjustment.

- [ ] **Step 6: Run tests**

Run:

```bash
npm run test:run -- src/game/engine/advanceOneMinute.test.ts
npm run test:run
```

Expected: PASS.

- [ ] **Step 7: Commit the closed engine loop**

```bash
git add src/game/engine/advanceOneMinute.ts src/game/engine/advanceOneMinute.test.ts
git commit -m "feat: close outpatient lab simulation loop"
```

---

### Task 6: Display Selectors and Bottleneck Explanation

**Files:**
- Create: `src/game/selectors/hospitalSelectors.test.ts`
- Create: `src/game/selectors/hospitalSelectors.ts`

**Interfaces:**
- Consumes: `GameState`
- Produces: `selectDepartmentSummary(state, departmentId): DepartmentSummary`
- Produces: `selectTopBottleneck(state): DepartmentSummary | null`
- Produces: `previewStaffAssignment(state, staffId, departmentId): AssignmentPreview`

- [ ] **Step 1: Write failing selector tests**

Create `src/game/selectors/hospitalSelectors.test.ts`:

```ts
import { createPrototypeScenario } from "../scenario/createPrototypeScenario"
import {
  previewStaffAssignment,
  selectDepartmentSummary,
  selectTopBottleneck,
} from "./hospitalSelectors"

describe("hospital selectors", () => {
  it("explains why outpatient work is blocked", () => {
    const state = createPrototypeScenario()
    state.tasks["blocked-consult"] = {
      id: "blocked-consult",
      type: "outpatient-consult",
      status: "blocked",
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
      blockedReason: "외래 의사를 기다리는 중",
    }

    expect(selectDepartmentSummary(state, "outpatient").primaryReason).toBe(
      "외래 의사를 기다리는 중",
    )
  })

  it("previews both sides of moving the float nurse", () => {
    const state = createPrototypeScenario()

    expect(
      previewStaffAssignment(state, "nurse-float", "lab"),
    ).toEqual({
      accepted: true,
      improves: ["검사실 처리시간"],
      cautions: ["외래 지원 중단", "이동 준비 5분"],
      reason: null,
    })
  })

  it("selects the department with the largest waiting workload", () => {
    const state = createPrototypeScenario()
    state.patients["patient-1"]!.status = "waiting"
    state.patients["patient-1"]!.departmentId = "lab"
    state.patients["patient-2"]!.status = "waiting"
    state.patients["patient-2"]!.departmentId = "lab"

    expect(selectTopBottleneck(state)?.id).toBe("lab")
  })
})
```

- [ ] **Step 2: Run tests and observe failure**

Run:

```bash
npm run test:run -- src/game/selectors/hospitalSelectors.test.ts
```

Expected: FAIL because the selector module does not exist.

- [ ] **Step 3: Implement display types and selectors**

Use these exact display types:

```ts
export type DepartmentSummary = {
  id: DepartmentId
  displayName: string
  waitingCount: number
  runningCount: number
  estimatedWait: number
  assignedStaffNames: string[]
  primaryReason: string | null
  status: "stable" | "busy" | "blocked"
}

export type AssignmentPreview = {
  accepted: boolean
  improves: string[]
  cautions: string[]
  reason: string | null
}
```

Estimated wait is the sum of waiting and running task remaining time divided by effective department capacity, rounded up.

- [ ] **Step 4: Run tests**

Run:

```bash
npm run test:run -- src/game/selectors/hospitalSelectors.test.ts
npm run test:run
```

Expected: PASS.

- [ ] **Step 5: Commit selectors**

```bash
git add src/game/selectors
git commit -m "feat: explain hospital bottlenecks"
```

---

### Task 7: Versioned Local Save Adapter

**Files:**
- Create: `src/persistence/SaveAdapter.ts`
- Create: `src/persistence/saveEnvelope.test.ts`
- Create: `src/persistence/saveEnvelope.ts`
- Create: `src/persistence/LocalStorageSaveAdapter.test.ts`
- Create: `src/persistence/LocalStorageSaveAdapter.ts`

**Interfaces:**
- Consumes: `GameState`
- Produces: `createSaveEnvelope(state: GameState, savedAt: string): SaveEnvelope`
- Produces: `parseSaveEnvelope(value: string): GameState | null`
- Produces: `SaveAdapter` with `load`, `save`, and `clear`
- Produces: `new LocalStorageSaveAdapter(storage?: Storage)`

- [ ] **Step 1: Write failing save round-trip tests**

Create `src/persistence/saveEnvelope.test.ts`:

```ts
import { createPrototypeScenario } from "../game/scenario/createPrototypeScenario"
import { createSaveEnvelope, parseSaveEnvelope } from "./saveEnvelope"

describe("save envelope", () => {
  it("round-trips the full deterministic state", () => {
    const state = createPrototypeScenario()
    const envelope = createSaveEnvelope(state, "2026-07-28T10:00:00.000Z")

    expect(parseSaveEnvelope(JSON.stringify(envelope))).toEqual(state)
  })

  it("rejects malformed and unsupported saves", () => {
    expect(parseSaveEnvelope("{")).toBeNull()
    expect(
      parseSaveEnvelope(
        JSON.stringify({ schemaVersion: 99, payload: {} }),
      ),
    ).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests and observe failure**

Run:

```bash
npm run test:run -- src/persistence/saveEnvelope.test.ts
```

Expected: FAIL because the save module does not exist.

- [ ] **Step 3: Implement the save envelope and validation**

Use:

```ts
export type SaveEnvelope = {
  schemaVersion: 1
  saveId: string
  savedAt: string
  checksum: string
  payload: GameState
}
```

Validation requirements:

- JSON must parse to an object.
- `schemaVersion` must equal `1`.
- `checksum` must match a deterministic checksum of the serialized payload.
- `payload.scenarioId` must equal `prototype-outpatient-lab`.
- `payload.patients`, `staff`, `departments`, and `tasks` must be objects.
- Invalid data returns `null` without throwing.

Use a small synchronous FNV-1a checksum helper over
`JSON.stringify(payload)`. The checksum detects incomplete or corrupted local
saves; it is not a security boundary.

- [ ] **Step 4: Define and implement the adapter**

Create `src/persistence/SaveAdapter.ts`:

```ts
import type { GameState } from "../game/model/types"

export interface SaveAdapter {
  load(): Promise<GameState | null>
  save(state: GameState): Promise<void>
  clear(): Promise<void>
}
```

`LocalStorageSaveAdapter` uses:

- `waiton.save.current`
- `waiton.save.previous`

Save order:

1. Move valid current value to previous.
2. Write the new complete serialized envelope to current.
3. Never delete previous on a failed write.

Load order:

1. Parse current.
2. If invalid, parse previous.
3. Return null if both fail.

- [ ] **Step 5: Add adapter tests with an in-memory Storage stub**

Create `src/persistence/LocalStorageSaveAdapter.test.ts`:

```ts
import { createPrototypeScenario } from "../game/scenario/createPrototypeScenario"
import { LocalStorageSaveAdapter } from "./LocalStorageSaveAdapter"

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe("LocalStorageSaveAdapter", () => {
  it("loads the current valid save", async () => {
    const adapter = new LocalStorageSaveAdapter(new MemoryStorage())
    const state = createPrototypeScenario()

    await adapter.save(state)

    expect(await adapter.load()).toEqual(state)
  })

  it("loads the previous save when current is corrupt", async () => {
    const storage = new MemoryStorage()
    const adapter = new LocalStorageSaveAdapter(storage)
    const state = createPrototypeScenario()

    await adapter.save(state)
    await adapter.save({ ...state, gameTime: 511 })
    storage.setItem("waiton.save.current", "{")

    expect(await adapter.load()).toEqual(state)
  })

  it("clears current and previous saves", async () => {
    const storage = new MemoryStorage()
    const adapter = new LocalStorageSaveAdapter(storage)
    await adapter.save(createPrototypeScenario())
    await adapter.save({ ...createPrototypeScenario(), gameTime: 511 })

    await adapter.clear()

    expect(storage.getItem("waiton.save.current")).toBeNull()
    expect(storage.getItem("waiton.save.previous")).toBeNull()
  })
})
```

- [ ] **Step 6: Run tests**

Run:

```bash
npm run test:run -- src/persistence
npm run test:run
```

Expected: PASS.

- [ ] **Step 7: Commit persistence**

```bash
git add src/persistence
git commit -m "feat: add resumable local saves"
```

---

### Task 8: Mobile Hospital UI and Staff Trade-off Interaction

**Files:**
- Create: `src/app/useGameSession.ts`
- Modify: `src/app/App.tsx`
- Modify: `src/app/App.test.tsx`
- Create: `src/features/hospital-overview/HospitalOverview.test.tsx`
- Create: `src/features/hospital-overview/HospitalOverview.tsx`
- Create: `src/features/department/DepartmentPanel.tsx`
- Create: `src/features/staff-assignment/StaffAssignmentPanel.tsx`
- Create: `src/features/feedback/ChangeSummary.tsx`
- Create: `src/features/pause-resume/PauseOverlay.tsx`
- Modify: `src/styles/theme.css`

**Interfaces:**
- Consumes: `createPrototypeScenario`, `applyCommand`, `advanceOneMinute`, selectors, and `SaveAdapter`
- Produces: `useGameSession(adapter: SaveAdapter)`
- Produces: hospital overview and department interaction UI

- [ ] **Step 1: Write the failing hospital interaction test**

Create `src/features/hospital-overview/HospitalOverview.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createPrototypeScenario } from "../../game/scenario/createPrototypeScenario"
import { HospitalOverview } from "./HospitalOverview"

describe("HospitalOverview", () => {
  it("shows the nurse assignment trade-off before applying it", async () => {
    const user = userEvent.setup()
    const onCommand = vi.fn()

    render(
      <HospitalOverview
        state={createPrototypeScenario()}
        onCommand={onCommand}
      />,
    )

    await user.click(screen.getByRole("button", { name: /검사실/ }))
    await user.click(screen.getByRole("button", { name: /간호사 지원 배치/ }))

    expect(screen.getByText("검사실 처리시간")).toBeInTheDocument()
    expect(screen.getByText("외래 지원 중단")).toBeInTheDocument()
    expect(screen.getByText("이동 준비 5분")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "배치 확정" }))

    expect(onCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "assign-staff",
        staffId: "nurse-float",
        departmentId: "lab",
      }),
    )
  })
})
```

- [ ] **Step 2: Run test and observe failure**

Run:

```bash
npm run test:run -- src/features/hospital-overview/HospitalOverview.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement `useGameSession`**

Hook state:

```ts
type GameSession = {
  state: GameState
  hasSave: boolean
  saveStatus: "idle" | "saving" | "saved" | "error"
  dispatch(command: GameCommand): void
  startNew(): Promise<void>
  continueSaved(): Promise<void>
  pause(): void
  resume(): void
}
```

Rules:

- `dispatch` applies commands synchronously through `applyCommand`.
- Accepted commands update React state before calling `adapter.save`.
- Keep at most one save promise in flight; if state changes during a save,
  retain only the latest pending state and save it when the current write ends.
- One real-second interval advances one game minute only while playing.
- Speed `2` applies two deterministic one-minute ticks per real second.
- Every 15 real seconds request a save.
- `visibilitychange` pauses and saves when the document becomes hidden.
- `pagehide` and `잠시 나가기` also pause and request a save.
- A patient task completion requests a save.
- Save failure exposes `saveStatus: "error"` but does not roll back or block play.
- Cleanup removes intervals and browser event listeners.

- [ ] **Step 4: Implement the hospital overview**

Required visible content:

- Heading `Wait:ON`
- Current hospital time
- Medical-safety notice
- Outpatient and lab cards
- Waiting count and estimated wait
- Top bottleneck and reason
- Fixed `일시정지` and `잠시 나가기` actions

Department buttons use text, icon, and status; color alone is insufficient.

- [ ] **Step 5: Implement department and staff assignment panels**

Interaction:

1. Tap department.
2. View waiting/running work and assigned staff.
3. Tap `간호사 지원 배치`.
4. Show `AssignmentPreview`.
5. Confirm to dispatch command.
6. Show returned changes through `ChangeSummary`.

All drag-equivalent actions must have button alternatives; this phase uses buttons only.

- [ ] **Step 6: Implement pause and resume**

`PauseOverlay` contains:

- `병원 운영이 일시정지되었습니다.`
- `계속하기`
- `잠시 나가기`
- `현재 몸 상태에 문제가 있으면 현장 의료진에게 알려주세요.`

Returning from background keeps the overlay open until explicit resume.

- [ ] **Step 7: Build the mobile layout**

CSS requirements:

- `max-width: 480px`
- centered app shell on wide screens
- `min-height: 100dvh`
- minimum `44px` interactive target
- base text `16px`
- visible focus rings
- `prefers-reduced-motion` disables transitions
- outpatient and lab landmarks remain visible without horizontal scrolling at 390px

- [ ] **Step 8: Run UI and full tests**

Run:

```bash
npm run test:run -- src/features/hospital-overview/HospitalOverview.test.tsx
npm run test:run
npm run lint
npm run build
```

Expected: all commands exit 0.

- [ ] **Step 9: Commit the playable vertical slice**

```bash
git add src/app src/features src/styles
git commit -m "feat: add playable hospital vertical slice"
```

---

### Task 9: Resume Flow, Regression Coverage, and Prototype Handoff

**Files:**
- Modify: `src/app/App.test.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/app/useGameSession.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: completed vertical slice
- Produces: new-game and continue flow
- Produces: verified build artifact in `dist/`

- [ ] **Step 1: Write the failing resume-flow test**

Add to `src/app/App.test.tsx`:

```tsx
it("offers continue when a valid local save exists", async () => {
  const adapter = createMemorySaveAdapter(createPrototypeScenario())

  render(<App saveAdapter={adapter} />)

  expect(
    await screen.findByRole("button", { name: "이어하기" }),
  ).toBeInTheDocument()
  expect(screen.getByRole("button", { name: "새로 시작" })).toBeInTheDocument()
})
```

Define the test-only memory adapter in the test file with the same `SaveAdapter` interface.

- [ ] **Step 2: Run test and observe failure**

Run:

```bash
npm run test:run -- src/app/App.test.tsx
```

Expected: FAIL because `App` does not accept `saveAdapter` and has no continue screen.

- [ ] **Step 3: Implement the start screen**

Rules:

- `App` accepts an optional `saveAdapter`; default is `LocalStorageSaveAdapter`.
- Load metadata on mount.
- Show `이어하기` only when a valid save exists.
- `새로 시작` creates the prototype scenario and saves immediately.
- Replacing a save requires a confirmation dialog with `기존 진행을 새 게임으로 바꿉니다.`
- Continue restores in paused state and requires `계속하기`.

- [ ] **Step 4: Add regression tests**

Add tests for:

- a save immediately after accepted staff assignment restores moving staff and the movement task.
- visibility hidden pauses the game.
- pagehide pauses and requests the latest state save.
- no game time advances while paused.
- corrupt current save falls back to previous.
- a rejected command does not trigger a save.
- a failed save keeps the accepted in-memory command result visible.
- rapid save requests serialize writes and persist the newest state last.

- [ ] **Step 5: Update README**

Add:

````markdown
## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run test:run
npm run lint
npm run build
```

The prototype uses fictional data only and stores progress locally in the browser.
````

- [ ] **Step 6: Run the full verification suite**

Run:

```bash
npm run test:run
npm run lint
npm run build
```

Expected:

- Vitest reports zero failed tests.
- ESLint reports zero errors.
- TypeScript and Vite exit 0.
- `dist/index.html` exists.

- [ ] **Step 7: Perform a manual mobile acceptance pass**

Run:

```bash
npm run dev -- --host 127.0.0.1
```

At a 390×844 viewport, verify:

1. New game starts at 08:30.
2. Outpatient and lab are both visible.
3. Nurse assignment preview shows one improvement and two cautions.
4. Confirmed assignment gives immediate feedback.
5. Pause stops time.
6. Background and return show the pause overlay.
7. Refresh offers continue.
8. Continue restores the nurse movement task and game time.
9. No screen requires sound or color alone.
10. Safety notice is readable.

- [ ] **Step 8: Commit the verified prototype**

```bash
git add README.md src
git commit -m "test: verify prototype resume flow"
```

---

## Plan Self-Review Checklist

- [x] Every MVP foundation requirement maps to a task.
- [x] All task interfaces use the exact names defined in Task 2.
- [x] No code under `src/game` imports React or browser storage.
- [x] Commands are the only path from UI to engine state changes.
- [x] Staff reservation is deterministic and atomic.
- [x] The first closed loop includes a visible trade-off.
- [x] Save state includes running movement and patient tasks.
- [x] Backgrounding pauses without advancing offline time.
- [x] Medical and privacy boundaries appear in UI and tests.
- [x] No placeholder steps or undefined implementation responsibilities remain.

## Follow-on Plans

After this foundation passes user review, write separate implementation plans for:

1. Emergency room, surgery room, bed allocation, and six-event fixed day.
2. Full 9-minute pacing, result scoring, tutorial, and accessibility polish.
3. Constrained shuffle bag and rule-based operating director.
4. Production deployment and observational playtest instrumentation.
