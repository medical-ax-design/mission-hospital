# Ready:ON

Ready:ON은 병원이 승인한 검사·수술 준비사항을 환자와 보호자가 제때 수행하도록 돕고, 의료진에게는 준비가 완료되지 않은 환자만 선별해 보여주는 Medical AX 서비스입니다.

현재 단계는 실제 환자정보와 병원 시스템을 연결하지 않는 4일 발표용 프로토타입입니다.

## 기술 구성

- Web: Next.js, TypeScript, Vercel
- API: NestJS, TypeScript, OCI, Docker
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- API: REST, OpenAPI

## 문서

전체 문서와 우선순위는 [문서 안내](./docs/README.md)에서 확인할 수 있습니다.

- [제품 개요](./docs/PRODUCT_BRIEF.md)
- [제품 요구사항](./docs/PRD.md)
- [UX 및 화면 명세](./docs/UX_SPEC.md)
- [도메인 모델](./docs/DOMAIN_MODEL.md)
- [시스템 아키텍처](./docs/ARCHITECTURE.md)
- [데이터베이스 설계](./docs/DATABASE.md)
- [REST API 명세](./docs/API_SPEC.md)
- [보안·개인정보 기준](./docs/SECURITY_PRIVACY.md)
- [인프라 및 배포](./docs/INFRASTRUCTURE.md)
- [4일 프로토타입 계획](./docs/PROTOTYPE_PLAN.md)
- [QA 계획](./docs/QA_PLAN.md)
- [5인 팀 계획](./docs/TEAM_PLAN.md)
- [근거 자료](./docs/REFERENCES.md)

## 안전 경계

- AI가 의료지침을 생성하거나 승인하지 않습니다.
- 병원이 작성·검토·승인한 프로토콜만 환자에게 전달합니다.
- 준비 작업 완료와 임상적 검사 가능 판정을 구분합니다.
- 프로토타입에서는 실제 환자정보를 사용하지 않습니다.
