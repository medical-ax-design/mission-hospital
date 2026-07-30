import { describe, expect, it } from 'vitest';
import {
  availableRouteModes,
  createIndoorRoute,
  hospitalMaps,
} from './indoor-navigation-model';

describe('indoor navigation model', () => {
  it('본관·별관·암병원의 공식 지도 주소를 구분한다', () => {
    expect(hospitalMaps.MAIN['1F'].imageUrl).toContain(
      '/hospital/1F/hospital-1F-0.jpg',
    );
    expect(hospitalMaps.ANNEX['1F'].imageUrl).toContain(
      '/etc/1F/etc-1F-0.jpg',
    );
    expect(hospitalMaps.CANCER['3F'].imageUrl).toContain(
      '/cancer/3F/cancer-3F-0.jpg',
    );
  });

  it('건물과 층이 달라지면 연결통로와 수직 이동 단계를 만든다', () => {
    const route = createIndoorRoute(
      {
        building: 'MAIN',
        floor: '1F',
        landmark: 'Gate 1',
      },
      {
        building: 'CANCER',
        floor: '3F',
        landmark: '수술환자가족대기실',
      },
      'ELEVATOR',
    );

    expect(route).not.toBeNull();
    expect(route!.some(({ kind }) => kind === 'MAP')).toBe(true);
    expect(
      route!.some(
        (step) =>
          step.kind === 'TRANSITION' &&
          step.title === '본관 1F에서 별관 1F 연결통로로 이동',
      ),
    ).toBe(true);
    expect(
      route!.some(
        (step) =>
          step.kind === 'TRANSITION' &&
          step.title === '별관 1F에서 암병원 2F 연결통로로 이동',
      ),
    ).toBe(true);
    expect(
      route!.some(
        (step) =>
          step.kind === 'TRANSITION' &&
          step.title ===
            '암병원 2F에서 엘리베이터로 3F 이동',
      ),
    ).toBe(true);
  });

  it('공식 연결 경로가 확인되지 않은 이동 수단은 제공하지 않는다', () => {
    const start = {
      building: 'MAIN' as const,
      floor: '1F',
      landmark: 'Gate 1',
    };
    const destination = {
      building: 'CANCER' as const,
      floor: '3F',
      landmark: '수술환자가족대기실',
    };

    expect(availableRouteModes(start, destination)).toEqual([
      'ELEVATOR',
    ]);
    expect(
      createIndoorRoute(start, destination, 'ESCALATOR'),
    ).toBeNull();
  });

  it('등록되지 않은 층은 경로를 만들지 않는다', () => {
    const start = {
      building: 'MAIN' as const,
      floor: '1F',
      landmark: 'Gate 1',
    };
    const destination = {
      building: 'CANCER' as const,
      floor: '9F',
      landmark: '미등록 장소',
    };

    expect(availableRouteModes(start, destination)).toEqual([]);
    expect(
      createIndoorRoute(start, destination, 'ELEVATOR'),
    ).toBeNull();
  });
});
