# 현재 기술 개요

## 1. 범위와 기준

이 문서는 삼성서울병원 프로젝트로 현재 저장소에서 실행되는 보호자
동행 발표 프로토타입의
기술 상태를 설명한다. 기능 계획보다 실제 코드, 공유 Zod 계약과
자동화 테스트를 우선한다.

현재 제품 범위는 암 수술 또는 건강검진 오전 대장내시경 가상 환자의 보호자가
여정을 연결하고, 병원이 확인한 상태와 보호자 업무, 목적 기반 이동
안내, 월간 일정, 공식 층별 안내도 기반 이동 또는 검사 제한 안내를
확인하는 흐름이다.

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
6. 일정은 동일 시간대의 날짜로 묶어 6주 달력에 표시한다.
7. 공식 지도 이미지는 삼성서울병원 HTTPS URL에서 읽는다. 공개
   자료 상태에서는 기본적으로 경로 SVG를 만들지 않는다.
8. 경로 SVG는 `HOSPITAL_VERIFIED` 또는 현재 공식 지도에서
   출발·승강기·도착 좌표를 모두 대조한 `OFFICIAL_PUBLIC` 경로만
   렌더링한다.
9. 현재 `OFFICIAL_PUBLIC` 경로는 암병원 3층
   수술환자가족대기실→승강기→2층 원무수납 한 개다. 713×424 공식
   지도와 동일 비율의 SVG viewBox를 사용해 배경과 선을 맞춘다.

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
| `GET` | `/hospital-guide/catalog` | 공식 건물·층·시설 카탈로그 |
| `GET` | `/hospital-guide/purposes/search?q=` | 목적 기반 공식 처리 방법 |
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

- 모든 환자와 치료 단계·일정은 발표용 가상 정보다.
- 실제 환자 인증과 보호자 동의 절차는 구현하지 않았다.
- EMR, OCS, Voice EMR, 키오스크 시스템을 연결하지 않았다.
- 삼성서울병원 공식 공개 층별 안내도를 원격 배경으로 사용하지만
  자동 현 위치와 실시간 공간 운영 정보는 연결하지 않았다.
- AI가 진단, 치료 판단 또는 의료지침을 생성하지 않는다.
- 제한 검색은 `DO_NOT_PROVIDE`와 `CHECK_BEFORE_PROVIDING`만
  반환하며 섭취 또는 행동을 허가하지 않는다.
- 절대 금식 시작 시각은 공식 공개 안내의 검사 당일 오전 5시를
  사용하며, 자정 이후 금식과 장 정결제 복용 구간을 혼동하지 않는다.
- 제한 규칙은 사전 구조화한 삼성서울병원 공개 안내의 가상
  데이터이며 실제 병원 승인 콘텐츠 연동이 아니다.
- 질문은 의료진에게 자동 전송하지 않고 답변을 저장하지 않는다.

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

루트 `vercel.json`은 모노레포 전체를 설치한 뒤
`@ready-on/web`만 빌드한다. API 주소는 저장소에 기록하지 않고
Vercel의 `NEXT_PUBLIC_API_BASE_URL` 환경변수로 주입한다.

다음 항목은 병원과의 데이터·보안·운영 합의 후 별도 구현한다.

- 환자·보호자 인증과 동의
- 병원 치료 상태 연동
- 보호자 업무와 창구·키오스크 운영 데이터
- 실내 공간 그래프, 지도 버전과 접근 가능한 이동 경로

### 실내 길찾기 권장 구조

공개 층별 안내 이미지는 공간 그래프나 실시간 위치 데이터가 아니다.
제품화 시 지도 화면과 경로 계산을 분리한다.

- `Place`: 건물, 층, 검사실, 창구, 엘리베이터와 랜드마크
- `RouteNode`·`RouteEdge`: 이동 가능한 지점과 연결 관계
- `MapVersion`: 공사·이전 정보를 포함한 유효기간과 승인 상태
- `LocationFix`: 사용자가 선택했거나 QR·비콘 등으로 확인한 출발점
- `RoutePolicy`: 휠체어 경로, 직원 통제구역과 임시 폐쇄 조건

현재 프로토타입은 본관·별관·암병원·양성자치료센터의 공식 안내
이미지와 원문을 제공한다. 공개 이미지에는 이동 가능한 복도 그래프가
없으므로 기본 상태는 `MAP_ONLY`다. 다만 암병원 3층
수술환자가족대기실에서 공식 안내도의 동일 승강기를 거쳐 2층
원무수납으로 이동하는 구간은 `OFFICIAL_PUBLIC` 경로로 제공한다.
화면에서 병원 내부 승인 경로와 구분한다. 공식 안내도의
시설 번호는 데이터 대조용으로 유지하되 사용자에게는 장소명과 이동
행동을 중심으로 안내한다.
자동 실내 위치와 실제 길찾기는 병원 내부 2D 공간 데이터와 정확도
검증 없이는 구현된 것으로 표시하지 않는다.

## 9. OCI API 컨테이너 배포

`apps/api/Dockerfile`은 ARM64를 지원하는 Node.js 22 이미지에서
NestJS API를 비루트 사용자로 실행한다. 현재 `packages/contracts`가
TypeScript 소스를 export하므로 컨테이너도 로컬 개발과 동일하게
`tsx`로 API 진입점을 실행한다. 계약 패키지가 별도 JavaScript 빌드
산출물을 제공하면 런타임을 `node dist/main.js`로 교체한다.

`deploy/oci/compose.yaml`은 다음 경계를 적용한다.

- API의 `3001` 포트는 Docker 내부 네트워크에만 노출
- Caddy만 호스트의 `80`, `443/tcp`, `443/udp` 사용
- Caddy 자동 HTTPS와 NestJS readiness health check
- API와 Caddy 모두 `unless-stopped` 재시작 정책
- 실제 API 호스트와 Web Origin은 서버 전용 `.env`에서 주입

실제 공인 IP, OCI OCID, SSH 키, Vercel 토큰과 운영 환경변수는
Git에 저장하지 않는다. 배포·검증·롤백 절차는
[`deploy/oci/README.md`](../deploy/oci/README.md)에 정의한다.
