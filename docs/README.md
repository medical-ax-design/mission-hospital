# 프로젝트 문서 안내

이 디렉터리는 현재 Wait:ON 보호자 동행 발표 프로토타입과 후속 검사·수술 준비 누락 방지 제품 트랙의 제품, UX, 도메인, 기술 및 운영 기준을 관리한다.

현재 구현 범위는 [`PRODUCT_BRIEF.md`](./PRODUCT_BRIEF.md), [`PRD.md`](./PRD.md), [`UX_SPEC.md`](./UX_SPEC.md)를 기준으로 한다. 기존 도메인·DB·인프라 문서는 준비 누락 방지 후속 트랙의 설계 자산이며, 해당 기능이 현재 보호자 UI에 구현됐다는 뜻이 아니다.

## 문서 우선순위

문서가 충돌하면 다음 순서로 해석한다.

1. [`PRODUCT_BRIEF.md`](./PRODUCT_BRIEF.md): 제품의 존재 이유와 경계
2. [`PRD.md`](./PRD.md): 기능 범위와 인수 조건
3. [`DOMAIN_MODEL.md`](./DOMAIN_MODEL.md): 상태와 비즈니스 규칙
4. [`UX_SPEC.md`](./UX_SPEC.md): 화면과 사용자 상호작용
5. 기술 문서: DB, API, 아키텍처, 보안, 인프라
6. 제작 문서: 프로토타입, QA, 팀 운영

## 제품 문서

- [`PRODUCT_BRIEF.md`](./PRODUCT_BRIEF.md): 제품 개요, 문제, 사용자와 가치
- [`PRD.md`](./PRD.md): 제품 요구사항과 MVP 범위
- [`UX_SPEC.md`](./UX_SPEC.md): 의료진·환자·보호자 사용자 흐름과 화면 명세
- [`DOMAIN_MODEL.md`](./DOMAIN_MODEL.md): 도메인 용어, 상태 모델과 불변 조건

## 기술 문서

- [`ARCHITECTURE.md`](./ARCHITECTURE.md): 전체 시스템과 모듈 구성
- [`DATABASE.md`](./DATABASE.md): PostgreSQL 스키마, 제약조건과 인덱스
- [`API_SPEC.md`](./API_SPEC.md): REST API 계약
- [`SECURITY_PRIVACY.md`](./SECURITY_PRIVACY.md): 인증, 권한, 감사와 개인정보 기준
- [`INFRASTRUCTURE.md`](./INFRASTRUCTURE.md): Vercel, OCI, Supabase 배포 구성

## 제작·검증 문서

- [`PROTOTYPE_PLAN.md`](./PROTOTYPE_PLAN.md): 4일 발표용 프로토타입 범위와 일정
- [`QA_PLAN.md`](./QA_PLAN.md): 기능·보안·사용성 테스트
- [`TEAM_PLAN.md`](./TEAM_PLAN.md): 5인 팀 역할과 협업 방식
- [`REFERENCES.md`](./REFERENCES.md): 제품·의료 콘텐츠·기술 근거

## 공통 작성 규칙

- 의료지침은 병원이 작성·검토·승인한 정보만 사용한다.
- `환자`, `검사`, `수술` 같은 일반어와 DB·API 필드명을 혼용하지 않는다.
- 기능 요구사항에는 고유 ID를 붙인다.
- 결정이 필요한 내용은 숨기지 않고 의사결정 항목으로 표시한다.
- 실제 환자정보를 사용하는 기능은 별도 보안·법무 검토 전 구현 범위에 포함하지 않는다.
