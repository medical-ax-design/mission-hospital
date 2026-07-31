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

const cancerSecondFloor = {
  ...createGuideFloor('2F', 2),
  sourceUrl:
    'https://www.samsunghospital.com/_newhome/info/guide/cancer/2F.html',
  places: [
    {
      id: 'cancer-2f-payment',
      officialNumber: '07',
      officialName: '원무수납',
      aliases: ['원무', '수납'],
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
          cancerSecondFloor,
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
            id: 'document-onsite-cancer-2f',
            channel: 'ONSITE',
            placeId: 'cancer-2f-payment',
            title: '암병원 2층 원무 수납에서 확인',
            requiredItems: [
              '환자 신분증',
              '신청자 신분증',
              '가족관계증명서',
              '환자가 자필 서명한 동의서',
            ],
            orderedSteps: [
              '필요한 서류가 홈페이지·모바일 발급 대상인지 먼저 확인하세요.',
              '최초 발급과 재발급 중 어느 경우인지 확인하세요.',
              '보호자 발급 구비서류를 준비하세요.',
              '공식 원무 수납 장소에서 발급 가능 여부를 확인하세요.',
            ],
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
        buildingId: 'CANCER',
        floorCode: '2F',
        place: cancerSecondFloor.places[0],
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
