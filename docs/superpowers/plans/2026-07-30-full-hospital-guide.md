# Wait:ON 전체 병원 이용 안내 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 보호자가 `서류 발급` 목적에서 공식 처리 방법과 장소를 확인하고, 삼성서울병원 네 건물의 공개 전체 층을 탐색하되 병원 승인 경로가 없으면 붉은 이동선을 표시하지 않는 이용 안내를 구현한다.

**Architecture:** 공용 Zod 계약이 병원 안내 카탈로그와 목적 결과를 정의하고 NestJS API가 출처가 명시된 정적 공식 데이터를 제공한다. Next.js 화면은 목적 중심 진입과 전체 층 탐색을 같은 카탈로그로 구성하며, 길찾기 모델은 `VERIFIED`, `MAP_ONLY`, `UNAVAILABLE` 상태를 명시적으로 반환한다. 엘리베이터와 에스컬레이터 선은 승인된 노드·층 연결 데이터가 있는 경우에만 층별 구간으로 렌더링한다.

**Tech Stack:** TypeScript 5.9, Zod, NestJS, React 19, Next.js 15, Vitest, Testing Library, CSS

## Global Constraints

- 본관 공개 층은 `B3F`, `B2F`, `B1F`, `1F`부터 `20F`다.
- 별관 공개 층은 `B3F`, `B2F`, `B1F`, `1F`부터 `8F`다.
- 암병원 공개 층은 `B3F`, `B2F`, `B1F`, `1F`부터 `11F`다.
- 양성자치료센터 공개 층은 `B3F`, `B1F`다.
- 검증되지 않은 `3번 키오스크`, 창구번호, 번호표, 운영시간과 예상 대기시간을 노출하지 않는다.
- 병원 승인 경로가 없으면 붉은 이동선과 움직이는 사용자 표식을 노출하지 않는다.
- 엘리베이터·에스컬레이터 경로는 현재 층, 층 전환, 도착 층으로 분리한다.
- 에스컬레이터 선택지는 승인된 입구·출구 쌍, 방향과 운행 상태가 있을 때만 노출한다.
- 주요 버튼 높이는 최소 `48px`다.
- 지도 없이도 시설번호, 시설명, 공식 원문 링크를 사용할 수 있어야 한다.

---

## 파일 구조

- `packages/contracts/src/hospital-guide.ts`: 카탈로그, 목적 결과와 경로 상태 Zod 계약
- `packages/contracts/src/hospital-guide.test.ts`: 계약 허용·거부 규칙
- `packages/contracts/src/index.ts`: 병원 안내 계약 export
- `apps/api/src/hospital-guide/official-hospital-guide.data.ts`: 출처가 명시된 공식 공개 데이터
- `apps/api/src/hospital-guide/hospital-guide.service.ts`: 카탈로그 조회와 목적 검색
- `apps/api/src/hospital-guide/hospital-guide.controller.ts`: 읽기 전용 API
- `apps/api/src/hospital-guide/hospital-guide.module.ts`: Nest 모듈
- `apps/api/src/hospital-guide/hospital-guide.service.test.ts`: 층 범위, 출처와 검색 검증
- `apps/api/test/hospital-guide.e2e.test.ts`: API 응답 계약 검증
- `apps/api/src/app.module.ts`: 병원 안내 모듈 등록
- `apps/api/src/caregiver-journey/memory-caregiver-journey.repository.ts`: 확인되지 않은 키오스크 데이터 제거
- `apps/web/features/caregiver-journey/api.ts`: 병원 안내 API 메서드
- `apps/web/features/caregiver-journey/api.test.ts`: 요청 URL과 응답 파싱 검증
- `apps/web/features/hospital-guide/hospital-guide-model.ts`: 층 정렬, 검색, 목적 연결과 경로 상태
- `apps/web/features/hospital-guide/hospital-guide-model.test.ts`: 모델 단위 테스트
- `apps/web/features/hospital-guide/hospital-guide-test-fixtures.ts`: 웹 모델·화면 공용 테스트 데이터
- `apps/web/features/hospital-guide/components/hospital-guide-home-screen.tsx`: 목적 검색과 전체 안내 진입
- `apps/web/features/hospital-guide/components/purpose-result-screen.tsx`: 서류 발급 처리 방법과 장소
- `apps/web/features/hospital-guide/components/building-directory-screen.tsx`: 네 건물 전체 층 탐색
- `apps/web/features/hospital-guide/components/floor-detail-screen.tsx`: 공식 지도와 시설 목록
- `apps/web/features/hospital-guide/components/safe-navigation-screen.tsx`: `MAP_ONLY`와 승인 경로 안내
- `apps/web/features/caregiver-journey/caregiver-journey-app.tsx`: 새 화면 상태 연결
- `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`: 보호자 여정 통합 테스트
- `apps/web/app/globals.css`: 목적·층·지도·fallback 화면 스타일
- `docs/REFERENCES.md`: 공식 자료, 확인일과 데이터 사용 범위
- `docs/UX_SPEC.md`: 최종 화면 흐름과 경로 신뢰도 규칙

### Task 1: 공용 병원 안내 계약

**Files:**
- Create: `packages/contracts/src/hospital-guide.ts`
- Create: `packages/contracts/src/hospital-guide.test.ts`
- Modify: `packages/contracts/src/index.ts`

