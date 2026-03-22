# 원가 등록 고도화 실행 계획

**프로젝트**: pms-new  
**대상**: 원가 등록 고도화  
**목표**: 직접비/간접비 구분 + 다중업체 지원 + Excel 일괄 등록

---

## TL;DR

> **Quick Summary**: 실행원가 등록 UI를 크게 개선하여 직접비/간접비를 시각적으로 구분하고, 외주비(제작/용역)에 다중 업체를 추가/관리할 수 있도록 하며, Excel 템플릿을 제공하여 업로드即可完成 일괄 등록.
> 
> **Deliverables**:
> - 그룹 기반 원가 입력 UI (직접비/간접비)
> - 외주비 다중업체 관리
> - Excel 템플릿 다운로드
> - Excel 파일 업로드/파싱
> 
> **Estimated Effort**: Medium (2-3일)
> **Parallel Execution**: YES (UI + Backend 병렬)
> **Critical Path**: Schema → Server Action → UI → Excel

---

## Tasks

### Task 1: 데이터 모델 보강

**Files**: `prisma/schema.prisma`, `src/lib/seed.ts`

**Changes**:
1. `CostCategory`에 `costType: 'DIRECT' | 'INDIRECT'` 추가
2. `CostExecutionItem`에 `subCategory`, `vendor` 필드 활용
3. Seed 데이터 업데이트

**Acceptance Criteria**:
- [ ] `npx prisma db push` 성공
- [ ] CostCategory에 DIRECT/INDIRECT 분류 존재

---

### Task 2: 원가 요약 컴포넌트

**File**: `src/components/cost/CostSummary.tsx`

**Features**:
- 계약금액, 직접비합계, 간접비합계
- 총원가, 판관비, 영업이익
- 실시간 계산

**Acceptance Criteria**:
- [ ] 금액 변경 시 합계 즉시 갱신

---

### Task 3: 외주비 업체 관리 UI

**File**: `src/components/cost/VendorManager.tsx`

**Features**:
- 외주비(제작) → 업체 목록 + 합계
- 외주비(용역) → 업체 목록 + 합계
- 업체 추가/삭제

**Acceptance Criteria**:
- [ ] 다중 업체 추가/삭제 가능
- [ ] 합계 정확

---

### Task 4: 실행원가 등록 페이지 개편

**File**: `src/app/(dashboard)/cost/[projectId]/execution/page.tsx`

**Features**:
- 직접비/간접비 그룹 UI
- 기존 입력 방식 유지
- 새 UI 통합

**Acceptance Criteria**:
- [ ] 그룹 UI 정상 렌더링
- [ ] 저장 시 정상 동작

---

### Task 5: Server Action 수정

**File**: `src/app/actions/cost-executions.ts`

**Changes**:
1. `createCostExecutionWithItems()` 추가
2. `CostExecutionItem` 일괄 생성 로직

**Acceptance Criteria**:
- [ ] 다중 item 정상 생성

---

### Task 6: Excel 템플릿 생성

**File**: `src/lib/excel/cost-template.ts`

**Functions**:
```typescript
export function generateCostTemplate(): Workbook
export function parseCostExcel(file: File): Promise<ParsedCostData>
export function exportCostToExcel(execution: CostExecution): Workbook
```

**Acceptance Criteria**:
- [ ] 템플릿 다운로드 정상
- [ ] 업로드 파일 파싱 정상

---

### Task 7: Excel 업로드 API

**File**: `src/app/api/cost-execution/upload/route.ts`

**Endpoint**: `POST /api/cost-execution/upload`

**Acceptance Criteria**:
- [ ] Excel 파일 업로드 → 파싱 성공
- [ ] 미리보기 데이터 정확

---

### Task 8: 통합 테스트

**QA Scenarios**:
```
1. 원가 등록 → 저장 → DB 확인
2. 외주비 다중업체 → 합계 정확
3. Excel 다운로드 → 수정 → 업로드 → 등록
```

---

## Execution Order

```
Task 1 (Schema) → Task 5 (Server Action)
                         ↓
Task 2 (Summary) ← Task 5 완료
        ↓
Task 3 (Vendor UI) ← Task 2 완료
        ↓
Task 4 (Page) ← Task 2, 3 완료
        ↓
Task 6 (Excel Template) ← Task 5 완료
        ↓
Task 7 (Excel API) ← Task 6 완료
        ↓
Task 8 (Test)
```

---

## Success Criteria

- [ ] 직접비/간접비 그룹 UI
- [ ] 외주비 다중업체 관리
- [ ] Excel 템플릿 다운로드
- [ ] Excel 업로드 → 일괄 등록
- [ ] 빌드 에러 없음
