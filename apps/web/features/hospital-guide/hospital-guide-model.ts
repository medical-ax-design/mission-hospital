import type {
  GuideFloor,
  RouteAvailability,
  VerifiedRoute,
} from '@ready-on/contracts/hospital-guide';

type RoutePoint = [number, number];

interface PrototypeRouteNode {
  id: string;
  point: RoutePoint;
}

interface PrototypeRouteGraph {
  nodes: PrototypeRouteNode[];
  edges: [string, string][];
  destinationNodeByPlaceId: Record<string, string>;
}

export interface PrototypeRouteResult {
  currentPoint: RoutePoint;
  destinationPoint: RoutePoint;
  points: RoutePoint[];
}

const cancerFirstFloorGraph: PrototypeRouteGraph = {
  nodes: [
    { id: 'gate-6', point: [34, 85] },
    { id: 'south-west', point: [41, 80] },
    { id: 'south-center', point: [49, 77] },
    { id: 'lower-hub', point: [52, 69] },
    { id: 'administration', point: [52, 63] },
    { id: 'records', point: [52, 56] },
    { id: 'center', point: [52, 50] },
    { id: 'endoscopy-entrance', point: [52, 37] },
    { id: 'upper-corridor', point: [50, 25] },
    { id: 'gate-7', point: [46, 8] },
    { id: 'west-lift', point: [41, 47] },
    { id: 'east-center', point: [61, 50] },
    { id: 'east-corridor', point: [70, 50] },
    { id: 'gate-8', point: [76, 49] },
  ],
  edges: [
    ['gate-6', 'south-west'],
    ['south-west', 'south-center'],
    ['south-center', 'lower-hub'],
    ['lower-hub', 'administration'],
    ['administration', 'records'],
    ['records', 'center'],
    ['center', 'endoscopy-entrance'],
    ['endoscopy-entrance', 'upper-corridor'],
    ['upper-corridor', 'gate-7'],
    ['west-lift', 'center'],
    ['center', 'east-center'],
    ['east-center', 'east-corridor'],
    ['east-corridor', 'gate-8'],
  ],
  destinationNodeByPlaceId: {
    'cancer-1f-endoscopy': 'endoscopy-entrance',
    'cancer-1f-payment': 'administration',
    'cancer-1f-medical-record-copy': 'records',
  },
};

function pointsEqual(left: RoutePoint, right: RoutePoint) {
  return left[0] === right[0] && left[1] === right[1];
}

function pointDistance(left: RoutePoint, right: RoutePoint) {
  return Math.hypot(left[0] - right[0], left[1] - right[1]);
}

function shortestNodePath(
  graph: PrototypeRouteGraph,
  startId: string,
  destinationId: string,
) {
  const distances = new Map<string, number>(
    graph.nodes.map(({ id }) => [id, id === startId ? 0 : Infinity]),
  );
  const previous = new Map<string, string>();
  const unvisited = new Set(graph.nodes.map(({ id }) => id));
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));
  const neighbors = new Map<string, string[]>();

  for (const [left, right] of graph.edges) {
    neighbors.set(left, [...(neighbors.get(left) ?? []), right]);
    neighbors.set(right, [...(neighbors.get(right) ?? []), left]);
  }

  while (unvisited.size) {
    const currentId = [...unvisited].reduce((closest, candidate) =>
      (distances.get(candidate) ?? Infinity) <
      (distances.get(closest) ?? Infinity)
        ? candidate
        : closest,
    );

    if (currentId === destinationId) break;
    unvisited.delete(currentId);

    const current = nodeById.get(currentId);
    if (!current) continue;

    for (const neighborId of neighbors.get(currentId) ?? []) {
      if (!unvisited.has(neighborId)) continue;
      const neighbor = nodeById.get(neighborId);
      if (!neighbor) continue;

      const candidateDistance =
        (distances.get(currentId) ?? Infinity) +
        pointDistance(current.point, neighbor.point);
      if (candidateDistance < (distances.get(neighborId) ?? Infinity)) {
        distances.set(neighborId, candidateDistance);
        previous.set(neighborId, currentId);
      }
    }
  }

  const path = [destinationId];
  while (path[0] !== startId) {
    const currentPathId = path[0];
    if (!currentPathId) return null;
    const parent = previous.get(currentPathId);
    if (!parent) return null;
    path.unshift(parent);
  }

  return path
    .map((id) => nodeById.get(id)?.point)
    .filter((point): point is RoutePoint => Boolean(point));
}

