# 프로젝트 문서 안내

이 디렉터리는 현재 Wait:ON 보호자 동행 발표 프로토타입의 제품,
화면, 기술과 안전 기준을 관리한다. 이전 제품 방향과 완료된 작업
기록은 [`archive`](./archive)에 보존하지만 현재 요구사항이나 구현
상태의 근거로 사용하지 않는다.

## 문서 우선순위

문서가 충돌하면 다음 순서로 해석한다.

1. [`PRODUCT_BRIEF.md`](./PRODUCT_BRIEF.md): 제품의 존재 이유와 경계
2. [`PRD.md`](./PRD.md): 기능 범위와 인수 조건
3. [`UX_SPEC.md`](./UX_SPEC.md): 화면과 사용자 상호작용
4. [`TECHNICAL_OVERVIEW.md`](./TECHNICAL_OVERVIEW.md): 현재 구현 상태
5. [`SECURITY_PRIVACY.md`](./SECURITY_PRIVACY.md): 제품화 안전 기준
6. [`REFERENCES.md`](./REFERENCES.md): 조사와 기술 근거

## 제품 문서

- [`PRODUCT_BRIEF.md`](./PRODUCT_BRIEF.md): 제품 개요, 문제, 사용자와 가치
- [`PRD.md`](./PRD.md): 제품 요구사항과 MVP 범위
- [`UX_SPEC.md`](./UX_SPEC.md): 보호자 사용자 흐름과 화면 명세

## 기술·안전·근거

- [`TECHNICAL_OVERVIEW.md`](./TECHNICAL_OVERVIEW.md): 실제 코드 기준
  아키텍처, API, 저장소와 실행 방법
- [`SECURITY_PRIVACY.md`](./SECURITY_PRIVACY.md): 인증, 권한, 감사와 개인정보 기준
- [`REFERENCES.md`](./REFERENCES.md): 제품·의료 콘텐츠·기술 근거

## 진행 중 설계

- [`superpowers/specs/2026-07-30-staff-event-workflow-design.md`](./superpowers/specs/2026-07-30-staff-event-workflow-design.md):
  병원 전산 이벤트 자동 수신, 간호사 예외 처리, 원무 안내 관리와 보호자 화면 반영 설계

## 아카이브

- [`archive/preparation-orchestration`](./archive/preparation-orchestration):
  이전 검사·수술 준비 오케스트레이션 제품 트랙
- [`archive/process`](./archive/process): 완료된 설계와 구현 계획

아카이브 문서는 의사결정 배경을 찾을 때만 사용한다. 현재 API 계약은
`packages/contracts`의 Zod 스키마와 API 테스트를 최종 기준으로 삼는다.

## 공통 작성 규칙

- 의료지침은 병원이 작성·검토·승인한 정보만 사용한다.
- `환자`, `검사`, `수술` 같은 일반어와 DB·API 필드명을 혼용하지 않는다.
- 기능 요구사항에는 고유 ID를 붙인다.
- 결정이 필요한 내용은 숨기지 않고 의사결정 항목으로 표시한다.
- 실제 환자정보를 사용하는 기능은 별도 보안·법무 검토 전 구현 범위에 포함하지 않는다.
