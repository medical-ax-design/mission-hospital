import { describe, expect, it } from 'vitest';
import {
  HospitalGuideCatalogResponseSchema,
  RouteAvailabilitySchema,
} from './hospital-guide.js';

const officialFloor = {
  code: 'B1F',
  level: -1,
  label: '지하 1층',
  mapImageUrl: 'https://www.samsunghospital.com/map.jpg',
  sourceUrl:
    'https://www.samsunghospital.com/_newhome/info/guide/proton/B1F.html',
  sourceCheckedAt: '2026-07-30',
  publicationStatus: 'PUBLIC',
  places: [],
} as const;

describe('hospital guide contracts', () => {
  it('양성자치료센터와 지하층을 포함한 공식 층을 허용한다', () => {
    const parsed = HospitalGuideCatalogResponseSchema.parse({
      catalog: {
        checkedAt: '2026-07-30',
        buildings: [
          {
            id: 'MAIN',
            name: '본관',
            sourceUrl:
              'https://www.samsunghospital.com/_newhome/info/guide/hospital/1F.html',
            floors: [{ ...officialFloor, code: '1F', level: 1, label: '1층' }],
          },
          {
            id: 'ANNEX',
            name: '별관',
            sourceUrl:
              'https://www.samsunghospital.com/_newhome/info/guide/etc/1F.html',
            floors: [{ ...officialFloor, code: '1F', level: 1, label: '1층' }],
          },
          {
            id: 'CANCER',
            name: '암병원',
            sourceUrl:
              'https://www.samsunghospital.com/_newhome/info/guide/cancer/1F.html',
            floors: [{ ...officialFloor, code: '1F', level: 1, label: '1층' }],
          },
          {
            id: 'PROTON',
            name: '양성자치료센터',
            sourceUrl:
              'https://www.samsunghospital.com/_newhome/info/guide/proton/B1F.html',
            floors: [officialFloor],
          },
        ],
        purposes: [],
      },
    });

    expect(parsed.catalog.buildings[3]?.id).toBe('PROTON');
    expect(parsed.catalog.buildings[3]?.floors[0]?.level).toBe(-1);
  });

  it('DEMO 경로를 운영 가능한 경로로 해석하지 않는다', () => {
    expect(() =>
      RouteAvailabilitySchema.parse({
        status: 'VERIFIED',
        sourceStatus: 'DEMO',
        segments: [
          {
            kind: 'WALK',
            floorKey: 'MAIN:1F',
            label: '출입구에서 원무까지',
            startNodeId: 'main-1f-gate',
            endNodeId: 'main-1f-affairs',
            points: [
              [10, 10],
              [20, 20],
            ],
          },
        ],
      }),
    ).toThrow();
  });

  it('현재 공식 지도에서 좌표화한 경로를 별도 출처로 허용한다', () => {
    const route = RouteAvailabilitySchema.parse({
      status: 'VERIFIED',
      sourceStatus: 'OFFICIAL_PUBLIC',
      sourceCheckedAt: '2026-07-31',
      sourceUrls: [
        'https://www.samsunghospital.com/_newhome/info/guide/cancer/3F.html',
      ],
      segments: [
        {
          kind: 'WALK',
          floorKey: 'CANCER:3F',
          label: '대기실에서 엘리베이터까지',
          startNodeId: 'waiting',
          endNodeId: 'elevator',
          points: [
            [36.89, 21.18],
            [32.12, 21.74],
          ],
        },
      ],
    });

    expect(route).toMatchObject({
      status: 'VERIFIED',
      sourceStatus: 'OFFICIAL_PUBLIC',
    });
  });

  it('지도 영역 밖의 승인 경로 좌표를 거부한다', () => {
    expect(() =>
      RouteAvailabilitySchema.parse({
        status: 'VERIFIED',
        sourceStatus: 'HOSPITAL_VERIFIED',
        segments: [
          {
            kind: 'WALK',
            floorKey: 'MAIN:1F',
            label: '출입구에서 엘리베이터까지',
            startNodeId: 'main-1f-gate',
            endNodeId: 'main-1f-elevator',
            points: [
              [10, 10],
              [101, 20],
            ],
          },
        ],
      }),
    ).toThrow();
  });

  it('에스컬레이터에는 방향과 운행 상태가 필요하다', () => {
    expect(() =>
      RouteAvailabilitySchema.parse({
        status: 'VERIFIED',
        sourceStatus: 'HOSPITAL_VERIFIED',
        segments: [
          {
            kind: 'VERTICAL',
            mode: 'ESCALATOR',
            fromFloorKey: 'MAIN:1F',
            toFloorKey: 'MAIN:2F',
            entryNodeId: 'main-1f-escalator',
            exitNodeId: 'main-2f-escalator',
            entryPoint: [50, 50],
            exitPoint: [45, 45],
          },
        ],
      }),
    ).toThrow();
  });
});
