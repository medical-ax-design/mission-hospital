# 5인 팀 역할 및 협업 계획

## 1. 역할 배치

정해진 직무가 없으므로 4일 동안 결과물 기준으로 역할을 배치한다. 모든 팀원은 본인 영역의 코드, 테스트와 문서를 함께 책임진다.

### 1. 제품·UX 리드

책임:

- PRD와 범위 통제
- 의료진·환자 화면 흐름
- 디자인 토큰과 접근성
- 데모 문구와 발표 시나리오
- 팀 간 인수 조건 확인

주요 산출물:

- 화면 와이어프레임
- 의료진 카탈로그·프로토콜 UI
- 환자 현재 작업 UI

### 2. 프론트엔드 리드

책임:

- Next.js 애플리케이션 구조
- 인증 세션과 API client
- 의료진 대시보드
- 환자 모바일 화면
- Vercel 배포

주요 소유:

- `apps/web`
- 프론트 컴포넌트 테스트

### 3. 백엔드·도메인 리드

책임:

- NestJS 모듈과 REST API
- 프로토콜 상태 전환
- 환자 스냅샷 생성
- 권한과 idempotency
- OpenAPI

주요 소유:

- `apps/api`
- `packages/contracts`

### 4. 데이터·인프라 리드

책임:

- PostgreSQL schema와 migration
- Supabase Auth와 RLS
- OCI Docker 배포
- 환경변수와 health check
- seed·초기화·롤백

주요 소유:

- `supabase`
- `infra`

### 5. QA·통합·발표 리드

책임:

- E2E 시나리오
- API 통합 테스트
- 접근성·모바일 QA
- 배포 smoke test
- 데모 데이터와 발표 리허설
- 장애 대비 녹화본

주요 소유:

- E2E 테스트
- QA 체크리스트
- 발표 자료

## 2. 공동 책임

- 실제 환자정보 사용 금지
- 의료 문구를 실제 지침으로 표현하지 않기
- PR마다 최소 한 명 리뷰
- 맡은 기능의 테스트 작성
- 매일 범위 재확인

## 3. 작업 경계

```text
제품·UX ── 화면 상태·문구 ──▶ 프론트
프론트 ─── API 계약 ───────▶ 백엔드
백엔드 ─── 스키마·트랜잭션 ─▶ 데이터
QA ───── 인수 조건 ───────▶ 전 영역
```

API 계약을 먼저 합의하고 프론트와 백엔드를 병렬 진행한다. 계약 변경은 `packages/contracts`와 `API_SPEC.md`를 함께 수정한다.

## 4. 일일 운영

### 오전 15분

- 전일 완료
- 오늘의 데모 경로 기여 작업
- 막힌 사항
- 범위 삭제 필요 여부

### 오후 통합 20분

- main 최신 상태에서 핵심 흐름 실행
- API·DB 변경 공유
- 다음 병합 순서 결정

### 종료 전

- 배포 환경 smoke test
- Blocker 갱신
- 발표 시나리오 체크

## 5. Git 규칙

- 짧은 feature branch 사용
- 한 PR은 한 기능 또는 한 인프라 변경
- DB migration과 API 변경을 같은 PR에서 추적
- 생성된 비밀정보와 `.env` 커밋 금지
- main 직접 개발 지양
- 병합 전 lint, typecheck, test

브랜치 예:

```text
feat/procedure-catalog
feat/protocol-publishing
feat/patient-tasks
infra/oci-api
test/demo-e2e
```

## 6. 의사결정

우선순위:

1. 의료 안전 경계
2. 데모 폐쇄 루프
3. 데이터 일관성
4. 사용성
5. 시각적 완성도
6. 확장 기능

논쟁이 20분을 넘으면 제품·UX 리드가 PRD 기준으로 범위를 결정하고 결정 기록을 남긴다.

## 7. Definition of Done

기능 완료 조건:

- 인수 조건 충족
- API 또는 UI 테스트
- 오류 상태 구현
- 권한 검사
- 문서 변경
- Preview 또는 통합 환경 확인
- 실제 환자정보 없음
