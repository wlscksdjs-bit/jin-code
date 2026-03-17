# PMS 원가 관리 상세화 수정 계획

## TL;DR

> **Quick Summary**: 실행예산서 Excel처럼 원가 항목을 상세하게 관리할 수 있도록 UI를 수정합니다. 대분류/중분류 드롭다운 선택, 업체명 필수 입력, 무한 행 추가 기능을 추가합니다.

> **Deliverables**:
> - 대분류(直接경비/間接경비) 드롭다운
> - 중분류(CostCategorySeed 기반) 드롭다운
> - 업체명 필수 입력 필드
> - 무한 행 추가 가능한 동적 테이블 UI
> - 단위테스트 (vitest)

> **Estimated Effort**: Medium
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 4 → Task 7 → Task 11

---

## Context

### Original Request
PMS 원가가 너무 간소화되어 있음. 실행예산서 Excel 파일처럼 업체명까지 기입 가능한 최대한 디테일하고 정확한 관리 필요.

### Interview Summary
**Key Discussions**:
- 기존 PMS 원가 모델은 aggregation 기반 (재료비合計, 노무비合計 등)
- 현재 UI: vendor 필드 없음, 분류 드롭다운 없음, 행 추가 제한적
- Excel 실행예산서 구조: 대분류 → 중분류(드롭다운) → 수기 내용 입력 → 업체명 필수
- 분류 체계: CostCategorySeed (20+ 항목) 활용
- 데이터: 새로 시작 (마이그레이션 불필요)
- 테스트: 단위테스트 추가 요청

**Research Findings**:
- CostCategory 테이블: 이미 존재, 계층 구조 지원
- CostExecutionItem: vendor 필드 already exists in schema
- cost-calculation.ts: CostFields interface에 20+ 필드
- excel-template.ts: CostItemRow에 vendor 필드 존재

---

## Work Objectives

### Core Objective
원가 관리 UI를 실행예산서 Excel처럼 상세하게 변경하여, 항목별 분류(대분류/중분류)와 업체명 관리가 가능하도록 함.

### Concrete Deliverables
- src/app/(dashboard)/cost/page.tsx - 원가 관리 페이지 수정
- src/app/actions/budget.ts 또는 새로운 API - 원가 항목 CRUD
- src/lib/cost-calculation.ts - 변경 시 계산 로직 확인
- src/__tests__/cost.test.ts - 단위테스트

### Definition of Done
- [ ] 대분류 드롭다운이 정상 작동 (直接경비, 間接경비 선택 가능)
- [ ] 중분류 드롭다운이 CostCategorySeed 기반 选项 표시
- [ ] 업체명 입력 필드가 표시되고 필수 입력 검증
- [ ] 행 추가/삭제가 무한대로 가능
- [ ] 단가 × 수량 = 금액 자동 계산
- [ ] 단위테스트가 80%+ 통과

### Must Have
- 분류 선택 (대분류 → 중분류)
- 업체명 필수 입력
- 품목명, 규격, 단위, 수량, 단가, 금액 입력
- 동적 행 추가/삭제

### Must NOT Have (Guardrails)
- 기존 데이터 손실 (마이그레이션)
- 시트 기반 그룹딩 제한 (새로운 동적 UI로 교체)
- vendor 필드 제거 (필수화로 변경)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (프로젝트에 테스트 프레임워크 없음)
- **Automated tests**: YES - vitest 설치 후 TDD
- **Framework**: vitest (bun과 호환, lightweight)
- **If TDD**: 각 taskRED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
- Frontend: Playwright로 UI 테스트
- Backend: API endpoints 테스트
- 계산 로직: vitest로 단위테스트

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation):
├── Task 1: vitest 설치 및 설정
├── Task 2: CostCategorySeed 타입 확인
├── Task 3: 기존 cost 페이지 분석 및 마이그레이션 전략 수립
└── Task 4: UI 컴포넌트 구조 설계

