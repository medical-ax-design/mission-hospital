# Wait:ON 기술 설계

## 문서 정보

- 상위 문서: [`PROJECT_V2.md`](./PROJECT_V2.md), [`GAMEPLAY.md`](./GAMEPLAY.md)
- 시스템 명세: [`SYSTEMS.md`](./SYSTEMS.md)
- UX 명세: [`UX_FLOW.md`](./UX_FLOW.md)
- 문서 목적: MVP의 애플리케이션 구조, 데이터 모델, 게임 루프, 저장과 테스트 전략을 정의한다.

---

## 1. 기술 목표

1. QR 또는 링크로 모바일 브라우저에서 즉시 실행한다.
2. 핵심 게임 규칙을 UI와 분리한다.
3. 같은 입력은 같은 결과를 만드는 결정론적 시뮬레이션을 유지한다.
4. 사용자 입력은 즉시 반영하고 저장 때문에 화면을 멈추지 않는다.
5. 백그라운드 전환과 강제 종료 이후에도 진행을 복구한다.
6. 실제 환자정보와 의료정보를 받거나 전송하지 않는다.

---

## 2. 권장 기술 구성

### 애플리케이션

- React
- TypeScript
- Vite
- CSS Modules 또는 범위가 제한된 일반 CSS
- SVG 기반 병원 단면과 아이콘

### 테스트

- Vitest
- React Testing Library
- 브라우저 기반 핵심 흐름 테스트

### 저장

- 첫 MVP: 브라우저 로컬 저장소
- 저장 어댑터 인터페이스를 통해 게임 엔진과 분리
- 데이터가 커지면 IndexedDB 어댑터로 교체 가능

### 사용하지 않는 기술

- Unity 또는 Unreal
- 3D 렌더링 엔진
- 물리 엔진
- 실시간 멀티플레이
- 서버 필수 구조
- 생성형 AI API

MVP는 데이터 중심의 2D 운영 시뮬레이션이므로 범용 게임 엔진보다 웹 UI 기술이 배포와 중단·복귀에 적합하다.

---

## 3. 애플리케이션 구조

```text
src/
├── app/
│   ├── App.tsx
│   ├── routes.ts
│   └── providers/
├── game/
│   ├── engine/
│   │   ├── advanceTime.ts
│   │   ├── applyCommand.ts
│   │   ├── evaluateTasks.ts
│   │   ├── resolveEffects.ts
│   │   └── calculateMetrics.ts
│   ├── models/
│   ├── scheduler/
│   ├── director/
│   ├── events/
│   ├── scenarios/
│   └── selectors/
├── features/
│   ├── onboarding/
│   ├── hospital-overview/
│   ├── department/
│   ├── event-choice/
│   ├── pause-resume/
│   └── result/
├── persistence/
│   ├── SaveAdapter.ts
│   ├── LocalStorageSaveAdapter.ts
│   ├── migrations/
│   └── validation/
├── components/
├── styles/
└── main.tsx
```

### 경계

- `game/`은 React를 import하지 않는다.
- UI는 게임 상태를 직접 수정하지 않고 명령을 전달한다.
- 저장 모듈은 게임 규칙을 알지 못한다.
- 콘텐츠 데이터는 엔진 코드와 분리한다.
- 결과 설명은 상태 변화 기록에서 생성한다.

---

## 4. 상태 모델

```ts
type GameState = {
  schemaVersion: number
  scenarioId: string
  randomSeed: number
  gameTime: number
  speed: 0 | 1 | 2
  phase: "playing" | "event" | "paused" | "result"
  patients: Record<string, Patient>
  staff: Record<string, Staff>
  departments: Record<string, Department>
  facilities: Record<string, Facility>
  bedPools: Record<RoomType, BedPool>
  tasks: Record<string, Task>
  schedules: Record<string, ScheduleEntry>
  events: EventState
  director: DirectorState
  metrics: Metrics
  changes: StateChange[]
  tutorial: TutorialState
}
```

### 파생 상태

