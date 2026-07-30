# 현재 기술 개요

## 1. 범위와 기준

이 문서는 현재 저장소에서 실행되는 보호자 동행 발표 프로토타입의
기술 상태를 설명한다. 기능 계획보다 실제 코드, 공유 Zod 계약과
자동화 테스트를 우선한다.

현재 제품 범위는 암 수술 또는 오전 대장내시경 가상 환자의 보호자가
여정을 연결하고, 병원이 확인한 상태와 보호자 업무, 목적 기반 이동
안내, 의료진 확인 요약 또는 검사 제한 안내를 확인하는 흐름이다.

## 2. 모노레포 구성

| 경로 | 기술 | 책임 |
|---|---|---|
| `apps/web` | Next.js 16, React 19 | 모바일 중심 보호자 화면과 API 호출 |
| `apps/api` | NestJS 11 | 보호자 여정, 발표 상태 전환, health endpoint |
| `packages/contracts` | Zod 4 | 웹과 API가 공유하는 요청·응답 데이터 검증 |
| `supabase/migrations` | PostgreSQL SQL | 후속 검사·수술 카탈로그 기반 스키마 |

루트 npm workspace가 세 패키지의 테스트, 타입 검사와 빌드를
통합한다.

## 3. 실행 흐름

1. Web이 `NEXT_PUBLIC_API_BASE_URL`의 NestJS API를 호출한다.
2. API가 `MemoryCaregiverJourneyRepository`에서 가상 여정을
   읽거나 변경하고 `RestrictionGuidanceService`에서 대장내시경
   제한 단계와 질문을 관리한다.
3. Web은 모든 응답을 해당 공유 Zod 스키마로 검증한다.
4. 연결, 업무 완료와 발표 단계 전환 결과를 화면 상태에 반영한다.
5. 치료 시각은 `Asia/Seoul` 기준으로 표시한다.

일반 사용자 화면에는 발표 단계 전환 도구가 나타나지 않는다.
`/?demo=1`에서만 발표자 도구를 사용할 수 있다.

## 4. 구현된 API

| Method | Path | 역할 |
|---|---|---|
| `GET` | `/caregiver-journeys/demo` | 현재 가상 보호자 여정 조회 |
| `POST` | `/caregiver-journeys/demo/link` | 가상 환자와 보호자 연결 |
| `POST` | `/caregiver-journeys/demo/tasks/{taskId}/complete` | 보호자 업무 완료 |
| `POST` | `/caregiver-journeys/demo/advance` | 발표용 치료 단계 전환 |
| `POST` | `/caregiver-journeys/demo/scenarios/{scenarioId}/select` | 가상 시나리오 선택 |
| `GET` | `/caregiver-journeys/demo/restrictions` | 현재 공식 제한 목록 |
| `GET` | `/caregiver-journeys/demo/restrictions/search?q=` | 음식·행동 제한 검색 |
| `POST` | `/caregiver-journeys/demo/restrictions/advance` | 제한 단계 전환 |
| `GET` | `/caregiver-journeys/demo/questions` | 저장 질문 조회 |
| `POST` | `/caregiver-journeys/demo/questions` | 질문 저장 |
| `POST` | `/caregiver-journeys/demo/questions/{id}/complete` | 질문 확인 완료 |
| `DELETE` | `/caregiver-journeys/demo/questions/{id}` | 질문 삭제 |
| `GET` | `/health/live` | API 프로세스 생존 확인 |
| `GET` | `/health/ready` | API 준비 상태 확인 |

보호자 여정의 실행 계약은
`packages/contracts/src/caregiver-journey.ts`가 정의한다. 제한 안내와
질문 계약은 `packages/contracts/src/restriction-guidance.ts`가
정의한다. 현재 업무,
이동 안내 또는 병원 확인 시각이 없을 때는 `null`을 사용하며 Web은
임의 정보를 만들지 않고 빈 상태를 표시한다.

## 5. 데이터 저장

### 보호자 여정

현재 API는 메모리 저장소를 사용한다. API 프로세스를 재시작하면
환자 연결, 치료 단계, 업무 완료, 제한 단계와 질문 상태가 초기 가상
시나리오로 돌아간다. 실제 환자정보는 저장하지 않는다.

### 검사·수술 카탈로그 기반

`supabase/migrations/202607290001_catalog_foundation.sql`에는 다음
기반이 있다.

- 병원 조직과 사용자 프로필
- 검사·수술 카탈로그
- 조직 단위 RLS 정책
- 감사 필드와 버전 필드

`DatabaseService`와 `DrizzleCatalogRepository`는 요청 단위
PostgreSQL transaction에서 조직·사용자 컨텍스트를 설정한다.
이 저장소는 통합 테스트로 검증되지만 현재 `AppModule`에 연결된
REST API는 아니다. 보호자 여정도 아직 PostgreSQL에 저장하지 않는다.

## 6. 의료·개인정보 경계

- 모든 환자, 치료 단계, 경로와 의료진 설명은 발표용 가상 정보다.
- 실제 환자 인증과 보호자 동의 절차는 구현하지 않았다.
- EMR, OCS, Voice EMR, 병원 실내 지도와 키오스크 시스템을
  연결하지 않았다.
- AI가 진단, 치료 판단 또는 의료지침을 생성하지 않는다.
- 의료진 확인 전에는 진료 내용 요약을 표시하지 않는다.
- 제한 검색은 `DO_NOT_PROVIDE`와 `CHECK_BEFORE_PROVIDING`만
  반환하며 섭취 또는 행동을 허가하지 않는다.
- 제한 규칙은 사전 구조화한 삼성서울병원 공개 안내의 가상
  데이터이며 실제 병원 승인 콘텐츠 연동이 아니다.
- 질문은 의료진에게 자동 전송하지 않고 답변을 저장하지 않는다.
- 가족 공유는 외부 전송이 없는 화면 미리보기다.

제품화 전 필수 보안 기준은
[`SECURITY_PRIVACY.md`](./SECURITY_PRIVACY.md)를 따른다.

## 7. 로컬 실행과 검증

Node.js 22 이상과 npm이 필요하다.

```bash
npm install
npm run dev --workspace @ready-on/api
```

별도 터미널에서 Web을 실행한다.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001 \
  npm run dev --workspace @ready-on/web
```

| 환경변수 | 기본값 또는 상태 |
|---|---|
| `PORT` | API 기본값 `3001` |
| `WEB_ORIGIN` | CORS 기본값 `http://localhost:3000` |
| `NEXT_PUBLIC_API_BASE_URL` | Web 기본값 `http://localhost:3001` |
| `DATABASE_URL` | 카탈로그 통합·운영 저장소에 필요 |

전체 검증 명령은 다음과 같다.

```bash
npm test
npm run typecheck
npm run build
```

통합 테스트는 Docker로 임시 PostgreSQL을 실행할 수 있다.

## 8. 배포 목표와 미구현 연동

Vercel Web, OCI API, Supabase PostgreSQL은 목표 인프라 구성이다.
현재 저장소만으로 해당 환경에 배포가 완료되었다고 간주하지 않는다.
배포 전 환경변수, CORS, 비밀정보, migration 적용과 health check를
환경별로 검증해야 한다.

다음 항목은 병원과의 데이터·보안·운영 합의 후 별도 구현한다.

- 환자·보호자 인증과 동의
- 병원 치료 상태 연동
- 보호자 업무와 창구·키오스크 운영 데이터
- 실내 지도와 접근 가능한 이동 경로
- 의료진 확인 기록 수신
- 실제 가족 공유와 감사 로그
