import type {
  GuideFloor,
  RouteAvailability,
  VerifiedRoute,
} from '@ready-on/contracts/hospital-guide';

type RoutePoint = [number, number];

function pointsEqual(left: RoutePoint, right: RoutePoint) {
  return left[0] === right[0] && left[1] === right[1];
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
