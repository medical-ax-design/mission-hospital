import {
  HospitalGuideCatalogSchema,
  HospitalGuidePurposeResultSchema,
  RouteAvailabilitySchema,
  VerifiedRouteSchema,
  type GuideFloor,
} from '@ready-on/contracts/hospital-guide';

export function createGuideFloor(
  code: string,
  level: number,
): GuideFloor {
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

const mainFirstFloor = {
  ...createGuideFloor('1F', 1),
  places: [
    {
      id: 'main-1f-payment',
      officialNumber: '25',
      officialName: '원무수납/접수',
      aliases: ['원무', '수납', '서류 발급'],
      mapX: null,
      mapY: null,
      sourceStatus: 'OFFICIAL_PUBLIC' as const,
    },
  ],
};

export const hospitalGuideCatalogFixture =
  HospitalGuideCatalogSchema.parse({
    checkedAt: '2026-07-30',
    buildings: [
      {
        id: 'MAIN',
        name: '본관',
        sourceUrl: mainFirstFloor.sourceUrl,
        floors: [
          createGuideFloor('B3F', -3),
          mainFirstFloor,
          createGuideFloor('20F', 20),
        ],
      },
      {
        id: 'ANNEX',
        name: '별관',
        sourceUrl:
          'https://www.samsunghospital.com/_newhome/info/guide/etc/1F.html',
        floors: [
          {
            ...createGuideFloor('B3F', -3),
            sourceUrl:
              'https://www.samsunghospital.com/_newhome/info/guide/etc/B3F.html',
          },
          {
            ...createGuideFloor('8F', 8),
            sourceUrl:
              'https://www.samsunghospital.com/_newhome/info/guide/etc/8F.html',
          },
        ],
      },
      {
        id: 'CANCER',
        name: '암병원',
        sourceUrl:
          'https://www.samsunghospital.com/_newhome/info/guide/cancer/1F.html',
        floors: [
          {
            ...createGuideFloor('B3F', -3),
            sourceUrl:
              'https://www.samsunghospital.com/_newhome/info/guide/cancer/B3F.html',
          },
          {
            ...createGuideFloor('11F', 11),
            sourceUrl:
              'https://www.samsunghospital.com/_newhome/info/guide/cancer/11F.html',
          },
        ],
      },
      {
        id: 'PROTON',
        name: '양성자치료센터',
        sourceUrl:
          'https://www.samsunghospital.com/_newhome/info/guide/proton/B1F.html',
        floors: [
          {
            ...createGuideFloor('B3F', -3),
            sourceUrl:
              'https://www.samsunghospital.com/_newhome/info/guide/proton/B3F.html',
          },
          {
            ...createGuideFloor('B1F', -1),
            sourceUrl:
              'https://www.samsunghospital.com/_newhome/info/guide/proton/B1F.html',
          },
        ],
      },
    ],
    purposes: [
      {
        id: 'document-issuance',
        category: 'DOCUMENT',
        name: '서류 발급',
        searchTerms: ['제증명', '진료비 서류'],
        options: [
          {
            id: 'document-online',
            channel: 'ONLINE',
            placeId: null,
            title: '홈페이지에서 발급',
            requiredItems: ['환자 본인인증 수단'],
            orderedSteps: ['환자 본인인증 후 발급 가능 목록을 확인하세요.'],
            sourceUrl:
              'https://samsunghospital.com/home/healthChart/issueService/InfoIssueCertiList.do',
            sourceStatus: 'OFFICIAL_PUBLIC',
          },
          {
            id: 'document-onsite-main',
            channel: 'ONSITE',
            placeId: 'main-1f-payment',
            title: '본관 원무 수납에서 확인',
            requiredItems: ['환자 신분증', '신청자 신분증'],
            orderedSteps: ['공식 원무 수납 장소에서 확인하세요.'],
            sourceUrl:
              'https://samsunghospital.com/home/healthChart/issueService/InfoIssueCertiList.do',
            sourceStatus: 'OFFICIAL_PUBLIC',
          },
        ],
      },
    ],
  });

export const documentIssuanceResultFixture =
  HospitalGuidePurposeResultSchema.parse({
    purpose: hospitalGuideCatalogFixture.purposes[0],
    places: [
      {
        buildingId: 'MAIN',
        floorCode: '1F',
        place: mainFirstFloor.places[0],
      },
    ],
  });

export const mapOnlyRouteFixture = RouteAvailabilitySchema.parse({
  status: 'MAP_ONLY',
  sourceUrl: mainFirstFloor.sourceUrl,
});

export const verifiedElevatorRouteFixture =
  VerifiedRouteSchema.parse({
    status: 'VERIFIED',
    sourceStatus: 'HOSPITAL_VERIFIED',
    segments: [
      {
        kind: 'WALK',
        floorKey: 'MAIN:1F',
        label: '현재 위치에서 엘리베이터 입구까지',
        startNodeId: 'main-1f-start',
        endNodeId: 'main-1f-elevator',
        points: [
          [10, 20],
          [40, 40],
        ],
      },
      {
        kind: 'VERTICAL',
        mode: 'ELEVATOR',
        fromFloorKey: 'MAIN:1F',
        toFloorKey: 'MAIN:2F',
        entryNodeId: 'main-1f-elevator',
        exitNodeId: 'main-2f-elevator',
        entryPoint: [40, 40],
        exitPoint: [45, 35],
        bankId: 'main-central',
      },
      {
        kind: 'WALK',
        floorKey: 'MAIN:2F',
        label: '엘리베이터 출구에서 목적지까지',
        startNodeId: 'main-2f-elevator',
        endNodeId: 'main-2f-destination',
        points: [
          [45, 35],
          [70, 25],
        ],
      },
    ],
  });

export const verifiedEscalatorRouteFixture =
  VerifiedRouteSchema.parse({
    status: 'VERIFIED',
    sourceStatus: 'HOSPITAL_VERIFIED',
    segments: [
      {
        kind: 'WALK',
        floorKey: 'MAIN:1F',
        label: '현재 위치에서 에스컬레이터 입구까지',
        startNodeId: 'main-1f-start',
        endNodeId: 'main-1f-escalator',
        points: [
          [10, 20],
          [50, 50],
        ],
      },
      {
        kind: 'VERTICAL',
        mode: 'ESCALATOR',
        fromFloorKey: 'MAIN:1F',
        toFloorKey: 'MAIN:2F',
        entryNodeId: 'main-1f-escalator',
        exitNodeId: 'main-2f-escalator',
        entryPoint: [50, 50],
        exitPoint: [45, 45],
        direction: 'UP',
        operatingStatus: 'OPEN',
      },
      {
        kind: 'WALK',
        floorKey: 'MAIN:2F',
        label: '에스컬레이터 출구에서 목적지까지',
        startNodeId: 'main-2f-escalator',
        endNodeId: 'main-2f-destination',
        points: [
          [45, 45],
          [75, 30],
        ],
      },
    ],
  });
