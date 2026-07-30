# REST API 명세

## 1. 기본 규칙

- Base path: `/api/v1`
- Content type: `application/json`
- 인증: `Authorization: Bearer <Supabase Access Token>`
- 시간: ISO 8601 UTC
- ID: UUID
- 쓰기 요청 추적: `X-Request-Id`
- 중복 방지 대상: `Idempotency-Key`

## 2. 공통 응답

### 성공

단건:

```json
{
  "data": {}
}
```

목록:

```json
{
  "data": [],
  "meta": {
    "nextCursor": null,
    "total": 0
  }
}
```

### 오류

```json
{
  "error": {
    "code": "PUBLISHED_PROTOCOL_NOT_FOUND",
    "message": "게시된 준비 프로토콜이 없습니다.",
    "details": {
      "procedureId": "uuid"
    },
    "requestId": "req_..."
  }
}
```

클라이언트는 `message` 문자열을 분기 조건으로 사용하지 않고 `code`를 사용한다.

## 3. 오류 코드

| HTTP | 코드 | 의미 |
|---:|---|---|
| 400 | VALIDATION_ERROR | 요청 필드 오류 |
| 401 | UNAUTHENTICATED | 로그인 필요 또는 토큰 오류 |
| 403 | FORBIDDEN | 역할 또는 조직 권한 없음 |
| 404 | RESOURCE_NOT_FOUND | 리소스 없음 |
| 409 | EXTERNAL_CODE_DUPLICATE | 외부 코드 중복 |
| 409 | PUBLISHED_PROTOCOL_EXISTS | 게시 프로토콜 상태 충돌 |
| 409 | CONCURRENT_MODIFICATION | 동시 편집 충돌 |
| 422 | PROTOCOL_NOT_PUBLISHABLE | 게시 조건 미충족 |
| 422 | PUBLISHED_PROTOCOL_NOT_FOUND | 케이스에 적용할 프로토콜 없음 |
| 422 | INVALID_STATE_TRANSITION | 허용되지 않은 상태 전환 |
| 429 | RATE_LIMITED | 요청 제한 |
| 500 | INTERNAL_ERROR | 예상하지 못한 오류 |

## 4. 인증·사용자

### GET `/me`

현재 사용자, 역할과 조직을 반환한다.

응답:

```json
{
  "data": {
    "id": "uuid",
    "displayName": "홍관리",
    "role": "ADMIN",
    "organization": {
      "id": "uuid",
      "name": "Demo Hospital",
      "timezone": "Asia/Seoul"
    }
  }
}
```

## 5. 검사·수술 카탈로그

### GET `/procedures`

권한: ADMIN, STAFF

Query:

- `query`: 이름 또는 외부 코드
- `type`: `EXAM` 또는 `SURGERY`
- `department`
- `active`: 기본 `true`
- `cursor`
- `limit`: 기본 20, 최대 100

응답 항목:

```json
{
  "id": "uuid",
  "procedureType": "EXAM",
  "name": "대장내시경",
  "externalCode": null,
  "department": "소화기내과",
  "isActive": true,
  "publishedProtocol": {
    "id": "uuid",
    "version": 1,
    "publishedAt": "2026-07-29T01:00:00Z"
  }
}
```

### POST `/procedures`

권한: ADMIN

요청:

```json
{
  "procedureType": "EXAM",
  "name": "대장내시경",
  "externalCode": null,
  "department": "소화기내과",
  "description": "데모용 검사 항목"
}
```

응답: `201 Created`

### GET `/procedures/{procedureId}`

권한: ADMIN, STAFF

항목과 프로토콜 버전 요약을 반환한다.

### PATCH `/procedures/{procedureId}`

권한: ADMIN

요청:

```json
{
  "name": "대장내시경",
  "externalCode": "EXAM-001",
  "department": "소화기내과",
  "rowVersion": 1
}
```

### POST `/procedures/{procedureId}/deactivate`

권한: ADMIN

명시적 비활성화 명령이다.

## 6. 준비 프로토콜

### GET `/procedures/{procedureId}/protocols`

권한: ADMIN, STAFF

버전 역순으로 반환한다.

### POST `/procedures/{procedureId}/protocols`

권한: ADMIN

새 v1 초안을 만든다.

요청:

```json
{
  "title": "대장내시경 기본 준비",
  "applicabilityNote": "데모용 기본 프로토콜",
  "patientNotice": "병원에서 승인한 안내를 따르세요."
}
```

### POST `/protocols/{protocolId}/versions`

권한: ADMIN

현재 버전을 복제해 다음 DRAFT 버전을 생성한다.

### GET `/protocols/{protocolId}`

권한: ADMIN, STAFF

프로토콜과 모든 단계를 반환한다.

### PATCH `/protocols/{protocolId}`

권한: ADMIN

DRAFT만 수정할 수 있다.

### POST `/protocols/{protocolId}/steps`

권한: ADMIN

요청:

```json
{
  "sortOrder": 1,
  "phase": "PRE_PROCEDURE",
  "title": "3일 전 음식 확인",
  "instruction": "안내받은 식사 제한을 확인하세요.",
  "availabilityOffsetMinutes": -5760,
  "dueOffsetMinutes": -4320,
  "isRequired": true,
  "responseType": "ACKNOWLEDGE",
  "helpText": "이해하기 어려우면 도움을 요청하세요."
}
```

