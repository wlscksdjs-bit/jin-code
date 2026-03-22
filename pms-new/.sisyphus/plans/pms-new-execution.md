# PMS-NEW 프로젝트 실행 계획

**프로젝트**: pms-new  
**작성일**: 2026-03-22  
**목표**: 기존 프로젝트 분석 → 실행 가능 상태 → 무결성 테스트 → 고도화

---

## TL;DR

> **Quick Summary**: 기존 pms-new 프로젝트는 70%+ 완성 상태. 데이터 모델, Server Actions, UI 컴포넌트가 대부분 구현됨. 주요 문제는 1) 의존성 손상 2) 몇 가지 누락된 페이지 3) 테스트 부재.
> 
> **Deliverables**:
> - 실행 가능한 개발 환경
> - 모든 페이지 정상 동작
> - 단위 + E2E 테스트
> - SSE 실시간 업데이트
> - Excel 내보내기
> 
> **Estimated Effort**: Medium (3-5일)
> **Parallel Execution**: YES
> **Critical Path**: Fix deps → Build → Pages → Tests → Enhancement

---

## Phase 1: 기본 실행 가능 상태

### Task 1-1: 의존성 재설치 및 빌드 검증

**Files**: `package.json`, `node_modules/`

**Steps**:
1. `rm -rf node_modules package-lock.json`
2. `npm install`
3. `npx prisma generate`
4. `npm run build`

**QA**:
```
Command: npm run build
Expected: 빌드 성공, 0 errors
```

---

### Task 1-2: 루트 페이지 수정

**File**: `src/app/page.tsx`

**Change**: 단순 텍스트 → 대시보드 리다이렉트

**QA**:
```
Scenario: 루트 페이지 접근
  Tool: Playwright
  Steps: http://localhost:3000 접속
  Expected: 대시보드로 리다이렉트
```

---

### Task 1-3: Notifications 페이지 생성

**File**: `src/app/(dashboard)/notifications/page.tsx`

**Create**:
- 알림 목록 UI
- 읽음/안읽음 필터
- 일괄 읽음 처리

**QA**:
```
Scenario: 알림 페이지 렌더링
  Tool: Playwright
  Steps: /notifications 접속
  Expected: 알림 목록 정상 표시
```

---

### Task 1-4: Budgets Server Action 검증

**File**: `src/app/actions/budgets.ts`

**Check**: Budget CRUD 함수 존재 확인 및 필요시 추가

**QA**:
```
Command: npx prisma db push && npm run build
Expected: 성공
```

---

## Phase 2: 무결성 테스트

### Task 2-1: 단위 테스트 설정

**Files**: `vitest.config.ts`, `tests/unit/*.test.ts`

**Setup**: vitest + @testing-library/react

**Test Targets**: Server Actions

---

### Task 2-2: E2E 테스트 작성

**File**: `e2e/app.spec.ts`

**Test Cases**:
1. 로그인 → 대시보드
2. 프로젝트 생성
3. 견적원가 등록
4. 발주 생성

---

### Task 2-3: API 테스트

**Test Endpoints**:
- `/api/projects`
- `/api/cost-estimates`
- `/api/dashboard`

---

## Phase 3: 고도화

### Task 3-1: SSE 실시간 업데이트

**Files**:
- `src/app/api/events/route.ts`
- `src/components/use-sse.ts`

**Implement**: 실행원가 변경 → SSE 브로드캐스트

---

### Task 3-2: Excel 내보내기

**File**: `src/lib/excel-export.ts`

**Export**:
- 프로젝트 목록
- 견적원가 (실행예산서 양식)
- 실행원가
- 자금수지

---

### Task 3-3: Google 연동 완성

**Files**: `src/app/actions/sheets.ts`, `src/app/actions/drive.ts`

**Implement**:
- Google Sheets 동기화
- Google Drive 업로드

---

## Final Verification

- [ ] `npm run dev` 정상 실행
- [ ] 모든 페이지 렌더링
- [ ] 단위 테스트 통과
- [ ] E2E 테스트 통과
- [ ] 빌드 에러 없음

---

## Success Criteria

```bash
npm run dev    # 개발 서버 실행
npm test       # 단위 테스트
npm run test:e2e  # E2E 테스트
npm run build  # 빌드 성공
```
