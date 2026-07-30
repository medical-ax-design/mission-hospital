import type { INestApplication } from '@nestjs/common';
import {
  HospitalGuideCatalogResponseSchema,
  HospitalGuidePurposeResponseSchema,
} from '@ready-on/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/main.js';

describe('hospital guide API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('공식 병원 안내 카탈로그를 반환한다', async () => {
    const response = await request(app.getHttpServer())
      .get('/hospital-guide/catalog')
      .expect(200);

    const catalog = HospitalGuideCatalogResponseSchema.parse(
      response.body,
    ).catalog;
    expect(catalog.buildings).toHaveLength(4);
    expect(catalog.buildings.at(-1)?.id).toBe('PROTON');
  });

  it('등록되지 않은 목적 검색은 404로 응답한다', async () => {
    await request(app.getHttpServer())
      .get('/hospital-guide/purposes/search')
      .query({ q: '없는 업무' })
      .expect(404);
  });

  it('서류 발급의 공식 처리 방법과 장소를 반환한다', async () => {
    const response = await request(app.getHttpServer())
      .get('/hospital-guide/purposes/search')
      .query({ q: '서류 발급' })
      .expect(200);

    const result = HospitalGuidePurposeResponseSchema.parse(
      response.body,
    ).result;
    expect(result.purpose.id).toBe('document-issuance');
    expect(result.places.some(({ buildingId }) => buildingId === 'MAIN'))
      .toBe(true);
    expect(JSON.stringify(result)).not.toContain('키오스크');
  });
});
