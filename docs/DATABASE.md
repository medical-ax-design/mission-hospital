# PostgreSQL 데이터베이스 설계

## 1. 원칙

- PostgreSQL과 Supabase를 사용한다.
- 기본키는 UUID `id`를 사용한다.
- 외부 병원 코드는 nullable 업무 속성으로 저장한다.
- 모든 시간은 `timestamptz`로 저장한다.
- 게시된 프로토콜은 불변 데이터로 취급한다.
- 물리 삭제보다 비활성화와 상태 전환을 우선한다.
- 스키마 변경은 `supabase/migrations`로만 배포한다.

## 2. 확장 기능

```sql
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
```

`pgcrypto`는 UUID 생성을, `pg_trgm`은 한국어 검사·수술 이름 부분 검색을 지원한다.

## 3. Enum

```sql
create type user_role as enum ('ADMIN', 'STAFF', 'PATIENT');
create type procedure_type as enum ('EXAM', 'SURGERY');
create type protocol_status as enum ('DRAFT', 'PUBLISHED', 'RETIRED');
create type step_phase as enum ('PRE_PROCEDURE', 'POST_PROCEDURE');
create type response_type as enum (
  'ACKNOWLEDGE',
  'COMPLETE',
  'YES_NO',
  'HELP_REQUEST',
  'INFORMATION_ONLY'
);
create type case_status as enum (
  'NOT_STARTED',
  'IN_PROGRESS',
  'NEEDS_ATTENTION',
  'READY',
  'CANCELLED',
  'COMPLETED'
);
create type task_status as enum (
  'PENDING',
  'AVAILABLE',
  'COMPLETED',
  'OVERDUE',
  'HELP_REQUESTED',
  'NEEDS_REVIEW',
  'CANCELLED'
);
```

## 4. 테이블

### organizations

```sql
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### profiles

```sql
create table profiles (
  id uuid primary key references auth.users(id),
  organization_id uuid not null references organizations(id),
  role user_role not null,
  display_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### procedure_catalog

```sql
create table procedure_catalog (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  procedure_type procedure_type not null,
  name text not null,
  normalized_name text not null,
  external_code text,
  department text not null,
  description text,
  is_active boolean not null default true,
  row_version integer not null default 1,
  created_by uuid not null references profiles(id),
  updated_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint procedure_name_not_blank check (length(trim(name)) > 0),
  constraint procedure_department_not_blank check (length(trim(department)) > 0)
);
```

제약과 인덱스:

```sql
create unique index procedure_external_code_unique
  on procedure_catalog (organization_id, external_code)
  where external_code is not null;

create index procedure_name_trgm_idx
  on procedure_catalog using gin (normalized_name gin_trgm_ops);

create index procedure_department_idx
  on procedure_catalog (organization_id, department)
  where is_active = true;
```

### preparation_protocols

```sql
create table preparation_protocols (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  procedure_id uuid not null references procedure_catalog(id),
  version integer not null,
  status protocol_status not null default 'DRAFT',
  title text not null,
  applicability_note text,
  patient_notice text,
  internal_note text,
  row_version integer not null default 1,
  published_at timestamptz,
  retired_at timestamptz,
  created_by uuid not null references profiles(id),
  published_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (procedure_id, version),
  constraint protocol_version_positive check (version > 0)
);
```

동일 Procedure의 게시 버전 하나를 강제한다.

```sql
create unique index one_published_protocol_per_procedure
  on preparation_protocols (procedure_id)
  where status = 'PUBLISHED';
```

### protocol_steps

```sql
create table protocol_steps (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references preparation_protocols(id) on delete cascade,
  sort_order integer not null,
  phase step_phase not null default 'PRE_PROCEDURE',
  title text not null,
  instruction text not null,
  availability_offset_minutes integer not null,
  due_offset_minutes integer not null,
  is_required boolean not null default true,
  response_type response_type not null,
  help_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (protocol_id, sort_order),
  constraint step_offsets_valid
    check (availability_offset_minutes <= due_offset_minutes),
  constraint step_title_not_blank check (length(trim(title)) > 0),
  constraint step_instruction_not_blank check (length(trim(instruction)) > 0)
);
```

`on delete cascade`는 DRAFT 삭제에만 사용한다. API는 PUBLISHED와 RETIRED 프로토콜의 단계 삭제를 금지한다.

PUBLISHED 또는 RETIRED 프로토콜의 임상 안내 필드와 연결된 protocol_steps 변경을 거부하는 DB trigger를 둔다. 상태 전환 시각과 감사 로그처럼 허용된 운영 필드만 명시적으로 변경할 수 있다.

### preparation_cases

```sql
create table preparation_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_subject_id uuid references profiles(id),
  patient_display_name text not null,
  patient_age_label text,
  procedure_id uuid not null references procedure_catalog(id),
  protocol_id uuid not null references preparation_protocols(id),
  protocol_version integer not null,
  scheduled_at timestamptz not null,
  status case_status not null default 'NOT_STARTED',
  is_demo boolean not null default true,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

프로토타입에서는 PATIENT 역할의 데모 프로필을 `patient_subject_id`에 연결하고 가상 표시명만 사용한다.

### case_tasks

```sql
create table case_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  case_id uuid not null references preparation_cases(id),
  source_step_id uuid not null references protocol_steps(id),
  source_protocol_id uuid not null references preparation_protocols(id),
  source_protocol_version integer not null,
  sort_order integer not null,
  phase step_phase not null,
  title_snapshot text not null,
  instruction_snapshot text not null,
  response_type_snapshot response_type not null,
  is_required boolean not null,
  available_at timestamptz not null,
  due_at timestamptz not null,
  status task_status not null default 'PENDING',
  response_data jsonb,
  responded_by uuid references profiles(id),
  responded_at timestamptz,
  resolved_by uuid references profiles(id),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, sort_order)
);
```

`response_data`에는 허용된 스키마만 저장하며 임의 의료기록 입력창으로 사용하지 않는다.

### idempotency_keys

```sql
create table idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  key text not null,
  actor_id uuid not null,
  request_hash text not null,
  response_status integer,
  response_body jsonb,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (organization_id, actor_id, key)
);
```

### audit_logs

```sql
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  before_data jsonb,
  after_data jsonb,
  request_id text,
  occurred_at timestamptz not null default now()
);
```

감사 로그에는 update와 delete 권한을 부여하지 않는다.

## 5. 주요 인덱스

```sql
create index protocols_by_procedure
  on preparation_protocols (procedure_id, status, version desc);