**Interfaces:**
- Produces: `HospitalGuideCatalog`, `HospitalGuidePurposeResult`, `HospitalGuideCatalogResponseSchema`, `HospitalGuidePurposeResponseSchema`, `RouteAvailability`
- Consumes: 없음

- [ ] **Step 1: 실패하는 계약 테스트 작성**

```ts
import { describe, expect, it } from 'vitest';
import {
  HospitalGuideCatalogResponseSchema,
  RouteAvailabilitySchema,
} from './hospital-guide';

describe('hospital guide contracts', () => {
  it('양성자치료센터와 지하층을 포함한 공식 층을 허용한다', () => {
    const parsed = HospitalGuideCatalogResponseSchema.parse({
      catalog: {
        checkedAt: '2026-07-30',
        buildings: [{
          id: 'PROTON',
          name: '양성자치료센터',
          sourceUrl: 'https://www.samsunghospital.com/_newhome/info/guide/proton/B1F.html',
          floors: [{
            code: 'B1F',
            level: -1,
            label: '지하 1층',
            mapImageUrl: 'https://www.samsunghospital.com/map.jpg',
            sourceUrl: 'https://www.samsunghospital.com/_newhome/info/guide/proton/B1F.html',
            sourceCheckedAt: '2026-07-30',
            publicationStatus: 'PUBLIC',
            places: [],
          }],
        }],
        purposes: [],
      },
    });
    expect(parsed.catalog.buildings[0]?.id).toBe('PROTON');
  });

  it('DEMO 경로를 운영 가능한 경로로 해석하지 않는다', () => {
    expect(() => RouteAvailabilitySchema.parse({
      status: 'VERIFIED',
      sourceStatus: 'DEMO',
      segments: [{
        kind: 'WALK',
        floorKey: 'MAIN:1F',
        label: '출입구에서 원무까지',
        startNodeId: 'main-1f-gate',
        endNodeId: 'main-1f-affairs',
        points: [[10, 10], [20, 20]],
      }],
    })).toThrow();
  });
});
```

- [ ] **Step 2: 계약 테스트가 실패하는지 확인**

Run: `npm test -- hospital-guide.test.ts`

Expected: FAIL with `Cannot find module './hospital-guide'`.

- [ ] **Step 3: 최소 계약 구현**

`HospitalBuildingSchema`에는 `PROTON`을 추가하고 아래 계약을
`hospital-guide.ts`에 정의한다.

```ts
import { z } from 'zod';

export const GuideBuildingIdSchema = z.enum([
  'MAIN', 'ANNEX', 'CANCER', 'PROTON',
]);
export const GuideSourceStatusSchema = z.enum([
  'HOSPITAL_VERIFIED', 'OFFICIAL_PUBLIC', 'DEMO', 'UNKNOWN',
]);
export const RouteStatusSchema = z.enum([
  'VERIFIED', 'MAP_ONLY', 'UNAVAILABLE',
]);
export const GuidePlaceSchema = z.object({
  id: z.string().min(1),
  officialNumber: z.string().min(1).nullable(),
  officialName: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  mapX: z.number().min(0).max(100).nullable(),
  mapY: z.number().min(0).max(100).nullable(),
  sourceStatus: GuideSourceStatusSchema,
});
export const GuideFloorSchema = z.object({
  code: z.string().regex(/^(B[1-9]|[1-9][0-9]*)F$/),
  level: z.number().int(),
  label: z.string().min(1),
  mapImageUrl: z.url().nullable(),
  sourceUrl: z.url(),
  sourceCheckedAt: z.iso.date(),
  publicationStatus: z.literal('PUBLIC'),
  places: z.array(GuidePlaceSchema),
});
export const GuideBuildingSchema = z.object({
  id: GuideBuildingIdSchema,
  name: z.string().min(1),
  sourceUrl: z.url(),
  floors: z.array(GuideFloorSchema).min(1),
});
export const ServiceChannelSchema = z.enum(['ONLINE', 'MOBILE', 'ONSITE']);
export const HospitalGuidePurposeSchema = z.object({
  id: z.string().min(1),
  category: z.literal('DOCUMENT'),
  name: z.string().min(1),
  searchTerms: z.array(z.string().min(1)).min(1),
  options: z.array(z.object({
    id: z.string().min(1),
    channel: ServiceChannelSchema,
    placeId: z.string().min(1).nullable(),
    title: z.string().min(1),
    requiredItems: z.array(z.string().min(1)),
    orderedSteps: z.array(z.string().min(1)).min(1),
    sourceUrl: z.url(),
    sourceStatus: GuideSourceStatusSchema,
  })).min(1),
});
export const HospitalGuideCatalogSchema = z.object({
  checkedAt: z.iso.date(),
  buildings: z.array(GuideBuildingSchema).length(4),
  purposes: z.array(HospitalGuidePurposeSchema),
});
export const HospitalGuideCatalogResponseSchema = z.object({
  catalog: HospitalGuideCatalogSchema,
});
export const HospitalGuidePurposeResultSchema = z.object({
  purpose: HospitalGuidePurposeSchema,
  places: z.array(z.object({
    buildingId: GuideBuildingIdSchema,
    floorCode: z.string(),
    place: GuidePlaceSchema,
  })),
});
export const HospitalGuidePurposeResponseSchema = z.object({
  result: HospitalGuidePurposeResultSchema,
});
const RoutePointSchema = z.tuple([
  z.number().min(0).max(100),
  z.number().min(0).max(100),
]);
const WalkSegmentSchema = z.object({
  kind: z.literal('WALK'),
  floorKey: z.string().min(1),
  label: z.string().min(1),
  startNodeId: z.string().min(1),
  endNodeId: z.string().min(1),
  points: z.array(RoutePointSchema).min(2),
});
const ElevatorTransitionSchema = z.object({
  kind: z.literal('VERTICAL'),
  mode: z.literal('ELEVATOR'),
  fromFloorKey: z.string().min(1),
  toFloorKey: z.string().min(1),
  entryNodeId: z.string().min(1),
  exitNodeId: z.string().min(1),
  entryPoint: RoutePointSchema,
  exitPoint: RoutePointSchema,
  bankId: z.string().min(1),
});
const EscalatorTransitionSchema = z.object({
  kind: z.literal('VERTICAL'),
  mode: z.literal('ESCALATOR'),
  fromFloorKey: z.string().min(1),
  toFloorKey: z.string().min(1),
  entryNodeId: z.string().min(1),
  exitNodeId: z.string().min(1),
  entryPoint: RoutePointSchema,
  exitPoint: RoutePointSchema,
  direction: z.enum(['UP', 'DOWN']),
  operatingStatus: z.literal('OPEN'),
});
const VerifiedRouteSchema = z.object({
  status: z.literal('VERIFIED'),
  sourceStatus: z.literal('HOSPITAL_VERIFIED'),
  segments: z.array(z.union([
    WalkSegmentSchema,
    ElevatorTransitionSchema,
    EscalatorTransitionSchema,
  ])).min(1),
});
export const RouteAvailabilitySchema = z.discriminatedUnion('status', [
  VerifiedRouteSchema,
  z.object({ status: z.literal('MAP_ONLY'), sourceUrl: z.url() }),
  z.object({ status: z.literal('UNAVAILABLE'), reason: z.string().min(1) }),
]);

export type HospitalGuideCatalog = z.infer<typeof HospitalGuideCatalogSchema>;
export type HospitalGuidePurposeResult = z.infer<typeof HospitalGuidePurposeResultSchema>;
export type RouteAvailability = z.infer<typeof RouteAvailabilitySchema>;
export type GuideFloor = z.infer<typeof GuideFloorSchema>;
export type GuidePlace = z.infer<typeof GuidePlaceSchema>;
```