Wave 2 (After Wave 1 — core implementation, MAX PARALLEL):
├── Task 5: 대분류/중분류 드롭다운 컴포넌트 구현
├── Task 6: 업체명 입력 필드 추가
├── Task 7: 동적 행 추가/삭제 기능 구현
├── Task 8: 금액 자동 계산 로직 구현
└── Task 9: 기존 cost 페이지 수정 통합

Wave 3 (After Wave 2 — testing & verification):
├── Task 10: 단위테스트 작성
├── Task 11: 통합 테스트 및 QA
└── Task 12: 빌드 검증
```

### Dependency Matrix
- **1-4**: — — 5-9, 1
- **5-9**: 1-4 — 10-12, 2
- **10-12**: 5-9 — Final, 3

---

- [ ] 1. **vitest 설치 및 테스트 설정**

  **What to do**:
  - vitest 설치: `bun add -D vitest @vitejs/plugin-react`
  - vitest.config.ts 생성
  - package.json에 test 스크립트 추가
  - 테스트 실행 확인

  **Must NOT do**:
  - 기존 테스트 파일 손상 (없음)
  - 빌드 설정 변경 (vite는 Next.js가 관리)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Tasks 5-9
  - **Blocked By**: None

  **References**:
  - `package.json` - 현재 의존성 확인
  - `src/lib/cost-calculation.ts` - 테스트 대상 코드

  **Acceptance Criteria**:
  - [ ] vitest 설치 완료
  - [ ] bun test 실행 시 에러 없이 동작

  **QA Scenarios**:
  ```
  Scenario: vitest 설정 검증
    Tool: Bash
    Preconditions: 프로젝트 루트
    Steps:
      1. bun add -D vitest @vitejs/plugin-react
      2. vitest.config.ts 생성
      3. bun test 실행
    Expected Result: 테스트가 에러 없이 실행됨
    Evidence: .sisyphus/evidence/task-1-vitest-setup.{ext}
  ```

  **Commit**: YES
  - Message: `feat(cost): install vitest and configure`
  - Files: `package.json`, `vitest.config.ts`

---

- [ ] 2. **CostCategorySeed 타입 확인**

  **What to do**:
  - src/lib/cost-calculation.ts의 COST_CATEGORY_SEED 배열 확인
  - 대분류/중분류 계층 구조 파악
  - TypeScript 타입으로 추출

  **Must NOT do**:
  - 기존 코드 수정

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)

  **References**:
  - `src/lib/cost-calculation.ts:153-178` - COST_CATEGORY_SEED 정의

  **Acceptance Criteria**:
  - [ ] 분류 데이터 타입 확인 완료
  - [ ] 대분류/중분류 매핑 파악

---

- [ ] 3. **기존 cost 페이지 분석**

  **What to do**:
  - src/app/(dashboard)/cost/page.tsx 전체 구조 분석
  - 현재 Item 추가/수정/삭제 로직 파악
  - API 호출 구조 파악 (/api/cost-estimate/create)

  **Must NOT do**:
  - 코드 수정

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **References**:
  - `src/app/(dashboard)/cost/page.tsx` - 현재 원가 관리 페이지

  **Acceptance Criteria**:
  - [ ] 현재 UI 구조 도식화
  - [ ] 수정 필요 영역 파악

---

- [ ] 4. **UI 컴포넌트 구조 설계**

  **What to do**:
  - 새로운 UI 구조 설계
  - 분류 드롭다운 → 품목 입력 → 업체명 → 수량/단가/금액 흐름 설계
  - 컴포넌트 분리 계획 (ClassificationSelect, VendorInput, CostItemRow 등)

  **Must NOT do**:
  - 실제 구현

  **Recommended Agent Profile**:
  - **Category**: `deep`

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **Acceptance Criteria**:
  - [ ] UI 구조 설계 문서
  - [ ] 컴포넌트 분리 계획

---

- [ ] 5. **대분류/중분류 드롭다운 컴포넌트 구현**

  **What to do**:
  - CostCategorySelect 컴포넌트 생성
  - 대분류 드롭다운: 直接경비, 間接경비
  - 중분류 드롭다운: CostCategorySeed 기반 (대분류 선택 시 해당 중분류 표시)
  - 부모-자식 관계 드롭다운 구현

  **Must NOT do**:
  - 기존 cost/page.tsx 직접 수정 (别개의 컴포넌트로 분리)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8, 9)
  - **Blocks**: Task 9 (통합)
  - **Blocked By**: Task 1-4

  **References**:
  - `src/components/ui/select.tsx` - 기존 Select 컴포넌트
  - `src/lib/cost-calculation.ts:153-178` - 분류 데이터

  **Acceptance Criteria**:
  - [ ] 대분류 선택 시 중분류 목록 변경
  - [ ] 드롭다운이 올바른 옵션 표시

  **QA Scenarios**:
  ```
  Scenario: 대분류 선택 시 중분류 변경 확인
    Tool: Playwright
    Preconditions: 원가 관리 페이지 접근
    Steps:
      1. 대분류 드롭다운 클릭
      2. "直接경비" 선택
      3. 중분류 드롭다운 확인 (재료비, 노무비, 외주비 등)
    Expected Result: 중분류 목록이 변경됨
    Evidence: .sisyphus/evidence/task-5-dropdown.{ext}
  ```

  **Commit**: YES
  - Message: `feat(cost): add classification dropdown components`
  - Files: `src/components/cost/category-select.tsx`

---

- [ ] 6. **업체명 입력 필드 추가**

  **What to do**:
  - VendorInput 컴포넌트 생성
  - 입력 검증 (필수 입력)
  - 자동완성 (선택적 - 기존 업체명 기준)

  **Must NOT do**:
  - 기존 UI에 직접 추가 (별도 컴포넌트)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2

  **References**:
  - `src/components/ui/input.tsx` - 기존 Input 컴포넌트

  **Acceptance Criteria**:
  - [ ] 업체명 입력 필드 표시
  - [ ] 필수 입력 검증 작동

---

- [ ] 7. **동적 행 추가/삭제 기능 구현**

  **What to do**:
  - CostItemsTable 컴포넌트 생성
  - "행 추가" 버튼으로 무한 행 추가
  - 각 행의 삭제 버튼
  - 행 순서Drag & Drop (선택적)

  **Must NOT do**:
  - 시트 기반 그룹핑 제한

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2

  **Acceptance Criteria**:
  - [ ] 행 추가 버튼 클릭 시 새 행 추가
  - [ ] 삭제 버튼 클릭 시 해당 행 삭제
  - [ ] 10+ 행 추가해도 정상 작동

  **QA Scenarios**:
  ```
  Scenario: 무한 행 추가/삭제
    Tool: Playwright
    Preconditions: 원가 관리 페이지 접근
    Steps:
      1. "행 추가" 버튼 5회 클릭
      2. 각 행에 데이터 입력
      3. 3번째 행 삭제 버튼 클릭
    Expected Result: 행이 정상 추가/삭제됨
    Evidence: .sisyphus/evidence/task-7-rows.{ext}
  ```

---

- [ ] 8. **금액 자동 계산 로직 구현**

  **What to do**:
  - 수량 × 단가 = 금액 자동 계산
  - 각 행의 금액 합산 (소계/합계)
  - 분류별 합산 (선택적)

  **Must NOT do**:
  - 기존 계산 로직 손상

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Can Run In Parallel**: YES

  **References**:
  - `src/lib/cost-calculation.ts` - 기존 계산 로직

  **Acceptance Criteria**:
  - [ ] 수량/단가 변경 시 금액 자동 계산
  - [ ] 전체 합계 정상 표시

---

- [ ] 9. **기존 cost 페이지 수정 통합**

  **What to do**:
  - 새로운 컴포넌트들을 cost/page.tsx에 통합
  - 기존 기능 (엑셀 업로드/다운로드) 유지
  - 손익 계산 패널 유지

  **Must NOT do**:
  - 기존 데이터 손실

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`

  **Parallelization**:
  - **Can Run In Parallel**: NO (이전 작업들을 통합)
  - **Blocked By**: Tasks 5-8

  **References**:
  - `src/app/(dashboard)/cost/page.tsx` - 통합 대상

  **Acceptance Criteria**:
  - [ ] 기존 기능 모두 작동
  - [ ] 새로운 기능 모두 작동

