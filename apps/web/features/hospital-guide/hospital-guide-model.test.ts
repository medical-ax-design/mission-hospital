import { describe, expect, it } from 'vitest';
import {
  getPrototypeDestinationPoint,
  getPrototypeRoute,
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

  it('암병원 1층의 선택 위치를 복도 노드에 맞추고 목적지까지 연결한다', () => {
    expect(
      getPrototypeRoute('1F', 'cancer-1f-endoscopy', [35, 84]),
    ).toEqual({
      currentPoint: [34, 85],
      destinationPoint: [52, 37],
      points: [
        [34, 85],
        [41, 80],
        [49, 77],
        [52, 69],
        [52, 63],
        [52, 56],
        [52, 50],
        [52, 37],
      ],
    });
  });

  it('복도 축과 먼 위치는 길찾기 시작점으로 사용하지 않는다', () => {
    expect(
      getPrototypeRoute('1F', 'cancer-1f-endoscopy', [90, 10]),
    ).toBeNull();
  });

  it('지원하는 목적지의 지도상 도착점을 반환한다', () => {
    expect(
      getPrototypeDestinationPoint('1F', 'cancer-1f-payment'),
    ).toEqual([52, 63]);
    expect(
      getPrototypeDestinationPoint('2F', 'cancer-1f-payment'),
    ).toBeNull();
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