- [ ] **Step 3a: 공용 index에서 계약 export**

`packages/contracts/src/index.ts`에서
`HospitalGuideCatalogResponseSchema`,
`HospitalGuidePurposeResponseSchema`, `RouteAvailabilitySchema`와 세
응답 타입, `GuideFloor`, `GuidePlace`를 `./hospital-guide.js`로
export한다.

- [ ] **Step 4: 계약 테스트와 기존 타입 검사를 통과시키기**

Run: `npm test -- hospital-guide.test.ts && npm run typecheck --workspace @ready-on/contracts`

Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add packages/contracts/src/hospital-guide.ts packages/contracts/src/hospital-guide.test.ts packages/contracts/src/caregiver-journey.ts packages/contracts/src/index.ts
git commit -m "feat: define hospital guide contracts"
```

### Task 2: 공식 공개 층 카탈로그 API

**Files:**
- Create: `apps/api/src/hospital-guide/official-hospital-guide.data.ts`
- Create: `apps/api/src/hospital-guide/hospital-guide.service.ts`
- Create: `apps/api/src/hospital-guide/hospital-guide.controller.ts`
- Create: `apps/api/src/hospital-guide/hospital-guide.module.ts`
- Create: `apps/api/src/hospital-guide/hospital-guide.service.test.ts`
- Create: `apps/api/test/hospital-guide.e2e.test.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `HospitalGuideCatalogSchema`, `HospitalGuidePurposeResponseSchema`
- Produces: `HospitalGuideService.getCatalog()` and `HospitalGuideService.findPurpose(query: string)`

- [ ] **Step 1: 전체 층과 출처를 요구하는 실패 테스트 작성**

```ts
it('네 건물의 공개 전체 층을 지하부터 제공한다', () => {
  const catalog = service.getCatalog();
  expect(catalog.buildings.find(({ id }) => id === 'MAIN')?.floors.map(({ code }) => code))
    .toEqual(['B3F', 'B2F', 'B1F', '1F', '2F', '3F', '4F', '5F', '6F', '7F', '8F', '9F', '10F', '11F', '12F', '13F', '14F', '15F', '16F', '17F', '18F', '19F', '20F']);
  expect(catalog.buildings.find(({ id }) => id === 'ANNEX')?.floors).toHaveLength(11);
  expect(catalog.buildings.find(({ id }) => id === 'CANCER')?.floors).toHaveLength(14);
  expect(catalog.buildings.find(({ id }) => id === 'PROTON')?.floors.map(({ code }) => code))
    .toEqual(['B3F', 'B1F']);
});

it('모든 공개 층에 공식 원문과 확인일이 있다', () => {
  for (const building of service.getCatalog().buildings) {
    for (const floor of building.floors) {
      expect(floor.sourceUrl).toContain('samsunghospital.com');
      expect(floor.sourceCheckedAt).toBe('2026-07-30');
    }
  }
});
```

