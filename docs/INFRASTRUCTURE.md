# 인프라 및 배포 설계

## 1. 환경

| 환경 | 목적 | 데이터 |
|---|---|---|
| local | 개발·자동 테스트 | 로컬 seed |
| preview | PR·발표 전 QA | 가상 데이터 |
| production-demo | 발표 및 시연 | 가상 데이터 |

실제 환자 데이터를 포함하는 운영 환경은 현재 범위에 없다.

## 2. 구성

```text
Git repository
├─ Vercel → apps/web
├─ CI → apps/api Docker image
├─ OCI → API container
└─ Supabase CLI → migrations
```

## 3. Vercel

- `apps/web`을 프로젝트 root로 설정한다.
- `main`은 production-demo에 배포한다.
- feature branch와 PR은 Preview Deployment를 사용한다.
- 환경변수는 development, preview, production을 분리한다.
- 서버 전용 비밀을 클라이언트 bundle에 포함하지 않는다.

필수 변수 예:

```text
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

## 4. OCI API

### 권장 배포

NestJS API를 multi-stage Docker image로 빌드한다.

프로토타입 선택지:

1. OCI Container Instances: 서버 운영 부담이 적음
2. OCI Compute VM + Docker Compose: 인프라 제어와 데모 설명이 쉬움

기본 권장안은 OCI Container Instances다. 팀이 VM 네트워크·TLS 운영을 발표 범위로 삼을 때만 Compute VM을 선택한다.

컨테이너 요구사항:

- non-root 사용자
- read-only root filesystem이 가능하도록 구성
- `/health/live`, `/health/ready`
- graceful shutdown
- CPU·메모리 제한
- 구조화 stdout 로그
- production dependency만 포함

## 5. API 공개

- 공개 도메인 예: `api.demo.example.com`
- HTTPS만 허용
- CORS는 Vercel production과 승인된 preview origin만 허용
- Swagger UI는 production-demo에서 인증 또는 비활성화
- health endpoint에는 상세 설정을 노출하지 않는다.

## 6. Supabase

사용 기능:

- PostgreSQL
- Auth
- 필요 시 Storage

스키마 변경:

```text
supabase migration new <name>
→ 로컬 적용·테스트
→ 리뷰
→ preview 적용
→ production-demo 승인 적용
```

원격 Dashboard에서 임의로 스키마를 변경하지 않는다.

연결:

- 마이그레이션: direct connection
- OCI 지속 백엔드: direct 또는 Supavisor session mode
- SSL 검증 적용
- ORM connection pool 상한 설정

## 7. CI/CD 단계

PR:

1. install
2. lint
3. typecheck
4. unit test
5. API integration test
6. web build
7. API Docker build
8. Vercel preview

main:

1. PR 단계 반복
2. Docker image 태그 생성
3. OCI 배포
4. smoke test
5. Vercel production-demo 배포

DB 마이그레이션은 destructive change 여부를 검토하고 별도 승인 단계로 실행한다.

## 8. 릴리스 순서

하위 호환 변경:

1. DB migration
2. API 배포
3. Web 배포

파괴적 변경은 expand-and-contract 패턴을 사용한다.

```text
새 컬럼 추가
→ API가 구·신 컬럼 동시 지원
→ 데이터 이관
→ Web 전환
→ 구 컬럼 제거
```

## 9. 롤백

- Web: 이전 Vercel deployment 승격
- API: 이전 Docker image 태그 재배포
- DB: 자동 down migration보다 전진 수정 migration 우선
- seed 데이터: production-demo에서만 재생성 가능

## 10. 관측

최소 대시보드:

- API 5xx 비율
- p50/p95 응답시간
- DB connection 수
- 인증 실패율
- 프로토콜 게시 실패
- 케이스 생성 실패

알림 후보:

- 5분간 health check 실패
- 5xx 비율 5% 초과
- DB 연결 실패 연속 발생

## 11. 백업과 복구

프로토타입:

- Supabase 제공 백업 범위를 요금제에 맞게 확인
- seed로 데모 환경 재생성 가능
- 프로토콜 데이터 export 절차 문서화

실서비스 전:

- RPO/RTO 정의
- point-in-time recovery 검토
- 분기별 복구훈련

## 12. 비용·복잡성 통제

MVP에서는 다음을 사용하지 않는다.

- Kubernetes
- 서비스 메시
- Redis
- Kafka
- 별도 검색엔진
- 다중 리전 active-active

병원 연동과 알림 규모가 실제 요구로 확인된 후 추가한다.
