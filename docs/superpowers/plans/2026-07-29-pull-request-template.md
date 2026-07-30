# Pull Request 템플릿 및 Draft PR 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 제품·개발 통합형 기본 PR 템플릿을 저장소에 추가하고 현재 MVP 기반 구현을 `main` 대상 Draft PR로 생성한다.

**Architecture:** GitHub이 자동 인식하는 `.github/pull_request_template.md` 한 개를 공용 기준으로 사용한다. 현재 PR 본문은 같은 섹션 구조를 사용하되 실제 구현·검증·미완료 범위를 채워 생성한다.

**Tech Stack:** GitHub Markdown, GitHub CLI

## Global Constraints

- base 브랜치는 `main`, head 브랜치는 `feat/mvp-foundation`이다.
- 현재 전체 MVP가 완료되지 않았으므로 Draft PR로 생성한다.
- PR 본문에는 실제 환자정보, 비밀정보, 토큰을 포함하지 않는다.
- 실행하지 않은 검증 항목은 체크하지 않는다.
- 실제 최신 검증 결과인 테스트 11개 통과, typecheck 통과, build 통과, npm 취약점 0건만 기록한다.

---

### Task 1: 공용 PR 템플릿 저장

**Files:**
- Create: `.github/pull_request_template.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-29-pull-request-template-design.md`
- Produces: GitHub 새 PR 화면에서 자동 로드되는 기본 PR 본문

- [x] **Step 1: 기본 템플릿 작성**

````markdown
## 변경 목적

<!-- 해결하려는 문제와 사용자·운영자에게 생기는 변화를 적어주세요. -->

## 변경 내용

### 포함

-

### 포함하지 않음

-

## 관련 문서

<!-- PRD 요구사항, 설계 문서, 이슈를 연결하세요. 없으면 '해당 없음'으로 적으세요. -->

-

## 검증

### 자동 검증

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm audit --audit-level=high`

### 수동 검증

- [ ] 핵심 사용자 흐름 확인
- [ ] 오류·빈 상태 확인

실행 결과:

```text
명령과 결과를 적어주세요.
```

## 데이터베이스·API

- Migration: 해당 없음
- API 계약 변경: 해당 없음
- 하위 호환성: 해당 없음
- Rollback 또는 복구: 해당 없음

## 보안·개인정보·의료 안전

- [ ] 실제 환자정보를 포함하지 않았습니다.
- [ ] 비밀정보와 토큰을 커밋하지 않았습니다.
- [ ] 인증·권한·조직 격리 영향을 검토했습니다.
- [ ] 의료지침을 임의로 생성하거나 변경하지 않았습니다.
- [ ] `READY`를 임상적 판단으로 표현하지 않았습니다.

## 화면 변경

<!-- 스크린샷 또는 영상을 첨부하세요. UI 변경이 없으면 '해당 없음'으로 적으세요. -->

해당 없음

접근성·반응형 확인:

- [ ] 키보드 접근
- [ ] 모바일 또는 데스크톱 기준 화면
- [ ] 오류 메시지와 포커스

## 배포·운영

- 환경변수 변경: 해당 없음
- 배포 순서: 해당 없음
- Health check 영향: 해당 없음
- Rollback: 해당 없음

## 리뷰 요청

<!-- 리뷰어가 우선 확인할 파일, 규칙, 위험을 적어주세요. -->

-

## 완료 체크

- [ ] 변경 범위와 제외 범위를 명시했습니다.
- [ ] 관련 문서를 갱신했습니다.
- [ ] 필요한 테스트를 추가하거나 갱신했습니다.
- [ ] Draft 해제 전에 미완료 항목을 처리했습니다.
````

- [x] **Step 2: 템플릿 검증**

Run: `git diff --check`
Expected: no output

직접 확인:

- 파일 경로가 `.github/pull_request_template.md`
- 설계 문서의 10개 섹션이 모두 존재
- 체크박스가 기본적으로 선택되지 않음
- 실제 데이터나 환경 비밀값이 없음

- [x] **Step 3: 커밋과 푸시**

```bash
git add .github/pull_request_template.md docs/superpowers/plans/2026-07-29-pull-request-template.md
git commit -m "docs: add product and engineering PR template"
git push
```

### Task 2: 현재 구현 Draft PR 생성

**Files:**
- No repository files

**Interfaces:**
- Consumes: 공용 PR 템플릿 섹션, `feat/mvp-foundation` 최신 커밋과 검증 결과
- Produces: GitHub Draft Pull Request

- [x] **Step 1: 최신 브랜치 검증**

Run: `git status --short`
Expected: no output

Run: `git rev-parse HEAD && git rev-parse origin/feat/mvp-foundation`
Expected: two hashes are identical

Run: `gh pr list --head feat/mvp-foundation --state all`
Expected: no existing PR

- [x] **Step 2: Draft PR 생성**

제목:

```text
feat: establish Ready:ON MVP foundation
```

본문에는 다음을 정확히 기록한다.

- 완료: workspace, contracts, health API, migration, Drizzle schema, catalog service, RLS transaction/repository
- 미완료: Supabase JWT, REST controller, staff web UI, deployment
- DB: 새 migration 1개, 빈 DB 또는 demo DB에 적용
- 보안: 가상 데이터 전용, RLS runtime role 검증
- 검증: 5 test files, 11 tests, typecheck/build/audit 통과
- 리뷰 요청: migration·RLS, snapshot 전 단계인 catalog boundary, 문서와 구현 일치

`/private/tmp/ready-on-pr-body.md`에 위 내용을 공용 템플릿의 섹션 구조로 채워 저장한다.

Run:

```bash
gh pr create \
  --base main \
  --head feat/mvp-foundation \
  --draft \
  --title "feat: establish Ready:ON MVP foundation" \
  --body-file /private/tmp/ready-on-pr-body.md
```

Expected: GitHub PR URL

- [x] **Step 3: 생성 결과 검증**

Run: `gh pr view --json number,title,state,isDraft,url,baseRefName,headRefName`

Expected:

```json
{
  "title": "feat: establish Ready:ON MVP foundation",
  "state": "OPEN",
  "isDraft": true,
  "baseRefName": "main",
  "headRefName": "feat/mvp-foundation"
}
```
