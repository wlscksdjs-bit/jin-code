# PMS 원가/손익 관리 고도화 플랜

## TL;DR

> **Quick Summary**: 원가/손익 관리 workflow 완성 - 견적원가 → 실행원가 → 실적 관리까지全程관리
> 
> **Deliverables**:
> - 테스트 인프라 구축 (vitest)
> - CostExecution CRUD UI (실행원가)
> - CostActual CRUD API+UI (실적/예상)
> - 견적→실행원가 전환 기능 (반자동)
> - 손익 현황 대시보드
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: 테스트 구축 → CostExecution UI → 전환기능 → CostActual → 대시보드

---

## Context

### Original Request
사용자 요구사항:
- **핵심 영역**: 원가/손익 관리
- **Workflow**: 견적원가 → 실행원가 (반자동: 버튼 클릭으로 생성, 항목별 수동 입력)
- **테스트 전략**: TDD (테스트 인프라 구축 후)

### Interview Summary
**Key Discussions**:
- 원가 관리 workflow 완성 강조
- 견적원가 승인 후 실행원가 baseline 생성 (반자동)
- 19개 원가 항목 (재료비, 노무비, 경비 17항목, 간접비)

**Research Findings**:
- 기존 API: `/api/cost-estimate/create`, `/api/cost-execution/create` 존재
- CostEstimate UI: `/cost` 페이지에 존재
- CostExecution/CostActual: API/UI 미구현
- 테스트 인프라: 없음 (vitest 미설치)

### Metis Review (Self-Analysis)
**Identified Gaps** (addressed):
- 테스트 인프라 구축 필수 (TDD 선택했으므로)
- CostExecution UI 구현 필수
- CostActual API+UI 구현 필수
- 전환 workflow 설계 필요

---

## Work Objectives

### Core Objective
원가/손익 관리 workflow 완성: 견적원가 산출 → 실행원가 업데이트 → 실적/예상 관리 → 손익 추적

### Concrete Deliverables
- 테스트 인프라: vitest 설정 + 테스트 스크립트
- 실행원가 관리 UI: `/cost-execution` 페이지, CRUD
- 실적/예상 관리: CostActual API + UI
- 전환 기능: 견적원가 → 실행원가 복사 (반자동)
- 대시보드: 손익 현황, 절감/초과 표시

### Definition of Done
- [ ] vitest 설치 후 테스트 실행 가능
- [ ] 실행원가 목록/상세/생성 UI 작동
- [ ] 실적/예상 CRUD 작동
- [ ] 견적→실행원가 전환 버튼 작동
- [ ] 대시보드에서 손익 현황 확인 가능

### Must Have
- TDD 테스트 작성 (각 기능별)
- 기존 API route 패턴 준수
- shadcn/ui 컴포넌트 활용

### Must NOT Have (Guardrails)
- 다른 모듈 수정하지 않음 (sales, projects, resources 등)
- 데이터베이스 스키마 변경하지 않음 (모델은 이미 존재)
- 인증/권한 체계 변경하지 않음

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO → YES (構築)
- **Automated tests**: TDD
- **Framework**: vitest
- **If TDD**: 각 Task별 RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
모든 Task는 Agent-Executed QA Scenarios 포함:
- **Frontend/UI**: Playwright로 UI 검증
- **API**: curl로 응답 검증
- **단위테스트**: vitest로 검증

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (테스트 인프라 + 기반 구축):
├── T1: vitest 설치 및 설정
├── T2: 테스트 디렉토리 구조 생성
├── T3: CostExecution 타입 정의
├── T4: CostExecution Server Actions (CRUD)
└── T5: CostExecution 목록 페이지 skeleton

Wave 2 (실행원가 UI - MAX PARALLEL):
├── T6: CostExecution 생성 폼 UI
├── T7: CostExecution 상세/수정 UI
├── T8: CostExecution 삭제 기능
├── T9: CostEstimate → CostExecution 전환 버튼
└── T10: 전환 로직 (견적 복사)

Wave 3 (실적/예상 관리):
├── T11: CostActual API Routes (CRUD)
├── T12: CostActual Server Actions
├── T13: CostActual 목록 페이지
├── T14: CostActual 생성/수정 폼
└── T15: 실행원가 → 실적 집계 기능

