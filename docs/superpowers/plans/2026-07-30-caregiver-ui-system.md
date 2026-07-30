# Wait:ON 보호자 UI 시스템 구현 계획

- 설계: `docs/superpowers/specs/2026-07-30-caregiver-ui-system-design.md`
- 목표: 모든 보호자 화면에 동일한 모바일 셸·헤더·카드·하단 메뉴를
  적용하고 실제 날짜 선택이 동작하는 일정을 완성한다.

## 1. 공통 셸과 디자인 토큰

대상:

- `apps/web/app/globals.css`
- `apps/web/features/caregiver-journey/components/mobile-shell.tsx`
- `apps/web/features/caregiver-journey/components/bottom-navigation.tsx`
- `apps/web/features/caregiver-journey/components/app-header.tsx` 신규

작업:

1. 네이비·Wait:ON 녹색·밝은 앱 표면 토큰을 추가한다.
2. 데스크톱 430px 중앙 셸과 모바일 전체 화면 규칙을 통일한다.
3. 홈용 브랜드 헤더와 하위 화면용 앱 헤더를 공통 컴포넌트로 만든다.
4. 하단 메뉴의 위치, 높이, 아이콘과 선택 상태를 통일한다.
5. 320px, 390px와 200% 글자 확대에서 겹치지 않는 여백을 확보한다.

검증:

- 주요 메뉴가 `홈 / 일정 / 이용 안내` 순서를 유지한다.
- 현재 메뉴는 `aria-current="page"`를 제공한다.
- 모든 주요 조작 영역이 최소 48px이다.

## 2. 홈 정보 구조

대상:

- `apps/web/features/caregiver-journey/components/caregiver-home-screen.tsx`
- `apps/web/features/caregiver-journey/caregiver-journey-app.tsx`
- `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`

작업:

1. 홈 상단을 브랜드, 보호자 인사와 목적 검색이 포함된 네이비
   히어로로 재구성한다.
2. 병원 확인 현재 상태를 첫 번째 흰 카드로 옮긴다.
3. 보호자 업무와 주의사항의 주요 행동을 하나씩 유지한다.
4. 오늘 일정 최대 세 개와 `전체 일정 보기`를 추가한다.
5. 목적 검색과 바로가기에서 기존 공식 이용 안내 검색으로 연결한다.
6. 병원 확인 정보와 일반 안내의 출처 문구를 유지한다.

검증:

- 현재 상태, 지금 할 일과 오늘 일정이 이 순서로 읽힌다.
- 목적 검색은 의료 질문을 처리하지 않고 이용 안내 검색만 호출한다.
- 기존 데모 시나리오 선택과 상태 전환이 유지된다.

## 3. 실제 날짜 선택 일정

대상:

- `apps/web/features/caregiver-journey/calendar-model.ts`
- `apps/web/features/caregiver-journey/calendar-model.test.ts`
- `apps/web/features/caregiver-journey/components/schedule-screen.tsx`
- `apps/web/features/caregiver-journey/caregiver-journey-app.test.tsx`

작업:

1. 서울 시간 기준 날짜 키의 이동과 5일 스트립 모델을 추가한다.
2. 선택 날짜 요약 카드와 5개 날짜 버튼을 구현한다.
3. 일정 날짜의 표식과 접근 가능한 일정 개수를 표시한다.
4. 월간 달력을 `달력 보기`로 펼치거나 접게 한다.
5. 날짜 변경 시 날짜 제목, 일정 수와 목록을 동시에 갱신한다.
6. 일정 없는 날짜와 `오늘로 돌아가기`를 구현한다.
7. 일정 카드를 시간 열, 유형, 장소와 준비사항 구조로 변경한다.

검증:

- 날짜 버튼은 실제 `button`과 `aria-pressed`를 사용한다.
- 7월 30일에서 31일로 선택하면 31일 일정만 표시한다.
- 빈 날짜를 선택하면 다른 날의 일정을 복사하지 않는다.
- 월 경계의 5일 스트립이 올바른 날짜 키를 만든다.

