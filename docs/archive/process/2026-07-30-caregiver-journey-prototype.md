# Caregiver Journey Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, end-to-end demo in which a fictional cancer surgery patient's caregiver links to the patient, checks treatment progress, completes one hospital task with a purpose-based route, and reads a clinician-confirmed fictional summary.

**Architecture:** Add Zod contracts to the shared package, a NestJS caregiver-journey module backed by an in-memory demo repository, and a Next.js App Router web workspace. The web app uses one client-side journey controller with six focused screen components; all mutations go through the API so the in-memory repository can later be replaced by hospital integrations without rewriting the UI.

**Tech Stack:** TypeScript 5.9, Zod 4, NestJS 11, Next.js 16.2.12, React 19.2.8, Vitest 3, React Testing Library, plain responsive CSS.

## Global Constraints

- Use only fictional patient, caregiver, facility, treatment and clinical-summary data.
- Never present a generated or inferred medical state; treatment progress is an operational demo status.
- Keep actual treatment status visually separate from general educational content.
- Purpose-based guide steps come from registered demo rules, not generated AI output.
- Show the clinical summary only when its status is `CONFIRMED`.
- No PostgreSQL persistence, Supabase Auth, EMR/OCS, Voice EMR, indoor positioning, push delivery, external family messaging or generative AI call.
- Keep the presenter-only advance control behind the `?demo=1` query parameter.
- Support a 390px-wide mobile viewport without document-level horizontal scrolling.
- Use semantic headings, buttons, focus-visible styles and text labels in addition to color.
- Follow TDD for every contract, service and interactive screen behavior.

---

## File Structure

### Shared contracts

- `packages/contracts/src/caregiver-journey.ts`: Zod schemas and exported TypeScript types.
- `packages/contracts/src/caregiver-journey.test.ts`: schema acceptance and rejection tests.
- `packages/contracts/src/index.ts`: package export.

### API

- `apps/api/src/caregiver-journey/caregiver-journey.repository.ts`: storage interface.
- `apps/api/src/caregiver-journey/memory-caregiver-journey.repository.ts`: fictional seed and mutation implementation.
- `apps/api/src/caregiver-journey/caregiver-journey.service.ts`: link, complete-task and advance policies.
- `apps/api/src/caregiver-journey/caregiver-journey.service.test.ts`: domain transition tests.
- `apps/api/src/caregiver-journey/caregiver-journey.controller.ts`: REST routes.
- `apps/api/src/caregiver-journey/caregiver-journey.module.ts`: Nest providers and controller.
- `apps/api/test/caregiver-journey.e2e.test.ts`: HTTP contract and full demo transition.
- `apps/api/src/app.module.ts`: import the new module.
- `apps/api/src/main.ts`: enable configured CORS for the separate web app.

### Web

- `apps/web/package.json`: Next.js workspace and scripts.
- `apps/web/tsconfig.json`: Next.js TypeScript configuration.
- `apps/web/next-env.d.ts`: Next.js declarations.
- `apps/web/next.config.ts`: workspace package transpilation.
- `apps/web/vitest.config.ts`: jsdom component-test project.
- `apps/web/vitest.setup.ts`: testing-library matchers and cleanup.
- `apps/web/app/layout.tsx`: metadata and global stylesheet.
- `apps/web/app/page.tsx`: root page rendering the journey.
- `apps/web/app/globals.css`: design tokens, mobile shell and responsive screen styles.
- `apps/web/features/caregiver-journey/api.ts`: validated API client.
- `apps/web/features/caregiver-journey/api.test.ts`: API validation and error tests.
- `apps/web/features/caregiver-journey/caregiver-journey-app.tsx`: client-side flow controller.
- `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`: end-to-end component flow.
- `apps/web/features/caregiver-journey/components/mobile-shell.tsx`: shared mobile frame and header.
- `apps/web/features/caregiver-journey/components/patient-link-screen.tsx`: screen 1.
- `apps/web/features/caregiver-journey/components/caregiver-home-screen.tsx`: screen 2.
- `apps/web/features/caregiver-journey/components/treatment-progress-screen.tsx`: screen 3.
- `apps/web/features/caregiver-journey/components/caregiver-task-screen.tsx`: screen 4.
- `apps/web/features/caregiver-journey/components/purpose-guide-screen.tsx`: screen 5.
- `apps/web/features/caregiver-journey/components/clinical-summary-screen.tsx`: screen 6 and family-share preview.

