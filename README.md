# Wait:ON 보호자 동행 프로토타입

Wait:ON은 암 수술 환자의 보호자가 병원에서 기다리는 동안 **확인된 치료 단계**, **지금 처리할 업무**, **목적에 맞는 이동 안내**, **의료진이 확인한 설명**을 하나의 여정으로 이어서 보는 Medical AX 서비스 프로토타입입니다.

현재 구현은 4일 발표용 가상 시나리오입니다. 기존에 설계한 검사·수술 준비 누락 방지 오케스트레이션은 후속 제품 트랙으로 문서에 보존하며, 이번 UI에 구현된 것으로 간주하지 않습니다.

> 이 프로토타입의 치료 단계, 이동 경로와 의료진 설명은 모두 가상 데이터이며 실제 환자 상태 또는 의료지침이 아니다.

## 구현된 발표 여정

1. 가상 환자 김정우(68세, 위암 수술)를 보호자 김서연(딸)과 연결
2. 병원이 확인한 치료 진행 단계와 다음 안내 확인
3. 일반적인 수술 과정을 별도 교육 정보로 확인
4. 보호자 업무인 입원 서류 발급과 준비물 확인
5. 수술 대기실에서 본관 1층 키오스크까지 가상 경로 확인
6. 업무 완료 후 홈 상태 반영
7. 발표자 도구로 치료 단계 전환
8. 의료진 확인 후 진료 내용 정리와 가족 공유 미리보기 확인

## 로컬 실행

Node.js 22 이상과 npm이 필요합니다.

```bash
npm install
```

터미널 1:

```bash
npm run dev --workspace @ready-on/api
```

터미널 2:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001 npm run dev --workspace @ready-on/web
```

- 일반 화면: `http://localhost:3000`
- 발표자 도구 포함: `http://localhost:3000/?demo=1`
- API 상태: `http://localhost:3001/health`

메모리 저장소를 사용하므로 API 프로세스를 재시작하면 가상 여정은 초기화됩니다.

## 검증

```bash
npm test
npm run typecheck
npm run build
```

## 기술 구성

- Web: Next.js 16, React 19, TypeScript
- API: NestJS 11, TypeScript
- 계약 검증: Zod
- 테스트: Vitest, Testing Library, Supertest
- 후속 운영 인프라 후보: Vercel, OCI, Supabase PostgreSQL

## 문서

- [제품 개요](./docs/PRODUCT_BRIEF.md)
- [제품 요구사항](./docs/PRD.md)
- [UX 및 화면 명세](./docs/UX_SPEC.md)
- [보호자 여정 설계](./docs/superpowers/specs/2026-07-30-caregiver-journey-prototype-design.md)
- [구현 계획](./docs/superpowers/plans/2026-07-30-caregiver-journey-prototype.md)
- [전체 문서 안내](./docs/README.md)

## 안전 경계

- 실제 환자정보, 실제 삼성서울병원 경로, EMR·OCS 또는 Voice EMR을 연결하지 않습니다.
- 교육용 일반 과정과 병원이 확인한 치료 상태를 화면에서 구분합니다.
- AI가 진단, 의료지침 또는 진료 요약을 새로 만들지 않습니다.
- 가족 공유는 외부 메시지를 보내지 않는 화면 미리보기입니다.
