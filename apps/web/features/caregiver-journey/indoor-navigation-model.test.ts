import { describe, expect, it } from 'vitest';
import {
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

    expect(route.some(({ kind }) => kind === 'MAP')).toBe(true);
    expect(
      route.some(
        (step) =>
          step.kind === 'TRANSITION' &&
          step.title.includes('연결통로'),
      ),
    ).toBe(true);
    expect(
      route.some(
        (step) =>
          step.kind === 'TRANSITION' &&
          step.title.includes('엘리베이터'),
      ),
    ).toBe(true);
  });
});
