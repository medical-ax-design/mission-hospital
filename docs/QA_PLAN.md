# QA 및 검증 계획

## 1. 목표

- 핵심 폐쇄 루프가 실제 DB와 API에서 동작하는지 확인한다.
- 프로토콜 버전과 환자 스냅샷이 깨지지 않는지 확인한다.
- 역할과 조직 경계를 우회할 수 없는지 확인한다.
- 고령 환자가 최소 설명으로 현재 작업을 수행할 수 있는지 확인한다.

## 2. 테스트 계층

### 단위 테스트

- 프로토콜 게시 가능 여부
- 단계 오프셋 검증
- 케이스 상태 계산
- 예외 우선순위 정렬
- 응답 타입 검증
- idempotency 결과 재사용

### API 통합 테스트

- PostgreSQL test schema 또는 격리 DB 사용
- 트랜잭션과 unique constraint 확인
- JWT 역할별 endpoint 접근
- 케이스 생성 시 작업 스냅샷 확인
- 감사 로그 생성 확인

### 웹 컴포넌트 테스트

- 검색 빈 상태와 중복 경고
- 게시 확인 modal
- 환자 현재 작업
- 도움 요청
- 오류 후 입력 보존

### E2E

브라우저에서 데모 시나리오 전체를 자동화한다.

## 3. 필수 테스트 케이스

### CAT

- CAT-001 이름 일부로 Procedure 검색
- CAT-002 외부 코드로 검색
- CAT-003 외부 코드 없이 등록
- CAT-004 동일 외부 코드 중복 거부
- CAT-005 비활성 Procedure로 케이스 생성 거부

### PRO

- PRO-001 단계 없는 초안 게시 거부
- PRO-002 유효한 프로토콜 게시 성공
- PRO-003 게시 프로토콜 수정 거부
- PRO-004 새 버전 생성 시 단계 복제
- PRO-005 새 버전 게시 시 기존 버전 RETIRED
- PRO-006 Procedure별 PUBLISHED 하나만 유지

### CASE

- CASE-001 게시 프로토콜 없는 Procedure 케이스 생성 거부
- CASE-002 케이스와 모든 작업 원자적 생성
- CASE-003 작업 기한 오프셋 계산
- CASE-004 새 프로토콜 게시 후 기존 작업 불변
- CASE-005 취소 케이스 신규 응답 거부

### TASK

- TASK-001 허용 응답 완료
- TASK-002 다른 response type 거부
- TASK-003 도움 요청 상태 전환
- TASK-004 STAFF 도움 요청 처리
- TASK-005 같은 Idempotency-Key 중복 요청 결과 동일

### AUTH

- AUTH-001 미인증 쓰기 거부
- AUTH-002 STAFF 프로토콜 게시 거부
- AUTH-003 PATIENT 카탈로그 조회 거부
- AUTH-004 다른 조직 리소스 접근 거부
- AUTH-005 비활성 계정 거부

### AUDIT

- AUDIT-001 게시 이벤트 기록
- AUDIT-002 도움 요청 처리 기록
- AUDIT-003 로그에 토큰이 포함되지 않음
- AUDIT-004 일반 API에서 수정·삭제 불가

## 4. 사용성 테스트

대상:

- 팀 외부 5명 이상
- 가능하면 40대 이상 사용자 2명 이상
- 의료 경험이 없는 사용자 포함

환자 과제:

1. 현재 해야 할 일을 말한다.
2. 완료 상태를 입력한다.
3. 이해하기 어려운 상황에서 도움을 요청한다.
4. 전체 준비 일정으로 이동한다.

의료진 과제:

1. 대장내시경을 검색한다.
2. 프로토콜 단계를 확인한다.
3. 가상 환자 일정을 만든다.
4. 도움 요청 환자를 찾는다.

측정:

- 과제 성공 여부
- 첫 행동까지 걸린 시간
- 도움 요청 발견 시간
- 잘못 누른 횟수
- 의료 판단 도구로 오해했는지

## 5. 접근성 검증

- Chrome keyboard navigation
- 200% zoom
- 360×800 모바일 viewport
- 색상 제거 상태 캡처
- 화면 읽기 프로그램의 제목·버튼 순서
- focus trap과 modal 닫기
- 최소 터치 영역

## 6. 성능 검증

프로토타입 데이터:

- Procedure 1,000개
- Protocol 2,000개
- Preparation Case 10,000개
- Case Task 50,000개

검증:

- 카탈로그 검색 explain plan
- 대시보드 쿼리 p95
- attention partial index 사용
- N+1 query 여부

## 7. 보안 검증

- RLS 활성 여부 자동 검사
- 외부 코드 unique partial index
- service role 브라우저 bundle 검색
- CORS allowlist
- 보안 헤더
- SQL injection 기본 페이로드
- 로그 redaction
- 만료 JWT 거부

## 8. 배포 전 체크리스트

- lint, typecheck, test, build 성공
- migration이 빈 DB에 적용
- seed 적용
- health live/ready 성공
- production-demo 환경변수 확인
- 실제 환자정보 없음
- Demo Hospital 표시
- API 문서와 구현 일치
- 이전 API image 롤백 가능
- 발표 시나리오 2회 연속 성공

## 9. 결함 등급

| 등급 | 기준 | 발표 전 처리 |
|---|---|---|
| Blocker | 로그인, 게시, 케이스 생성, 환자 응답 불가 | 반드시 수정 |
| Critical | 권한 우회, 데이터 혼합, 스냅샷 변경 | 반드시 수정 |
| Major | 핵심 흐름 우회 필요, 모바일 사용 어려움 | 원칙적으로 수정 |
| Minor | 문구, 정렬, 비핵심 스타일 | 기록 후 판단 |