다음 값은 저장하지 않고 원본 상태에서 계산한다.

- 부서별 예상 대기시간
- 병목 순위
- 사용 가능한 의료진 목록
- PX 종합 점수
- 화면에 표시할 상위 경고

파생 상태를 저장하지 않으면 복구 후 불일치 가능성을 줄일 수 있다.

---

## 5. 명령과 효과

UI는 다음과 같은 명령을 엔진에 전달한다.

```ts
type GameCommand =
  | { type: "ASSIGN_STAFF"; staffId: string; departmentId: string }
  | { type: "SCHEDULE_REST"; staffId: string }
  | { type: "REORDER_TASK"; taskId: string; beforeTaskId: string }
  | { type: "SEND_GUIDANCE"; patientId: string }
  | { type: "CHOOSE_EVENT"; eventId: string; choiceId: string }
  | { type: "ASSIGN_BED"; patientId: string; roomType: RoomType }
  | { type: "SET_SPEED"; speed: 0 | 1 | 2 }
  | { type: "PAUSE" }
  | { type: "RESUME" }
```

명령 처리 결과:

```ts
type CommandResult = {
  accepted: boolean
  nextState: GameState
  effects: Effect[]
  changes: StateChange[]
  rejection?: {
    reason: string
    suggestedCommand?: GameCommand
  }
}
```

거부된 명령도 UI 피드백에 필요한 이유와 대안을 반환한다.

---

## 6. 게임 루프

### 시계

- UI 렌더 프레임과 게임 시간 틱을 분리한다.
- 현실 시간 1초마다 게임 시간 1분을 진행한다.
- 2배속에서는 같은 결정론적 틱을 두 번 실행한다.
- 탭이 백그라운드로 가면 틱을 중지한다.

### 틱 함수

```ts
function advanceOneGameMinute(state: GameState): GameState
```

함수는 외부 시간, DOM, 네트워크와 전역 난수에 의존하지 않는다. 난수는 `randomSeed`가 있는 전용 생성기를 사용한다.

### 즉시 입력

1. UI가 명령 전송
2. 엔진이 메모리 상태에 즉시 적용
3. UI가 결과 렌더링
4. 저장 요청을 큐에 등록
5. 저장 실패 시 플레이는 유지하고 재시도

저장 완료 전까지 입력을 막지 않는다.

---

## 7. 작업 스케줄러

### 조건 데이터

```ts
type Requirement =
  | { type: "TIME_REACHED"; at: number }
  | { type: "TASK_COMPLETED"; taskId: string }
  | { type: "STAFF_AVAILABLE"; role: StaffRole; count: number }
  | { type: "FACILITY_AVAILABLE"; facilityId: string }
  | { type: "DEPARTMENT_OPEN"; departmentId: string }
  | { type: "BED_AVAILABLE"; roomType: RoomType; count: number }
```

조건을 콜백 함수로 저장하지 않는다.

### 재평가 인덱스

대기 작업을 조건 종류별로 인덱싱한다.

```text
staff:doctor → 관련 작업 ID
facility:lab-1 → 관련 작업 ID
task:test-07 → 의존 작업 ID
time:630 → 해당 시각 작업 ID
```

관련 상태가 바뀔 때만 작업을 재평가한다. 전체 대기열을 매 프레임 폴링하지 않는다.

### 자원 예약

예약 로직은 순수 함수로 작성하고 다음을 보장한다.

- 전부 예약하거나 전부 실패
- 중복 예약 없음
- 작업 취소 시 즉시 해제
- 저장 후 동일한 예약 관계 복원

---

## 8. 이벤트와 운영 디렉터

### MVP 고정 시나리오

```ts
type ScenarioEvent = {
  id: string
  triggerAt?: number
  triggerCondition?: SerializableCondition
  choices: EventChoice[]
  phase: "buildup" | "peak" | "recovery"
}
```

MVP 이벤트 순서는 콘텐츠 데이터에 고정한다.

### 반복 플레이

운영 디렉터는 다음 순수 함수로 표현한다.

