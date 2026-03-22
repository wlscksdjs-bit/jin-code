# 원가관리 전체 고도화 실행 계획

**프로젝트**: pms-new  
**대상**: 원가관리 시스템 (견적원가 → 실행원가 → 예산대비)  
**목표**: Excel 등록 + 수주 후 실행관리 + 항목별 예산대비 현황

---

## TL;DR

> **Quick Summary**: 견적원가는 Excel 양식 제공 + Excel 업로드로 등록하고, 수주확정 후 실행원가로 관리하면서 항목별 (예산 vs 사용 vs 금회 vs 예정)와 절감/초과 상태를 한눈에 파악할 수 있도록 개선합니다.
> 
> **Deliverables**:
> - 견적원가 Excel 템플릿 + 업로드
> - 수주확정 → 예산 전환 Workflow
> - 항목별 예산대비 현황 (예산/사용/금회/예정/절감/초과)
> - 실행원가 → 예산 사용금액 자동 반영
> 
> **Estimated Effort**: Medium-Large (4-5일)
> **Parallel Execution**: YES
> **Critical Path**: Excel Template → Upload API → Budget Conversion → Comparison UI

---

## Tasks

### Task 1: 견적원가 Excel 템플릿 생성

**File**: `src/lib/excel/estimate-template.ts`

**Functions**:
- `generateEstimateTemplate()` - 템플릿 다운로드
- `parseEstimateExcel()` - Excel 파일 파싱
- `exportEstimateToExcel()` - 견적원가 내보내기

**Acceptance Criteria**:
- [ ] Excel 파일 (.xlsx) 다운로드 정상
- [ ] 19개 항목 정확히 파싱

---

### Task 2: 견적원가 Excel 업로드 API

**File**: `src/app/api/cost-estimate/upload/route.ts`

**Endpoint**: `POST /api/cost-estimate/upload`

**Acceptance Criteria**:
- [ ] 파일 업로드 → 데이터 파싱
- [ ] 미리보기 표시
- [ ] CostEstimate 생성

---

### Task 3: 견적원가 등록 페이지 개편

**File**: `src/app/(dashboard)/cost/[projectId]/estimate/page.tsx`

**Changes**:
- Excel 다운로드 버튼 추가
- Excel 업로드 버튼 추가
- 기존 입력 유지

**Acceptance Criteria**:
- [ ] 버튼 동작
- [ ] 업로드 후 등록

---

### Task 4: 견적원가 → 예산 전환

**File**: `src/app/actions/estimates.ts`

**Function**: `convertEstimateToBudget(projectId, estimateId)`

**Acceptance Criteria**:
- [ ] 견적원가 → Budget 생성
- [ ] BudgetItem (항목별) 생성

---

### Task 5: 예산대비 현황 컴포넌트

**File**: `src/components/cost/BudgetComparison.tsx`

**Display**:
- 항목별: 예산 | 사용금액 | 금회사용 | 사용예정 | 차이 | 상태
- 상태: 절감(초록) | 정상(파랑) | 초과(빨강)

**Acceptance Criteria**:
- [ ] 테이블 렌더링
- [ ] 계산 정확

---

### Task 6: 실행원가 → 예산 사용 반영

**File**: `src/app/actions/cost-executions.ts`

**Function**: `updateBudgetFromExecution(executionId)`

**Acceptance Criteria**:
- [ ] 실행원가 등록 시 BudgetItem.actualAmount 업데이트

---

### Task 7: 예산대비 현황 페이지

**File**: `src/app/(dashboard)/cost/[projectId]/budget-comparison/page.tsx`

**Features**:
- 전체 요약 카드
- 항목별 테이블
- 실행원가 등록 버튼

**Acceptance Criteria**:
- [ ] 페이지 렌더링
- [ ] 데이터 정확

---

### Task 8: 수주확정 Workflow

**File**: `src/app/actions/workflow.ts`

**Function**: `confirmContract(projectId, options)`

**Acceptance Criteria**:
- [ ] 견적→예산 전환
- [ ] 프로젝트 상태 변경

---

## Execution Order

```
Task 1 (Excel Template)
        ↓
Task 2 (Upload API) ← Task 1 완료
        ↓
Task 3 (Page) ← Task 2 완료
        ↓
Task 4 (Conversion) ← Task 3 완료
        ↓
Task 5 (Comparison Component) ← Task 4 완료
        ↓
Task 6 (Update from Execution) ← Task 4 완료
        ↓
Task 7 (Comparison Page) ← Task 5, 6 완료
        ↓
Task 8 (Workflow) ← Task 4 완료
```

---

## Success Criteria

### Phase 1
- [ ] 견적원가 Excel 다운로드/업로드

### Phase 2
- [ ] 수주확정 → 예산 전환

### Phase 3
- [ ] 항목별 예산대비 표시 (예산/사용/금회/예정)
- [ ] 절감/정상/초과 색상 표시
- [ ] 한눈에 현황 파악