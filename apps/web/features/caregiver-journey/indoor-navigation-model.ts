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

type MapKey = `${HospitalBuilding}:${string}`;

interface RouteEdge {
  from: MapKey;
  to: MapKey;
  mode: 'BUILDING' | RouteMode;
  title: string;
  instruction: string;
}

const routeEdges: RouteEdge[] = [];

function mapKey(building: HospitalBuilding, floor: string): MapKey {
  return `${building}:${floor}`;
}

function addTwoWayEdge(
  left: MapKey,
  right: MapKey,
  mode: RouteEdge['mode'],
  leftToRight: Pick<RouteEdge, 'title' | 'instruction'>,
  rightToLeft: Pick<RouteEdge, 'title' | 'instruction'>,
) {
  routeEdges.push(
    { from: left, to: right, mode, ...leftToRight },
    { from: right, to: left, mode, ...rightToLeft },
  );
}

for (const [building, floors] of Object.entries(hospitalMaps) as Array<
  [HospitalBuilding, Record<string, HospitalMap>]
>) {
  const floorNames = Object.keys(floors);
  for (let index = 0; index < floorNames.length - 1; index += 1) {
    const currentFloor = floorNames[index]!;
    const nextFloor = floorNames[index + 1]!;

    addTwoWayEdge(
      mapKey(building, currentFloor),
      mapKey(building, nextFloor),
      'ELEVATOR',
      {
        title: `${buildingLabels[building]} ${currentFloor}에서 엘리베이터로 ${nextFloor} 이동`,
        instruction: `${nextFloor} 버튼을 누르고 안내 방송을 확인하세요.`,
      },
      {
        title: `${buildingLabels[building]} ${nextFloor}에서 엘리베이터로 ${currentFloor} 이동`,
        instruction: `${currentFloor} 버튼을 누르고 안내 방송을 확인하세요.`,
      },
    );
  }
}

addTwoWayEdge(
  mapKey('MAIN', '1F'),
  mapKey('ANNEX', '1F'),
  'BUILDING',
  {
    title: '본관 1F에서 별관 1F 연결통로로 이동',
    instruction: '별관 방향 연결통로 표지판을 확인하고 이동하세요.',
  },
  {
    title: '별관 1F에서 본관 1F 연결통로로 이동',
    instruction: '본관 방향 연결통로 표지판을 확인하고 이동하세요.',
  },
);
addTwoWayEdge(
  mapKey('ANNEX', '1F'),
  mapKey('CANCER', '2F'),
  'BUILDING',
  {
    title: '별관 1F에서 암병원 2F 연결통로로 이동',
    instruction: '암병원 방향 연결통로 표지판을 확인하고 이동하세요.',
  },
  {
    title: '암병원 2F에서 별관 1F 연결통로로 이동',
    instruction: '별관 방향 연결통로 표지판을 확인하고 이동하세요.',
  },
);

function parseMapKey(key: MapKey) {
  const [building, floor] = key.split(':') as [
    HospitalBuilding,
    string,
  ];
  return { building, floor };
}

function findEdgePath(
  start: IndoorLocation,
  destination: IndoorLocation,
  mode: RouteMode,
): RouteEdge[] | null {
  const startKey = mapKey(start.building, start.floor);
  const destinationKey = mapKey(
    destination.building,
    destination.floor,
  );

  if (
    !getHospitalMap(start.building, start.floor) ||
    !getHospitalMap(destination.building, destination.floor)
  ) {
    return null;
  }

  if (startKey === destinationKey) {
    return [];
  }

  const queue: MapKey[] = [startKey];
  const visited = new Set<MapKey>([startKey]);
  const previous = new Map<MapKey, RouteEdge>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    const candidates = routeEdges.filter(
      (edge) =>
        edge.from === current &&
        (edge.mode === 'BUILDING' || edge.mode === mode),
    );

    for (const edge of candidates) {
      if (visited.has(edge.to)) continue;
      visited.add(edge.to);
      previous.set(edge.to, edge);
      if (edge.to === destinationKey) {
        queue.length = 0;
        break;
      }
      queue.push(edge.to);
    }
  }

  if (!previous.has(destinationKey)) {
    return null;
  }

  const path: RouteEdge[] = [];
  let cursor = destinationKey;
  while (cursor !== startKey) {
    const edge = previous.get(cursor);
    if (!edge) return null;
    path.unshift(edge);
    cursor = edge.from;
  }

  return path;
}

export function availableRouteModes(
  start: IndoorLocation,
  destination: IndoorLocation,
) {
  return (['ELEVATOR', 'ESCALATOR'] as const).filter(
    (mode) => findEdgePath(start, destination, mode) !== null,
  );
}

function mapStep(
  location: IndoorLocation,
  title: string,
  instruction: string,
  path: string,
): MapRouteStep | null {
  const map = getHospitalMap(location.building, location.floor);
  if (!map) {
    return null;
  }

  return {
    kind: 'MAP',
    title,
    instruction,
    map,
    path,
  };
}

function departurePath(
  start: IndoorLocation,
  destination: IndoorLocation,
  hasTransition: boolean,
) {
  if (
    !hasTransition &&
    start.building === 'MAIN' &&
    start.floor === '1F' &&
    start.landmark === 'Gate 1' &&
    destination.landmark === '3번 키오스크'
  ) {
    return '18,37 20,35 24,33';
  }

  if (
    start.building === 'MAIN' &&
    start.floor === '1F' &&
    start.landmark === 'Gate 1'
  ) {
    return '18,37 22,34 31,31 43,28 56,27 66,24 76,18';
  }

  return '12,42 27,42 39,32 58,32 76,18';
}

export function createIndoorRoute(
  start: IndoorLocation,
  destination: IndoorLocation,
  mode: RouteMode,
): IndoorRouteStep[] | null {
  const edgePath = findEdgePath(start, destination, mode);
  if (edgePath === null) return null;

  const firstMapStep = mapStep(
    start,
    `${buildingLabels[start.building]} ${start.floor}에서 출발`,
    `${start.landmark}에서 시연용 붉은 선을 따라 이동하세요.`,
    departurePath(start, destination, edgePath.length > 0),
  );
  if (!firstMapStep) return null;

  const route: IndoorRouteStep[] = [firstMapStep];

  for (const [index, edge] of edgePath.entries()) {
    route.push({
      kind: 'TRANSITION',
      title: edge.title,
      instruction: edge.instruction,
      icon: edge.mode,
    });

    const next = parseMapKey(edge.to);
    const isDestination = index === edgePath.length - 1;
    const nextLocation: IndoorLocation = {
      ...next,
      landmark: isDestination ? destination.landmark : '연결 지점',
    };
    const nextMapStep = mapStep(
      nextLocation,
      isDestination
        ? `${buildingLabels[next.building]} ${next.floor} 도착`
        : `${buildingLabels[next.building]} ${next.floor} 연결 지점`,
      isDestination
        ? `시연용 붉은 선을 따라 ${destination.landmark}까지 이동하세요.`
        : '다음 연결 지점까지 시연용 붉은 선을 따라 이동하세요.',
      isDestination
        ? '8,46 28,37 49,37 66,23 88,14'
        : '8,20 28,20 48,34 66,34 88,45',
    );
    if (!nextMapStep) return null;
    route.push(nextMapStep);
  }

  return route;
}
