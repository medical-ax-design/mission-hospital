import {
  HospitalGuideCatalogSchema,
  type GuideBuildingId,
  type GuidePlace,
} from '@ready-on/contracts';

const checkedAt = '2026-07-30';
const guideRoot =
  'https://www.samsunghospital.com/_newhome/info/guide';
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
      sourceUrl: `${guideRoot}/${definition.directory}/${definition.floors[0]}.html`,
      floors: definition.floors.map((code) => {
        const level = floorLevel(code);
        return {
          code,
          level,
          label: floorLabel(level),
          mapImageUrl: imageUrl(id, definition.directory, code),
          sourceUrl: `${guideRoot}/${definition.directory}/${code}.html`,
          sourceCheckedAt: checkedAt,
          publicationStatus: 'PUBLIC',
          places: placesByFloor[`${id}:${code}`] ?? [],
        };
      }),
    })),
    purposes: [],
  });
