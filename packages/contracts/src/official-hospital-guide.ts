import {
  HospitalGuideCatalogSchema,
  type GuideBuildingId,
  type GuidePlace,
  type HospitalGuidePurposeResult,
} from '@ready-on/contracts/hospital-guide';

const checkedAt = '2026-07-31';
const officialGuidePage =
  'https://www.samsunghospital.com/home/info/guide/hmain.do?new';
const standardImageRoot =
  'https://www.samsunghospital.com/_newhome/ui/home/static/img/hospital/guide';
const protonImageRoot =
  'https://www.samsunghospital.com/_newhome/ui/proton/static/img/popup_guide/proton';

const buildingDefinitions = {
  MAIN: {
    name: '본관',
    directory: 'hospital',
    floors: [
      'B3F',
      'B2F',
      'B1F',
      ...Array.from({ length: 20 }, (_, index) => `${index + 1}F`),
    ],
  },
  ANNEX: {
    name: '별관',
    directory: 'etc',
    floors: [
      'B3F',
      'B2F',
      'B1F',
      ...Array.from({ length: 8 }, (_, index) => `${index + 1}F`),
    ],
  },
  CANCER: {
    name: '암병원',
    directory: 'cancer',
    floors: [
      'B3F',
      'B2F',
      'B1F',
      ...Array.from({ length: 11 }, (_, index) => `${index + 1}F`),
    ],
  },
  PROTON: {
    name: '양성자치료센터',
    directory: 'proton',
    floors: ['B3F', 'B1F'],
  },
} satisfies Record<
  GuideBuildingId,
  { name: string; directory: string; floors: string[] }
>;

function place(
  id: string,
  officialNumber: string,
  officialName: string,
  aliases: string[] = [],
): GuidePlace {
  return {
    id,
    officialNumber,
    officialName,
    aliases,
    mapX: null,
    mapY: null,
    sourceStatus: 'OFFICIAL_PUBLIC',
  };
}

const placesByFloor: Record<string, GuidePlace[]> = {
  'MAIN:1F': [
    place('main-1f-information', '14', '안내데스크(일반안내)', [
      '안내 데스크',
    ]),
    place('main-1f-administration-team', '24', '원무팀', ['원무']),
    place('main-1f-payment', '25', '원무수납/접수', ['수납', '접수']),
    place(
      'main-1f-medical-record-copy',
      '27',
      '의무기록복사/영상복사',
      ['의무기록', '영상복사', '서류 발급'],
    ),
    place('main-1f-admission', '29', '입퇴원 수속', [
      '입원',
      '퇴원',
    ]),
  ],
  'MAIN:2F': [
    place('main-2f-icu-waiting', '15', '중환자보호대기실', [
      '보호자 대기실',
    ]),
    place('main-2f-blood-collection', '17', '채혈실', ['채혈']),
  ],
  'ANNEX:B1F': [
    place(
      'annex-b1f-surgery-reception',
      '04',
      '별관수술실접수 (보호자대기실)',
      ['수술 접수', '보호자 대기실'],
    ),
  ],
  'ANNEX:1F': [
    place('annex-1f-payment', '04', '원무(수납)', ['원무', '수납']),
  ],
  'CANCER:1F': [
    place('cancer-1f-endoscopy', '02', '내시경실', ['내시경']),
    place('cancer-1f-endoscopy-reception', '03', '내시경접수', [
      '내시경 접수',
    ]),
    place('cancer-1f-colorectal-center', '04', '대장센터', ['대장']),
    place('cancer-1f-outpatient-payment', '10', '외래수납', [
      '수납',
    ]),
    place('cancer-1f-payment', '13', '원무수납', ['원무', '수납']),
    place(
      'cancer-1f-medical-record-copy',
      '15',
      '의무기록복사/영상복사',
      ['의무기록', '영상복사', '서류 발급'],
    ),
    place('cancer-1f-information', '17', '안내데스크', [
      '안내 데스크',
    ]),
  ],
  'CANCER:3F': [
    place(
      'cancer-3f-operating-room',
      '04',
      '수술실/회복실/기관지내시경실/마취통증의학과',
      ['수술실', '회복실'],
    ),
    place(
      'cancer-3f-surgery-family-waiting',
      '05',
      '수술환자가족대기실',
      ['수술 보호자 대기실'],
    ),
    place(
      'cancer-3f-icu-family-waiting',
      '08',
      '중환자가족대기실',
      ['중환자 보호자 대기실'],
    ),
  ],
  'CANCER:11F': [
    place('cancer-11f-single-room', '05', '병동(1인실)', [
      '1인실',
    ]),
    place('cancer-11f-double-room', '06', '병동(2인실)', [
      '2인실',
    ]),
    place('cancer-11f-six-room', '08', '병동(6인실)', ['6인실']),
    place('cancer-11f-patient-lounge', '12', '환자휴게실', [
      '휴게실',
    ]),
  ],
  'MAIN:20F': [
    place('main-20f-vip-ward', '02', '병동(VIP)', ['VIP 병동']),
  ],
};

const certificateSource =
  'https://samsunghospital.com/home/healthChart/issueService/InfoIssueCertiList.do';
const caregiverRequiredItems = [
  '환자 신분증',
  '신청자 신분증',
  '가족관계증명서',
  '환자가 자필 서명한 동의서',
];
const onsiteSteps = [
  '필요한 서류가 홈페이지·모바일 발급 대상인지 먼저 확인하세요.',
  '최초 발급과 재발급 중 어느 경우인지 확인하세요.',
  '보호자 발급 구비서류를 준비하세요.',
  '공식 원무 수납 장소에서 발급 가능 여부를 확인하세요.',
];

