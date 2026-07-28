# Wait:ON 프로토타입 기반 구현 계획

> **구현 작업자 필수 지침:** 이 계획은 작업 단위별로 테스트를 먼저 작성하고, 실패를 확인한 뒤 최소 구현을 추가하는 방식으로 실행한다. 작업별 독립 실행은 `superpowers:subagent-driven-development`, 현재 세션에서 순차 실행은 `superpowers:executing-plans`를 사용한다.

## 1. 목표

모바일 브라우저에서 실행되는 Wait:ON의 첫 플레이 가능 프로토타입을 만든다.

첫 프로토타입은 다음 경험을 하나의 닫힌 게임 루프로 제공한다.

1. 환자가 외래에 도착한다.
2. 외래 진료 후 검사실로 이동한다.
3. 검사실 대기열이 증가한다.
4. 사용자가 순환 간호사를 검사실로 재배치한다.
5. 검사실 처리시간은 짧아지지만 외래 지원은 중단된다.
6. 선택 결과가 대기시간과 환자 만족도에 반영된다.
7. 사용자는 언제든 일시정지하거나 나갈 수 있다.
8. 다시 접속하면 저장된 진행 상태부터 이어서 플레이한다.

이번 구현은 전체 병원 MVP가 아니라 **아키텍처와 핵심 재미를 검증하는 첫 수직 슬라이스**다. 응급실, 수술실, 병상 배정과 운영 디렉터는 이 기반이 검증된 후 별도 계획으로 추가한다.

---

## 2. 기술 구성

- React
- TypeScript
- Vite
- 일반 CSS와 SVG
- Vitest
- React Testing Library
- 브라우저 Local Storage

이번 단계에서는 다음을 사용하지 않는다.

- 서버와 사용자 계정
- 실제 환자 또는 의료 데이터
- 전역 상태관리 라이브러리
- Canvas, WebGL 또는 범용 게임 엔진
- 실시간 멀티플레이
- 생성형 AI API

---

## 3. 아키텍처

```text
사용자
  ↓
React 기능 UI
  ↓ GameCommand
순수 TypeScript 게임 엔진
  ↓ GameState + StateChange
표시용 Selector
  ↓
React 화면 갱신

GameState
  ↓
SaveAdapter
  ↓
Local Storage의 current / previous 저장본
```

### 계층별 책임

#### `src/game/model`

- 직렬화 가능한 게임 타입을 정의한다.
- 함수, DOM 객체, React 상태와 현재 현실 시각을 저장하지 않는다.

#### `src/game/scenario`

- 프로토타입의 초기 환자, 의료진, 부서와 작업 데이터를 생성한다.
- 게임 규칙을 처리하지 않는다.

#### `src/game/scheduler`

- 작업 시작 조건을 판정한다.
- 필요한 의료진을 전부 확보할 수 있을 때만 원자적으로 예약한다.

#### `src/game/engine`

- 명령과 시간 틱을 처리한다.
- 게임 상태를 변경할 수 있는 유일한 계층이다.
- 같은 초기 상태와 명령 순서에는 항상 같은 결과를 만든다.

#### `src/game/selectors`

- 대기 인원, 예상 대기시간과 병목 원인을 화면용 데이터로 계산한다.
- 원본 상태는 변경하지 않는다.

#### `src/persistence`

- 버전이 포함된 저장 봉투를 만들고 검증한다.
- 게임 시간을 진행하거나 규칙을 실행하지 않는다.

#### `src/features`

- 사용자가 보는 병원 단면, 부서 정보, 인력 배치와 일시정지 UI를 담당한다.
- 게임 상태를 직접 수정하지 않고 명령만 전송한다.

#### `src/app/useGameSession.ts`

- React와 게임 엔진 사이를 연결한다.
- 명령 전달, 현실 시간 타이머, 자동 저장과 백그라운드 일시정지를 조정한다.

---

## 4. 디렉터리 구조

