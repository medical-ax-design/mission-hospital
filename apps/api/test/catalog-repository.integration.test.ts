import { readFile } from 'node:fs/promises';
import type { CreateProcedureInput } from '@ready-on/contracts';
import postgres from 'postgres';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { DrizzleCatalogRepository } from '../src/catalog/drizzle-catalog.repository.js';
import type { ActorContext } from '../src/catalog/catalog.types.js';
import { DatabaseService } from '../src/database/database.service.js';
import {
  type DockerPostgres,
  startDockerPostgres,
} from './support/docker-postgres.js';

const adminA: ActorContext = {
  id: '10000000-0000-4000-8000-000000000001',
  organizationId: '20000000-0000-4000-8000-000000000001',
  role: 'ADMIN',
};

const adminB: ActorContext = {
  id: '10000000-0000-4000-8000-000000000002',
  organizationId: '20000000-0000-4000-8000-000000000002',
  role: 'ADMIN',
};

const firstInput: CreateProcedureInput = {
  procedureType: 'EXAM',
  name: '대장내시경',
  externalCode: 'EXAM-001',
  department: '소화기내과',
  description: 'Demo Hospital 가상 항목',
};

describe('DrizzleCatalogRepository RLS integration', () => {
  let container: DockerPostgres;
  let database: DatabaseService;

  beforeAll(async () => {
    container = await startDockerPostgres();
    const adminSql = postgres(container.adminUrl, { max: 1 });
    const migration = await readFile(
      new URL(
        '../../../supabase/migrations/202607290001_catalog_foundation.sql',
        import.meta.url,
      ),
      'utf8',
    );

    await adminSql.unsafe(`
      create schema auth;
      create table auth.users (id uuid primary key);
    `);
    await adminSql.unsafe(migration);
    await adminSql.unsafe(`
      create role ready_on_runtime login password 'runtime' nobypassrls;
      grant usage on schema public to ready_on_runtime;
      grant select, insert, update on
        public.organizations,
        public.profiles,
        public.procedure_catalog
      to ready_on_runtime;

      insert into public.organizations (id, name) values
        ('${adminA.organizationId}', 'Demo Hospital A'),
        ('${adminB.organizationId}', 'Demo Hospital B');
      insert into auth.users (id) values
        ('${adminA.id}'),
        ('${adminB.id}');
      insert into public.profiles (
        id,
        organization_id,
        role,
        display_name
      ) values
        ('${adminA.id}', '${adminA.organizationId}', 'ADMIN', '관리자 A'),
        ('${adminB.id}', '${adminB.organizationId}', 'ADMIN', '관리자 B');
    `);
    await adminSql.end();

    database = new DatabaseService(container.runtimeUrl);
  }, 120_000);

  afterAll(async () => {
    await database?.close();
    await container?.stop();
  });

  it('같은 조직에서는 생성한 항목을 검색한다', async () => {
    const created = await database.withActor(adminA, async (db) => {
      const repository = new DrizzleCatalogRepository(db);
      return repository.create(firstInput, adminA);
    });

    const found = await database.withActor(adminA, async (db) => {
      const repository = new DrizzleCatalogRepository(db);
      return repository.search(adminA.organizationId, '대장', 20);
    });

    expect(found.map((procedure) => procedure.id)).toEqual([created.id]);
  });

  it('다른 조직에서는 생성한 항목을 조회하지 못한다', async () => {
    const found = await database.withActor(adminB, async (db) => {
      const repository = new DrizzleCatalogRepository(db);
      return repository.search(adminB.organizationId, '대장', 20);
    });

    expect(found).toEqual([]);
  });
});