- [ ] **Step 2: 서비스 테스트 실패 확인**

Run: `npm test -- hospital-guide.service.test.ts`

Expected: FAIL with missing hospital guide service.

- [ ] **Step 3: 출처가 고정된 카탈로그 데이터 작성**

`official-hospital-guide.data.ts`에 다음 층 배열과 URL 생성 규칙을
넣는다. 배열에 없는 URL은 생성하지 않는다.

```ts
const floors = {
  MAIN: ['B3F', 'B2F', 'B1F', ...Array.from({ length: 20 }, (_, index) => `${index + 1}F`)],
  ANNEX: ['B3F', 'B2F', 'B1F', ...Array.from({ length: 8 }, (_, index) => `${index + 1}F`)],
  CANCER: ['B3F', 'B2F', 'B1F', ...Array.from({ length: 11 }, (_, index) => `${index + 1}F`)],
  PROTON: ['B3F', 'B1F'],
} as const;

const directories = {
  MAIN: 'hospital',
  ANNEX: 'etc',
  CANCER: 'cancer',
  PROTON: 'proton',
} as const;
```

각 `Floor`에는 `sourceUrl`,
`https://www.samsunghospital.com/_newhome/info/guide/{directory}/{floor}.html`
을 넣는다. `mapImageUrl`은 공식 페이지에서 실제 이미지 URL이
확인된 층만 저장하고, 확인하지 못한 층은 `null`로 두어 화면이
시설 목록과 원문 링크로 복구되게 한다. 공개 자료에서 확인한 시설은
정확한 공식 명칭과 번호만 `places`에 넣으며, 좌표는 모두 `null`로
둔다.

- [ ] **Step 4: 조회 서비스와 읽기 전용 컨트롤러 구현**

```ts
@Controller('hospital-guide')
export class HospitalGuideController {
  constructor(private readonly service: HospitalGuideService) {}

  @Get('catalog')
  getCatalog() {
    return { catalog: this.service.getCatalog() };
  }

  @Get('purposes/search')
  findPurpose(@Query('q') query = '') {
    return { result: this.service.findPurpose(query) };
  }
}
```

`findPurpose`는 공백을 정리한 뒤 목적 이름과 `searchTerms`를
대소문자 구분 없이 검색한다. 결과가 없으면 `NotFoundException`을
던지고 장소를 생성하지 않는다.

- [ ] **Step 5: API 계약 e2e 테스트 작성**

```ts
it('/hospital-guide/catalog (GET)', async () => {
  const response = await request(app.getHttpServer())
    .get('/hospital-guide/catalog')
    .expect(200);
  expect(HospitalGuideCatalogResponseSchema.parse(response.body).catalog.buildings)
    .toHaveLength(4);
});

it('/hospital-guide/purposes/search?q=없는업무 (GET)', () =>
  request(app.getHttpServer())
    .get('/hospital-guide/purposes/search?q=없는업무')
    .expect(404));
```

- [ ] **Step 6: API 단위·e2e 테스트 통과**

Run: `npm test -- hospital-guide && npm run typecheck --workspace @ready-on/api`

Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add apps/api/src/hospital-guide apps/api/src/app.module.ts apps/api/test/hospital-guide.e2e.test.ts
git commit -m "feat: serve official hospital floor catalog"
```

### Task 3: 서류 발급 목적과 허위 키오스크 제거

**Files:**
- Modify: `apps/api/src/hospital-guide/official-hospital-guide.data.ts`
- Modify: `apps/api/src/hospital-guide/hospital-guide.service.test.ts`
- Modify: `apps/api/src/caregiver-journey/memory-caregiver-journey.repository.ts`
- Modify: `apps/api/src/caregiver-journey/caregiver-journey.service.test.ts`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`

**Interfaces:**
- Consumes: `HospitalGuidePurposeSchema`
- Produces: 목적 ID `document-issuance`와 공식 방문 장소 참조

- [ ] **Step 1: 검증되지 않은 데이터를 금지하는 실패 테스트 작성**

```ts
it('서류 발급 결과에 확인되지 않은 3번 키오스크가 없다', () => {
  const result = service.findPurpose('서류 발급');
  expect(JSON.stringify(result)).not.toContain('3번 키오스크');
  expect(result.purpose.options.every(({ sourceStatus }) =>
    sourceStatus === 'OFFICIAL_PUBLIC' ||
    sourceStatus === 'HOSPITAL_VERIFIED')).toBe(true);
});
```