```text
src/
├── app/
│   ├── App.tsx
│   ├── App.test.tsx
│   └── useGameSession.ts
├── game/
│   ├── model/
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── scenario/
│   │   ├── createPrototypeScenario.ts
│   │   └── createPrototypeScenario.test.ts
│   ├── scheduler/
│   │   ├── evaluateRequirements.ts
│   │   ├── reserveTask.ts
│   │   └── reserveTask.test.ts
│   ├── engine/
│   │   ├── applyCommand.ts
│   │   ├── applyCommand.test.ts
│   │   ├── advanceOneMinute.ts
│   │   └── advanceOneMinute.test.ts
│   └── selectors/
│       ├── hospitalSelectors.ts
│       └── hospitalSelectors.test.ts
├── persistence/
│   ├── SaveAdapter.ts
│   ├── LocalStorageSaveAdapter.ts
│   ├── LocalStorageSaveAdapter.test.ts
│   ├── saveEnvelope.ts
│   └── saveEnvelope.test.ts
├── features/
│   ├── hospital-overview/
│   │   ├── HospitalOverview.tsx
│   │   └── HospitalOverview.test.tsx
│   ├── department/
│   │   └── DepartmentPanel.tsx
│   ├── staff-assignment/
│   │   └── StaffAssignmentPanel.tsx
│   ├── feedback/
│   │   └── ChangeSummary.tsx
│   └── pause-resume/
│       └── PauseOverlay.tsx
├── styles/
│   ├── reset.css
│   └── theme.css
├── test/
│   └── setup.ts
└── main.tsx
```

---

## 5. 전역 구현 원칙

- 기준 모바일 화면은 390×844 CSS 픽셀이다.
- TypeScript `strict` 모드를 사용한다.
- `src/game/**`에서는 React, DOM, 브라우저 저장소와 현실 시각을 import하지 않는다.
- 같은 초기 상태, 난수 시드와 명령 목록은 같은 최종 상태를 만들어야 한다.
- 사용자 명령은 저장 완료를 기다리지 않고 즉시 화면에 반영한다.
- 선택 화면에는 카운트다운을 두지 않는다.
- 브라우저가 백그라운드로 전환되면 게임을 일시정지한다.
- 복귀 후 사용자가 `계속하기`를 눌러야 시간이 다시 흐른다.
- 실패해도 진행 전체가 사라지는 게임 오버를 만들지 않는다.
- 화면에는 가상의 병원 운영 시뮬레이션이라는 안내를 표시한다.
- 실제 진료 순서나 의료 판단을 나타내지 않는다는 문구를 표시한다.

---

## 6. 핵심 상태 계약

```ts
export type DepartmentId = "outpatient" | "lab"
export type StaffRole = "doctor" | "nurse" | "lab-tech"
export type StaffStatus =
  | "available"
  | "moving"
  | "working"
  | "resting"

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
  | {
      type: "set-speed"
      commandId: string
      speed: 0 | 1 | 2
    }
  | { type: "pause"; commandId: string }
  | { type: "resume"; commandId: string }
```

파생 값인 예상 대기시간, 병목 순위와 배치 가능한 의료진 목록은 저장하지 않고 selector에서 계산한다.

---

## 7. 작업 계획

### 작업 1: 웹 애플리케이션과 테스트 환경

**생성 파일**

- `package.json`
- `package-lock.json`
- `index.html`
- `tsconfig.json`
- `tsconfig.app.json`
- `tsconfig.node.json`
- `vite.config.ts`
- `eslint.config.js`
- `src/test/setup.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/main.tsx`
- `src/styles/reset.css`
- `src/styles/theme.css`

**실행 순서**

- [ ] React, TypeScript, Vite와 테스트 의존성을 설치한다.
- [ ] `dev`, `build`, `lint`, `test`, `test:run` 스크립트를 추가한다.
- [ ] `App`이 `Wait:ON`과 가상 시뮬레이션 안내를 표시하는 실패 테스트를 작성한다.
- [ ] 테스트 실패 원인이 `App.tsx` 부재인지 확인한다.
- [ ] 최소 앱 셸을 구현한다.
- [ ] 전체 테스트, 린트와 빌드를 실행한다.

```bash
npm run test:run
npm run lint
npm run build
```

**완료 기준**

- 세 명령이 모두 종료 코드 0으로 끝난다.
- 초기 화면에 의료 안전 안내가 보인다.

---

### 작업 2: 직렬화 가능한 모델과 초기 시나리오

**생성 파일**

- `src/game/model/types.ts`
- `src/game/model/constants.ts`
- `src/game/scenario/createPrototypeScenario.ts`
- `src/game/scenario/createPrototypeScenario.test.ts`

**초기 시나리오**

- 시작 시각은 08:30, 게임 분으로는 `510`이다.
- 환자 세 명이 08:30, 08:40, 08:50에 도착한다.
- 환자 경로는 외래 진료 → 검사 → 결과 확인이다.
- 의료진은 외래 의사, 검사 담당자와 순환 간호사 각 한 명이다.
- 순환 간호사는 외래에서 시작하며 외래와 검사실 모두 지원할 수 있다.
- 초기에는 실행 중인 작업이 없다.