create index cases_dashboard
  on preparation_cases (organization_id, scheduled_at, status);

create index case_tasks_by_case
  on case_tasks (case_id, sort_order);

create index tasks_attention
  on case_tasks (organization_id, status, due_at)
  where status in ('OVERDUE', 'HELP_REQUESTED', 'NEEDS_REVIEW');

create index audit_entity
  on audit_logs (organization_id, entity_type, entity_id, occurred_at desc);
```

## 6. 트랜잭션

반드시 트랜잭션으로 처리할 작업:

- 프로토콜 새 버전 게시와 기존 버전 종료
- 환자 케이스와 모든 Case Task 생성
- 작업 상태 변경과 감사 로그 기록
- Procedure 비활성화와 관련 상태 검증

## 7. 동시성

- 편집 가능 엔터티는 `row_version`을 사용한다.
- update 조건에 `id`와 현재 `row_version`을 포함한다.
- 영향 행이 0이면 `409 CONCURRENT_MODIFICATION`을 반환한다.
- 게시와 케이스 생성 시 필요한 행을 `for update`로 잠근다.

## 8. RLS 방향

모든 업무 테이블에 RLS를 활성화한다.

원칙:

- 사용자는 자신의 `organization_id` 행만 접근한다.
- PATIENT는 본인에게 연결된 케이스만 조회한다.
- 감사 로그는 ADMIN만 조회한다.
- 쓰기 권한은 API의 런타임 역할과 명시적 정책으로 제한한다.

OCI API는 사용자 JWT로 PostgREST를 호출하지 않고 Drizzle로 PostgreSQL에 직접 연결한다. 따라서 `auth.uid()`만으로 조직 경계를 구현하지 않는다.

런타임 DB 역할에는 `BYPASSRLS`를 부여하지 않고, 각 요청 트랜잭션 시작 시 검증된 조직과 사용자를 transaction-local 설정으로 주입한다.

```sql
select set_config('app.organization_id', $1, true);
select set_config('app.actor_id', $2, true);
```

조직 정책 예:

```sql
create policy organization_isolation
on procedure_catalog
using (
  organization_id =
  current_setting('app.organization_id', true)::uuid
)
with check (
  organization_id =
  current_setting('app.organization_id', true)::uuid
);
```

트랜잭션 밖에서 쿼리를 실행하지 않으며, 설정이 없으면 정책이 접근을 거부하도록 테스트한다. 프로토타입에서도 RLS를 비활성화한 상태를 정상 구성으로 간주하지 않는다.

## 9. Seed 데이터

가상 데이터:

- 조직: `Demo Hospital`
- ADMIN 1명, STAFF 1명, PATIENT 1명
- Procedure 5개: 대장내시경, 조영 복부 CT, 뇌 MRI/MRA, 대장암 수술, 일반 X-ray
- 게시 프로토콜: 대장내시경 1개
- 가상 환자 케이스 3개: 정상 진행, 도움 요청, 기한 경과

공개된 병원 안내는 콘텐츠 구조 참고에만 사용하고 `Demo Hospital`이 승인한 가상 문구로 표시한다.
