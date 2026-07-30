import { randomUUID } from 'node:crypto';
import type {
  CreateProcedureInput,
  Procedure,
} from '@ready-on/contracts';
import { describe, expect, it } from 'vitest';
import { CatalogService } from './catalog.service.js';
import type {
  ActorContext,
  CatalogRepository,
} from './catalog.types.js';

const admin: ActorContext = {
  id: '10000000-0000-4000-8000-000000000001',
  organizationId: '20000000-0000-4000-8000-000000000001',
  role: 'ADMIN',
};

const staff: ActorContext = {
  ...admin,
  id: '10000000-0000-4000-8000-000000000002',
  role: 'STAFF',
};

const patient: ActorContext = {
  ...admin,
  id: '10000000-0000-4000-8000-000000000003',
  role: 'PATIENT',
};

const firstInput: CreateProcedureInput = {
  procedureType: 'EXAM',
  name: '대장내시경',
  externalCode: 'EXAM-001',
  department: '소화기내과',
  description: null,
};

class InMemoryCatalogRepository implements CatalogRepository {
  private readonly procedures: Array<{
    organizationId: string;
    procedure: Procedure;
  }> = [];

  async findByExternalCode(
    organizationId: string,
    externalCode: string,
  ): Promise<Procedure | null> {
    return (
      this.procedures.find(
        (entry) =>
          entry.organizationId === organizationId &&
          entry.procedure.externalCode === externalCode,
      )?.procedure ?? null
    );
  }

  async create(
    input: CreateProcedureInput,
    actor: ActorContext,
  ): Promise<Procedure> {
    const now = new Date().toISOString();
    const procedure: Procedure = {
      id: randomUUID(),
      ...input,
      isActive: true,
      rowVersion: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.procedures.push({
      organizationId: actor.organizationId,
      procedure,
    });
    return procedure;
  }

  async search(
    organizationId: string,
    query: string,
    limit: number,
  ): Promise<Procedure[]> {
    const normalizedQuery = query.toLocaleLowerCase('ko-KR');
    return this.procedures
      .filter(
        (entry) =>
          entry.organizationId === organizationId &&
          (entry.procedure.name
            .toLocaleLowerCase('ko-KR')
            .includes(normalizedQuery) ||
            entry.procedure.externalCode
              ?.toLocaleLowerCase('ko-KR')
              .includes(normalizedQuery)),
      )
      .map((entry) => entry.procedure)
      .slice(0, limit);
  }
}

describe('CatalogService', () => {
  it('관리자는 외부 코드 없이 검사 항목을 생성한다', async () => {
    const service = new CatalogService(new InMemoryCatalogRepository());

    const result = await service.create(
      {
        ...firstInput,
        externalCode: null,
      },
      admin,
    );

    expect(result.name).toBe('대장내시경');
    expect(result.externalCode).toBeNull();
  });

  it('동일 조직의 외부 코드 중복을 거부한다', async () => {
    const service = new CatalogService(new InMemoryCatalogRepository());
    await service.create(firstInput, admin);

    await expect(
      service.create(
        {
          ...firstInput,
          name: '건강검진 대장내시경',
        },
        admin,
      ),
    ).rejects.toMatchObject({
      code: 'EXTERNAL_CODE_DUPLICATE',
    });
  });

  it('STAFF의 항목 생성을 거부한다', async () => {
    const service = new CatalogService(new InMemoryCatalogRepository());

    await expect(service.create(firstInput, staff)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('STAFF는 같은 조직의 이름 일부로 항목을 검색한다', async () => {
    const service = new CatalogService(new InMemoryCatalogRepository());
    await service.create(firstInput, admin);
    await service.create(
      {
        ...firstInput,
        name: '뇌 MRI/MRA',
        externalCode: 'EXAM-002',
        department: '영상의학과',
      },
      admin,
    );

    const result = await service.search('  대장  ', 20, staff);

    expect(result.map((procedure) => procedure.name)).toEqual(['대장내시경']);
  });

  it('PATIENT의 카탈로그 검색을 거부한다', async () => {
    const service = new CatalogService(new InMemoryCatalogRepository());

    await expect(service.search('대장', 20, patient)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });
});