**실행 순서**

- [ ] 초기 상태의 시각, 시드, 환자와 의료진 수를 검사하는 테스트를 작성한다.
- [ ] 모듈이 없어 실패하는 것을 확인한다.
- [ ] 공개 타입을 정의한다.
- [ ] 고정된 초기 데이터를 반환하는 시나리오 팩터리를 구현한다.
- [ ] 같은 팩터리를 두 번 호출했을 때 상태가 같은지 확인한다.

**완료 기준**

- 게임 상태 전체를 `JSON.stringify`할 수 있다.
- 초기 상태에 브라우저 객체와 함수가 포함되지 않는다.

---

### 작업 3: 작업 조건과 원자적 의료진 예약

**생성 파일**

- `src/game/scheduler/evaluateRequirements.ts`
- `src/game/scheduler/reserveTask.ts`
- `src/game/scheduler/reserveTask.test.ts`

**예약 규칙**

1. 작업 시작 시각과 선행 작업 완료 여부를 검사한다.
2. 해당 부서에서 `available` 상태인 의료진만 후보가 된다.
3. 후보 ID를 사전순으로 정렬해 결과를 결정론적으로 만든다.
4. 모든 요구 자원을 먼저 찾는다.
5. 하나라도 부족하면 어떤 자원도 예약하지 않는다.
6. 성공한 경우에만 작업과 의료진 상태를 함께 변경한다.

**대표 테스트**

- [ ] 외래 작업에 사용 가능한 의사가 예약된다.
- [ ] 의사가 이미 일하고 있으면 작업은 차단된다.
- [ ] 실패한 예약은 다른 의료진 상태를 변경하지 않는다.
- [ ] 같은 상태에서는 항상 같은 의료진이 선택된다.

**차단 이유**

```ts
const roleReason = {
  doctor: "외래 의사를 기다리는 중",
  nurse: "간호사 지원을 기다리는 중",
  "lab-tech": "검사 담당자를 기다리는 중",
} as const
```

---

### 작업 4: 의료진 배치 명령과 즉시 피드백

**생성 파일**

- `src/game/engine/applyCommand.ts`
- `src/game/engine/applyCommand.test.ts`

**배치 규칙**

- 대상 부서를 지원할 수 있는 의료진만 이동할 수 있다.
- 일하는 중이거나 쉬는 중인 의료진은 즉시 이동할 수 없다.
- 이미 대상 부서에 있으면 명령을 거절한다.
- 이동에는 게임 시간 5분이 필요하다.
- 이동 중인 의료진은 어느 부서의 처리 능력에도 포함되지 않는다.

**성공 피드백**

- `간호사가 검사실로 이동합니다.`
- `이동 준비 동안 외래 지원이 중단됩니다.`

**대표 테스트**

- [ ] 간호사 이동 명령이 5분짜리 이동 작업을 만든다.
- [ ] 이동 시작과 외래 지원 중단을 즉시 반환한다.
- [ ] 일하는 의료진 이동 요청은 이유와 대안을 반환한다.
- [ ] 거절된 명령은 원본 상태를 변경하지 않는다.

---

### 작업 5: 결정론적 게임 시계와 환자 흐름

**생성 파일**

- `src/game/engine/advanceOneMinute.ts`
- `src/game/engine/advanceOneMinute.test.ts`

**1분 틱 처리 순서**

1. 일시정지 상태면 같은 상태를 반환한다.
2. 게임 시각을 1분 증가시킨다.
3. 도착 시간이 된 환자를 활성화한다.
4. 실행 중인 작업의 남은 시간을 줄인다.
5. 완료된 작업의 예약 자원을 해제한다.
6. 환자의 다음 경로 작업을 생성한다.
7. 완료된 의료진 이동을 적용한다.
8. 대기 또는 차단 작업을 다시 평가한다.
9. 우선순위 내림차순, ID 오름차순으로 시작 후보를 정렬한다.
10. 예약 가능한 작업을 시작한다.
11. 대기시간에 따른 만족도 변화를 적용한다.
12. 지표와 상태 변화 기록을 갱신한다.

**기본 처리시간**

```ts
const BASE_DURATION = {
  "outpatient-consult": 12,
  "lab-test": 15,
  "result-review": 8,
  "staff-move": 5,
} as const
```

같은 부서에 순환 간호사가 있으면 환자 작업의 처리시간을 3분 줄인다. 단, 5분보다 짧아지지 않는다.

**대표 테스트**