```ts
function evaluateDirector(state: GameState): DirectorDecision
```

출력:

- 아무 행동 없음
- 페이싱 상태 변경
- 허용된 이벤트 후보
- 회복 구간 연장
- 고압 이벤트 억제

운영 디렉터는 LLM 호출이나 실제 사용자 프로파일을 사용하지 않는다.

---

## 9. 저장 구조

### 저장 봉투

```ts
type SaveEnvelope = {
  schemaVersion: number
  saveId: string
  savedAt: string
  checksum: string
  payload: GameState
}
```

### 슬롯

- `current`: 최신 저장본
- `previous`: 직전 정상 저장본
- `meta`: 이어하기 화면에 필요한 최소 정보

### 저장 큐

- 동시에 하나의 저장만 수행한다.
- 저장 중 새 요청이 오면 `dirty` 플래그만 설정한다.
- 현재 저장이 끝난 뒤 최신 상태를 다시 저장한다.
- 완성되지 않은 JSON을 정상 슬롯에 덮어쓰지 않는다.

### 마이그레이션

```text
저장본 읽기
→ 스키마 버전 확인
→ 순차 마이그레이션
→ 유효성 검증
→ 게임 상태 복구
```

마이그레이션 실패 시 `previous` 저장본을 시도하고 사용자 동의 없이 데이터를 삭제하지 않는다.

---

## 10. 화면 렌더링

### 병원 단면

- HTML과 SVG를 기본으로 사용한다.
- 부서 배치는 CSS Grid로 구성한다.
- 환자와 의료진은 DOM 또는 SVG 아이콘으로 표시한다.
- 많은 캐릭터를 개별 물리 객체로 만들지 않는다.
- 화면 밖 부서는 숫자와 작업 상태만 갱신한다.

### 성능

- 엔진 상태 전체를 매 렌더마다 복제하지 않는다.
- 선택자를 사용해 화면에 필요한 파생 상태만 구독한다.
- 장식 애니메이션은 게임 틱과 분리한다.
- 모션 줄이기에서는 장식 애니메이션을 비활성화한다.

---

## 11. 테스트 전략

### 단위 테스트

- 작업 조건 평가
- 자원 원자적 예약
- 상태 전이
- 지표 계산
- 이벤트 효과
- 연쇄 제한
- 디렉터 상태 전환
- 저장 마이그레이션

### 결정론 테스트

같은 초기 상태, 시드와 명령 목록을 두 번 실행해 최종 상태가 같은지 확인한다.

### 속성 테스트

- 병상 수가 음수가 되지 않음
- 한 의료진이 두 작업에 예약되지 않음
- 지표가 0~100을 벗어나지 않음
- 완료 작업의 자원이 모두 해제됨
- 일시정지 중 게임 시간이 변하지 않음

### 통합 테스트

- 새 게임부터 첫 이벤트 해결
- 의료진 재배치와 부작용
- 병상 부족 선택
- 잠시 나가기와 이어하기
- 백그라운드 전환
- 하루 결과 생성

### UI 테스트

- 차단 이유 표시
- 선택 전 예상 영향
- 색상 외 상태 표현
- 모션 줄이기
- 저장 실패 안내

---

## 12. 기술 수용 기준

1. 게임 엔진은 React 없이 단위 테스트할 수 있다.
2. 같은 입력과 시드는 같은 결과를 만든다.
3. UI 입력 후 다음 렌더에서 결과가 보인다.
4. 저장이 느리거나 실패해도 게임 조작이 멈추지 않는다.
5. 예약 충돌과 중복 지표 차감이 발생하지 않는다.
6. 최신 저장본이 손상되면 이전 정상 저장본을 시도한다.
7. 백그라운드 전환 시 게임 시간이 멈춘다.
8. 실제 환자정보를 입력하거나 전송하는 코드 경로가 없다.
9. 병원 단면은 모바일 세로 화면에서 스크롤 없이 핵심 상태를 보여준다.
10. 핵심 게임 규칙은 자동 테스트로 검증된다.