## 4. 치료 진행 화면 통일

대상:

- `apps/web/features/caregiver-journey/components/treatment-progress-screen.tsx`
- `apps/web/features/caregiver-journey/components/treatment-stage-media.tsx`
- `apps/web/features/caregiver-journey/components/treatment-demo-controls.tsx`
- 관련 컴포넌트 테스트

작업:

1. 공통 앱 헤더와 콘텐츠 여백을 적용한다.
2. 병원 확인 상태를 강조 카드로 표시한다.
3. AI 미디어는 파란 보조색과 기존 안전 고지를 유지한다.
4. 전체 타임라인을 하나의 흰 카드 안에 배치한다.
5. 완료·현재·예정 상태를 색상 외 텍스트와 기호로 표시한다.
6. 데모 제어 막대를 하단 메뉴 또는 화면 하단 안전 영역과 겹치지 않게
   배치한다.

검증:

- 병원 상태가 AI 미디어보다 먼저 읽힌다.
- AI 사용 및 실시간 영상이 아니라는 고지가 유지된다.
- 이전·다음·자동 진행 시 상태, 미디어와 타임라인이 함께 바뀐다.

## 5. 이용 안내와 하위 화면 통일

대상:

- `apps/web/features/hospital-guide/components/hospital-guide-home-screen.tsx`
- `apps/web/features/hospital-guide/components/purpose-result-screen.tsx`
- `apps/web/features/hospital-guide/components/building-directory-screen.tsx`
- `apps/web/features/hospital-guide/components/floor-detail-screen.tsx`
- `apps/web/features/hospital-guide/components/safe-navigation-screen.tsx`
- `apps/web/features/caregiver-journey/components/caregiver-task-screen.tsx`
- `apps/web/features/caregiver-journey/components/restriction-guidance-screen.tsx`
- `apps/web/features/caregiver-journey/components/saved-questions-screen.tsx`

작업:

1. 하위 화면에 동일한 네이비 앱 헤더를 적용한다.
2. 목적 검색, 목적 칩, 공식 결과 카드와 주요 행동의 규격을 통일한다.
3. 건물·층 선택과 공식 지도도 앱 셸의 카드 경계 안에 배치한다.
4. 제한 안내와 질문 목록은 경고색 규칙과 동일한 카드 구조를 사용한다.
5. `MAP_ONLY`, `VERIFIED`, `UNAVAILABLE` 안전 동작과 공식 출처를
   변경하지 않는다.

검증:

- 하위 화면 이동 후에도 같은 앱으로 인식되는 헤더와 여백을 유지한다.
- 공개 지도에서 추정 경로선이 생기지 않는다.
- 의료 허용 판정이나 AI 복약 지침이 추가되지 않는다.

## 6. 회귀 검증과 문서 동기화

대상:

- `apps/web/features/**/*.test.tsx`
- `apps/web/features/**/*.test.ts`
- `docs/UX_SPEC.md`
- `docs/PRD.md`

작업:

1. 변경된 화면 제목과 상호작용에 맞춰 테스트를 갱신한다.
2. 전체 웹 테스트, 타입 검사와 프로덕션 빌드를 실행한다.
3. 390×844와 1280×900에서 홈→일정→이용 안내→진행상황 흐름을
   브라우저로 확인한다.
4. 가로 스크롤, 고정 메뉴 겹침, 콘솔 오류와 모션 감소를 확인한다.
5. 최종 UI 구조와 날짜 상호작용을 UX·PRD 문서에 반영한다.

명령:

```bash
npm test -- --run apps/web
npm run typecheck --workspace @ready-on/web
npm run build --workspace @ready-on/web
```

완료 조건:

- 핵심 흐름과 기존 안전 테스트가 통과한다.
- 날짜 선택이 실제 일정 목록을 바꾼다.
- 모든 화면이 공통 앱 셸과 시각 규칙을 사용한다.
- 기존 치료 미디어, 제한 안내와 공식 지도 안전 경계가 유지된다.