- [ ] 첫 환자가 외래, 검사와 결과 확인을 거쳐 완료된다.
- [ ] 간호사 이동은 정확히 5분 후 완료된다.
- [ ] 일시정지 상태에서는 시간이 흐르지 않는다.
- [ ] 같은 상태와 명령을 두 번 실행한 최종 상태가 같다.
- [ ] 지표는 0에서 100 사이를 벗어나지 않는다.
- [ ] 의료진 한 명이 두 작업에 동시에 예약되지 않는다.

---

### 작업 6: 병목과 선택 결과를 설명하는 Selector

**생성 파일**

- `src/game/selectors/hospitalSelectors.ts`
- `src/game/selectors/hospitalSelectors.test.ts`

**공개 함수**

```ts
selectDepartmentSummary(state, departmentId)
selectTopBottleneck(state)
previewStaffAssignment(state, staffId, departmentId)
```

**부서 요약**

- 대기 인원
- 실행 중 작업 수
- 예상 대기시간
- 배치된 의료진
- 가장 중요한 지연 원인
- 안정, 혼잡 또는 차단 상태

예상 대기시간은 대기·실행 작업의 남은 시간 합계를 유효 처리 능력으로 나눈 뒤 올림한다.

**대표 테스트**

- [ ] 외래 작업 차단 이유를 사용자 문장으로 설명한다.
- [ ] 검사실로 간호사를 옮길 때 장점과 주의점을 모두 보여준다.
- [ ] 대기 업무가 가장 많은 부서를 병목으로 선택한다.

---

### 작업 7: 버전 저장과 복구 어댑터

**생성 파일**

- `src/persistence/SaveAdapter.ts`
- `src/persistence/saveEnvelope.ts`
- `src/persistence/saveEnvelope.test.ts`
- `src/persistence/LocalStorageSaveAdapter.ts`
- `src/persistence/LocalStorageSaveAdapter.test.ts`

**저장 계약**

```ts
export interface SaveAdapter {
  load(): Promise<GameState | null>
  save(state: GameState): Promise<void>
  clear(): Promise<void>
}

export type SaveEnvelope = {
  schemaVersion: 1
  saveId: string
  savedAt: string
  checksum: string
  payload: GameState
}
```

**저장 슬롯**

- `waiton.save.current`
- `waiton.save.previous`

**저장 순서**

1. 현재 저장본이 유효하면 이전 저장본으로 옮긴다.
2. 새 상태의 완전한 JSON을 현재 저장본에 기록한다.
3. 새 저장에 실패해도 이전 저장본을 삭제하지 않는다.

**불러오기 순서**

1. 현재 저장본의 JSON, 버전, 시나리오와 체크섬을 검사한다.
2. 현재 저장본이 손상되었으면 이전 저장본을 검사한다.
3. 둘 다 사용할 수 없으면 `null`을 반환한다.
4. 손상된 데이터를 사용자 동의 없이 삭제하지 않는다.

**대표 테스트**

- [ ] 전체 게임 상태를 저장하고 동일하게 복원한다.
- [ ] 잘못된 JSON을 예외 없이 거절한다.
- [ ] 현재 저장본 손상 시 이전 저장본을 사용한다.
- [ ] 삭제 명령이 두 슬롯을 모두 제거한다.

---

### 작업 8: 모바일 병원 UI와 인력 배치 선택

**생성 또는 수정 파일**