---

- [ ] 10. **단위테스트 작성**

  **What to do**:
  - cost-calculation.ts 함수들에 대한 단위테스트
  - 드롭다운 컴포넌트 테스트 (storybook 또는 vitest)
  - 금액 계산 로직 테스트

  **Must NOT do**:
  - 브라우저 의존적인 테스트

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 11, 12)
  - **Blocked By**: Tasks 5-9

  **References**:
  - `src/lib/cost-calculation.ts` - 테스트 대상
  - `src/__tests__/cost.test.ts` - 테스트 파일

  **Acceptance Criteria**:
  - [ ] calculateTotalExpense 테스트
  - [ ] calculateProfit 테스트
  - [ ] toCostFields 테스트
  - [ ] 80%+ 커버리지

  **QA Scenarios**:
  ```
  Scenario: 단위테스트 실행
    Tool: Bash
    Preconditions: vitest 설치됨
    Steps:
      1. bun test 실행
    Expected Result: 80%+ 테스트 통과
    Evidence: .sisyphus/evidence/task-10-tests.{ext}
  ```

---

- [ ] 11. **통합 테스트 및 QA**

  **What to do**:
  - 전체 사용자 플로우 테스트
  - 분류 선택 → 입력 → 저장 플로우
  - 엑셀 업로드/다운로드 테스트

  **Must NOT do**:
  - 프로덕션 데이터 사용

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 10

  **Acceptance Criteria**:
  - [ ] 전체 플로우 테스트 통과
  - [ ] 엑셀 기능 정상 작동

