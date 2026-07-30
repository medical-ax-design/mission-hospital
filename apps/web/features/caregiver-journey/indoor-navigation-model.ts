import type { HospitalBuilding } from '@ready-on/contracts/caregiver-journey';

export type RouteMode = 'ELEVATOR' | 'ESCALATOR';

export interface IndoorLocation {
  building: HospitalBuilding;
  floor: string;
  landmark: string;
}

export interface HospitalMap {
  building: HospitalBuilding;
  floor: string;
  imageUrl: string;
  sourceUrl: string;
  landmarks: string[];
}

export interface MapRouteStep {
  kind: 'MAP';
  title: string;
  instruction: string;
  map: HospitalMap;
  path: string;
}

export interface TransitionRouteStep {
  kind: 'TRANSITION';
  title: string;
  instruction: string;
  icon: 'BUILDING' | RouteMode;
}

export type IndoorRouteStep = MapRouteStep | TransitionRouteStep;

const imageRoot =
  'https://www.samsunghospital.com/_newhome/ui/home/static/img/hospital/guide';
const guideRoot =
  'https://www.samsunghospital.com/_newhome/info/guide';

function createMap(
  building: HospitalBuilding,
  directory: string,
  floor: string,
  landmarks: string[],
): HospitalMap {
  return {
    building,
    floor,
    imageUrl: `${imageRoot}/${directory}/${floor}/${directory}-${floor}-0.jpg`,
    sourceUrl: `${guideRoot}/${directory}/${floor}.html`,
    landmarks,
  };
}

export const hospitalMaps = {
  MAIN: {
    '1F': createMap('MAIN', 'hospital', '1F', [
      'Gate 1',
      '안내데스크(일반안내)',
      '원무수납/접수',
      '입퇴원 수속',
    ]),
    '2F': createMap('MAIN', 'hospital', '2F', [
      '중앙 엘리베이터',
      '채혈실',
      '중환자보호대기실',
    ]),
  },
  ANNEX: {
    '1F': createMap('ANNEX', 'etc', '1F', [
      '별관 출입구',
      '원무(수납)',
      '안과(접수)',
    ]),
    '2F': createMap('ANNEX', 'etc', '2F', [
      '별관 엘리베이터',
      '국제진료소',
      '성형외과(접수)',
    ]),
  },
  CANCER: {
    '1F': createMap('CANCER', 'cancer', '1F', [
      'Gate 6',
      '안내데스크',
      '내시경접수',
      '원무수납',
    ]),
    '2F': createMap('CANCER', 'cancer', '2F', [
      '암병원 엘리베이터',
      '통원치료센터',
      '채혈접수',
    ]),
    '3F': createMap('CANCER', 'cancer', '3F', [
      '암병원 엘리베이터',
      '수술환자가족대기실',
      '중환자가족대기실',
    ]),
  },
} satisfies Record<
  HospitalBuilding,
  Record<string, HospitalMap>
>;

export const buildingLabels: Record<HospitalBuilding, string> = {
  MAIN: '본관',
  ANNEX: '별관',
  CANCER: '암병원',
};

export function getHospitalMap(
  building: HospitalBuilding,
  floor: string,
) {
  return hospitalMaps[building][
    floor as keyof (typeof hospitalMaps)[typeof building]
  ] as HospitalMap | undefined;
}

function mapStep(
  location: IndoorLocation,
  title: string,
  instruction: string,
  path: string,
): MapRouteStep {
  const map = getHospitalMap(location.building, location.floor);
  if (!map) {
    throw new Error(`Unsupported hospital map: ${location.building} ${location.floor}`);
  }

  return {
    kind: 'MAP',
    title,
    instruction,
    map,
    path,
  };
}

export function createIndoorRoute(
  start: IndoorLocation,
  destination: IndoorLocation,
  mode: RouteMode,
): IndoorRouteStep[] {
  const route: IndoorRouteStep[] = [];
  const buildingChanged = start.building !== destination.building;
  const floorChanged = start.floor !== destination.floor;

  route.push(
    mapStep(
      start,
      `${buildingLabels[start.building]} ${start.floor}에서 출발`,
      `${start.landmark}에서 붉은 선을 따라 이동하세요.`,
      buildingChanged || floorChanged
        ? '12,72 34,72 48,54 64,54 78,34'
        : '12,72 35,65 58,48 82,28',
    ),
  );

  if (buildingChanged) {
    route.push({
      kind: 'TRANSITION',
      title: `${buildingLabels[start.building]}에서 ${buildingLabels[destination.building]} 연결통로로 이동`,
      instruction:
        '연결통로 표지판을 확인하고 화면의 다음 안내를 눌러 주세요.',
      icon: 'BUILDING',
    });

    if (destination.floor !== '1F') {
      route.push(
        mapStep(
          {
            building: destination.building,
            floor: '1F',
            landmark: `${buildingLabels[destination.building]} 연결통로`,
          },
          `${buildingLabels[destination.building]} 1F 도착`,
          `${mode === 'ELEVATOR' ? '엘리베이터' : '에스컬레이터'} 표지판까지 붉은 선을 따라가세요.`,
          '10,35 30,35 48,55 66,55 84,72',
        ),
      );
    }
  }

  if (floorChanged || (buildingChanged && destination.floor !== '1F')) {
    route.push({
      kind: 'TRANSITION',
      title: `${
        mode === 'ELEVATOR' ? '엘리베이터' : '에스컬레이터'
      }로 ${destination.floor} 이동`,
      instruction:
        mode === 'ELEVATOR'
          ? `${destination.floor} 버튼을 누르고 도착 안내를 확인하세요.`
          : `${destination.floor}까지 에스컬레이터를 이어서 이용하세요.`,
      icon: mode,
    });
  }

  if (buildingChanged || floorChanged) {
    route.push(
      mapStep(
        destination,
        `${buildingLabels[destination.building]} ${destination.floor} 도착`,
        `붉은 선을 따라 ${destination.landmark}까지 이동하세요.`,
        '12,76 30,62 48,62 64,38 86,24',
      ),
    );
  }

  return route;
}
