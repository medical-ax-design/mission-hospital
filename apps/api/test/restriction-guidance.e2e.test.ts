import type { INestApplication } from '@nestjs/common';
import {
  CaregiverJourneyResponseSchema,
  RestrictionGuidanceResponseSchema,
  RestrictionSearchResponseSchema,
  SavedQuestionListResponseSchema,
  SavedQuestionResponseSchema,
} from '@ready-on/contracts';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { createApp } from '../src/main.js';

describe('restriction guidance API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  beforeEach(async () => {
    await request(app.getHttpServer())
      .post(
        '/caregiver-journeys/demo/scenarios/morning-colonoscopy/select',
      )
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('오전 대장내시경 가상 여정으로 전환한다', async () => {
    const response = await request(app.getHttpServer())
      .post(
        '/caregiver-journeys/demo/scenarios/morning-colonoscopy/select',
      )
      .expect(201);

    const journey = CaregiverJourneyResponseSchema.parse(response.body)
      .journey;
    expect(journey.scenarioId).toBe('morning-colonoscopy');
    expect(journey.patient.procedureName).toBe(
      '건강검진 오전 대장내시경',
    );
  });

  it('현재 단계 제한과 딸기 검색 결과를 반환한다', async () => {
    const guidanceResponse = await request(app.getHttpServer())
      .get('/caregiver-journeys/demo/restrictions')
      .expect(200);
    const guidance = RestrictionGuidanceResponseSchema.parse(
      guidanceResponse.body,
    ).guidance;
    expect(guidance.phase.code).toBe('THREE_DAYS_BEFORE');

    const searchResponse = await request(app.getHttpServer())
      .get('/caregiver-journeys/demo/restrictions/search')
      .query({ q: '딸기' })
      .expect(200);
    const result = RestrictionSearchResponseSchema.parse(
      searchResponse.body,
    ).result;
    expect(result.resultType).toBe('DO_NOT_PROVIDE');
  });

  it('반복되거나 너무 긴 검색어는 400으로 거부한다', async () => {
    await request(app.getHttpServer())
      .get(
        '/caregiver-journeys/demo/restrictions/search?q=딸기&q=커피',
      )
      .expect(400);

    await request(app.getHttpServer())
      .get('/caregiver-journeys/demo/restrictions/search')
      .query({ q: '가'.repeat(81) })
      .expect(400);
  });

  it('절대 금식 단계에서 물을 제한한다', async () => {
    await request(app.getHttpServer())
      .post('/caregiver-journeys/demo/restrictions/advance')
      .expect(201);
    await request(app.getHttpServer())
      .post('/caregiver-journeys/demo/restrictions/advance')
      .expect(201);

    const response = await request(app.getHttpServer())
      .get('/caregiver-journeys/demo/restrictions/search')
      .query({ q: '물' })
      .expect(200);
    expect(
      RestrictionSearchResponseSchema.parse(response.body).result
        .resultType,
    ).toBe('DO_NOT_PROVIDE');
  });

  it('질문을 저장하고 완료한 뒤 삭제한다', async () => {
    const createdResponse = await request(app.getHttpServer())
      .post('/caregiver-journeys/demo/questions')
      .send({ query: '커피' })
      .expect(201);
    const created = SavedQuestionResponseSchema.parse(
      createdResponse.body,
    ).question;

    const listResponse = await request(app.getHttpServer())
      .get('/caregiver-journeys/demo/questions')
      .expect(200);
    expect(
      SavedQuestionListResponseSchema.parse(listResponse.body).questions,
    ).toHaveLength(1);

    const completedResponse = await request(app.getHttpServer())
      .post(
        `/caregiver-journeys/demo/questions/${created.id}/complete`,
      )
      .expect(201);
    expect(
      SavedQuestionResponseSchema.parse(completedResponse.body).question
        .status,
    ).toBe('DONE');

    await request(app.getHttpServer())
      .delete(`/caregiver-journeys/demo/questions/${created.id}`)
      .expect(200);

    const emptyResponse = await request(app.getHttpServer())
      .get('/caregiver-journeys/demo/questions')
      .expect(200);
    expect(
      SavedQuestionListResponseSchema.parse(emptyResponse.body).questions,
    ).toHaveLength(0);
  });
});