---

- [ ] 12. **빌드 검증**

  **What to do**:
  - TypeScript 컴파일 확인
  - 빌드 확인 (bun run build)
  - Lint 확인

  **Must NOT do**:
  - 빌드 실패를 무시

  **Recommended Agent Profile**:
  - **Category**: `quick`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocked By**: Task 11

  **Acceptance Criteria**:
  - [ ] tsc --noEmit 통과
  - [ ] bun run build 통과

  **QA Scenarios**:
  ```
  Scenario: 빌드 검증
    Tool: Bash
    Preconditions: 코드 수정 완료
    Steps:
      1. bun run build 실행
    Expected Result: 빌드 성공
    Evidence: .sisyphus/evidence/task-12-build.{ext}
  ```

  **Commit**: YES
  - Message: `test(cost): add unit tests`
  - Files: `src/__tests__/cost.test.ts`

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `tsc --noEmit` + linter + `bun test`. Review all changed files.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill if UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff. Verify 1:1.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

- **1**: `feat(cost): install vitest and configure` — package.json, vitest.config.ts
- **2**: `feat(cost): add classification dropdown components` — cost-category-select.tsx
- **3**: `feat(cost): add vendor input field` — vendor-input.tsx
- **4**: `feat(cost): implement dynamic row management` — cost-items-table.tsx
- **5**: `feat(cost): integrate all components into cost page` — cost/page.tsx
- **6**: `test(cost): add unit tests` — __tests__/cost.test.ts
- **7**: `refactor(cost): final integration and build verification`

---

## Success Criteria

### Verification Commands
```bash
bun run build  # Expected: PASS
bun test       # Expected: 80%+ tests pass
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Build passes
- [ ] Tests pass