`caregiver-journey.service.test.ts`에는 위암 수술 demo의 `guide`가
확인되지 않은 키오스크와 예상 이동시간을 포함하지 않는다고
검증한다.

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- hospital-guide.service.test.ts caregiver-journey.service.test.ts`

Expected: FAIL because current demo contains `3번 키오스크`.

- [ ] **Step 3: 공식 서류 발급 옵션 추가**

`document-issuance` 목적은 공식 제증명 발급 안내와 간편서류발급기
공지 두 출처만 사용한다. `ONLINE`, `MOBILE`, `ONSITE` 옵션을
출처가 확인된 범위에서 작성하고, 방문 장소는 공식 공개 안내에
표시된 본관 1·2층, 별관 B2·B1·1층, 암병원 1·2층의
`간편서류발급기` 또는 공식 원무 시설만 참조한다. 특정 기계 번호,
대기시간과 번호표 여부는 저장하지 않는다.

- [ ] **Step 4: demo 여정에서 가짜 목적 안내 제거**

`createSurgeryJourney()`의 `guide`는 `null`로 바꾸고, 현재
`입원 서류 발급` 업무는 새 병원 안내 API의
`document-issuance` 목적 화면으로 연결한다. 기존
`PurposeGuideSchema`는 하위 호환을 위해 유지하지만 demo 데이터에서
더 이상 사용하지 않는다.

- [ ] **Step 5: 테스트 통과**

Run: `npm test -- hospital-guide.service.test.ts caregiver-journey.service.test.ts`

Expected: PASS and no `3번 키오스크` in serialized API test fixtures.

- [ ] **Step 6: 커밋**

```bash
git add apps/api/src/hospital-guide apps/api/src/caregiver-journey packages/contracts/src/caregiver-journey.ts apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx
git commit -m "fix: remove unverified kiosk guidance"
```

### Task 4: 웹 API와 병원 안내 모델

**Files:**
- Modify: `apps/web/features/caregiver-journey/api.ts`
- Modify: `apps/web/features/caregiver-journey/api.test.ts`
- Create: `apps/web/features/hospital-guide/hospital-guide-model.ts`
- Create: `apps/web/features/hospital-guide/hospital-guide-model.test.ts`
- Create: `apps/web/features/hospital-guide/hospital-guide-test-fixtures.ts`

**Interfaces:**
- Consumes: `HospitalGuideCatalogResponseSchema`, `HospitalGuidePurposeResponseSchema`
- Produces: `getHospitalGuideCatalog()`, `searchHospitalGuidePurpose(query)`, `sortFloors`, `findFloor`, `getRouteAvailability`, `validateVerifiedRoute`

- [ ] **Step 1: 웹 API 실패 테스트 작성**

```ts
it('병원 안내 카탈로그를 계약으로 파싱한다', async () => {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
    catalog: hospitalGuideCatalogFixture,
  })));
  await expect(api.getHospitalGuideCatalog())
    .resolves.toEqual(hospitalGuideCatalogFixture);
  expect(fetchMock).toHaveBeenCalledWith(
    'http://localhost:3001/hospital-guide/catalog',
    { method: 'GET' },
  );
});
```

- [ ] **Step 2: 모델 실패 테스트 작성**

```ts
it('지하층을 먼저, 지상층을 숫자순으로 정렬한다', () => {
  expect(sortFloors([
    createGuideFloor('10F', 10),
    createGuideFloor('B1F', -1),
    createGuideFloor('2F', 2),
    createGuideFloor('B3F', -3),
  ]).map(({ code }) => code)).toEqual(['B3F', 'B1F', '2F', '10F']);
});

it('승인 경로가 없으면 공식 지도 전용 상태를 반환한다', () => {
  const floor = createGuideFloor('1F', 1);
  expect(getRouteAvailability(floor, null)).toEqual({
    status: 'MAP_ONLY',
    sourceUrl: expect.stringContaining('samsunghospital.com'),
  });
});

it('에스컬레이터 입구와 보행선 끝점이 다르면 승인 경로를 거부한다', () => {
  const invalid = structuredClone(verifiedEscalatorRouteFixture);
  const transition = invalid.segments[1];
  if (transition?.kind === 'VERTICAL') {
    transition.entryPoint = [99, 99];
  }
  expect(validateVerifiedRoute(invalid)).toBeNull();
});
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test -- api.test.ts hospital-guide-model.test.ts`

Expected: FAIL with missing methods and module.

- [ ] **Step 4: 공용 테스트 fixture 구현**

```ts
export function createGuideFloor(code: string, level: number): GuideFloor {
  return {
    code,
    level,
    label: level < 0 ? `지하 ${Math.abs(level)}층` : `${level}층`,
    mapImageUrl: null,
    sourceUrl: `https://www.samsunghospital.com/_newhome/info/guide/hospital/${code}.html`,
    sourceCheckedAt: '2026-07-30',
    publicationStatus: 'PUBLIC',
    places: [],
  };
}
```

같은 파일에서 `hospitalGuideCatalogFixture`,
`documentIssuanceResultFixture`, `mapOnlyRouteFixture`,
`verifiedElevatorRouteFixture`, `verifiedEscalatorRouteFixture`를 공용
계약으로 `parse`해 export한다. 승인 fixture의
`sourceStatus`는 `HOSPITAL_VERIFIED`로 고정한다.

- [ ] **Step 5: API 메서드와 순수 모델 구현**

```ts
export function sortFloors(floors: GuideFloor[]) {
  return [...floors].sort((left, right) => left.level - right.level);
}

