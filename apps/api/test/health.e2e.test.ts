import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/main.js';

describe('health endpoints', () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('readiness 상태와 서비스 이름을 반환한다', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200);

    expect(response.body).toEqual({
      data: {
        status: 'ready',
        service: 'ready-on-api',
      },
    });
  });

  it('프레임워크 식별 헤더를 노출하지 않는다', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200);

    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