### Documentation

- `docs/PRODUCT_BRIEF.md`: record the caregiver-journey prototype as the current demonstration track.
- `docs/PRD.md`: add the six prototype capabilities and explicit demo exclusions.
- `docs/UX_SPEC.md`: add the six-screen navigation and accessibility requirements.
- `README.md`: add local API and web run commands.

---

### Task 1: Define the Caregiver Journey Contract

**Files:**
- Create: `packages/contracts/src/caregiver-journey.test.ts`
- Create: `packages/contracts/src/caregiver-journey.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces: `TreatmentStage`, `CaregiverTaskStatus`, `CaregiverJourney`, `CaregiverJourneySchema`, `CaregiverJourneyResponseSchema`.
- Consumed by: API repository/service/controller and web API client/screens.

- [ ] **Step 1: Write the failing schema tests**

Test a complete fictional journey and these rejections:

```ts
import { describe, expect, it } from 'vitest';
import { CaregiverJourneySchema } from './caregiver-journey.js';

const validJourney = {
  id: 'demo',
  linked: true,
  patient: {
    id: 'patient-demo',
    displayName: '김정우',
    age: 68,
    procedureName: '위암 수술',
    scheduledAt: '2026-07-30T00:00:00.000Z',
  },
  caregiver: { displayName: '김서연', relationship: '딸' },
  treatment: {
    stage: 'IN_PROGRESS',
    label: '수술 진행 중',
    updatedAt: '2026-07-30T00:40:00.000Z',
    nextNotice: '상태가 변경되면 알려드립니다.',
  },
  task: {
    id: 'task-admission-docs',
    title: '입원 서류 발급',
    status: 'AVAILABLE',
    estimatedMinutes: 15,
    requiredItems: ['보호자 신분증'],
  },
  guide: {
    destination: '본관 1층 3번 키오스크',
    ticketRequired: false,
    steps: ['중앙 엘리베이터로 이동', '1층 원무 방향으로 이동'],
    fallback: '발급되지 않으면 옆 제증명 창구를 방문하세요.',
  },
  summary: { status: 'UNAVAILABLE' },
} as const;

