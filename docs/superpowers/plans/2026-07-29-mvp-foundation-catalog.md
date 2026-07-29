# MVP 기반 및 검사·수술 카탈로그 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 실행 가능한 Next.js·NestJS 모노레포를 만들고, 의료진이 검사·수술 항목을 등록하고 검색하는 첫 번째 엔드투엔드 수직 기능을 완성한다.

**Architecture:** npm workspaces 아래 `apps/web`, `apps/api`, `packages/contracts`를 두고 브라우저는 REST API만 호출한다. API는 Zod 계약을 경계에서 검증하고, 카탈로그 도메인 서비스와 Drizzle 저장소를 분리하며, Supabase PostgreSQL 스키마는 SQL migration으로 관리한다.

**Tech Stack:** TypeScript strict mode, Next.js App Router, NestJS REST, Zod, Drizzle ORM, PostgreSQL/Supabase, Vitest, Testing Library, Supertest

## Global Constraints

- 내부 식별자는 UUID `id`, 외부 병원 코드는 nullable `externalCode`로 사용한다.
- 실제 환자정보와 실제 의료지침을 저장하지 않고 `Demo Hospital` 가상 데이터만 사용한다.
- 브라우저는 인증 외에 Supabase 업무 테이블을 직접 변경하지 않는다.
- API 응답은 `{ "data": ... }`, 오류는 `{ "error": { "code", "message", "details", "requestId" } }` 형태다.
- TypeScript는 `strict: true`를 사용하고 `any` 타입을 추가하지 않는다.
- 새 동작은 실패하는 테스트를 먼저 확인한 후 최소 구현으로 통과시킨다.
- 패키지 버전은 `package-lock.json`에 고정하고 임의의 전역 도구에 의존하지 않는다.
- 카탈로그 API는 검증된 Supabase JWT의 `app_metadata.organization_id`와 `app_metadata.role`만 권한 근거로 사용한다.

---

## 파일 구조

```text
apps/
├── api/
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── common/http/
│   │   ├── database/
│   │   ├── health/
│   │   └── catalog/
│   └── test/
└── web/
    ├── app/
    │   └── staff/catalog/page.tsx
    ├── features/catalog/
    └── lib/api/
packages/
└── contracts/
    └── src/catalog.ts
supabase/
└── migrations/
    └── 202607290001_catalog_foundation.sql
```

`packages/contracts`는 HTTP 입력·출력 계약만 소유한다. `apps/api/src/catalog`은 카탈로그 규칙과 저장을, `apps/web/features/catalog`은 사용자 상호작용을 소유한다.

### Task 1: 모노레포와 공유 계약 기반

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `tsconfig.base.json`
- Create: `vitest.config.ts`
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/catalog.test.ts`
- Create: `packages/contracts/src/catalog.ts`
- Create: `packages/contracts/src/index.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `POST /api/v1/procedures` 요청 형식과 `Procedure` 응답 형식
- Produces: `createProcedureSchema`, `procedureSchema`, `CreateProcedureInput`, `Procedure`

- [x] **Step 1: 설정 파일과 테스트 실행기만 구성**

루트 npm workspace에 `apps/*`, `packages/*`를 등록한다.

```json
{
  "name": "ready-on",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "test": "vitest run",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "build": "npm run build --workspaces --if-present"
  },
  "devDependencies": {
    "@types/node": "^24.0.0",
    "typescript": "^5.9.0",
    "vitest": "^3.2.0"
  }
}
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

`packages/contracts/package.json`:

```json
{
  "name": "@ready-on/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": { ".": "./src/index.ts" },
  "scripts": { "typecheck": "tsc --noEmit" },
  "dependencies": { "zod": "^4.0.0" }
}
```

파일 생성 후 lockfile을 만든다.

Run: `npm install`
Expected: `package-lock.json` 생성, exit code 0

- [x] **Step 2: 공유 계약의 실패 테스트 작성**

```ts
import { describe, expect, it } from 'vitest';
import { createProcedureSchema } from './catalog';

