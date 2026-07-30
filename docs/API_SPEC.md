# 현재 API 계약

Base URL 예시: `http://localhost:3001`

모든 요청과 응답은 JSON이다. Web은 `packages/contracts`의 Zod
스키마로 응답을 검증하며 계약과 다른 성공 응답을 화면 상태로
사용하지 않는다.

## 1. 보호자 여정

| Method | Path | 응답 |
|---|---|---|
| `GET` | `/caregiver-journeys/demo` | `CaregiverJourneyResponse` |
| `POST` | `/caregiver-journeys/demo/link` | `CaregiverJourneyResponse` |
| `POST` | `/caregiver-journeys/demo/tasks/{taskId}/complete` | `CaregiverJourneyResponse` |
| `POST` | `/caregiver-journeys/demo/advance` | `CaregiverJourneyResponse` |
| `POST` | `/caregiver-journeys/demo/scenarios/{scenarioId}/select` | `CaregiverJourneyResponse` |

`scenarioId`는 `gastric-surgery` 또는 `morning-colonoscopy`다. 지원하지
않는 값은 `400`을 반환한다.

## 2. 제한 안내

| Method | Path | 응답 |
|---|---|---|
| `GET` | `/caregiver-journeys/demo/restrictions` | `RestrictionGuidanceResponse` |
| `GET` | `/caregiver-journeys/demo/restrictions/search?q={query}` | `RestrictionSearchResponse` |
| `POST` | `/caregiver-journeys/demo/restrictions/advance` | `RestrictionGuidanceResponse` |

제한 API는 오전 대장내시경 시나리오에서만 사용한다. 다른 시나리오인
경우 `400`을 반환한다. 검색어는 공백 제거 후 1자 이상 80자 이하의
단일 문자열이며, 빈 값·배열·초과 길이는 `400`이다.

`POST /caregiver-journeys/demo/advance`는 위암 수술 시나리오에서만
사용하며 대장내시경 시나리오에서는 `400`을 반환한다. 대장내시경
준비 단계는 제한 전용 advance API로만 전환한다.

검색 결과의 `resultType`은 다음 두 값만 허용한다.

- `DO_NOT_PROVIDE`
- `CHECK_BEFORE_PROVIDING`

## 3. 저장 질문

| Method | Path | 요청·응답 |
|---|---|---|
| `GET` | `/caregiver-journeys/demo/questions` | `SavedQuestionListResponse` |
| `POST` | `/caregiver-journeys/demo/questions` | `{ "query": "커피" }` → `SavedQuestionResponse` |
| `POST` | `/caregiver-journeys/demo/questions/{questionId}/complete` | `SavedQuestionResponse` |
| `DELETE` | `/caregiver-journeys/demo/questions/{questionId}` | `{ "deleted": true }` |

질문 검색어는 공백 제거 후 1자 이상 80자 이하다. 존재하지 않는
질문을 완료하거나 삭제하면 `404`를 반환한다.

## 4. 오류

NestJS 기본 오류 본문을 사용한다. Web은 상태코드를
`CaregiverJourneyApiError`로 변환하고 사용자에게 내부 오류나
의료적 추론 결과를 표시하지 않는다.
