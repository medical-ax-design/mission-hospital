# 시스템 아키텍처

## 1. 아키텍처 목표

- 프론트엔드와 도메인 API를 분리한다.
- 검사·수술 준비 규칙을 UI가 아닌 백엔드에서 일관되게 적용한다.
- 인증, 권한, 감사, 프로토콜 버전을 모든 쓰기 경로에서 강제한다.
- PostgreSQL 마이그레이션으로 스키마 변경을 추적한다.
- 실제 병원 연동 전에는 가상 환자정보만 처리한다.
- 향후 EMR·OCS 연동 모듈을 핵심 도메인과 분리한다.

## 2. 기술 구성

| 계층 | 기술 | 배포 |
|---|---|---|
| 웹 | Next.js, TypeScript | Vercel |
| API | NestJS, TypeScript, REST | OCI Container Instance 또는 Compute VM |
| 계약 | TypeScript 타입, Zod 스키마 | 모노레포 패키지 |
| DB | PostgreSQL | Supabase |
| 인증 | Supabase Auth, JWT | Supabase |
| ORM | Drizzle ORM | API 내부 |
| API 문서 | OpenAPI/Swagger | API 빌드 |
| 관측 | 구조화 로그, request ID, health endpoint | OCI |

## 3. 시스템 컨텍스트

```text
┌──────────────────┐
│ 의료진 웹         │
│ Next.js / Vercel │
└────────┬─────────┘
         │ HTTPS + JWT
         ▼
┌──────────────────┐       ┌──────────────────┐
│ NestJS API       │──────▶│ Supabase Auth    │
│ OCI              │ JWT   │ JWKS             │
└────────┬─────────┘       └──────────────────┘
         │ PostgreSQL + SSL
         ▼
┌──────────────────┐
│ Supabase Postgres│
│ RLS / Audit      │
└──────────────────┘

┌──────────────────┐
│ 환자 모바일 웹    │
│ Next.js / Vercel │
└────────┬─────────┘
         └───────────────▶ 동일 API
```

브라우저는 Supabase Auth 로그인 외에 핵심 도메인 테이블을 직접 수정하지 않는다.

## 4. 모노레포 구조

```text
apps/
├── web/
│   ├── app/
│   ├── features/
│   ├── components/
│   └── lib/
└── api/
    ├── src/
    │   ├── auth/
    │   ├── catalog/
    │   ├── protocols/
    │   ├── preparation-cases/
    │   ├── tasks/
    │   ├── dashboard/
    │   ├── audit/
    │   ├── database/
    │   └── common/
    └── test/

packages/
└── contracts/
    ├── catalog.ts
    ├── protocol.ts
    ├── preparation-case.ts
    └── errors.ts

supabase/
├── migrations/
└── seed.sql

infra/
├── api.Dockerfile
└── oci/
```

## 5. 백엔드 모듈

### Auth Module

- Supabase JWT 서명, 발급자, 만료를 검증한다.
- `sub`를 내부 프로필과 연결한다.
- 역할과 조직 컨텍스트를 요청에 주입한다.

### Catalog Module

- Procedure 검색, 생성, 수정, 비활성화
- 외부 코드와 유사 이름 중복 검사

### Protocol Module

- 초안과 단계 편집
- 유효성 검사
- 새 버전 복제
- 게시·종료 트랜잭션

### Preparation Case Module

- 게시 프로토콜 조회
- 환자 케이스와 작업 스냅샷 생성
- 케이스 상태 계산

### Task Module

- 환자 응답
- 도움 요청
- 의료진 처리
- idempotency 처리

### Dashboard Module

- 예외 우선 목록
- 날짜·부서·Procedure 필터
- 요약 집계

### Audit Module

- 도메인 변경 이벤트를 감사 레코드로 기록
- 관리자 조회

## 6. 요청 흐름

### 인증 요청

```text
브라우저 로그인
→ Supabase Auth가 JWT 발급
→ 브라우저가 Authorization: Bearer <JWT> 전송
→ API가 JWKS로 서명 검증
→ profiles에서 역할·조직 조회
→ 권한 검사
→ 도메인 처리
```

### 프로토콜 게시

```text
POST /protocols/{id}/publish
→ ADMIN 확인
→ 초안 잠금 조회
→ 단계 유효성 검사
→ 기존 PUBLISHED 버전 잠금
→ 기존 버전 RETIRED
→ 초안 PUBLISHED
→ audit_logs 기록
→ commit
```

### 환자 케이스 생성

```text
POST /preparation-cases
→ STAFF 확인
→ 활성 Procedure 확인
→ 게시 프로토콜·단계 잠금 조회
→ 케이스 생성
→ 단계 스냅샷 일괄 생성
→ 감사 로그
→ commit
```

## 7. API 설계 원칙

- REST 리소스는 복수 명사를 사용한다.
- 상태 전환은 명시적 명령 endpoint를 사용한다.
- 시간은 ISO 8601 UTC로 전송하고 화면에서 병원 시간대로 표시한다.
- 모든 오류는 공통 envelope을 사용한다.
- 모든 쓰기 요청은 `X-Request-Id`를 지원한다.
- 중복 위험이 있는 명령은 `Idempotency-Key`를 사용한다.
- 목록은 cursor 또는 page 기반 pagination을 사용한다.

## 8. 데이터 접근

OCI의 지속 실행 API는 다음 우선순위를 따른다.

1. IPv6 직접 연결이 안정적이면 direct connection
2. IPv4 제약이 있으면 Supavisor session mode
3. 모든 연결에 SSL 검증 적용

DB 계정은 마이그레이션용과 런타임용을 분리한다. 런타임 계정에는 스키마 변경 권한을 부여하지 않는다.

런타임 역할은 `BYPASSRLS` 권한을 갖지 않는다. API는 인증된 요청마다 DB 트랜잭션을 열고 검증된 `organization_id`와 `actor_id`를 transaction-local PostgreSQL 설정으로 주입한 뒤 쿼리한다. 트랜잭션 컨텍스트가 없는 쿼리는 RLS가 거부해야 한다.

## 9. 캐시

MVP에서는 외부 캐시를 사용하지 않는다.

- 카탈로그 검색은 PostgreSQL 인덱스로 처리한다.
- JWKS는 검증 라이브러리의 제한된 캐시를 사용한다.
- 프로토콜 게시 직후 정확성이 중요하므로 애플리케이션 캐시를 두지 않는다.

## 10. 백그라운드 작업

MVP에서는 작업 만료를 조회 시점에 계산한다. 실제 알림과 대량 상태 전환이 필요해지면 별도 worker를 추가한다.

```text
apps/worker
├─ task-availability
├─ reminders
└─ integrations
```

API 프로세스 안에 무제한 반복 스케줄러를 넣지 않는다.

## 11. 외부 연동 경계

향후 EMR·OCS 연동은 `integration` 모듈이 내부 명령으로 변환한다.

```text
외부 처방 이벤트
→ Adapter
→ Normalized Procedure Order
→ CreatePreparationCase
```

외부 payload를 도메인 테이블에 그대로 저장하지 않는다. 원문 보관이 필요한 경우 암호화된 별도 수신 로그와 보존정책을 둔다.

## 12. 배포 단위

- `web`: Vercel
- `api`: OCI Docker container
- `database`: Supabase managed Postgres
- `migration`: CI의 승인된 단일 작업

프론트 배포와 DB 마이그레이션을 하나의 무조건적 작업으로 묶지 않는다.
