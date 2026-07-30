import { describe, expect, it } from 'vitest';
import { HospitalGuideService } from './hospital-guide.service.js';

describe('HospitalGuideService', () => {
  const service = new HospitalGuideService();

  it('네 건물의 공개 전체 층을 지하부터 제공한다', () => {
    const catalog = service.getCatalog();

    expect(
      catalog.buildings
        .find(({ id }) => id === 'MAIN')
        ?.floors.map(({ code }) => code),
    ).toEqual([
      'B3F',
      'B2F',
      'B1F',
      '1F',
      '2F',
      '3F',
      '4F',
      '5F',
      '6F',
      '7F',
      '8F',
      '9F',
      '10F',
      '11F',
      '12F',
      '13F',
      '14F',
      '15F',
      '16F',
      '17F',
      '18F',
      '19F',
      '20F',
    ]);
    expect(
      catalog.buildings.find(({ id }) => id === 'ANNEX')?.floors,
    ).toHaveLength(11);
    expect(
      catalog.buildings.find(({ id }) => id === 'CANCER')?.floors,
    ).toHaveLength(14);
    expect(
      catalog.buildings
        .find(({ id }) => id === 'PROTON')
        ?.floors.map(({ code }) => code),
    ).toEqual(['B3F', 'B1F']);
  });

  it('모든 공개 층에 삼성서울병원 공식 원문과 확인일이 있다', () => {
    for (const building of service.getCatalog().buildings) {
      for (const floor of building.floors) {
        expect(floor.sourceUrl).toContain('samsunghospital.com');
        expect(floor.sourceCheckedAt).toBe('2026-07-30');
        expect(floor.publicationStatus).toBe('PUBLIC');
      }
    }
  });

  it('공식 페이지에서 확인된 시설번호와 이름을 제공한다', () => {
    const mainFirstFloor = service
      .getCatalog()
      .buildings.find(({ id }) => id === 'MAIN')
      ?.floors.find(({ code }) => code === '1F');

    expect(mainFirstFloor?.places).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          officialNumber: '27',
          officialName: '의무기록복사/영상복사',
          sourceStatus: 'OFFICIAL_PUBLIC',
        }),
      ]),
    );
    expect(JSON.stringify(mainFirstFloor)).not.toContain('키오스크');
  });

  it('카탈로그 복사본을 반환해 호출자 변경이 원본에 남지 않는다', () => {
    const first = service.getCatalog();
    first.buildings[0]!.name = '변경된 이름';

    expect(service.getCatalog().buildings[0]?.name).toBe('본관');
  });

  it('서류 발급을 공식 온라인·모바일·방문 방법으로 연결한다', () => {
    const result = service.findPurpose('서류 발급');

    expect(result.purpose.id).toBe('document-issuance');
    expect(result.purpose.options.map(({ channel }) => channel)).toEqual(
      expect.arrayContaining(['ONLINE', 'MOBILE', 'ONSITE']),
    );
    expect(result.places).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          buildingId: 'MAIN',
          floorCode: '1F',
        }),
      ]),
    );
    expect(JSON.stringify(result)).not.toContain('키오스크');
  });

  it('보호자 방문 발급에 공식 구비서류를 안내한다', () => {
    const result = service.findPurpose('진료비 서류');
    const onsite = result.purpose.options.find(
      ({ channel }) => channel === 'ONSITE',
    );

    expect(onsite?.requiredItems).toEqual(
      expect.arrayContaining([
        '환자 신분증',
        '신청자 신분증',
        '가족관계증명서',
        '환자가 자필 서명한 동의서',
      ]),
    );
  });
});