export function getPrototypeRoute(
  floorCode: string,
  destinationPlaceId: string,
  selectedPoint: RoutePoint,
): PrototypeRouteResult | null {
  const destinationNodeId = getPrototypeDestinationNodeId(
    floorCode,
    destinationPlaceId,
  );
  if (!destinationNodeId) return null;

  const nearestNode = cancerFirstFloorGraph.nodes.reduce(
    (nearest, node) =>
      pointDistance(node.point, selectedPoint) <
      pointDistance(nearest.point, selectedPoint)
        ? node
        : nearest,
  );

  // 공개 안내도에 표시된 복도 축에서 너무 먼 방 내부 선택은 거부한다.
  if (pointDistance(nearestNode.point, selectedPoint) > 9) return null;

  const points = shortestNodePath(
    cancerFirstFloorGraph,
    nearestNode.id,
    destinationNodeId,
  );
  const destinationNode = cancerFirstFloorGraph.nodes.find(
    ({ id }) => id === destinationNodeId,
  );

  if (!points || !destinationNode) return null;
  return {
    currentPoint: nearestNode.point,
    destinationPoint: destinationNode.point,
    points,
  };
}

function getPrototypeDestinationNodeId(
  floorCode: string,
  destinationPlaceId: string,
) {
  if (floorCode !== '1F' || !destinationPlaceId.startsWith('cancer-1f-')) {
    return null;
  }

  return (
    cancerFirstFloorGraph.destinationNodeByPlaceId[destinationPlaceId] ??
    null
  );
}

export function getPrototypeDestinationPoint(
  floorCode: string,
  destinationPlaceId: string,
): RoutePoint | null {
  const destinationNodeId = getPrototypeDestinationNodeId(
    floorCode,
    destinationPlaceId,
  );
  if (!destinationNodeId) return null;

  return (
    cancerFirstFloorGraph.nodes.find(
      ({ id }) => id === destinationNodeId,
    )?.point ?? null
  );
}

export function sortFloors(floors: GuideFloor[]) {
  return [...floors].sort((left, right) => left.level - right.level);
}

export function validateVerifiedRoute(
  route: VerifiedRoute,
): VerifiedRoute | null {
  for (const [index, segment] of route.segments.entries()) {
    if (segment.kind !== 'VERTICAL') continue;

    const previous = route.segments[index - 1];
    const next = route.segments[index + 1];
    if (
      previous?.kind !== 'WALK' ||
      next?.kind !== 'WALK' ||
      previous.floorKey !== segment.fromFloorKey ||
      previous.endNodeId !== segment.entryNodeId ||
      next.floorKey !== segment.toFloorKey ||
      next.startNodeId !== segment.exitNodeId
    ) {
      return null;
    }

    const previousEnd = previous.points.at(-1);
    const nextStart = next.points[0];
    if (
      !previousEnd ||
      !nextStart ||
      !pointsEqual(previousEnd, segment.entryPoint) ||
      !pointsEqual(nextStart, segment.exitPoint)
    ) {
      return null;
    }
  }

  return route;
}

export function getRouteAvailability(
  floor: GuideFloor,
  verifiedRoute: VerifiedRoute | null,
): RouteAvailability {
  if (verifiedRoute) {
    const validated = validateVerifiedRoute(verifiedRoute);
    if (validated) return validated;
  }

  return {
    status: 'MAP_ONLY',
    sourceUrl: floor.sourceUrl,
  };
}