describe('createProcedureSchema', () => {
  it('외부 코드의 빈 문자열을 null로 정규화한다', () => {
    const result = createProcedureSchema.parse({
      procedureType: 'EXAM',
      name: '대장내시경',
      externalCode: '   ',
      department: '소화기내과',
      description: '데모용 검사 항목',
    });

    expect(result.externalCode).toBeNull();
  });

  it('공백뿐인 검사 이름을 거부한다', () => {
    const result = createProcedureSchema.safeParse({
      procedureType: 'EXAM',
      name: '   ',
      externalCode: null,
      department: '소화기내과',
    });

    expect(result.success).toBe(false);
  });
});
```

- [x] **Step 3: 실패 확인**

Run: `npm test -- packages/contracts/src/catalog.test.ts`
Expected: FAIL because `./catalog` does not exist

- [x] **Step 4: 최소 계약 구현**

```ts
import { z } from 'zod';

const optionalCodeSchema = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value.length === 0 ? null : value))
  .nullable()
  .optional()
  .default(null);

export const createProcedureSchema = z.object({
  procedureType: z.enum(['EXAM', 'SURGERY']),
  name: z.string().trim().min(1).max(120),
  externalCode: optionalCodeSchema,
  department: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional().default(null),
});

export const procedureSchema = createProcedureSchema.extend({
  id: z.string().uuid(),
  isActive: z.boolean(),
  rowVersion: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreateProcedureInput = z.infer<typeof createProcedureSchema>;
export type Procedure = z.infer<typeof procedureSchema>;
```

- [x] **Step 5: 계약 검증**

Run: `npm test -- packages/contracts/src/catalog.test.ts && npm run typecheck`
Expected: 2 tests PASS, typecheck exit code 0

- [x] **Step 6: 커밋**

```bash
git add package.json package-lock.json tsconfig.base.json vitest.workspace.ts packages/contracts .gitignore
git commit -m "build: initialize TypeScript workspaces and contracts"
```

### Task 2: NestJS API와 readiness health check

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/test/health.e2e.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `GET /health/live`, `GET /health/ready`, `createApp()`

- [ ] **Step 1: health E2E 실패 테스트 작성**

```ts
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/main';

describe('health', () => {
  let app: Awaited<ReturnType<typeof createApp>>;

  beforeAll(async () => {
    app = await createApp();
    await app.init();
  });

  afterAll(async () => app.close());

  it('readiness 상태와 서비스 이름을 반환한다', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200);

    expect(response.body).toEqual({
      data: { status: 'ready', service: 'ready-on-api' },
    });
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- apps/api/test/health.e2e.test.ts`
Expected: FAIL because `../src/main` does not exist

- [ ] **Step 3: 최소 NestJS 앱 구현**

`createApp()`은 테스트가 포트를 열지 않고 앱 인스턴스를 받을 수 있도록 한다. 직접 실행일 때만 `PORT` 기본값 `3001`로 listen한다.

```ts
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

export async function createApp() {
  return NestFactory.create(AppModule, { logger: false });
}

if (process.env.NODE_ENV !== 'test') {
  void createApp().then((app) => app.listen(Number(process.env.PORT ?? 3001)));
}

// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { HealthController } from './health/health.controller';

@Module({ controllers: [HealthController] })
export class AppModule {}

// apps/api/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  live() {
    return { data: { status: 'ok', service: 'ready-on-api' } };
  }

  @Get('ready')
  ready() {
    return { data: { status: 'ready', service: 'ready-on-api' } };
  }
}
```

- [ ] **Step 4: API 검증**

Run: `npm test -- apps/api/test/health.e2e.test.ts && npm run typecheck --workspace @ready-on/api`
Expected: health test PASS, typecheck exit code 0

- [ ] **Step 5: 커밋**

```bash
git add apps/api
git commit -m "feat(api): add health endpoints"
```

### Task 3: PostgreSQL 카탈로그 스키마와 Drizzle 모델

**Files:**
- Create: `supabase/migrations/202607290001_catalog_foundation.sql`
- Create: `apps/api/src/database/schema.ts`
- Create: `apps/api/src/database/schema.test.ts`

**Interfaces:**
- Consumes: UUID 내부 식별자, nullable 외부 코드, 조직 격리 규칙
- Produces: `organizations`, `profiles`, `procedureCatalog` Drizzle tables

- [ ] **Step 1: Drizzle 스키마 실패 테스트 작성**

```ts
import { getTableConfig } from 'drizzle-orm/pg-core';
import { describe, expect, it } from 'vitest';
import { procedureCatalog } from './schema';

describe('procedureCatalog schema', () => {
  it('UUID id와 nullable externalCode를 노출한다', () => {
    const config = getTableConfig(procedureCatalog);
    const id = config.columns.find((column) => column.name === 'id');
    const externalCode = config.columns.find(
      (column) => column.name === 'external_code',
    );

    expect(id?.notNull).toBe(true);
    expect(externalCode?.notNull).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- apps/api/src/database/schema.test.ts`
Expected: FAIL because `./schema` does not exist

- [ ] **Step 3: SQL migration과 Drizzle 모델 구현**

Migration의 핵심 SQL:

```sql
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create type user_role as enum ('ADMIN', 'STAFF', 'PATIENT');
create type procedure_type as enum ('EXAM', 'SURGERY');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  role user_role not null,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table procedure_catalog (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  procedure_type procedure_type not null,
  name text not null check (length(trim(name)) > 0),
  normalized_name text not null,
  external_code text,
  department text not null check (length(trim(department)) > 0),
  description text,
  is_active boolean not null default true,
  row_version integer not null default 1,
  created_by uuid not null references profiles(id),
  updated_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index procedure_external_code_unique
  on procedure_catalog (organization_id, external_code)
  where external_code is not null;
create index procedure_name_trgm_idx
  on procedure_catalog using gin (normalized_name gin_trgm_ops);

alter table procedure_catalog enable row level security;
create policy procedure_organization_isolation on procedure_catalog
using (
  organization_id = current_setting('app.organization_id', true)::uuid
)
with check (
  organization_id = current_setting('app.organization_id', true)::uuid
);
```

Drizzle 모델은 다음 열 정의를 그대로 사용한다.

```ts
export const procedureCatalog = pgTable('procedure_catalog', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').notNull(),
  procedureType: procedureTypeEnum('procedure_type').notNull(),
  name: text('name').notNull(),
  normalizedName: text('normalized_name').notNull(),
  externalCode: text('external_code'),
  department: text('department').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  rowVersion: integer('row_version').notNull().default(1),
  createdBy: uuid('created_by').notNull(),
  updatedBy: uuid('updated_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

- [ ] **Step 4: 스키마 검증**

Run: `npm test -- apps/api/src/database/schema.test.ts && npm run typecheck --workspace @ready-on/api`
Expected: schema test PASS, typecheck exit code 0

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrations apps/api/src/database
git commit -m "feat(db): add procedure catalog schema"
```

### Task 4: 카탈로그 도메인 서비스

**Files:**
- Create: `apps/api/src/catalog/catalog.types.ts`
- Create: `apps/api/src/catalog/catalog.errors.ts`
- Create: `apps/api/src/catalog/catalog.service.test.ts`
- Create: `apps/api/src/catalog/catalog.service.ts`

**Interfaces:**
- Consumes: `CreateProcedureInput`
- Produces: `CatalogRepository`, `CatalogService.create(input, actor)`, `CatalogService.search(query, actor)`

```ts
export type ActorContext = {
  id: string;
  organizationId: string;
  role: 'ADMIN' | 'STAFF' | 'PATIENT';
};

export interface CatalogRepository {
  findByExternalCode(
    organizationId: string,
    externalCode: string,
  ): Promise<Procedure | null>;
  create(
    input: CreateProcedureInput,
    actor: ActorContext,
  ): Promise<Procedure>;
  search(
    organizationId: string,
    query: string,
    limit: number,
  ): Promise<Procedure[]>;
}
```

- [ ] **Step 1: 관리자 생성과 코드 중복 실패 테스트 작성**

테스트 안에 배열 기반 `InMemoryCatalogRepository`를 구현해 실제 서비스 규칙을 검증한다.

```ts
it('관리자는 외부 코드 없이 검사 항목을 생성한다', async () => {
  const result = await service.create(
    {
      procedureType: 'EXAM',
      name: '대장내시경',
      externalCode: null,
      department: '소화기내과',
      description: null,
    },
    admin,
  );

  expect(result.name).toBe('대장내시경');
  expect(result.externalCode).toBeNull();
});

it('동일 조직의 외부 코드 중복을 거부한다', async () => {
  await service.create(firstInput, admin);

  await expect(service.create(secondInput, admin)).rejects.toMatchObject({
    code: 'EXTERNAL_CODE_DUPLICATE',
  });
});

it('STAFF의 항목 생성을 거부한다', async () => {
  await expect(service.create(firstInput, staff)).rejects.toMatchObject({
    code: 'FORBIDDEN',
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- apps/api/src/catalog/catalog.service.test.ts`
Expected: FAIL because `CatalogService` does not exist

- [ ] **Step 3: 최소 서비스 구현**

`ADMIN` 역할을 확인하고, 값이 있는 `externalCode`만 중복 조회하며, 저장소 생성 결과를 반환한다. 검색은 `ADMIN`과 `STAFF`만 허용하고 trim한 검색어와 최대 100의 limit을 저장소에 전달한다.

```ts
export class CatalogError extends Error {
  constructor(
    public readonly code:
      | 'FORBIDDEN'
      | 'EXTERNAL_CODE_DUPLICATE',
    message: string,
  ) {
    super(message);
  }
}

export class CatalogService {
  constructor(private readonly repository: CatalogRepository) {}

  async create(input: CreateProcedureInput, actor: ActorContext) {
    if (actor.role !== 'ADMIN') {
      throw new CatalogError('FORBIDDEN', '항목 등록 권한이 없습니다.');
    }
    if (
      input.externalCode &&
      (await this.repository.findByExternalCode(
        actor.organizationId,
        input.externalCode,
      ))
    ) {
      throw new CatalogError(
        'EXTERNAL_CODE_DUPLICATE',
        '이미 사용 중인 외부 코드입니다.',
      );
    }
    return this.repository.create(input, actor);
  }

  async search(query: string, limit: number, actor: ActorContext) {
    if (actor.role === 'PATIENT') {
      throw new CatalogError('FORBIDDEN', '카탈로그 조회 권한이 없습니다.');
    }
    return this.repository.search(
      actor.organizationId,
      query.trim(),
      Math.min(Math.max(limit, 1), 100),
    );
  }
}
```

- [ ] **Step 4: 서비스 검증**

Run: `npm test -- apps/api/src/catalog/catalog.service.test.ts`
Expected: 3 tests PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/api/src/catalog
git commit -m "feat(api): add procedure catalog service"
```

### Task 5: 카탈로그 REST API와 공통 오류 응답

**Files:**
- Create: `apps/api/src/auth/actor-context.ts`
- Create: `apps/api/src/auth/token-verifier.ts`
- Create: `apps/api/src/auth/jwks-token-verifier.ts`
- Create: `apps/api/src/auth/jwt-auth.guard.ts`
- Create: `apps/api/src/auth/current-actor.decorator.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Create: `apps/api/src/common/http/request-id.middleware.ts`
- Create: `apps/api/src/common/http/api-exception.filter.ts`
- Create: `apps/api/src/catalog/catalog.controller.ts`
- Create: `apps/api/src/catalog/catalog.module.ts`
- Create: `apps/api/test/catalog.e2e.test.ts`
- Modify: `apps/api/src/app.module.ts`

**Interfaces:**
- Consumes: `CatalogService`, `createProcedureSchema`
- Produces: `TokenVerifier.verify(token): Promise<ActorContext>`, `GET /api/v1/procedures`, `POST /api/v1/procedures`

- [ ] **Step 1: API 실패 테스트 작성**

Nest testing module에서 `TOKEN_VERIFIER` provider만 다음 구현으로 교체하고 실제 HTTP 요청을 검증한다.

```ts
const testTokenVerifier: TokenVerifier = {
  async verify(token) {
    if (token !== 'valid-admin-token') throw new Error('invalid token');
    return {
      id: '10000000-0000-4000-8000-000000000001',
      organizationId: '20000000-0000-4000-8000-000000000001',
      role: 'ADMIN',
    };
  },
};

it('검사 항목을 생성하고 data envelope으로 반환한다', async () => {
  const response = await request(app.getHttpServer())
    .post('/api/v1/procedures')
    .set('Authorization', 'Bearer valid-admin-token')
    .set('X-Request-Id', 'req-catalog-create')
    .send({
      procedureType: 'EXAM',
      name: '대장내시경',
      externalCode: null,
      department: '소화기내과',
      description: 'Demo Hospital 가상 항목',
    })
    .expect(201);

  expect(response.body.data).toMatchObject({
    procedureType: 'EXAM',
    name: '대장내시경',
  });
});

it('잘못된 입력을 공통 오류 envelope으로 반환한다', async () => {
  const response = await request(app.getHttpServer())
    .post('/api/v1/procedures')
    .set('Authorization', 'Bearer valid-admin-token')
    .set('X-Request-Id', 'req-invalid')
    .send({ procedureType: 'EXAM', name: ' ', department: '' })
    .expect(400);

  expect(response.body.error).toMatchObject({
    code: 'VALIDATION_ERROR',
    requestId: 'req-invalid',
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- apps/api/test/catalog.e2e.test.ts`
Expected: FAIL with 404 for `/api/v1/procedures`

- [ ] **Step 3: controller와 오류 filter 구현**

Controller는 Zod parse 결과만 서비스에 전달한다. Filter는 알려진 도메인 오류와 Zod 오류를 명세의 HTTP 상태 및 공통 envelope으로 변환한다.

```ts
// apps/api/src/auth/token-verifier.ts
export const TOKEN_VERIFIER = Symbol('TOKEN_VERIFIER');
export interface TokenVerifier {
  verify(token: string): Promise<ActorContext>;
}

// apps/api/src/auth/current-actor.decorator.ts
export const CurrentActor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ActorContext => {
    const request = context.switchToHttp().getRequest<{ actor: ActorContext }>();
    return request.actor;
  },
);

// apps/api/src/auth/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_VERIFIER) private readonly verifier: TokenVerifier,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      actor?: ActorContext;
    }>();
    const match = /^Bearer (.+)$/.exec(request.headers.authorization ?? '');
    if (!match?.[1]) throw new UnauthorizedException('로그인이 필요합니다.');
    try {
      request.actor = await this.verifier.verify(match[1]);
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않은 로그인입니다.');
    }
  }
}

// apps/api/src/auth/jwks-token-verifier.ts
@Injectable()
export class JwksTokenVerifier implements TokenVerifier {
  private readonly jwks = createRemoteJWKSet(
    new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`),
  );

  async verify(token: string): Promise<ActorContext> {
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: process.env.SUPABASE_JWT_ISSUER,
    });
    const metadata = z
      .object({
        organization_id: z.string().uuid(),
        role: z.enum(['ADMIN', 'STAFF', 'PATIENT']),
      })
      .parse(payload.app_metadata);
    return {
      id: z.string().uuid().parse(payload.sub),
      organizationId: metadata.organization_id,
      role: metadata.role,
    };
  }
}

// apps/api/src/catalog/catalog.controller.ts
@Controller('api/v1/procedures')
@UseGuards(JwtAuthGuard)
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  async search(
    @Query('query') query = '',
    @Query('limit') rawLimit = '20',
    @CurrentActor() actor: ActorContext,
  ) {
    const data = await this.catalog.search(query, Number(rawLimit), actor);
    return { data, meta: { nextCursor: null, total: data.length } };
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: unknown, @CurrentActor() actor: ActorContext) {
    const input = createProcedureSchema.parse(body);
    return { data: await this.catalog.create(input, actor) };
  }
}
```

오류 filter의 매핑은 고정한다.

```ts
const statusByCode = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  EXTERNAL_CODE_DUPLICATE: 409,
} as const;

response.status(statusByCode[code] ?? 500).json({
  error: {
    code,
    message,
    details,
    requestId: request.headers['x-request-id'] ?? generatedRequestId,
  },
});
```

- [ ] **Step 4: API 검증**

Run: `npm test -- apps/api/test/catalog.e2e.test.ts apps/api/test/health.e2e.test.ts`
Expected: catalog and health tests PASS

- [ ] **Step 5: 커밋**

```bash
git add apps/api/src apps/api/test
git commit -m "feat(api): expose procedure catalog endpoints"
```

### Task 6: 의료진 카탈로그 웹 화면

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/globals.css`
- Create: `apps/web/app/staff/catalog/page.tsx`
- Create: `apps/web/features/catalog/catalog-api.ts`
- Create: `apps/web/features/catalog/catalog-page.tsx`
- Create: `apps/web/features/catalog/catalog-page.test.tsx`
- Create: `apps/web/test/setup.ts`

**Interfaces:**
- Consumes: `GET /api/v1/procedures`, `POST /api/v1/procedures`, `Procedure`
- Produces: `CatalogApi`, `/staff/catalog` 검색·등록 UI

```ts
export interface CatalogApi {
  search(query: string): Promise<Procedure[]>;
  create(input: CreateProcedureInput): Promise<Procedure>;
}

export type CatalogApiDependencies = {
  apiBaseUrl: string;
  getAccessToken(): Promise<string>;
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
};
```

- [ ] **Step 1: 환자 안전 문구와 등록 흐름 실패 테스트 작성**

```tsx
it('검색 결과가 없으면 입력한 이름으로 등록할 수 있다', async () => {
  const user = userEvent.setup();
  render(<CatalogPage api={fakeCatalogApi} />);

  await user.type(
    screen.getByPlaceholderText('검사·수술 이름 또는 코드 검색'),
    '대장내시경',
  );

  expect(
    await screen.findByText('‘대장내시경’과 일치하는 항목이 없습니다.'),
  ).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: '이 이름으로 새 항목 등록' }));
  expect(screen.getByLabelText('검사·수술 이름')).toHaveValue('대장내시경');
});

it('등록 폼을 제출하면 생성된 항목을 목록에 표시한다', async () => {
  const user = userEvent.setup();
  render(<CatalogPage api={fakeCatalogApi} />);

  await user.type(
    screen.getByPlaceholderText('검사·수술 이름 또는 코드 검색'),
    '대장내시경',
  );
  await user.click(
    await screen.findByRole('button', { name: '이 이름으로 새 항목 등록' }),
  );
  await user.type(screen.getByLabelText('담당 부서'), '소화기내과');
  await user.click(screen.getByRole('button', { name: '저장' }));

  expect(await screen.findByText('대장내시경 · 소화기내과')).toBeInTheDocument();
});
```

- [ ] **Step 2: 실패 확인**

Run: `npm test -- apps/web/features/catalog/catalog-page.test.tsx`
Expected: FAIL because `CatalogPage` does not exist

- [ ] **Step 3: 최소 UI와 API client 구현**

360px 이상에서도 폼을 읽을 수 있고 1024px에서 목록과 등록 패널이 나란히 보이게 한다. 검색은 2글자부터 300ms debounce하고, 결과가 없을 때만 등록 CTA를 표시한다. 화면 상단에 `Demo Hospital · 가상 데이터`를 표시한다.

```tsx
export function CatalogPage({ api }: { api: CatalogApi }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Procedure[]>([]);
  const [isCreateOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void api.search(query).then(setResults);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [api, query]);

  return (
    <main>
      <p>Demo Hospital · 가상 데이터</p>
      <h1>검사·수술 카탈로그</h1>
      <input
        aria-label="검사·수술 검색"
        placeholder="검사·수술 이름 또는 코드 검색"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {query.trim().length >= 2 && results.length === 0 ? (
        <section aria-live="polite">
          <p>‘{query.trim()}’과 일치하는 항목이 없습니다.</p>
          <button type="button" onClick={() => setCreateOpen(true)}>
            이 이름으로 새 항목 등록
          </button>
        </section>
      ) : (
        <ul>
          {results.map((procedure) => (
            <li key={procedure.id}>
              {procedure.name} · {procedure.department}
            </li>
          ))}
        </ul>
      )}
      {isCreateOpen ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            void api
              .create({
                procedureType: 'EXAM',
                name: String(form.get('name')),
                externalCode: null,
                department: String(form.get('department')),
                description: null,
              })
              .then((created) => {
                setResults([created]);
                setCreateOpen(false);
              });
          }}
        >
          <label>
            검사·수술 이름
            <input name="name" defaultValue={query.trim()} />
          </label>
          <label>
            담당 부서
            <input name="department" />
          </label>
          <button type="submit">저장</button>
        </form>
      ) : null}
    </main>
  );
}
```

API client는 계약 스키마로 응답을 검증한다.

```ts
export class ApiError extends Error {
  constructor(public readonly body: unknown) {
    super('API request failed');
  }

  static async fromResponse(response: Response) {
    return new ApiError(await response.json());
  }
}

export function createCatalogApi({
  apiBaseUrl,
  getAccessToken,
  fetch: fetchImpl,
}: CatalogApiDependencies): CatalogApi {
  return {
  async search(query) {
    const response = await fetchImpl(
      `${apiBaseUrl}/procedures?query=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${await getAccessToken()}` },
      },
    );
    if (!response.ok) throw await ApiError.fromResponse(response);
    const body = await response.json();
    return z.array(procedureSchema).parse(body.data);
  },
  async create(input) {
    const response = await fetchImpl(`${apiBaseUrl}/procedures`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${await getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new ApiError(await response.json());
    const body = await response.json();
    return procedureSchema.parse(body.data);
  },
  };
}
```

- [ ] **Step 4: 웹 검증**

Run: `npm test -- apps/web/features/catalog/catalog-page.test.tsx && npm run typecheck --workspace @ready-on/web && npm run build --workspace @ready-on/web`
Expected: component test PASS, typecheck and build exit code 0

- [ ] **Step 5: 커밋**

```bash
git add apps/web
git commit -m "feat(web): add staff procedure catalog"
```

### Task 7: 전체 검증과 실행 문서

**Files:**
- Create: `.env.example`
- Create: `docs/DEVELOPMENT.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: web, api, contracts workspace scripts
- Produces: 신규 팀원이 재현 가능한 로컬 실행 절차

- [ ] **Step 1: 환경변수 검증 실패 테스트 작성**

`apps/api/src/database/database-url.test.ts`에서 `DATABASE_URL`이 없거나 `postgresql://` 또는 `postgres://`이 아니면 명시적 오류가 발생하는 기대값을 먼저 작성한다.

- [ ] **Step 2: 실패 확인**

Run: `npm test -- apps/api/src/database/database-url.test.ts`
Expected: FAIL because `readDatabaseUrl` does not exist

- [ ] **Step 3: 최소 환경변수 검증과 실행 문서 구현**

`.env.example`에는 비밀값이 아닌 키 이름만 기록한다.

```dotenv
DATABASE_URL=postgresql://runtime_user:change-me@host:5432/postgres?sslmode=verify-full
SUPABASE_URL=https://example.supabase.co
SUPABASE_JWT_ISSUER=https://example.supabase.co/auth/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
```

`docs/DEVELOPMENT.md`에는 설치, migration, API `3001`, Web `3000`, test/typecheck/build 명령을 순서대로 기록한다.

```ts
export function readDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const value = env.DATABASE_URL;
  if (!value || !/^postgres(ql)?:\/\//.test(value)) {
    throw new Error(
      'DATABASE_URL must be a PostgreSQL connection URL.',
    );
  }
  return value;
}
```

- [ ] **Step 4: 전체 검증**

Run: `npm test && npm run typecheck && npm run build`
Expected: all tests PASS, typecheck and build exit code 0

Run: `git diff --check`
Expected: no output

- [ ] **Step 5: 커밋**

```bash
git add .env.example README.md docs/DEVELOPMENT.md apps/api/src/database
git commit -m "docs: add reproducible local development setup"
```

## 다음 계획과의 연결

이 계획이 끝나면 별도 계획으로 다음 수직 기능을 이어간다.

1. 준비 프로토콜 초안·단계·게시·버전 불변성
2. 환자 준비 케이스 생성과 작업 스냅샷
3. 환자 현재 할 일·완료·도움 요청
4. 의료진 예외 대시보드
5. Supabase Auth JWT와 조직 RLS 통합 검증