export function getRouteAvailability(
  floor: GuideFloor,
  verifiedRoute: Extract<RouteAvailability, { status: 'VERIFIED' }> | null,
): RouteAvailability {
  return verifiedRoute ?? { status: 'MAP_ONLY', sourceUrl: floor.sourceUrl };
}
```

`getHospitalGuideCatalog`과 `searchHospitalGuidePurpose`는 응답을
공용 Zod 계약으로 파싱한다. 목적 검색은
`/hospital-guide/purposes/search?q={encoded}`를 사용한다.
`CaregiverJourneyApi` 인터페이스와 `createFakeApi()` 기본 구현에도
두 메서드를 추가해 기존 화면 테스트가 병원 안내 카탈로그를
명시적으로 주입받게 한다.

`validateVerifiedRoute(route)`는 각 `VERTICAL` 앞뒤의 `WALK`가
존재하고 다음 조건을 모두 만족할 때만 route를 반환한다.

```ts
previousWalk.floorKey === transition.fromFloorKey
previousWalk.endNodeId === transition.entryNodeId
previousWalk.points.at(-1) === transition.entryPoint
nextWalk.floorKey === transition.toFloorKey
nextWalk.startNodeId === transition.exitNodeId
nextWalk.points[0] === transition.exitPoint
```

점 비교는 `x`, `y` 두 숫자를 각각 비교한다. 하나라도 다르면
`null`을 반환해 호출자가 `MAP_ONLY`로 낮춘다.

- [ ] **Step 6: 테스트와 타입 검사 통과**

Run: `npm test -- api.test.ts hospital-guide-model.test.ts && npm run typecheck --workspace @ready-on/web`

Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add apps/web/features/caregiver-journey/api.ts apps/web/features/caregiver-journey/api.test.ts apps/web/features/hospital-guide
git commit -m "feat: add hospital guide client model"
```

### Task 5: 목적 기반 홈과 서류 발급 결과

**Files:**
- Create: `apps/web/features/hospital-guide/components/hospital-guide-home-screen.tsx`
- Create: `apps/web/features/hospital-guide/components/purpose-result-screen.tsx`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.tsx`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `HospitalGuideCatalog`, `HospitalGuidePurposeResult`
- Produces: `onOpenPurpose`, `onOpenDirectory`, `onOpenPlace` UI callbacks

- [ ] **Step 1: 사용자 흐름 실패 테스트 작성**

```ts
it('서류 발급 목적에서 공식 처리 방법과 전체 층 안내로 이동한다', async () => {
  const apiWithHospitalGuide = createFakeApi({
    getDemo: vi.fn().mockResolvedValue({ ...unlinkedJourney, linked: true }),
    getHospitalGuideCatalog: vi.fn().mockResolvedValue(hospitalGuideCatalogFixture),
    searchHospitalGuidePurpose: vi.fn().mockResolvedValue(documentIssuanceResultFixture),
  });
  render(<CaregiverJourneyApp api={apiWithHospitalGuide} />);
  await user.click(await screen.findByRole('button', { name: '이용 안내' }));
  expect(screen.getByRole('heading', { name: '무엇을 하러 가시나요?' })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '서류 발급' }));
  expect(await screen.findByRole('heading', { name: '서류 발급' })).toBeInTheDocument();
  expect(screen.queryByText(/3번 키오스크|예상 대기/)).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '전체 건물·층별 안내' })).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- caregiver-journey-app.test.tsx`

Expected: FAIL because the current service guide uses card-only navigation.

- [ ] **Step 3: 이용 안내 홈 구현**

홈은 다음 순서로 렌더링한다.

```tsx
<h1>무엇을 하러 가시나요?</h1>
<label>
  <span>목적 검색</span>
  <input type="search" value={query} onChange={...} />
</label>
<button onClick={() => onOpenPurpose('document-issuance')}>서류 발급</button>
<button onClick={onOpenDirectory}>전체 건물·층별 안내</button>
```

`수납`, `검사`, `복약`은 데이터가 없는 동안 비활성 카드로도
노출하지 않는다. 검색 결과가 없으면 장소명 대신
`전체 층별 안내에서 찾기`와 `안내 데스크에 문의`를 제공한다.

- [ ] **Step 4: 목적 결과 구현**

처리 채널은 `온라인/모바일`을 방문보다 먼저 렌더링한다. 방문 옵션은
건물, 층, 공식 시설명, 준비물, 처리 순서, 출처 링크와
`이 장소로 안내` 버튼을 제공한다. API에 없는 창구번호, 번호표,
운영시간과 예상 대기시간을 위한 빈 UI를 만들지 않는다.

- [ ] **Step 5: 화면 테스트와 접근성 검사 통과**

Run: `npm test -- caregiver-journey-app.test.tsx`

Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add apps/web/features/hospital-guide/components/hospital-guide-home-screen.tsx apps/web/features/hospital-guide/components/purpose-result-screen.tsx apps/web/features/caregiver-journey/caregiver-journey-app.tsx apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx apps/web/app/globals.css
git commit -m "feat: add purpose based hospital guide"
```

### Task 6: 전체 건물·층별 안내와 층 상세

