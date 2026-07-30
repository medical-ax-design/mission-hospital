# Documentation Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 현재 보호자 동행 프로토타입 문서만 `docs` 최상위에 남기고 이전 제품 트랙과 완료된 작업 기록을 비권위 아카이브로 분리한다.

**Architecture:** 현재 제품 기준 문서는 제품·요구사항·UX·기술·안전·근거의 일곱 역할로 제한한다. 과거 문서는 내용 변경 없이 목적별 아카이브로 이동하며, 현재 구현 상태는 하나의 `TECHNICAL_OVERVIEW.md`에서 코드와 동일하게 설명한다.

**Tech Stack:** Markdown, Git, Node.js 링크 검사, npm workspace 검증

## Global Constraints

- 문서를 삭제하지 않고 `docs/archive`에 보존한다.
- 보호자 여정은 메모리 저장소, 검사·수술 카탈로그는 PostgreSQL 준비 상태로 구분한다.
- 실제 EMR, 병원 지도, Voice EMR 연동을 구현된 기능으로 표현하지 않는다.
- 현재 API 실행 계약은 `packages/contracts`와 API 테스트를 최종 기준으로 삼는다.
- 아카이브 문서는 현재 요구사항이나 구현 상태의 기준으로 사용하지 않는다.

---

## File Structure

### Current documents

- `docs/README.md`: 현재 문서 지도와 우선순위
- `docs/PRODUCT_BRIEF.md`: 제품 목적과 경계
- `docs/PRD.md`: 프로토타입 요구사항
- `docs/UX_SPEC.md`: 보호자 화면 흐름
- `docs/TECHNICAL_OVERVIEW.md`: 실제 구현 아키텍처, API, 저장소, 실행과 배포 경계
- `docs/SECURITY_PRIVACY.md`: 개인정보와 의료 안전 기준
- `docs/REFERENCES.md`: 조사와 기술 근거

### Historical documents

- `docs/archive/preparation-orchestration/`: 이전 준비 오케스트레이션 제품 문서와 계획
- `docs/archive/process/`: 완료된 PR·보호자 여정·문서 정리 설계와 실행 계획

---

### Task 1: 이전 준비 오케스트레이션 문서 분리

**Files:**

- Create: `docs/archive/preparation-orchestration/README.md`
- Move: `docs/API_SPEC.md`
- Move: `docs/ARCHITECTURE.md`
- Move: `docs/DATABASE.md`
- Move: `docs/DOMAIN_MODEL.md`
- Move: `docs/INFRASTRUCTURE.md`
- Move: `docs/PROTOTYPE_PLAN.md`
- Move: `docs/QA_PLAN.md`
- Move: `docs/TEAM_PLAN.md`
- Move: `docs/superpowers/specs/2026-07-29-preparation-orchestration-service-design.md`
- Move: `docs/superpowers/plans/2026-07-29-mvp-foundation-catalog.md`

**Interfaces:**

- Consumes: 현재 문서 목록과 Git 이동 기록
- Produces: 현재 기준에서 분리된 `docs/archive/preparation-orchestration`

- [ ] **Step 1: 아카이브 디렉터리를 만들고 이전 문서를 Git 이동한다**

```bash
mkdir -p docs/archive/preparation-orchestration
git mv docs/API_SPEC.md docs/ARCHITECTURE.md docs/DATABASE.md \
  docs/DOMAIN_MODEL.md docs/INFRASTRUCTURE.md docs/PROTOTYPE_PLAN.md \
  docs/QA_PLAN.md docs/TEAM_PLAN.md \
  docs/archive/preparation-orchestration/
git mv docs/superpowers/specs/2026-07-29-preparation-orchestration-service-design.md \
  docs/superpowers/plans/2026-07-29-mvp-foundation-catalog.md \
  docs/archive/preparation-orchestration/
```

- [ ] **Step 2: 비권위 문서 안내를 작성한다**

`docs/archive/preparation-orchestration/README.md`에 아래 내용을 기록한다.

```markdown
# 검사·수술 준비 오케스트레이션 아카이브

이 디렉터리는 Wait:ON이 검사·수술 준비 누락 방지 서비스를 중심으로
검토하던 시기의 설계 자산이다. 현재 보호자 동행 프로토타입의
요구사항이나 구현 상태를 설명하지 않는다.

현재 기준은 `../../README.md`, `../../PRODUCT_BRIEF.md`,
`../../PRD.md`, `../../UX_SPEC.md`,
`../../TECHNICAL_OVERVIEW.md`를 따른다.
```

- [ ] **Step 3: 이동 결과를 확인한다**

Run:

```bash
find docs/archive/preparation-orchestration -maxdepth 1 -type f | sort
```

Expected: `README.md`를 포함한 11개 파일이 출력되고 원래 경로에는 대상 파일이 없다.

- [ ] **Step 4: 변경을 커밋한다**

```bash
git add docs
git commit -m "docs: archive preparation orchestration track"
```

---

### Task 2: 현재 기술 개요와 문서 인덱스 정합화

**Files:**

- Create: `docs/TECHNICAL_OVERVIEW.md`
- Modify: `docs/README.md`
- Modify: `README.md`

**Interfaces:**

- Consumes: `apps/web`, `apps/api`, `packages/contracts`, `supabase/migrations`
- Produces: 현재 코드와 동일한 기술 경계와 유효한 문서 링크

- [ ] **Step 1: 실제 구현 정보를 코드에서 확인한다**

Run:

```bash
rg -n "@Controller|@(Get|Post)|MemoryCaregiverJourneyRepository|procedure_catalog|NEXT_PUBLIC_API_BASE_URL|DATABASE_URL" \
  apps packages supabase README.md
```

Expected: 보호자 여정, 카탈로그, health endpoint와 메모리·PostgreSQL 저장소 경계가 확인된다.

