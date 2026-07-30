import type { INestApplication } from '@nestjs/common';
import { HospitalGuideCatalogResponseSchema } from '@ready-on/contracts';
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
});