**Files:**
- Create: `apps/web/features/hospital-guide/components/building-directory-screen.tsx`
- Create: `apps/web/features/hospital-guide/components/floor-detail-screen.tsx`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.tsx`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `HospitalGuideCatalog`, `GuideBuilding`, `GuideFloor`
- Produces: `onSelectFloor(buildingId, floorCode)` and `onSetDestination(placeId)`

- [ ] **Step 1: 전체 층 탐색 실패 테스트 작성**

```ts
it('네 건물의 지하층과 고층을 탐색한다', async () => {
  const user = userEvent.setup();
  const apiWithHospitalGuide = createFakeApi({
    getDemo: vi.fn().mockResolvedValue({ ...unlinkedJourney, linked: true }),
    getHospitalGuideCatalog: vi.fn().mockResolvedValue(hospitalGuideCatalogFixture),
    searchHospitalGuidePurpose: vi.fn().mockResolvedValue(documentIssuanceResultFixture),
  });
  render(<CaregiverJourneyApp api={apiWithHospitalGuide} />);
  await user.click(await screen.findByRole('button', { name: '이용 안내' }));
  await user.click(screen.getByRole('button', { name: '전체 건물·층별 안내' }));
  expect(screen.getByRole('tab', { name: '본관' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: '별관' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: '암병원' })).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: '양성자치료센터' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /지하 3층/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /20층/ })).toBeInTheDocument();
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test -- caregiver-journey-app.test.tsx`

Expected: FAIL because no directory screen exists.

- [ ] **Step 3: 전체 층 목록 구현**

건물은 ARIA tab으로, 층은 지하/지상 제목 아래 세로 버튼 목록으로
렌더링한다. 각 버튼은 `aria-current`로 선택 층을 표시한다. 검색은
`officialName`과 `aliases`만 대상으로 하며 결과가 없는 층도 숨기지
않고 공식 원문 링크를 유지한다.

- [ ] **Step 4: 층 상세와 이미지 실패 복구 구현**

```tsx
{floor.mapImageUrl && !imageFailed ? (
  <img src={floor.mapImageUrl} onError={() => setImageFailed(true)} alt={`${building.name} ${floor.label} 공식 안내도`} />
) : (
  <p role="status">지도를 불러오지 못했습니다. 아래 시설 목록과 공식 원문을 확인해 주세요.</p>
)}
<a href={floor.sourceUrl} target="_blank" rel="noreferrer">삼성서울병원 공식 층별 안내 원문</a>
```

선택 시설은 텍스트와 강조 스타일로 표시하되 좌표가 없으면 지도 위
마커를 임의로 만들지 않는다.

- [ ] **Step 5: 전체 층·이미지 실패 테스트 통과**

Run: `npm test -- caregiver-journey-app.test.tsx`

Expected: PASS.

- [ ] **Step 6: 커밋**

```bash
git add apps/web/features/hospital-guide/components/building-directory-screen.tsx apps/web/features/hospital-guide/components/floor-detail-screen.tsx apps/web/features/caregiver-journey/caregiver-journey-app.tsx apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx apps/web/app/globals.css
git commit -m "feat: add complete hospital floor directory"
```

### Task 7: 검증 경로 전용 길찾기와 기존 수동선 제거

**Files:**
- Delete: `apps/web/features/caregiver-journey/indoor-navigation-model.ts`
- Delete: `apps/web/features/caregiver-journey/indoor-navigation-model.test.ts`
- Replace: `apps/web/features/caregiver-journey/components/indoor-navigation-screen.tsx`
- Create: `apps/web/features/hospital-guide/components/safe-navigation-screen.tsx`
- Create: `apps/web/features/hospital-guide/components/safe-navigation-screen.test.tsx`
- Modify: `apps/web/features/caregiver-journey/caregiver-journey-app.tsx`
- Modify: `apps/web/app/globals.css`

**Interfaces:**
- Consumes: `RouteAvailability`, destination `GuidePlace`, current `GuideFloor`
- Produces: 병원 승인 경로만 렌더링하는 `SafeNavigationScreen`

- [ ] **Step 1: 수동선 금지 실패 테스트 작성**

```tsx
it('MAP_ONLY에서는 붉은 선과 사용자 애니메이션을 렌더링하지 않는다', () => {
  const floor = createGuideFloor('1F', 1);
  const destination = {
    id: 'main-general-affairs',
    officialNumber: null,
    officialName: '원무',
    aliases: ['수납'],
    mapX: null,
    mapY: null,
    sourceStatus: 'OFFICIAL_PUBLIC',
  } as const;
  render(<SafeNavigationScreen
    route={{ status: 'MAP_ONLY', sourceUrl: floor.sourceUrl }}
    floor={floor}
    destination={destination}
    onBack={vi.fn()}
  />);
  expect(screen.queryByTestId('route-line')).not.toBeInTheDocument();
  expect(screen.queryByTestId('route-user-marker')).not.toBeInTheDocument();
  expect(screen.getByText('공식 지도에서 위치를 확인하세요')).toBeInTheDocument();
});
```

- [ ] **Step 2: 층 전환 분리 실패 테스트 작성**

승인된 테스트 fixture만 사용해 다음 순서를 검증한다.

```ts
expect(screen.getByText('현재 층에서 엘리베이터 입구까지')).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: '이동 수단에 도착했어요' }));
expect(screen.getByText('1층 → 2층')).toBeInTheDocument();
await user.click(screen.getByRole('button', { name: '2층에 도착했어요' }));
expect(screen.getByText('엘리베이터 출구에서 목적지까지')).toBeInTheDocument();
```

에스컬레이터 fixture는 `direction: 'UP'`,
`fromFloor: '1F'`, `toFloor: '2F'`와 서로 다른 입구·출구 좌표를
사용한다. 선분의 모든 좌표가 `0..100` 안이고 현재 층 선의 끝점과
입구 좌표, 도착 층 선의 시작점과 출구 좌표가 일치하는지 검증한다.

- [ ] **Step 3: 테스트 실패 확인**

Run: `npm test -- safe-navigation-screen.test.tsx`

Expected: FAIL because the safe screen does not exist.

- [ ] **Step 4: 안전 길찾기 화면 구현**

`MAP_ONLY`는 공식 지도, 목적지 시설번호·시설명, 원문 링크와
`가까운 안내 데스크에 문의`만 표시한다. `UNAVAILABLE`은 이미지도
추측하지 않고 문의 상태를 표시한다.

`VERIFIED`만 SVG polyline과 사용자 표식을 렌더링한다. 각 SVG의
`viewBox="0 0 100 100"` 안에 해당 층의 segment 하나만 넣는다.
전환 단계에는 지도와 선을 렌더링하지 않는다. 다음 층은 별도의
segment로 시작한다.

- [ ] **Step 5: 기존 공통 polyline과 애니메이션 삭제**

`departurePath`, `createIndoorRoute`, `toMotionPath`, `getFirstPoint`,
`18,37 22,34 ...`, `8,46 28,37 ...` 등 수동 좌표를 삭제한다.
`PurposeGuideScreen`의 가상 평면도와 `3번 키오스크` 표기도 함께
삭제한다. CSS의 `.schematic-map`, 미검증 `.official-map__route`,
`.route-user--animated` 규칙은 승인 경로 컴포넌트에 필요한 범위로
축소한다.

- [ ] **Step 6: 경로 화면 테스트와 정적 검색 통과**

Run:

```bash
npm test -- safe-navigation-screen.test.tsx caregiver-journey-app.test.tsx
rg -n "3번 키오스크|18,37|8,46|시연용 붉은 선" apps packages
```

Expected: tests PASS; `rg` exits with no matches.

- [ ] **Step 7: 커밋**

```bash
git add apps/web/features/caregiver-journey apps/web/features/hospital-guide apps/web/app/globals.css
git commit -m "fix: show only verified indoor routes"
```

### Task 8: 접근성, 문서와 전체 검증

**Files:**
- Modify: `apps/web/app/globals.css`
- Modify: `docs/REFERENCES.md`
- Modify: `docs/UX_SPEC.md`
- Modify: `docs/API_SPEC.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: 완성된 API와 UI
- Produces: 운영·현장 검증 전 배포 가능한 `MAP_ONLY` 프로토타입