- `src/app/useGameSession.ts`
- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/features/hospital-overview/HospitalOverview.tsx`
- `src/features/hospital-overview/HospitalOverview.test.tsx`
- `src/features/department/DepartmentPanel.tsx`
- `src/features/staff-assignment/StaffAssignmentPanel.tsx`
- `src/features/feedback/ChangeSummary.tsx`
- `src/features/pause-resume/PauseOverlay.tsx`
- `src/styles/theme.css`

**필수 화면 정보**

- Wait:ON 제목
- 현재 병원 시각
- 외래와 검사실 랜드마크
- 대기 인원과 예상 대기시간
- 가장 큰 병목과 원인
- 환자 경험 지표
- 일시정지와 잠시 나가기
- 의료 안전 안내

**간호사 배치 흐름**

1. 검사실 카드를 누른다.
2. 검사실의 대기 업무와 의료진을 확인한다.
3. `간호사 지원 배치`를 누른다.
4. `검사실 처리시간` 개선을 확인한다.
5. `외래 지원 중단`과 `이동 준비 5분`을 확인한다.
6. `배치 확정`을 누른다.
7. 명령 결과를 즉시 화면에 표시한다.

**세션 훅 규칙**

- 명령 결과를 React 상태에 먼저 반영하고 저장을 요청한다.
- 현실 시간 1초마다 게임 시간 1분을 진행한다.
- 2배속은 동일한 1분 틱을 두 번 실행한다.
- 동시에 하나의 저장만 실행한다.
- 저장 중 변경이 발생하면 가장 최신 상태 한 개를 대기시킨다.
- 15초마다 자동 저장한다.
- 주요 작업 완료 직후 저장한다.
- `visibilitychange`, `pagehide`와 `잠시 나가기`에서 일시정지하고 저장한다.
- 저장 실패는 플레이를 되돌리거나 막지 않고 상태로 표시한다.

**모바일 기준**

- 앱 최대 폭 480px
- 최소 높이 `100dvh`
- 버튼 최소 크기 44px
- 기본 글자 크기 16px
- 키보드 포커스 표시
- 색상 외에 아이콘과 텍스트로 상태 표현
- `prefers-reduced-motion`에서 장식 전환 비활성화

---

### 작업 9: 이어하기와 전체 회귀 검증

**수정 파일**

- `src/app/App.tsx`
- `src/app/App.test.tsx`
- `src/app/useGameSession.ts`
- `README.md`

**시작 화면 규칙**

- 정상 저장본이 있을 때만 `이어하기`를 표시한다.
- `새로 시작`은 초기 시나리오를 만들고 즉시 저장한다.
- 기존 저장본을 바꾸기 전 확인한다.
- 이어하기로 불러온 상태는 일시정지 상태로 시작한다.
- 사용자가 `계속하기`를 눌러야 시간이 흐른다.

**필수 회귀 테스트**

- [ ] 간호사 이동 직후 저장하면 이동 상태와 남은 시간이 복원된다.
- [ ] 백그라운드 진입 시 게임이 정지된다.
- [ ] `pagehide`에서 최신 상태 저장을 요청한다.
- [ ] 일시정지 중에는 시간이 변하지 않는다.
- [ ] 손상된 현재 저장본 대신 이전 저장본을 사용한다.
- [ ] 거절된 명령은 저장을 요청하지 않는다.
- [ ] 저장 실패 후에도 승인된 명령 결과가 화면에 남는다.
- [ ] 연속 저장 요청은 순서대로 처리되고 최신 상태가 마지막에 저장된다.

**최종 자동 검증**

```bash
npm run test:run
npm run lint
npm run build
```

**390×844 수동 검증**

1. 새 게임이 08:30에 시작한다.
2. 외래와 검사실이 가로 스크롤 없이 보인다.
3. 간호사 배치 전에 장점 하나와 주의점 두 개가 보인다.
4. 배치 확정 직후 결과 피드백이 보인다.
5. 일시정지하면 병원 시각이 멈춘다.
6. 백그라운드 복귀 시 일시정지 화면이 열린다.
7. 새로고침하면 이어하기를 선택할 수 있다.
8. 간호사 이동 작업과 남은 시간이 복원된다.
9. 소리나 색상에만 의존하는 정보가 없다.
10. 의료 안전 안내를 읽을 수 있다.

---

## 8. 프로토타입 완료 조건

- [ ] 외래에서 검사실까지 첫 환자 흐름이 완료된다.
- [ ] 순환 간호사 재배치에 명확한 이득과 손실이 있다.
- [ ] 선택 결과가 대기시간과 만족도에 반영된다.
- [ ] 지연 원인이 사용자 문장으로 설명된다.
- [ ] 같은 입력은 같은 결과를 만든다.
- [ ] 자원이 중복 예약되지 않는다.
- [ ] 사용자 행동 직후 결과가 화면에 보인다.
- [ ] 저장 실패가 플레이를 막지 않는다.
- [ ] 최신 저장본 손상 시 이전 저장본으로 복구한다.
- [ ] 백그라운드와 일시정지 중에는 시간이 흐르지 않는다.
- [ ] 실제 환자정보를 입력하거나 전송하는 경로가 없다.
- [ ] 모바일 세로 화면에서 핵심 운영 상태를 확인할 수 있다.

---

## 9. 후속 구현 계획

첫 수직 슬라이스가 플레이테스트를 통과한 뒤 다음 계획을 별도로 작성한다.

1. 응급실, 수술실, 1·2·6인실 병상 배정과 병상 부족 이벤트
2. 9분 플레이 페이싱, 결과 평가, 튜토리얼과 접근성 보완
3. 셔플백 기반 제한 무작위와 규칙 기반 운영 디렉터
4. 배포, 관찰형 플레이테스트와 익명 품질 지표