- [ ] **Step 2: 현재 기술 개요를 작성한다**

`docs/TECHNICAL_OVERVIEW.md`에는 아래 항목을 실제 코드 기준으로 작성한다.

```markdown
# 현재 기술 개요

## 1. 범위와 기준
## 2. 모노레포 구성
## 3. 실행 흐름
## 4. 구현된 API
## 5. 데이터 저장
## 6. 의료·개인정보 경계
## 7. 로컬 실행과 검증
## 8. 배포 목표와 미구현 연동
```

필수 사실:

- Web은 Next.js, API는 NestJS, 공유 계약은 Zod를 사용한다.
- 보호자 여정은 API 재시작 시 초기화되는 메모리 저장소다.
- 카탈로그는 PostgreSQL migration과 RLS transaction 저장소가 있다.
- 실제 인증, EMR/OCS/Voice EMR, 병원 실내 지도, 외부 공유는 없다.
- 구현된 endpoint만 표로 기록하고 계획 상태 endpoint를 넣지 않는다.

- [ ] **Step 3: 문서 인덱스를 현재 기준으로 수정한다**

`docs/README.md`에서 현재 기준 문서 7개와 두 아카이브의 역할을
구분한다. 이전 트랙을 현재 기술 문서로 소개하는 설명을 제거한다.

저장소 `README.md`의 문서 링크는 아래 네 문서를 우선 연결한다.

```markdown
- [문서 안내](./docs/README.md)
- [제품 개요](./docs/PRODUCT_BRIEF.md)
- [제품 요구사항](./docs/PRD.md)
- [현재 기술 개요](./docs/TECHNICAL_OVERVIEW.md)
```

- [ ] **Step 4: 현재 문서 링크를 검사한다**

Run:

```bash
node -e "const fs=require('fs'),path=require('path');const files=['README.md',...fs.readdirSync('docs').filter(f=>f.endsWith('.md')).map(f=>'docs/'+f)];let bad=[];for(const file of files){const text=fs.readFileSync(file,'utf8');for(const match of text.matchAll(/\\[[^\\]]+\\]\\(([^)#]+)(?:#[^)]+)?\\)/g)){const target=match[1];if(/^(https?:|mailto:)/.test(target))continue;const resolved=path.resolve(path.dirname(file),target);if(!fs.existsSync(resolved))bad.push(file+' -> '+target)}}if(bad.length){console.error(bad.join('\\n'));process.exit(1)}console.log('Current documentation links: OK')"
```

Expected: `Current documentation links: OK`

- [ ] **Step 5: 변경을 커밋한다**

```bash
git add README.md docs/README.md docs/TECHNICAL_OVERVIEW.md
git commit -m "docs: align documentation with caregiver prototype"
```

---

### Task 3: 완료된 프로세스 문서 아카이브와 전체 검증

**Files:**

- Create: `docs/archive/process/README.md`
- Move: `docs/superpowers/specs/2026-07-29-pull-request-template-design.md`
- Move: `docs/superpowers/plans/2026-07-29-pull-request-template.md`
- Move: `docs/superpowers/specs/2026-07-30-caregiver-journey-prototype-design.md`
- Move: `docs/superpowers/plans/2026-07-30-caregiver-journey-prototype.md`
- Move: `docs/superpowers/specs/2026-07-30-documentation-cleanup-design.md`
- Move: `docs/superpowers/plans/2026-07-30-documentation-cleanup.md`

**Interfaces:**

- Consumes: 완료된 설계·구현 기록
- Produces: 현재 기준 문서와 명확히 분리된 프로세스 아카이브

- [ ] **Step 1: 프로세스 문서를 이동한다**

```bash
mkdir -p docs/archive/process
git mv docs/superpowers/specs/2026-07-29-pull-request-template-design.md \
  docs/superpowers/plans/2026-07-29-pull-request-template.md \
  docs/superpowers/specs/2026-07-30-caregiver-journey-prototype-design.md \
  docs/superpowers/plans/2026-07-30-caregiver-journey-prototype.md \
  docs/superpowers/specs/2026-07-30-documentation-cleanup-design.md \
  docs/superpowers/plans/2026-07-30-documentation-cleanup.md \
  docs/archive/process/
```

- [ ] **Step 2: 프로세스 아카이브 안내를 작성한다**

```markdown
# 완료된 설계·구현 기록

이 디렉터리는 완료된 설계와 작업 계획을 보존한다. 현재 제품
요구사항과 기술 상태는 `../../README.md`에서 연결한 기준 문서를
따른다.
```

- [ ] **Step 3: 문서 구조와 링크를 최종 확인한다**

Run:

```bash
find docs -maxdepth 1 -type f -print | sort
```

Expected: `README.md`, `PRODUCT_BRIEF.md`, `PRD.md`, `UX_SPEC.md`,
`TECHNICAL_OVERVIEW.md`, `SECURITY_PRIVACY.md`, `REFERENCES.md`만 출력된다.

Run the current-document link checker from Task 2.

Expected: `Current documentation links: OK`

- [ ] **Step 4: 저장소 검증을 실행한다**

Run:

```bash
npm test
npm run typecheck
npm run build
git diff --check origin/main...HEAD
```

Expected: 40 tests pass, all workspace type checks and production builds pass, diff check exits 0.

- [ ] **Step 5: 변경을 커밋한다**

```bash
git add README.md docs
git commit -m "docs: archive completed implementation records"
```

- [ ] **Step 6: PR 브랜치를 갱신한다**

```bash
git push origin feat/caregiver-journey-prototype
gh pr view 2 --json number,state,isDraft,mergeStateStatus,url
```

Expected: PR `2` is `OPEN`, `isDraft` is `false`, and the pushed commits are included.