function floorLevel(code: string) {
  const value = Number.parseInt(code, 10);
  return code.startsWith('B') ? -Number.parseInt(code.slice(1), 10) : value;
}

function floorLabel(level: number) {
  return level < 0 ? `지하 ${Math.abs(level)}층` : `${level}층`;
}

function imageUrl(
  buildingId: GuideBuildingId,
  directory: string,
  floor: string,
) {
  if (buildingId === 'CANCER' && floor === '1F') {
    return 'https://www.samsunghospital.com/_newhome/ui/home/static/img/info/guide/map/map_cancer_01.png';
  }
  if (buildingId === 'PROTON') {
    return `${protonImageRoot}/${floor}/proton-${floor}-0.png`;
  }
  return `${standardImageRoot}/${directory}/${floor}/${directory}-${floor}-0.jpg`;
}

export const officialHospitalGuideCatalog =
  HospitalGuideCatalogSchema.parse({
    checkedAt,
    buildings: (
      Object.entries(buildingDefinitions) as Array<
        [
          GuideBuildingId,
          (typeof buildingDefinitions)[GuideBuildingId],
        ]
      >
    ).map(([id, definition]) => ({
      id,
      name: definition.name,
      sourceUrl: officialGuidePage,
      floors: definition.floors.map((code) => {
        const level = floorLevel(code);
        return {
          code,
          level,
          label: floorLabel(level),
          mapImageUrl: imageUrl(id, definition.directory, code),
          sourceUrl: officialGuidePage,
          sourceCheckedAt: checkedAt,
          publicationStatus: 'PUBLIC',
          places: placesByFloor[`${id}:${code}`] ?? [],
        };
      }),
    })),
    purposes: [
      {
        id: 'document-issuance',
        category: 'DOCUMENT',
        name: '서류 발급',
        searchTerms: [
          '제증명',
          '진료비 서류',
          '진단서',
          '수술확인서',
          '입원확인서',
          '통원확인서',
          '의무기록',
        ],
        options: [
          {
            id: 'document-online',
            channel: 'ONLINE',
            placeId: null,
            title: '홈페이지에서 발급',
            requiredItems: ['환자 본인인증 수단'],
            orderedSteps: [
              '삼성서울병원 제증명 발급 페이지를 여세요.',
              '환자 본인인증을 진행하세요.',
              '발급 가능한 서류와 최초·재발급 조건을 확인하세요.',
              '출력 또는 다운로드 가능한 서류를 발급하세요.',
            ],
            sourceUrl: certificateSource,
            sourceStatus: 'OFFICIAL_PUBLIC',
          },
          {
            id: 'document-mobile',
            channel: 'MOBILE',
            placeId: null,
            title: '모바일에서 발급',
            requiredItems: ['환자 본인인증 수단'],
            orderedSteps: [
              '삼성서울병원 모바일 서비스에 로그인하세요.',
              '제증명 발급 가능 목록을 확인하세요.',
              '다운로드 가능한 서류를 발급하세요.',
            ],
            sourceUrl: certificateSource,
            sourceStatus: 'OFFICIAL_PUBLIC',
          },
          {
            id: 'document-onsite-main',
            channel: 'ONSITE',
            placeId: 'main-1f-payment',
            title: '본관 원무 수납에서 확인',
            requiredItems: caregiverRequiredItems,
            orderedSteps: onsiteSteps,
            sourceUrl: certificateSource,
            sourceStatus: 'OFFICIAL_PUBLIC',
          },
          {
            id: 'document-onsite-annex',
            channel: 'ONSITE',
            placeId: 'annex-1f-payment',
            title: '별관 원무 수납에서 확인',
            requiredItems: caregiverRequiredItems,
            orderedSteps: onsiteSteps,
            sourceUrl: certificateSource,
            sourceStatus: 'OFFICIAL_PUBLIC',
          },
          {
            id: 'document-onsite-cancer',
            channel: 'ONSITE',
            placeId: 'cancer-1f-payment',
            title: '암병원 원무 수납에서 확인',
            requiredItems: caregiverRequiredItems,
            orderedSteps: onsiteSteps,
            sourceUrl: certificateSource,
            sourceStatus: 'OFFICIAL_PUBLIC',
          },
        ],
      },
    ],
  });

export function findOfficialHospitalGuidePurpose(
  query: string,
): HospitalGuidePurposeResult | null {
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  if (!normalizedQuery) return null;

  const purpose = officialHospitalGuideCatalog.purposes.find(
    (candidate) =>
      candidate.name.toLocaleLowerCase('ko-KR').includes(normalizedQuery) ||
      candidate.searchTerms.some((term) =>
        term.toLocaleLowerCase('ko-KR').includes(normalizedQuery),
      ),
  );
  if (!purpose) return null;

  const places = purpose.options.flatMap((option) => {
    if (!option.placeId) return [];

    for (const building of officialHospitalGuideCatalog.buildings) {
      for (const floor of building.floors) {
        const matched = floor.places.find(({ id }) => id === option.placeId);
        if (matched) {
          return [
            {
              buildingId: building.id,
              floorCode: floor.code,
              place: matched,
            },
          ];
        }
      }
    }

    return [];
  });

  return { purpose, places };
}