describe('CaregiverJourneySchema', () => {
  it('accepts the confirmed fictional caregiver journey', () => {
    expect(CaregiverJourneySchema.parse(validJourney)).toBeDefined();
  });

  it('rejects a confirmed summary without clinician-confirmed content', () => {
    expect(() =>
      CaregiverJourneySchema.parse({
        ...validJourney,
        summary: {
          status: 'CONFIRMED',
          confirmedAt: '2026-07-30T05:10:00.000Z',
          currentStatus: '수술 종료',
          items: [],
          nextSchedule: '회복실 확인 후 병실 이동 예정',
        },
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run the contract test and verify RED**

Run:

```bash
npx vitest run --project @ready-on/contracts src/caregiver-journey.test.ts
```

Expected: FAIL because `caregiver-journey.js` does not exist.

- [ ] **Step 3: Implement the schemas**

Define exact enums:

```ts
export const TreatmentStageSchema = z.enum([
  'PREPARING',
  'IN_OPERATING_ROOM',
  'IN_PROGRESS',
  'RECOVERY',
  'COMPLETED',
]);

export const CaregiverTaskStatusSchema = z.enum([
  'AVAILABLE',
  'IN_PROGRESS',
  'COMPLETED',
]);
```

Use a discriminated union for `summary`:

```ts
const ClinicalSummarySchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('UNAVAILABLE') }),
  z.object({
    status: z.literal('CONFIRMED'),
    confirmedAt: z.iso.datetime(),
    currentStatus: z.string().min(1),
    items: z.array(z.string().min(1)).min(1),
    nextSchedule: z.string().min(1),
  }),
]);
```

Export inferred types and `CaregiverJourneyResponseSchema` as `{ journey: CaregiverJourneySchema }`.

- [ ] **Step 4: Export and verify GREEN**

Add:

```ts
export * from './caregiver-journey.js';
```

to `packages/contracts/src/index.ts`.

Run:

```bash
npx vitest run --project @ready-on/contracts
npm run typecheck
```

Expected: contract tests PASS and typecheck exits 0.

- [ ] **Step 5: Commit**

```bash
git add packages/contracts/src/caregiver-journey.ts packages/contracts/src/caregiver-journey.test.ts packages/contracts/src/index.ts
git commit -m "feat(contracts): define caregiver journey"
```

---

### Task 2: Implement the In-Memory Journey Domain

**Files:**
- Create: `apps/api/src/caregiver-journey/caregiver-journey.repository.ts`
- Create: `apps/api/src/caregiver-journey/memory-caregiver-journey.repository.ts`
- Create: `apps/api/src/caregiver-journey/caregiver-journey.service.ts`
- Create: `apps/api/src/caregiver-journey/caregiver-journey.service.test.ts`

**Interfaces:**
- Consumes: `CaregiverJourney` and status types from `@ready-on/contracts`.
- Produces:

```ts
export interface CaregiverJourneyRepository {
  getDemo(): Promise<CaregiverJourney>;
  saveDemo(journey: CaregiverJourney): Promise<CaregiverJourney>;
}

export class CaregiverJourneyService {
  getDemo(): Promise<CaregiverJourney>;
  linkDemo(): Promise<CaregiverJourney>;
  completeTask(taskId: string): Promise<CaregiverJourney>;
  advanceDemo(): Promise<CaregiverJourney>;
}
```

- [ ] **Step 1: Write failing service tests**

Cover:

1. `linkDemo()` changes only `linked` to `true`.
2. `completeTask('task-admission-docs')` changes the matching task to `COMPLETED`.
3. an unknown task ID throws `NotFoundException`.
4. `advanceDemo()` follows the exact treatment sequence.
5. the summary stays `UNAVAILABLE` before `RECOVERY`.
6. entering `RECOVERY` replaces it with the fixed `CONFIRMED` summary.
7. advancing from `COMPLETED` keeps `COMPLETED` and does not wrap.

Use a fresh `MemoryCaregiverJourneyRepository` in every test.

- [ ] **Step 2: Run the service test and verify RED**

Run:

```bash
npx vitest run --project @ready-on/api src/caregiver-journey/caregiver-journey.service.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement repository and service**

Seed one fictional journey. Return `structuredClone()` values from repository reads and writes so tests and controllers cannot mutate storage by reference.

Use this transition list:

```ts
const stageOrder: TreatmentStage[] = [
  'PREPARING',
  'IN_OPERATING_ROOM',
  'IN_PROGRESS',
  'RECOVERY',
  'COMPLETED',
];
```

Use fixed labels and next notices keyed by stage. Set the clinician-confirmed fictional summary only on `RECOVERY` and preserve it on `COMPLETED`.

- [ ] **Step 4: Run tests and typecheck**

Run:

```bash
npx vitest run --project @ready-on/api src/caregiver-journey/caregiver-journey.service.test.ts
npm run typecheck
```

Expected: all new service tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/caregiver-journey
git commit -m "feat(api): add caregiver journey domain"
```

---

### Task 3: Expose the Journey API

**Files:**
- Create: `apps/api/src/caregiver-journey/caregiver-journey.controller.ts`
- Create: `apps/api/src/caregiver-journey/caregiver-journey.module.ts`
- Create: `apps/api/test/caregiver-journey.e2e.test.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`

**Interfaces:**
- Consumes: `CaregiverJourneyService`.
- Produces:
  - `GET /caregiver-journeys/demo`
  - `POST /caregiver-journeys/demo/link`
  - `POST /caregiver-journeys/demo/tasks/:taskId/complete`
  - `POST /caregiver-journeys/demo/advance`

- [ ] **Step 1: Write the failing E2E test**

Create a Nest app with `createApp()`, call `await app.init()`, and assert:

```ts
const initial = await request(app.getHttpServer())
  .get('/caregiver-journeys/demo')
  .expect(200);
expect(initial.body.journey.linked).toBe(false);

await request(app.getHttpServer())
  .post('/caregiver-journeys/demo/link')
  .expect(201);

const advanced = await request(app.getHttpServer())
  .post('/caregiver-journeys/demo/advance')
  .expect(201);
expect(advanced.body.journey.treatment.stage).toBe('IN_OPERATING_ROOM');
```

Also assert unknown task returns 404 and the full response parses through `CaregiverJourneyResponseSchema`.

- [ ] **Step 2: Run E2E and verify RED**

Run outside the sandbox when local socket binding is denied:

```bash
npx vitest run --project @ready-on/api test/caregiver-journey.e2e.test.ts
```

Expected: FAIL with missing route.

- [ ] **Step 3: Implement controller and module**

Controller methods return:

```ts
return { journey: await this.service.getDemo() };
```

Provide the repository token with `useClass: MemoryCaregiverJourneyRepository` and register the module in `AppModule`.

- [ ] **Step 4: Enable configured CORS**

In `createApp()`:

```ts
const app = await NestFactory.create(AppModule, { logger: false });
app.enableCors({
  origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
});
return app;
```

- [ ] **Step 5: Verify API GREEN**

Run:

```bash
npx vitest run --project @ready-on/api
npm run typecheck
```

Expected: all API tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/caregiver-journey apps/api/src/app.module.ts apps/api/src/main.ts apps/api/test/caregiver-journey.e2e.test.ts
git commit -m "feat(api): expose caregiver journey demo"
```

---

### Task 4: Scaffold the Next.js Web Workspace and API Client

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next-env.d.ts`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/vitest.setup.ts`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/features/caregiver-journey/api.test.ts`
- Create: `apps/web/features/caregiver-journey/api.ts`

**Interfaces:**
- Consumes: `CaregiverJourneyResponseSchema`.
- Produces:

```ts
export interface CaregiverJourneyApi {
  getDemo(): Promise<CaregiverJourney>;
  linkDemo(): Promise<CaregiverJourney>;
  completeTask(taskId: string): Promise<CaregiverJourney>;
  advanceDemo(): Promise<CaregiverJourney>;
}
```

- [ ] **Step 1: Add exact workspace dependencies**

Create `apps/web/package.json` with:

```json
{
  "name": "@ready-on/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@ready-on/contracts": "0.1.0",
    "next": "16.2.12",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^5.0.0",
    "jsdom": "^26.0.0"
  }
}
```

Run:

```bash
npm install
```

Expected: lockfile includes the web workspace and `npm audit` reports no unaddressed critical vulnerability.

- [ ] **Step 2: Configure Next.js and Vitest**

Use App Router, `transpilePackages: ['@ready-on/contracts']`, jsdom and the official React plugin. Import `@testing-library/jest-dom/vitest` and call `afterEach(cleanup)` in `vitest.setup.ts`.

- [ ] **Step 3: Write failing API client tests**

Mock `global.fetch` and verify:

1. `getDemo()` sends `GET` to `${baseUrl}/caregiver-journeys/demo`.
2. `completeTask()` URL-encodes the task ID and sends `POST`.
3. a non-2xx response throws `CaregiverJourneyApiError`.
4. malformed JSON fails Zod validation instead of reaching the UI.

- [ ] **Step 4: Run client tests and verify RED**

Run:

```bash
npx vitest run --project @ready-on/web features/caregiver-journey/api.test.ts
```

Expected: FAIL because `api.ts` does not exist.

- [ ] **Step 5: Implement validated fetch client**

Use:

```ts
const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

async function requestJourney(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, init);
  if (!response.ok) throw new CaregiverJourneyApiError(response.status);
  return CaregiverJourneyResponseSchema.parse(await response.json()).journey;
}
```

- [ ] **Step 6: Verify workspace**

Run:

```bash
npx vitest run --project @ready-on/web
npm run typecheck
npm run build
```

Expected: client tests, typecheck and empty web build PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web package-lock.json
git commit -m "build(web): initialize caregiver journey app"
```

---

### Task 5: Build Link, Home and Treatment Progress Screens

**Files:**
- Create: `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`
- Create: `apps/web/features/caregiver-journey/caregiver-journey-app.tsx`
- Create: `apps/web/features/caregiver-journey/components/mobile-shell.tsx`
- Create: `apps/web/features/caregiver-journey/components/patient-link-screen.tsx`
- Create: `apps/web/features/caregiver-journey/components/caregiver-home-screen.tsx`
- Create: `apps/web/features/caregiver-journey/components/treatment-progress-screen.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `CaregiverJourneyApi` and `CaregiverJourney`.
- Produces: a client component with `view: 'home' | 'progress' | 'task' | 'guide' | 'summary'`.

- [ ] **Step 1: Write failing flow tests**

Inject a fake `CaregiverJourneyApi` into `CaregiverJourneyApp`.

Test:

1. unlinked journey renders `환자를 선택해 주세요`.
2. clicking `보호자로 연결하기` calls `linkDemo()` once.
3. linked response renders `수술 준비 중`, `입원 서류 발급`, and `다음 안내`.
4. clicking `과정 알아보기` renders both `병원 확인 상태` and `일반적인 수술 과정`.
5. clicking `홈으로` returns to the home screen.

- [ ] **Step 2: Run component tests and verify RED**

Run:

```bash
npx vitest run --project @ready-on/web features/caregiver-journey/caregiver-journey-app.test.tsx
```

Expected: FAIL because the app component does not exist.

- [ ] **Step 3: Implement the controller and three screens**

Rules:

- Fetch once on mount.
- Render explicit loading and retry states.
- Do not optimistically change treatment stage.
- Use API responses as the only journey state after a mutation.
- Keep actual progress and educational copy in separate labeled regions.
- Use plain CSS; do not add a component library or Tailwind.

- [ ] **Step 4: Add responsive and accessible styles**

Define design tokens, `:focus-visible`, a 44px minimum button height, `aria-current="step"` for the active stage and a single-column layout below 720px.

- [ ] **Step 5: Verify GREEN**

Run:

```bash
npx vitest run --project @ready-on/web
npm run typecheck
npm run build
```

Expected: new screen tests PASS and Next production build exits 0.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat(web): add caregiver status journey"
```

---

### Task 6: Build Task, Purpose Guide and Completion Flow

**Files:**
- Create: `apps/web/features/caregiver-journey/components/caregiver-task-screen.tsx`
- Create: `apps/web/features/caregiver-journey/components/purpose-guide-screen.tsx`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.tsx`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `journey.task`, `journey.guide`, and `api.completeTask(taskId)`.
- Produces: task-detail → guide → complete → home flow.

- [ ] **Step 1: Extend the failing component test**

Test:

1. clicking the home task opens `입원 서류 발급`.
2. the task screen shows `보호자 신분증`, `15분`, and `번호표 필요 없음`.
3. `경로 안내 시작` shows destination, ordered steps and fallback.
4. `업무 완료` calls `completeTask('task-admission-docs')`.
5. the returned `COMPLETED` task appears as `완료` on home.

- [ ] **Step 2: Run and verify RED**

Run:

```bash
npx vitest run --project @ready-on/web features/caregiver-journey/caregiver-journey-app.test.tsx
```

Expected: FAIL because task and guide screens do not exist.

- [ ] **Step 3: Implement the two screens**

Render route information as semantic ordered steps. The map is an explicitly labeled schematic illustration, not a real hospital map.

If `guide` is absent, render:

```text
등록된 이동 안내가 없습니다.
가까운 안내 데스크에 문의해 주세요.
```

- [ ] **Step 4: Verify GREEN and commit**

Run:

```bash
npx vitest run --project @ready-on/web
npm run typecheck
npm run build
```

Commit:

```bash
git add apps/web
git commit -m "feat(web): guide caregiver hospital tasks"
```

---

### Task 7: Add Demo Advance, Confirmed Summary and Share Preview

**Files:**
- Create: `apps/web/features/caregiver-journey/components/clinical-summary-screen.tsx`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.tsx`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`
- Modify: `apps/web/features/caregiver-journey/components/caregiver-home-screen.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `api.advanceDemo()` and the summary discriminated union.
- Produces: presenter control, summary gate and non-sending family share preview.

- [ ] **Step 1: Extend failing tests**

Test:

1. demo controls are hidden when `demoMode` is false.
2. `다음 단계로 전환` calls `advanceDemo()` when `demoMode` is true.
3. `UNAVAILABLE` renders `의료진 설명을 확인 중입니다`.
4. `CONFIRMED` renders current status, all summary items and next schedule.
5. `가족에게 공유` opens a preview and does not invoke any external API.

- [ ] **Step 2: Run and verify RED**

Run:

```bash
npx vitest run --project @ready-on/web features/caregiver-journey/caregiver-journey-app.test.tsx
```

Expected: FAIL on missing summary and demo behavior.

- [ ] **Step 3: Implement behavior**

Read `demoMode` in `app/page.tsx` from `searchParams` and pass it as a boolean prop. The summary component must branch on `summary.status` before reading confirmed-only fields.

The share preview must include:

```text
수술 종료
회복실 확인 중
병실 이동 예정
```

and the visible label `가상 공유 미리보기`.

- [ ] **Step 4: Verify GREEN and commit**

Run:

```bash
npx vitest run --project @ready-on/web
npm run typecheck
npm run build
```

Commit:

```bash
git add apps/web
git commit -m "feat(web): complete caregiver demo loop"
```

---

### Task 8: Align Product Documentation and Local Runbook

**Files:**
- Modify: `docs/PRODUCT_BRIEF.md`
- Modify: `docs/PRD.md`
- Modify: `docs/UX_SPEC.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: the implemented routes, six screens and explicit prototype boundaries.
- Produces: a reviewer-readable source of truth and exact local commands.

- [ ] **Step 1: Update product documents**

Document the caregiver journey as the current presentation prototype. Preserve the existing preparation-orchestration foundation as a prior/adjacent track; do not silently claim it is already implemented in the new UI.

Add the following statement verbatim:

```text
이 프로토타입의 치료 단계, 이동 경로와 의료진 설명은 모두 가상 데이터이며 실제 환자 상태 또는 의료지침이 아니다.
```

- [ ] **Step 2: Add local run commands**

Document two terminals:

```bash
npm run dev --workspace @ready-on/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001 npm run dev --workspace @ready-on/web
```

Document demo URL:

```text
http://localhost:3000/?demo=1
```

- [ ] **Step 3: Check documentation consistency**

Run:

```bash
rg -n '실제 삼성서울병원|실제 환자|Voice EMR|가상 데이터' README.md docs
```

Expected: no document claims that a real hospital integration, actual patient data or live Voice EMR is present.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/PRODUCT_BRIEF.md docs/PRD.md docs/UX_SPEC.md
git commit -m "docs: align caregiver prototype scope"
```

---

### Task 9: Verify the Complete Prototype

**Files:**
- Modify only files directly required by failures found in this task.

**Interfaces:**
- Consumes: complete contracts, API, web app and documentation.
- Produces: verified demonstration build.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm test
npm run typecheck
npm run build
npm audit
```

Expected:

- all Vitest projects PASS;
- 0 TypeScript errors;
- NestJS and Next.js production builds PASS;
- no critical vulnerability remains unreported.

- [ ] **Step 2: Run API and web locally**

Terminal 1:

```bash
npm run dev --workspace @ready-on/api
```

Terminal 2:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001 npm run dev --workspace @ready-on/web
```

- [ ] **Step 3: Browser-test the full loop**

Open `http://localhost:3000/?demo=1` at 390×844 and 1280×900.

Verify:

1. link fictional caregiver;
2. open treatment progress;
3. open task and route;
4. complete task;
5. advance until recovery;
6. open confirmed summary;
7. open family-share preview;
8. reload and confirm the in-memory reset limitation is understandable;
9. confirm no page-level horizontal overflow;
10. confirm no console or page errors.

- [ ] **Step 4: Run diff checks**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and only intended prototype changes.

- [ ] **Step 5: Final commit**

If verification required fixes:

```bash
git add apps packages README.md docs package.json package-lock.json
git commit -m "fix: stabilize caregiver journey demo"
```

If no fixes are required, do not create an empty commit.
