import { describe, expect, it } from 'vitest';
import {
  getRouteAvailability,
  sortFloors,
  validateVerifiedRoute,
} from './hospital-guide-model';
import {
  createGuideFloor,
  verifiedElevatorRouteFixture,
  verifiedEscalatorRouteFixture,
} from './hospital-guide-test-fixtures';

describe('hospital guide model', () => {
  it('지하층을 먼저, 지상층을 숫자순으로 정렬한다', () => {
    expect(
      sortFloors([
        createGuideFloor('10F', 10),
        createGuideFloor('B1F', -1),
        createGuideFloor('2F', 2),
        createGuideFloor('B3F', -3),
      ]).map(({ code }) => code),
    ).toEqual(['B3F', 'B1F', '2F', '10F']);
  });

  it('승인 경로가 없으면 공식 지도 전용 상태를 반환한다', () => {
    const floor = createGuideFloor('1F', 1);

    expect(getRouteAvailability(floor, null)).toEqual({
      status: 'MAP_ONLY',
      sourceUrl: expect.stringContaining('samsunghospital.com'),
    });
  });

  it('엘리베이터 입구와 층별 보행선이 연결된 승인 경로를 허용한다', () => {
    expect(
      validateVerifiedRoute(verifiedElevatorRouteFixture),
    ).toEqual(verifiedElevatorRouteFixture);
  });

  it('에스컬레이터 입구와 보행선 끝점이 다르면 승인 경로를 거부한다', () => {
    const invalid = structuredClone(verifiedEscalatorRouteFixture);
    const transition = invalid.segments[1];
    if (transition?.kind === 'VERTICAL') {
      transition.entryPoint = [99, 99];
    }

    expect(validateVerifiedRoute(invalid)).toBeNull();
  });
});
