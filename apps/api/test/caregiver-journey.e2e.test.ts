import type { INestApplication } from '@nestjs/common';
import { CaregiverJourneyResponseSchema } from '@ready-on/contracts';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/main.js';

describe('caregiver journey API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('가상 보호자 여정을 조회하고 연결한다', async () => {
    const initial = await request(app.getHttpServer())
      .get('/caregiver-journeys/demo')
      .expect(200);

    expect(
      CaregiverJourneyResponseSchema.parse(initial.body).journey.linked,
    ).toBe(false);

    const linked = await request(app.getHttpServer())
      .post('/caregiver-journeys/demo/link')
      .expect(201);

    expect(
      CaregiverJourneyResponseSchema.parse(linked.body).journey.linked,
    ).toBe(true);
  });

  it('발표용 치료 단계를 진행한다', async () => {
    const response = await request(app.getHttpServer())
      .post('/caregiver-journeys/demo/advance')
      .expect(201);

    expect(
      CaregiverJourneyResponseSchema.parse(response.body).journey.treatment
        .stage,
    ).toBe('IN_OPERATING_ROOM');
  });

  it('보호자 업무를 완료한다', async () => {
    const response = await request(app.getHttpServer())
      .post(
        '/caregiver-journeys/demo/tasks/task-admission-docs/complete',
      )
      .expect(201);

    expect(
      CaregiverJourneyResponseSchema.parse(response.body).journey.task
        ?.status,
    ).toBe('COMPLETED');
  });

  it('존재하지 않는 보호자 업무에 404를 반환한다', async () => {
    await request(app.getHttpServer())
      .post('/caregiver-journeys/demo/tasks/unknown-task/complete')
      .expect(404);
  });
});
