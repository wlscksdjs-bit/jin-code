# PMS 한자 → 한글 변경 작업 계획

## TL;DR

> **Quick Summary**: PMS 프로그램 전체에서 사용 중인 한자(漢字)를 한글(한국어)로 변경합니다.

> **Deliverables**:
> - 5개 파일, 8곳 한자 → 한글 변경

> **Estimated Effort**: Quick (단순 치환 작업)
> **Parallel Execution**: YES - 1 wave
> **Critical Path**: Task 1 → Final Verification

---

## Context

### Original Request
PMS 프로그램에서 대분류에 한자가 잘못 표기되어 있음. 프로그램 전체적으로 한자 오류가 있으므로 점검하여 개선.

### Interview Summary
**Key Discussions**:
- 범위: 전체 PMS 프로그램 점검
- 변경: 모든 한자를 한글(한국어)로 변경
- 테스트: 화면 확인만

**발견된 한자 사용 현황 (총 8곳)**:

| 파일 | 현재 | 변경후 |
|------|------|--------|
| src/components/cost/category-select.tsx:27 | 直接경비 | 직접경비 |
| src/components/cost/category-select.tsx:28 | 間接경비 | 간접경비 |
| src/components/sales/sales-form.tsx:21,28 | 수주成功 | 수주성공 |
| src/components/sales/sales-edit-form.tsx:21,28 | 수주成功 | 수주성공 |
| src/app/(dashboard)/budget/page.tsx:139 | %執行 | %실행 |
| src/app/(dashboard)/sales/page.tsx:107 | 수주成功 | 수주성공 |

---

## Work Objectives

### Core Objective
PMS 프로그램 전체에서 사용 중인 한자를 한글(한국어)로统一.

### Must Have
- 5개 파일의 한자 8곳을 모두 한글으롤 변경

### Must NOT Have
- 한자 유지 (모든 한자를 변경)
- 의미 변경 (단어 의미는 동일하게 유지)

---

## Execution Strategy

### Tasks

- [ ] 1. **한자 → 한글 변경 작업**

  **What to do**:
  - category-select.tsx: 直接경비 → 직접경비, 間接경비 → 간접경비
  - sales-form.tsx: 수주成功 → 수주성공
  - sales-edit-form.tsx: 수주成功 → 수주성공
  - budget/page.tsx: 執行 → 실행
  - sales/page.tsx: 수주成功 → 수주성공

  **References**:
  - grep 결과 참조

  **Acceptance Criteria**:
  - [ ] 모든 한자가 한글로 변경됨
  - [ ] 빌드 통과

  **Commit**: YES
  - Message: `fix(i18n): change hanja to hangul`
  - Files: 변경된 파일들

---

## Final Verification Wave

- [ ] F1. **한자 존재 여부 확인**
  - grep으로 한자 재확인
  - Output: 한자 0개 확인

- [ ] F2. **빌드 확인**
  - bun run build 통과

---

## Success Criteria

### Final Checklist
- [ ] 모든 한자 제거
- [ ] 빌드 통과