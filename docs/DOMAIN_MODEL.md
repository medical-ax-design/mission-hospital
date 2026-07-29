# 도메인 모델 및 비즈니스 규칙

## 1. 목적

이 문서는 UI나 DB 구현과 독립적으로 서비스의 용어, 상태, 명령과 불변 조건을 정의한다.

## 2. 핵심 용어

### Procedure

병원이 관리하는 검사 또는 수술 항목이다. `Procedure`는 의료행위의 상세 임상 정의가 아니라 준비 프로토콜을 연결하는 카탈로그 단위다.

### Preparation Protocol

특정 Procedure에 적용되는 병원 승인 준비 지침의 버전 단위다.

### Protocol Step

환자가 특정 시점에 확인하거나 수행해야 하는 하나의 준비 단계다.

### Preparation Case

특정 환자에게 특정 일시의 Procedure 준비를 배정한 실행 단위다.

### Case Task

Preparation Case 생성 시 Protocol Step을 복사해 만든 환자별 실행 작업이다.

### Snapshot

환자에게 실제로 전달된 제목, 설명, 기한, 응답 방식을 보존한 값이다. 원본 프로토콜 변경과 무관하게 유지된다.

## 3. 식별자 규칙

- 모든 엔터티는 내부 UUID `id`를 기본키로 가진다.
- 외부 병원 코드는 `external_code`이며 기본키가 아니다.
- 다른 테이블에서는 `<entity>_id` 형태의 외래키를 사용한다.
- URL에 외부 코드를 식별자로 사용하지 않는다.

## 4. Procedure 규칙

필드:

- `id`
- `organization_id`
- `procedure_type`: `EXAM` 또는 `SURGERY`
- `name`
- `external_code`: nullable
- `department`
- `description`: nullable
- `is_active`

불변 조건:

- 이름은 공백만으로 구성할 수 없다.
- 동일 조직에서 `(external_code)`는 값이 있을 때 유일하다.
- 사용 이력이 있는 Procedure는 물리 삭제하지 않는다.
- 비활성 Procedure에는 새 프로토콜과 환자 케이스를 만들 수 없다.

## 5. 프로토콜 상태 모델

```text
DRAFT
  │ publish
  ▼
PUBLISHED
  │ supersede 또는 retire
  ▼
RETIRED
```

### DRAFT

- 내용과 단계를 수정할 수 있다.
- 환자 케이스에 적용할 수 없다.
- 삭제 대신 취소 상태를 추가할 수 있으나 MVP에서는 초안 삭제를 허용한다.

### PUBLISHED

- 환자 케이스 생성에 사용할 수 있다.
- 내용과 단계를 수정할 수 없다.
- 같은 Procedure에 하나만 존재할 수 있다.

### RETIRED

- 신규 케이스에 적용하지 않는다.
- 기존 케이스의 출처로 유지한다.
- 다시 PUBLISHED로 되돌리지 않는다.

### 버전 규칙

- 버전은 Procedure별 1부터 증가한다.
- 새 버전은 이전 버전을 복제한 DRAFT로 생성할 수 있다.
- 새 버전 게시와 기존 버전 종료는 같은 트랜잭션에서 처리한다.

## 6. Protocol Step 시간 모델

단계 시각은 Procedure 예정 시각에 대한 분 단위 오프셋으로 저장한다.

예:

| 표현 | `offset_minutes` |
|---|---:|
| 3일 전 | -4320 |
| 6시간 전 | -360 |
| 30분 전 | -30 |
| 검사 직후 | 0 |
| 1일 후 | 1440 |

추가 필드:

- `availability_offset_minutes`: 작업이 보이기 시작하는 시점
- `due_offset_minutes`: 완료 권장 시점
- `sort_order`

불변 조건:

- `availability_offset_minutes <= due_offset_minutes`
- 같은 프로토콜에서 `sort_order`는 유일하다.
- 사전 준비 프로토콜의 기본 단계는 `due_offset_minutes <= 0`이다.
- 검사 이후 단계는 명시적으로 `POST_PROCEDURE` 분류를 가져야 한다.

## 7. 환자 케이스 생성

명령:

```text
CreatePreparationCase(
  patientSubjectId,
  patientDisplayName,
  procedureId,
  scheduledAt,
  createdBy
)
```

처리:

1. Procedure가 활성인지 확인한다.
2. 현재 PUBLISHED 프로토콜을 잠금 조회한다.
3. 환자 케이스를 생성한다.
4. 프로토콜 단계마다 Case Task 스냅샷을 생성한다.
5. 기한을 `scheduled_at + offset`으로 계산한다.
6. 감사 로그를 기록한다.
7. 하나의 트랜잭션으로 커밋한다.

실패:

- 활성 Procedure 없음
- PUBLISHED 프로토콜 없음
- 유효하지 않은 예정 시각
- 단계가 없는 프로토콜

실패 시 일부 Case Task를 남기지 않는다.

## 8. Case Task 상태 모델

```text
PENDING
  │ available_at 도달
  ▼
AVAILABLE
  ├─ complete ───────────▶ COMPLETED
  ├─ request help ───────▶ HELP_REQUESTED
  ├─ answer requires review ▶ NEEDS_REVIEW
  └─ due_at 경과 ───────▶ OVERDUE

HELP_REQUESTED ── resolve ─▶ AVAILABLE 또는 COMPLETED
NEEDS_REVIEW ──── resolve ─▶ AVAILABLE 또는 COMPLETED
모든 진행 상태 ─ cancel ─▶ CANCELLED
```

규칙:

- COMPLETED와 CANCELLED는 일반 환자 행동으로 되돌리지 않는다.
- 의료진의 수정은 사유와 감사 로그가 필요하다.
- 동일 idempotency key로 같은 완료 명령이 오면 기존 결과를 반환한다.

### 시간 기반 유효 상태

MVP는 별도 worker 없이 조회 시각을 기준으로 유효 상태를 계산한다.

- 저장 상태가 `PENDING`이고 `available_at <= now()`이면 유효 상태는 `AVAILABLE`
- 미완료 작업이 `due_at < now()`이면 유효 상태는 `OVERDUE`
- 환자 응답 또는 의료진 처리처럼 쓰기가 발생하면 계산된 유효 상태를 먼저 반영하고 명령을 처리한다.
- 대시보드 집계는 동일한 SQL 표현을 사용해 상태 해석이 화면마다 달라지지 않게 한다.

## 9. Preparation Case 파생 상태

```text
if cancelled:
  CANCELLED
else if procedure completed:
  COMPLETED
else if any task in NEEDS_REVIEW, HELP_REQUESTED, OVERDUE:
  NEEDS_ATTENTION
else if all required tasks completed:
  READY
else if any task started or completed:
  IN_PROGRESS
else:
  NOT_STARTED
```

`READY`는 임상적으로 검사 또는 수술이 가능하다는 판정이 아니다. 시스템 내 필수 준비 작업이 완료됐다는 의미만 가진다.

파생 상태를 `preparation_cases.status`에 캐시한다. Case Task 상태를 변경하는 같은 트랜잭션에서 재계산한다. 시간이 지나 발생하는 `OVERDUE`는 저장값이 즉시 갱신되지 않을 수 있으므로 대시보드 쿼리는 task의 `due_at`을 포함한 유효 상태를 계산한다. 정합성 검증 테스트를 둔다.

## 10. 프로토콜 변경 영향

| 변경 | 기존 환자 케이스 | 신규 환자 케이스 |
|---|---|---|
| 새 초안 생성 | 영향 없음 | 영향 없음 |
| 새 버전 게시 | 영향 없음 | 새 버전 적용 |
| 기존 버전 종료 | 영향 없음 | 적용 불가 |
| Procedure 이름 변경 | 표시명 정책에 따라 최신 이름 표시 가능 | 최신 이름 |
| Procedure 비활성화 | 기존 케이스 유지 | 생성 불가 |

환자 안내 본문은 항상 Case Task 스냅샷을 표시한다.

## 11. 감사 규칙

감사 이벤트는 다음을 포함한다.

- `actor_id`
- `organization_id`
- `action`
- `entity_type`
- `entity_id`
- `before_data`
- `after_data`
- `request_id`
- `occurred_at`

감사 로그에는 비밀번호, 토큰, DB 연결정보를 저장하지 않는다.

## 12. 역할 규칙

### ADMIN

- Procedure 생성·수정·비활성화
- 프로토콜 초안 생성·수정·게시·종료
- 감사 로그 조회

### STAFF

- Procedure 및 게시 프로토콜 조회
- 환자 케이스 생성·조회
- 도움 요청 처리

### PATIENT

- 본인 케이스와 작업 조회
- 허용된 작업 응답
- 도움 요청

생산 환경에서는 조직 경계를 넘는 조회와 변경을 금지한다.