### PATCH `/protocols/{protocolId}/steps/{stepId}`

권한: ADMIN

DRAFT의 단계만 수정한다.

### DELETE `/protocols/{protocolId}/steps/{stepId}`

권한: ADMIN

DRAFT의 단계만 삭제한다.

### POST `/protocols/{protocolId}/publish`

권한: ADMIN

`Idempotency-Key` 권장.

응답:

```json
{
  "data": {
    "id": "uuid",
    "status": "PUBLISHED",
    "version": 2,
    "publishedAt": "2026-07-29T02:00:00Z"
  }
}
```

### POST `/protocols/{protocolId}/retire`

권한: ADMIN

현재 게시 버전을 종료한다. 새 버전 게시 없는 단독 종료도 가능하지만 확인 UI를 요구한다.

### DELETE `/protocols/{protocolId}`

권한: ADMIN

DRAFT만 삭제할 수 있다. 게시 이력이 있는 프로토콜은 삭제하지 않고 종료한다.

## 7. 환자 준비 케이스

### POST `/preparation-cases`

권한: ADMIN, STAFF

`Idempotency-Key` 필수.

요청:

```json
{
  "patientSubjectId": "uuid",
  "patientDisplayName": "김환자",
  "patientAgeLabel": "68세",
  "procedureId": "uuid",
  "scheduledAt": "2026-08-03T01:00:00Z",
  "isDemo": true
}
```

`patientSubjectId`는 프로토타입에 미리 생성한 PATIENT 역할의 가상 계정 ID다.

응답:

```json
{
  "data": {
    "id": "uuid",
    "status": "NOT_STARTED",
    "procedure": {
      "id": "uuid",
      "name": "대장내시경"
    },
    "protocolVersion": 1,
    "scheduledAt": "2026-08-03T01:00:00Z",
    "taskCount": 4
  }
}
```

### GET `/preparation-cases`

권한: ADMIN, STAFF

Query:

- `scheduledFrom`
- `scheduledTo`
- `procedureId`
- `department`
- `status`
- `attentionOnly`
- `cursor`
- `limit`

### GET `/preparation-cases/{caseId}`

권한: ADMIN, STAFF, 연결된 PATIENT

의료진과 환자는 역할에 맞는 DTO를 반환받는다. 환자 응답에는 내부 메모와 감사 정보가 포함되지 않는다.

### POST `/preparation-cases/{caseId}/cancel`

권한: ADMIN, STAFF

요청:

```json
{
  "reason": "데모 일정 변경"
}
```

### POST `/preparation-cases/{caseId}/complete`

권한: ADMIN, STAFF

Procedure 수행 종료를 표시한다. 준비 완료 판정과 구분한다.

## 8. 환자 작업

### GET `/patient/preparation-cases/{caseId}/current-task`

권한: 연결된 PATIENT

현재 AVAILABLE, OVERDUE, HELP_REQUESTED 또는 NEEDS_REVIEW 작업을 우선 반환한다.

### GET `/patient/preparation-cases/{caseId}/tasks`

권한: 연결된 PATIENT

환자용 스냅샷과 상태만 반환한다.

### POST `/patient/tasks/{taskId}/responses`

권한: 연결된 PATIENT

`Idempotency-Key` 필수.

요청 예:

```json
{
  "response": {
    "type": "COMPLETE"
  }
}
```

서버는 해당 작업의 `responseTypeSnapshot`과 요청이 일치하는지 검증한다.

### POST `/patient/tasks/{taskId}/help-requests`

권한: 연결된 PATIENT

요청:

```json
{
  "reasonCode": "INSTRUCTION_UNCLEAR"
}
```

허용 코드:

- `INSTRUCTION_UNCLEAR`
- `SUPPLY_UNAVAILABLE`
- `MISSED_TIMING`
- `MEDICATION_CONFIRMATION`
- `STAFF_REVIEW_REQUIRED`

### POST `/tasks/{taskId}/resolve`

권한: ADMIN, STAFF

요청:

```json
{
  "resolution": "RETURN_TO_AVAILABLE",
  "note": "전화로 준비방법 재안내"
}
```

## 9. 대시보드

### GET `/dashboard/preparation-summary`

권한: ADMIN, STAFF

Query:

- `date`
- `department`
- `procedureId`

응답:

```json
{
  "data": {
    "scheduled": 20,
    "needsReview": 1,
    "helpRequested": 2,
    "overdue": 3,
    "notStarted": 0,
    "inProgress": 0,
    "ready": 14
  }
}
```

### GET `/dashboard/attention-cases`

권한: ADMIN, STAFF

예외 우선순위로 정렬된 목록을 반환한다.

## 10. 감사 로그

### GET `/audit-logs`

권한: ADMIN

Query:

- `actorId`
- `entityType`
- `entityId`
- `action`
- `occurredFrom`
- `occurredTo`
- `cursor`

민감한 인증정보와 내부 DB 연결정보는 반환하지 않는다.

## 11. 운영 endpoint

### GET `/health/live`

프로세스 생존 여부만 확인한다.

### GET `/health/ready`

DB 연결과 필수 설정을 확인한다. 상세 비밀정보를 반환하지 않는다.