Wave 4 (대시보드 + 통합):
├── T16: 손익 현황 컴포넌트
├── T17: 절감/초과 계산 로직
├── T18: 대시보드 연동
├── T19: 원가 페이지tab 통합
└── T20: E2E 테스트 작성
```

### Dependency Matrix
- T1, T2: — — 3-20
- T3: 1 — 4-5
- T4: 1,3 — 6-10
- T5: 1,3 — 6
- T6-10: 4-5 — 11-15,16-20
- T11-15: 6-10 — 16-20
- T16-20: 11-15 — FINAL

---

## TODOs

- [ ] 1. **vitest 설치 및 설정**

  **What to do**:
  - package.json에 vitest, @vitejs/plugin-react, jsdom, @testing-library/react 추가
  - vitest.config.ts 생성 (Next.js React 설정)
  - package.json에 test 스크립트 추가 ("test": "vitest", "test:run": "vitest run")
  - 예제 테스트 파일 생성 (tests/example.test.ts)

  **Must NOT do**:
  - jest 설정은 추가하지 않음 (vitest만 사용)

  **Recommended Agent Profile**:
  - **Category**: quick
    - Reason: 설정 파일 변경为主, 복잡한 로직 없음
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1
  - **Blocks**: All other tasks
  - **Blocked By**: None

  **References**:
  - package.json - 현재 의존성 확인
  - vitest.dev/docs - 설정 가이드

  **Acceptance Criteria**:
  - [ ] npm install 후 의존성 설치됨
  - [ ] npm test -- --run 으로 예제 테스트 통과

  **QA Scenarios**:
  - Scenario: vitest 실행 확인
    Tool: Bash
    Preconditions: vitest 설치됨
    Steps:
      1. npm test -- --run 실행
      2. "example" 테스트 통과 확인
    Expected Result: 테스트 통과 메시지
    Evidence: .sisyphus/evidence/task-1-vitest-setup.txt

- [ ] 2. **테스트 디렉토리 구조 생성**

  **What to do**:
  - tests/ 디렉토리 생성
  - tests/unit/, tests/integration/ 서브디렉토리
  - tests/setup.ts (vitest 전역 설정)
  - vitest.config.ts 업데이트 (setupFiles 경로)

  **Must NOT do**:
  - src/__tests__ 에 작성하지 않음 (tests/ 사용)

  **Recommended Agent Profile**:
  - **Category**: quick
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 1)
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: T3
  - **Blocked By**: None

  **References**:
  - vitest 설정 문서

  **Acceptance Criteria**:
  - [ ] tests/ 디렉토리 생성됨
  - [ ] npm test 실행 시 setup.ts 로드됨

- [ ] 3. **CostExecution 타입 정의**

  **What to do**:
  - src/types/cost-execution.ts 생성
  - CostExecution 타입 정의 (API 응답과 일치)
  - CostExecutionFormData 타입 정의

  **Must NOT do**:
  - 기존 Prisma 생성 타입 중복 정의하지 않음

  **Recommended Agent Profile**:
  - **Category**: quick
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T4-T5
  - **Blocked By**: T1

  **References**:
  - prisma/schema.prisma: CostExecution 모델 정의
  - /api/cost-execution/create: API 응답 구조

  **Acceptance Criteria**:
  - [ ] 타입 파일 생성됨
  - [ ] tsc --noEmit 통과

- [ ] 4. **CostExecution Server Actions (CRUD)**

  **What to do**:
  - src/app/actions/cost-execution.ts 생성
  - getCostExecutions(projectId) 함수
  - getCostExecution(id) 함수
  - createCostExecution(data) 함수
  - updateCostExecution(id, data) 함수
  - deleteCostExecution(id) 함수
  - Zod 스키마 정의

  **Must NOT do**:
  - 기존 API route를 대체하지 않음 (Server Actions 추가로 구현)

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T6-T10
  - **Blocked By**: T1, T3

  **References**:
  - src/app/actions/budget.ts: 기존 Server Actions 패턴
  - prisma/schema.prisma: CostExecution 모델

  **Acceptance Criteria**:
  - [ ] 5개 CRUD 함수 export
  - [ ] tsc --noEmit 통과

  **QA Scenarios**:
  - Scenario: Server Actions 함수 존재 확인
    Tool: Bash
    Preconditions: 파일 생성됨
    Steps:
      1. grep "export.*function.*CostExecution" src/app/actions/cost-execution.ts
    Expected Result: 5개 함수声明
    Evidence: .sisyphus/evidence/task-4-actions.txt

- [ ] 5. **CostExecution 목록 페이지 skeleton**

  **What to do**:
  - src/app/(dashboard)/cost-execution/page.tsx 생성
  - 프로젝트 선택 ComboBox
  - CostExecution 목록 테이블 (초기 skeleton)
  - "새 실행원가" 버튼

  **Must NOT do**:
  - 상세 로직은 구현하지 않음 (skeleton만)

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: T6
  - **Blocked By**: T1, T3

  **References**:
  - src/app/(dashboard)/cost/page.tsx: 기존 Cost 페이지 패턴

  **Acceptance Criteria**:
  - [ ] 페이지 접근 시 200 응답
  - [ ] 프로젝트 선택 UI 존재

- [ ] 6. **CostExecution 생성 폼 UI**

  **What to do**:
  - src/app/(dashboard)/cost-execution/new/page.tsx 생성
  - 19개 원가 항목 입력 폼
  - 손익 계산 실시간 표시
  - "견적원가에서 복사" 버튼
  - Submit Server Action 호출

  **Must NOT do**:
  - 기존 /cost 페이지 폼을 복사하지 않음 (새로 작성)

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T11
  - **Blocked By**: T4, T5

  **References**:
  - src/app/(dashboard)/cost/page.tsx: 폼 레이아웃 참조
  - src/app/actions/cost-execution.ts: 사용할 함수

  **Acceptance Criteria**:
  - [ ] 19개 입력 필드 존재
  - [ ] Submit 시 데이터 저장됨
  - [ ] npm test 통과 (TDD)

  **QA Scenarios**:
  - Scenario: 실행원가 생성 폼 제출
    Tool: Bash (curl)
    Preconditions: 로그인됨
    Steps:
      1. POST /api/cost-execution/create 테스트
    Expected Result: 200 응답
    Evidence: .sisyphus/evidence/task-6-create.txt

- [ ] 7. **CostExecution 상세/수정 UI**

  **What to do**:
  - src/app/(dashboard)/cost-execution/[id]/page.tsx 생성
  - 상세 정보 표시
  - 수정 폼
  - 삭제 확인 Dialog

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T11
  - **Blocked By**: T4, T5

  **Acceptance Criteria**:
  - [ ] 상세 페이지 접근 가능
  - [ ] 수정/submit 작동

- [ ] 8. **CostExecution 삭제 기능**

  **What to do**:
  - 삭제 버튼 및 확인 Dialog
  - deleteCostExecution Server Action 호출
  - 삭제 후 목록으로 redirect

  **Recommended Agent Profile**:
  - **Category**: quick
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T11
  - **Blocked By**: T4, T5

  **Acceptance Criteria**:
  - [ ] 삭제 후 데이터 삭제됨

- [ ] 9. **CostEstimate → CostExecution 전환 버튼**

  **What to do**:
  - CostExecution 생성 폼에 "견적원가에서 가져오기" 버튼 추가
  - 프로젝트별 CostEstimate 목록 Modal
  - 선택 시 폼에 데이터 채움

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T11
  - **Blocked By**: T4, T5

  **Acceptance Criteria**:
  - [ ] 버튼 존재
  - [ ] Modal 열림
  - [ ] 선택 시 데이터 채워짐

- [ ] 10. **전환 로직 (견적 복사)**

  **What to do**:
  - CostEstimate 데이터 조회
  - CostExecutionFormData로 변환
  - Server Action으로 저장

  **Recommended Agent Profile**:
  - **Category**: deep
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: T11
  - **Blocked By**: T4, T5

  **Acceptance Criteria**:
  - [ ] 견적 데이터가 실행원가로 복사됨
  - [ ] 손익 계산 정상

- [ ] 11. **CostActual API Routes (CRUD)**

  **What to do**:
  - src/app/api/cost-actual/route.ts (GET list)
  - src/app/api/cost-actual/[id]/route.ts (GET, PUT, DELETE)
  - src/app/api/cost-actual/create/route.ts (POST)

  **Must NOT do**:
  - 기존 cost-execution API 패턴 따르되 새로운 엔드포인트

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T12-T15
  - **Blocked By**: T6-T10

  **References**:
  - /api/cost-execution/create: 기존 패턴

  **Acceptance Criteria**:
  - [ ] CRUD API 작동

- [ ] 12. **CostActual Server Actions**

  **What to do**:
  - src/app/actions/cost-actual.ts 생성
  - getCostActuals(projectId)
  - getCostActual(id)
  - createCostActual(data)
  - updateCostActual(id, data)
  - deleteCostActual(id)

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T13-T15
  - **Blocked By**: T11

  **Acceptance Criteria**:
  - [ ] 5개 함수 export

- [ ] 13. **CostActual 목록 페이지**

  **What to do**:
  - src/app/(dashboard)/cost-actual/page.tsx
  - 프로젝트별 실적/예상 목록
  - 월별/전체 view toggle

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T16
  - **Blocked By**: T12

  **Acceptance Criteria**:
  - [ ] 목록 표시

- [ ] 14. **CostActual 생성/수정 폼**

  **What to do**:
  - src/app/(dashboard)/cost-actual/new/page.tsx
  - src/app/(dashboard)/cost-actual/[id]/page.tsx
  - 실행원가에서 복사 옵션
  - Manual 입력

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T16
  - **Blocked By**: T12

  **Acceptance Criteria**:
  - [ ] 생성/수정 작동

- [ ] 15. **실행원가 → 실적 집계 기능**

  **What to do**:
  - CostExecution 합산 로직
  - CostActual 자동 생성 (또는 수동)
  - 예정(잔여) 계산

  **Recommended Agent Profile**:
  - **Category**: deep
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: T16
  - **Blocked By**: T12

  **Acceptance Criteria**:
  - [ ] 실행원가 합산 정확
  - [ ] 예정(잔여) 계산 정확

- [ ] 16. **손익 현황 컴포넌트**

  **What to do**:
  - src/components/cost/profit-loss-summary.tsx
  - 계약금액, 제조원가, 매출이익, 판관비, 영업이익 표시
  - Chart (손익 추이)

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: T19
  - **Blocked By**: T13-T15

  **References**:
  - src/app/(dashboard)/cost/page.tsx: 기존 손익 컴포넌트

  **Acceptance Criteria**:
  - [ ] 손익 계산 정확
  - [ ] Chart 표시

- [ ] 17. **절감/초과 계산 로직**

  **What to do**:
  - (예상원가 - 실행원가) = 절감/초과
  - 항목별 절감/초과 계산
  - 표시 컴포넌트

  **Recommended Agent Profile**:
  - **Category**: deep
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: T19
  - **Blocked By**: T13-T15

  **Acceptance Criteria**:
  - [ ] 절감 초괴 계산 정확

- [ ] 18. **대시보드 연동**

  **What to do**:
  - src/app/(dashboard)/page.tsx 업데이트
  - 손익 현황 Card 추가
  - 프로젝트별 손익 표시

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: T20
  - **Blocked By**: T16-T17

  **Acceptance Criteria**:
  - [ ] 대시보드에서 손익 확인

- [ ] 19. **원가 페이지 tab 통합**

  **What to do**:
  - src/app/(dashboard)/cost/page.tsx를 tab 구조로 변경
  - Tab: 견적원가 | 실행원가 | 실적/예상
  - 기존 기능 유지

  **Recommended Agent Profile**:
  - **Category**: visual-engineering
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: T20
  - **Blocked By**: T16-T17

  **References**:
  - src/components/ui/tabs.tsx: 기존 tab 컴포넌트

  **Acceptance Criteria**:
  - [ ] Tab 변경 작동

- [ ] 20. **E2E 테스트 작성**

  **What to do**:
  - tests/e2e/cost-management.spec.ts
  - 주요 시나리오 테스트
  - npm install @playwright/test (또는现有 Playwright 사용)

  **Recommended Agent Profile**:
  - **Category**: unspecified-high
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: FINAL
  - **Blocked By**: T16-T19

  **Acceptance Criteria**:
  - [ ] E2E 테스트 통과

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — oracle
  For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — unspecified-high
  Run `tsc --noEmit` + linter. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod. Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — unspecified-high (+ playwright skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task. Test cross-task integration. Save to `.sisyphus/evidence/final-qa/`. Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — deep
  For each task: read "What to do", read actual diff. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Detect cross-task contamination. Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- Phase 1: `test: setup vitest infrastructure`
- Phase 2: `feat: add cost execution UI`
- Phase 3: `feat: add cost actual API/UI`
- Phase 4: `feat: integrate dashboard`

---

## Success Criteria

### Verification Commands
```bash
npm run test     # vitest 테스트 통과
npm run build    # Next.js 빌드 성공
```

### Final Checklist
- [ ] 테스트 인프라 작동
- [ ] CostExecution CRUD 작동
- [ ] CostActual CRUD 작동
- [ ] 전환 기능 작동
- [ ] 대시보드 연동