- [ ] **Step 1: 접근성 회귀 테스트 추가**

`caregiver-journey-app.test.tsx`에 다음을 추가한다.

```ts
expect(screen.getByRole('tab', { name: '본관' })).toHaveAttribute('aria-selected', 'true');
expect(screen.getByRole('button', { name: /지하 1층/ })).toHaveTextContent('지하');
expect(screen.getByRole('link', { name: '삼성서울병원 공식 층별 안내 원문' })).toHaveAttribute('href', expect.stringContaining('samsunghospital.com'));
```

- [ ] **Step 2: 공식 출처와 API 문서 갱신**

`docs/REFERENCES.md`에는 건물별 공식 원문, 제증명 발급 안내,
간편서류발급기 공지, 확인일 `2026-07-30`, 사용 범위를 기록한다.
`docs/API_SPEC.md`에는 다음 두 엔드포인트와 404 동작을 기록한다.

```text
GET /hospital-guide/catalog
GET /hospital-guide/purposes/search?q=서류%20발급
```

`docs/UX_SPEC.md`에는 `VERIFIED`, `MAP_ONLY`, `UNAVAILABLE` 화면과
엘리베이터·에스컬레이터의 층별 분리 규칙을 기록한다.

- [ ] **Step 3: 전체 검증 실행**

Run:

```bash
npm test
npm run typecheck
npm run build
git diff --check
rg -n "3번 키오스크|시연용 붉은 선|실제 병원 지도가 아닙니다" apps packages
```

Expected: all commands PASS; final `rg` exits with no matches.

- [ ] **Step 4: 모바일 화면 수동 검증**

Run: `npm run dev --workspace @ready-on/web`

Verify at `http://localhost:3000/?demo=1`:

1. `이용 안내`에서 `서류 발급`과 `전체 건물·층별 안내`가 보인다.
2. 본관 B3F와 20F, 별관 B3F와 8F, 암병원 B3F와 11F,
   양성자치료센터 B3F와 B1F를 선택할 수 있다.
3. 지도 이미지가 실패해도 시설 목록과 원문 링크가 남는다.
4. `MAP_ONLY` 화면에는 붉은 선과 움직이는 원이 없다.
5. 어떤 화면에도 `3번 키오스크`와 추정 대기시간이 없다.
6. 화면 폭 390px에서 가로 스크롤이 생기지 않는다.

- [ ] **Step 5: 최종 커밋**

```bash
git add docs README.md apps/web/app/globals.css apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx
git commit -m "docs: document verified hospital guide behavior"
```
