# PMS-App 전면 재설계: 원가 관리 중심 프로젝트

## TL;DR

> **Quick Summary**: 원가 관리를 핵심으로 하는 건설/엔지니어링 프로젝트 관리 시스템 전면 재설계. 입찰부터 준공까지 프로젝트生命周期 관리, 견적원가→실행원가→월별 실적→손익 예측까지 실시간 연동.
> 
> **Deliverables**:
> - 프로젝트 중심 데이터 모델 (PostgreSQL + Prisma)
> - 견적원가 관리 시스템
> - WBS/CPM 일정관리 + 간트차트
> - 발주/입고 관리
> - 실행원가/월별 실적 관리
> - 자금수지 실시간 현황
> - 실시간 대시보드 (수주현황, KPI)
> 
> **Estimated Effort**: XL (대규모)
> **Parallel Execution**: YES - 다중 waves
> **Critical Path**: Foundation → 원가핵심 → 일정/구매 → 재무/대시보드

---

## Context

### Original Request
> 모든것은 프로젝트 기준으로 입찰 검토 때부터 프로젝트의 개요부터 견적원가부터 등록하고 수주 확정 시 설계 스케줄링 일정을 등록하고 그것에 따른 발주 및 입고 일정을 관리하며 공사시공팀은 제작일정에 맞춰 시공 스케줄링을 하여 모두 간트차트로 관리하며, 실행원가로 넘어가며 실제 실행을 하며 월별 실적과 사용 예정 비용을 누적 관리하여 자금수지 현황을 실시간으로 관리하여 예산 대비 적정 사용률을 체크하여 최종 절감 상황인지, 비용이 초과한 상황인지, 프로젝트 전체적으로 관리가 시작부터 끝까지되어 중간부터 최종까지 손익관리가 실시간으로 예상하는 시스템으로 구축하여 수주영업 현황부터 계획 대비 현 상황을 보여주는 대시보드까지 전체가 연동되도록 유기적인 시스템으로 업그레이드

### Interview Summary
**Key Discussions**:
- **핵심 우선순위**: 원가 관리 (모든 기능의 중심)
- **Tech Stack 결정**: Next.js 16 + PostgreSQL + SSE + 외부 Gantt 라이브러리
- **기존 코드**: 전체 신규 작성 (점진적 확장 아님)
- **외부 연동**: v1 미포함

### Research Findings
- 현재 pms-app: 14개 모듈 존재하지만 서로 고립됨
- 프로젝트 중심 아키텍처 필요
- 실시간 KPI 대시보드 필요 (CPI, SPI, EAC, VAC)
- WBS/CBS 계층적 원가 분해 필요
- CPM 일정관리 + Critical Path 필요

---

## Work Objectives

### Core Objective
**원가 관리 중심의 건설 프로젝트 관리 시스템** 구축 - 견적원가부터 손익 예측까지 실시간 연동

### Concrete Deliverables
- [ ] PostgreSQL 기반 프로젝트 중심 데이터 모델
- [ ] 견적원가 관리 (WBS 기반 항목별 원가)
- [ ] 실행원가 관리 (실적 누적, 지출 추적)
- [ ] 월별 실적 시스템 (예정 vs 실제)
- [ ] 자금수지 실시간 현황
- [ ] WBS/CPM 일정관리 + 통합 간트차트
- [ ] 발주/입고 관리
- [ ] 실시간 대시보드 (수주현황, KPI)
- [ ] 전체 유기적 연동

### Definition of Done
- [ ] 프로젝트 CRUD: Create/Read/Update/Delete
- [ ] 견적원가 등록 → 예산 전환
- [ ] 실행원가 등록 → 월별 실적 누적
- [ ] 간트차트에 설계/발주/시공 일정 표시
- [ ] 대시보드에 CPI/SPI/EAC/VAC 표시
- [ ] 자금수지 실시간 갱신 (SSE)

### Must Have
- 프로젝트 중심 데이터 모델
- 견적원가 → 실행원가 흐름
- 월별 실적 누적
- 간트차트 (설계 + 발주 + 시공)
- 실시간 대시보드
- 예산 대비 사용률 체크

### Must NOT Have (Guardrails)
- G2B 나라장터 연동 (v1)
- 모바일 앱 (v1)
- 외부 ERP/회계 연동 (v1)
- 기존 SQLite 데이터 마이그레이션

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (vitest, playwright)
- **Automated tests**: Tests-after (단위 + 통합)
- **Framework**: vitest (기존 설정 유지)
- **Agent-Executed QA**: EVERY task에 포함 (필수)

### QA Policy
모든 task는 agent-executed QA scenario 포함:
- Frontend: Playwright - UI 동작 확인
- Backend: API 호출 검증
- E2E: 핵심 사용자 플로우 검증

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation - 즉시 시작 가능):
├── Task 1: 프로젝트 스캐폴딩 + PostgreSQL 설정
├── Task 2: Prisma Schema - 프로젝트 중심 모델
├── Task 3: NextAuth 인증 시스템
├── Task 4: RBAC 권한 시스템
├── Task 5: UI 컴포넌트 기본 (Radix + Tailwind)
└── Task 6: 레이아웃 + 네비게이션

Wave 2 (원가 핵심 - Wave 1 완료 후):
├── Task 7: 프로젝트 CRUD API + Pages
├── Task 8: 견적원가 모델 + API
├── Task 9: 견적원가 등록 UI
├── Task 10: 예산 모델 + API
├── Task 11: 예산 관리 UI
└── Task 12: 실행원가 모델 + API

Wave 3 (실행원가 + 실적 - 병렬):
├── Task 13: 실행원가 등록 UI ✅
├── Task 14: 월별 실적 모델 + API ✅
├── Task 15: 월별 실적 UI (누적 표시) ✅
├── Task 16: SSE 실시간推送 설정 ✅
└── Task 17: Dashboard 집계 테이블 ✅ (2026-03-20)

Wave 4 (일정/구매 - 병렬):
├── Task 18: WBS 모델 + API ✅
├── Task 19: CPM 일정 계산 ✅
├── Task 20: 간트차트 연동 ✅
├── Task 21: 발주 모델 + API ✅
└── Task 22: 입고 모델 + API ✅ (2026-03-20)

Wave 5 (재무/대시보드 - 병렬):
├── Task 23: 자금수지 모델 + API ✅
├── Task 24: 자금수지 실시간 UI ✅
├── Task 25: 대시보드 메인 페이지 ✅
├── Task 26: 수주영업 현황 ✅
└── Task 27: KPI 카드 (CPI/SPI/EAC) ✅

Wave FINAL (통합 + 검증):
├── Task F1: 전체 연동 검증
├── Task F2: E2E 테스트
├── Task F3: 성능 최적화
└── Task F4: 문서화

Critical Path: Task 1 → 2 → 7 → 8 → 12 → 13 → 14 → 15 → 17 → 23 → 25 → F1

### Implementation Status (2026-03-20)
- **Wave 1** (Foundation): ✅ DONE — ProjectWorkflow, confirmContract, Server Actions, UI, RBAC, Layout
- **Wave 2** (원가핵심): ✅ DONE — Project CRUD, CostEstimate API, Budget API, CostExecution API
- **Wave 3** (실행원가+실적): ✅ DONE — MonthlyCostSnapshot, SSE infra, KPI 계산
- **Wave 4** (일정/구매): ✅ DONE — WbsItem, CPM 계산, GanttChart, PurchaseOrder, Vendor CRUD
- **Wave 5** (재무/대시보드): ✅ DONE — CashFlow API, CashFlowChart, KPI 카드, Dashboard 연동
- **Tasks 17, 22** (MISSING → DONE 2026-03-20): MaterialReceipt 모델 + 입고→CostActual 자동 생성, ProjectDashboard KPI 집계 테이블
- **Final** (E2E): ⚠️ 코드 작성 완료, 환경 제약(Playwright browser deps 미설치)으로 미실행
- **PostgreSQL**: ⚠️ Phase 1 스킵 — local 미설치, SQLite 유지 중
```

### Dependency Matrix

| Task | Depends | Blocks |
|------|---------|--------|
| 1 | - | 2, 3, 5, 6 |
| 2 | 1 | 7, 8, 10, 18 |
| 3 | 1 | 4 |
| 4 | 3 | 6 |
| 5 | 1 | 9, 11, 13 |
| 6 | 4, 5 | - |
| 7 | 2 | 8, 9 |
| 8 | 2, 7 | 9, 10, 12 |
| 9 | 5, 7, 8 | - |
| 10 | 8 | 11 |
| 11 | 5, 10 | - |
| 12 | 8 | 13, 14 |
| 13 | 5, 12 | 15 |
| 14 | 12 | 15 |
| 15 | 13, 14 | 16, 17 |
| 16 | 15 | - |
| 17 | 15 | 23, 25 |
| 18 | 2 | 19, 20 |
| 19 | 18 | 20 |
| 20 | 19 | - |
| 21 | 2 | 22 |
| 22 | 21 | - |
| 23 | 17, 22 | 24 |
| 24 | 23 | - |
| 25 | 17 | 26, 27 |
| 26 | 25 | - |
| 27 | 25 | - |
| F1 | 24, 26, 27 | F2 |
| F2 | F1 | F3, F4 |
| F3 | F2 | - |
| F4 | F2 | - |

---

## TODOs

### Wave 1: Foundation (프로젝트 설정 + 기반)

- [ ] 1. 프로젝트 스캐폴딩 + PostgreSQL 설정

  **What to do**:
  - Next.js 프로젝트 초기화 (기존 폴더 재사용 또는 새 폴더)
  - PostgreSQL 설치/연결 설정
  - Prisma 초기화 및 PostgreSQL provider 설정
  - 환경 변수 설정 (.env.example)
  - Git 초기화 (아직 없을 경우)

  **Must NOT do**:
  - SQLite 언급/사용 (PostgreSQL만)
  - 기존 node_modules 재사용 (깨진 종속성 방지)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: 기본 설정 작업, 복잡한 로직 없음

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (Tasks 1-6 병렬)
  - **Blocks**: Wave 2 (Tasks 7+)
  - **Blocked By**: None

  **References**:
  - `package.json` - 현재 프로젝트 설정 참고
  - Prisma PostgreSQL 가이드 - 연결 문자열 형식

  **Acceptance Criteria**:
  - [ ] `npx prisma db push` 성공
  - [ ] `.env` 파일에 `DATABASE_URL` 설정
  - [ ] `npx prisma generate` 성공

  **QA Scenarios**:
  ```
  Scenario: PostgreSQL 연결 확인
    Tool: Bash
    Preconditions: PostgreSQL 실행 중
    Steps:
      1. npx prisma db push --skip-generate
      2. echo $DATABASE_URL 확인
    Expected Result: 에러 없이 성공
    Evidence: .sisyphus/evidence/task-1-connection.txt
  ```

- [ ] 2. Prisma Schema - 프로젝트 중심 데이터 모델

  **What to do**:
  - 프로젝트 중심 Prisma 스키마 설계
  - **핵심 모델**: Project, CostEstimate, CostEstimateItem, Budget, BudgetItem
  - CostEstimateItem: 항목명, 단가, 수량, 금액, 비용유형 (재료비/노무비/외주비/경비)
  - WBS 연동을 위한 Task, TaskRelation 모델
  - 프로젝트 상태 enum (TENDER, AWARDED, CONTRACTED, PLANNING, IN_PROGRESS, COMPLETED)
  - AuditLog 모델 포함

  **Must NOT do**:
  - 기존 schema.prisma 복사/참조 (전체 재설계)
  - SQLite 특정 기능 사용

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - Reason: 데이터 모델 설계는 핵심, 신중해야 함

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 1 완료 후)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 7, 8, 10, 18
  - **Blocked By**: Task 1

  **References**:
  - `prisma/schema.prisma` - 기존 모델 참조 (재설계용)
  - PMS 연구 자료 - 권장 데이터 모델

  **Acceptance Criteria**:
  - [ ] `npx prisma validate` 성공
  - [ ] 모든 모델에 @id, @default(uuid())
  - [ ] 관계(relations) 정확히 정의
  - [ ] enum 타입 정의

  **QA Scenarios**:
  ```
  Scenario: Prisma 스키마 유효성 검사
    Tool: Bash
    Preconditions: schema.prisma 작성됨
    Steps:
      1. npx prisma validate
      2. npx prisma format
    Expected Result: 에러 없음
    Evidence: .sisyphus/evidence/task-2-schema-valid.txt

  Scenario: 관계 확인
    Tool: Bash
    Preconditions: 스키마 유효
    Steps:
      1. npx prisma generate
      2. 타입 확인: Project.costEstimates 접근 가능
    Expected Result: 타입 스크립트 에러 없음
    Evidence: .sisyphus/evidence/task-2-relations.txt
  ```

- [ ] 3. NextAuth 인증 시스템

  **What to do**:
  - NextAuth 5 설정 (기존 패턴 유지)
  - Credentials provider (이메일/비밀번호)
  - OAuth: Google, Kakao (선택)
  - Session strategy: JWT
  - 로그인/로그아웃 API routes
  - 미들웨어 설정

  **Must NOT do**:
  - 기존 auth.ts 단순 복사 (새 구조에 맞게 재설계)
  - 세션 스토어 Redis 등 복잡한 설정 (v1)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: 인증은 표준 패턴 따름

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:
  - `src/lib/auth.ts` - 기존 인증 패턴

  **Acceptance Criteria**:
  - [ ] `/api/auth/signin` 접속 가능
  - [ ] 로그인 성공 시 세션 생성
  - [ ] 로그아웃 시 세션 삭제

  **QA Scenarios**:
  ```
  Scenario: 로그인 플로우
    Tool: Playwright
    Preconditions: 개발 서버 실행 중
    Steps:
      1. 브라우저에서 http://localhost:3000/login 접속
      2. 테스트 계정으로 로그인
      3. 대시보드 페이지로 리다이렉트 확인
    Expected Result: 로그인 성공, 세션 쿠키 설정
    Evidence: .sisyphus/evidence/task-3-login.png
  ```

- [ ] 4. RBAC 권한 시스템

  **What to do**:
  - Role 정의: ADMIN, PM, STAFF
  - 권한 매트릭스: 각 역할별 접근 가능한 기능
  - 미들웨어에서 권한 체크
  - Server Actions에 권한 검증 추가

  **Must NOT do**:
  - 기존 rbac.ts 단순 재사용

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []
  - Reason: 규칙 기반, 복잡한 로직 없음

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Task 6
  - **Blocked By**: Task 3

  **References**:
  - `src/lib/rbac.ts` - 기존 권한 패턴
  - `src/middleware.ts` - 미들웨어 패턴

  **Acceptance Criteria**:
  - [ ] ADMIN: 모든 페이지 접근 가능
  - [ ] PM: 프로젝트 CRUD + 원가 관리 가능
  - [ ] STAFF: 읽기 전용 (진행률만)
  - [ ] 미로그인 시 /login 리다이렉트

  **QA Scenarios**:
  ```
  Scenario: 권한별 접근 제한
    Tool: Playwright
    Preconditions: STAFF 계정으로 로그인
    Steps:
      1. /projects/new 접근 시도
      2. 접근 거부 또는 리다이렉트 확인
    Expected Result: 403 또는 /dashboard 리다이렉트
    Evidence: .sisyphus/evidence/task-4-rbac.png
  ```

- [ ] 5. UI 컴포넌트 기본 (Radix + Tailwind)

  **What to do**:
  - Shadcn/ui 스타일 컴포넌트 설정
  - Button, Input, Card, Dialog, Select, Tabs, Badge
  - Table 컴포넌트 (TanStack Table)
  - cn() 유틸리티 함수
  - Tailwind 설정 확인
  - dark/light mode 설정

  **Must NOT do**:
  - MUI, Ant Design 등 다른 UI 라이브러리 혼합
  - Tailwind 클래스 직접 랜덤 생성

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: UI 작업, 디자인 감각 필요

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 9, 11, 13
  - **Blocked By**: Task 1

  **References**:
  - `src/components/ui/` - 기존 UI 컴포넌트

  **Acceptance Criteria**:
  - [ ] shadcn/ui CLI 설치 및 실행
  - [ ] Button, Card, Dialog 컴포넌트 사용 가능
  - [ ] 다크모드 토글 작동

  **QA Scenarios**:
  ```
  Scenario: UI 컴포넌트 렌더링
    Tool: Playwright
    Preconditions: shadcn/ui 설치됨
    Steps:
      1. http://localhost:3000 접속
      2. Button 클릭
      3. Dialog 열기/닫기
    Expected Result: 모든 컴포넌트 정상 렌더링
    Evidence: .sisyphus/evidence/task-5-ui.png
  ```

- [ ] 6. 레이아웃 + 네비게이션

  **What to do**:
  - Dashboard 레이아웃 (사이드바 + 헤더)
  - 네비게이션 메뉴: 프로젝트, 견적원가, 실행원가, 일정, 발주, 대시보드
  - 반응형 레이아웃 (모바일 미지원이지만 최소 레이아웃)
  - Breadcrumb 컴포넌트

  **Must NOT do**:
  - 복잡한 네비게이션 (v1은 단순 메뉴)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: 레이아웃 및 네비게이션 구조

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: None
  - **Blocked By**: Tasks 4, 5

  **References**:
  - `src/app/(dashboard)/layout.tsx` - 기존 레이아웃 패턴

  **Acceptance Criteria**:
  - [ ] 사이드바 메뉴 클릭 시 페이지 이동
  - [ ] 현재 페이지 메뉴 활성화 표시
  - [ ] 로그아웃 버튼 동작

  **QA Scenarios**:
  ```
  Scenario: 네비게이션 동작
    Tool: Playwright
    Preconditions: 로그인됨
    Steps:
      1. 사이드바에서 "프로젝트" 클릭
      2. /projects로 이동 확인
      3. 사이드바에서 "대시보드" 클릭
      4. /dashboard로 이동 확인
    Expected Result: 네비게이션 정상 작동
    Evidence: .sisyphus/evidence/task-6-nav.png
  ```

---

### Wave 2: 원가 핵심 (프로젝트 + 견적원가 + 예산)

- [ ] 7. 프로젝트 CRUD API + Pages

  **What to do**:
  - Project 모델 기반 CRUD API (GET, POST, PUT, DELETE)
  - Server Actions 또는 API Routes
  - 프로젝트 목록 페이지 (/projects)
  - 프로젝트 상세 페이지 (/projects/[id])
  - 프로젝트 생성/편집 폼
  - 프로젝트 상태 lifecycle 관리
  - 검색/필터 기능

  **Must NOT do**:
  - 기존 projects API 단순 재사용

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: CRUD + UI + 비즈니스 로직

  **Parallelization**:
  - **Can Run In Parallel**: NO (Task 2 완료 후)
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Task 2

  **References**:
  - `src/app/api/projects/` - 기존 API 패턴
  - `src/app/(dashboard)/projects/` - 기존 페이지 패턴

  **Acceptance Criteria**:
  - [ ] 프로젝트 목록 조회 (페이지네이션)
  - [ ] 프로젝트 생성/수정/삭제
  - [ ] 프로젝트 상태 변경 (TENDER → CONTRACTED 등)
  - [ ] 검색 필터 작동

  **QA Scenarios**:
  ```
  Scenario: 프로젝트 CRUD
    Tool: Playwright
    Preconditions: 로그인됨, 관리자 권한
    Steps:
      1. /projects 접속
      2. "새 프로젝트" 버튼 클릭
      3. 프로젝트명 "테스트 프로젝트" 입력
      4. "저장" 클릭
      5. 목록에 추가된 프로젝트 확인
    Expected Result: 프로젝트 생성 완료
    Evidence: .sisyphus/evidence/task-7-crud.png

  Scenario: 프로젝트 수정
    Tool: Playwright
    Steps:
      1. 기존 프로젝트 클릭
      2. "편집" 클릭
      3. 프로젝트명 변경
      4. 저장 후 변경 확인
    Expected Result: 수정 사항 저장됨
    Evidence: .sisyphus/evidence/task-7-update.png
  ```

- [ ] 8. 견적원가 모델 + API

  **What to do**:
  - CostEstimate 모델 기반 API
  - CostEstimateItem: 항목별 원가 (재료비, 노무비, 외주비, 경비)
  - 항목 추가/수정/삭제
  - 단가 × 수량 = 금액 자동 계산
  - 합계, 이윤, 판관비 계산
  - 견적서 출력 (Excel/PDF)

  **Must NOT do**:
  - 복잡한 공식 (단순 합계 + 이윤율 + 판관비율)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 비즈니스 로직 중심

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 9, 10, 12
  - **Blocked By**: Tasks 2, 7

  **References**:
  - `src/lib/cost-calculation.ts` - 기존 원가 계산 로직
  - 기존 CostEstimate, CostEstimateItem 모델

  **Acceptance Criteria**:
  - [ ] 견적원가 생성 (프로젝트별)
  - [ ] 항목 추가/수정/삭제
  - [ ] 단가×수량 자동 계산
  - [ ] 총합계 + 이윤 + 판관비 계산
  - [ ] Excel 내보내기

  **QA Scenarios**:
  ```
  Scenario: 견적원가 계산
    Tool: Playwright
    Preconditions: 프로젝트 생성됨
    Steps:
      1. 프로젝트 상세 페이지 접속
      2. "견적원가" 탭 클릭
      3. "항목 추가" 클릭
      4. 항목명: "콘크리트", 단가: 50000, 수량: 100
      5. 저장 후 금액 확인
    Expected Result: 금액 = 5,000,000 (50,000 × 100)
    Evidence: .sisyphus/evidence/task-8-calculation.png

  Scenario: 원가 유형별 분류
    Tool: Playwright
    Steps:
      1. 항목 추가: 유형="재료비"
      2. 항목 추가: 유형="노무비"
      3. 유형별 합계 표시 확인
    Expected Result: 유형별 분류 정확
    Evidence: .sisyphus/evidence/task-8-types.png
  ```

- [ ] 9. 견적원가 등록 UI

  **What to do**:
  - 견적원가 목록/상세 UI
  - 항목 추가/편집 폼 (모달 또는 페이지)
  - 테이블 형태의 원가 항목 표시
  - 합계, 이윤, 판관비 요약 카드
  - Excel 내보내기 버튼
  - 견적서 미리보기

  **Must NOT do**:
  - 복잡한 차트 (단순 테이블 + 카드)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: 복잡한 폼 UI

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None
  - **Blocked By**: Tasks 5, 7, 8

  **References**:
  - `src/app/(dashboard)/cost/` - 기존 원가 관리 페이지
  - `src/components/cost/` - 기존 원가 컴포넌트

  **Acceptance Criteria**:
  - [ ] 견적원가 목록 표시
  - [ ] 항목 추가 폼 동작
  - [ ] Excel 내보내기 버튼 작동
  - [ ] 견적서 미리보기 열기

  **QA Scenarios**:
  ```
  Scenario: 견적원가 UI 전체 플로우
    Tool: Playwright
    Steps:
      1. 프로젝트 선택
      2. 견적원가 탭 클릭
      3. 3개 항목 추가
      4. 합계 확인
      5. Excel 내보내기
    Expected Result: 모든 동작 정상, Excel 다운로드
    Evidence: .sisyphus/evidence/task-9-ui.png
  ```

- [ ] 10. 예산 모델 + API

  **What to do**:
  - Budget 모델 (수주 확정 시 견적 → 예산 전환)
  - BudgetItem 모델 (항목별 예산 배정)
  - 계약금액 vs 견적원가 비교
  - 예산 수정 이력 (Audit)
  - 예산 확정/잠금 기능

  **Must NOT do**:
  - 복잡한 예산 배분 알고리즘 (수동 배정)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 비즈니스 로직

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 11
  - **Blocked By**: Task 8

  **References**:
  - 기존 Budget, BudgetItem 모델

  **Acceptance Criteria**:
  - [ ] 견적 → 예산 전환 (1클릭)
  - [ ] 계약금액 설정
  - [ ] 항목별 예산 배정
  - [ ] 예산 수정 이력 추적
  - [ ] 예산 잠금/해제

  **QA Scenarios**:
  ```
  Scenario: 견적 → 예산 전환
    Tool: Playwright
    Steps:
      1. 견적원가 완료된 프로젝트 선택
      2. "수주확정" 버튼 클릭
      3. 계약금액 입력
      4. "예산전환" 클릭
    Expected Result: Budget 테이블에 데이터 생성
    Evidence: .sisyphus/evidence/task-10-convert.png

  Scenario: 예산 수정
    Tool: Playwright
    Steps:
      1. 예산 잠금 해제
      2. 항목별 금액 조정
      3. 저장
      4. 수정 이력 확인
    Expected Result: 변경 이력 AuditLog에 기록
    Evidence: .sisyphus/evidence/task-10-edit.png
  ```

- [ ] 11. 예산 관리 UI

  **What to do**:
  - 예산 목록/상세 UI
  - 계약금액 vs 견적원가 비교 표시
  - 항목별 예산 현황 (집행율)
  - 예산 수정 폼
  - 예산 잠금/해제 토글

  **Must NOT do**:
  - 복잡한 차트 (단순 진행바)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: UI/UX 중심

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None
  - **Blocked By**: Tasks 5, 10

  **References**:
  - `src/app/(dashboard)/budget/` - 기존 예산 페이지

  **Acceptance Criteria**:
  - [ ] 예산 목록 표시
  - [ ] 집행율 진행바 표시
  - [ ] 예산 수정 폼 동작
  - [ ] 잠금 상태 표시

  **QA Scenarios**:
  ```
  Scenario: 예산 집행율 표시
    Tool: Playwright
    Steps:
      1. 프로젝트 예산 상세 페이지
      2. 집행율 진행바 확인
      3. 색상 구분 (초록/노랑/빨강)
    Expected Result: 집행율에 따른 색상 정상
    Evidence: .sisyphus/evidence/task-11-budget.png
  ```

- [ ] 12. 실행원가 모델 + API

  **What to do**:
  - CostExecution 모델 (실행원가)
  - CostActual 모델 (실제 발생한 비용)
  - 발주(Commitment) 금액 commitment로 관리
  - 입고 → CostActual 자동 생성
  - 지출 유형: 재료비, 노무비, 외주비, 경비

  **Must NOT do**:
  - Invoice/결제 연동 (v1 미포함)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 핵심 비즈니스 로직

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 13, 14
  - **Blocked By**: Task 8

  **References**:
  - 기존 CostExecution, CostActual 모델
  - `src/lib/cost-calculation.ts`

  **Acceptance Criteria**:
  - [ ] 실행원가 생성
  - [ ] 항목별 지출 기록
  - [ ] Commitment(발주) 금액 추적
  - [ ] 입고 시 CostActual 자동 생성
  - [ ] 월별 구분 저장

  **QA Scenarios**:
  ```
  Scenario: 실행원가 등록
    Tool: Playwright
    Steps:
      1. 프로젝트 선택
      2. "실행원가" 탭 클릭
      3. "지출 추가" 클릭
      4. 항목: "시멘트 50만원"
      5. 저장
    Expected Result: CostActual 생성됨
    Evidence: .sisyphus/evidence/task-12-add.png

  Scenario: Commitment 추적
    Tool: Playwright
    Steps:
      1. 발주 생성 (Task 21에서)
      2. 실행원가에서 Commitment 금액 확인
    Expected Result: 발주 금액이 commitment로 표시
    Evidence: .sisyphus/evidence/task-12-commitment.png
  ```

---

### Wave 3: 실행원가 + 월별 실적 (실시간 핵심)

- [ ] 13. 실행원가 등록 UI

  **What to do**:
  - 실행원가 목록 UI (테이블)
  - 지출 추가/수정 폼
  - Commitment(발주) 금액 표시
  - 실제 지출과 예정 지출 구분
  - 월별 필터

  **Must NOT do**:
  - 복잡한 차트 (단순 테이블)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: 폼 UI + 테이블

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 5, 12

  **References**:
  - `src/app/(dashboard)/cost/` - 기존 원가 UI

  **Acceptance Criteria**:
  - [ ] 실행원가 목록 표시
  - [ ] 지출 추가 폼 동작
  - [ ] Commitment 금액 표시
  - [ ] 월별 필터 작동

  **QA Scenarios**:
  ```
  Scenario: 실행원가 CRUD
    Tool: Playwright
    Steps:
      1. 프로젝트 실행원가 페이지
      2. 5개 지출 항목 추가
      3. 총합계 확인
      4. 월별 필터로 조회
    Expected Result: 정상 동작, 필터 적용
    Evidence: .sisyphus/evidence/task-13-ui.png
  ```

- [ ] 14. 월별 실적 모델 + API

  **What to do**:
  - MonthlyPerformance 모델 (월별 실적)
  - 월별 발생 비용 집계
  - 예정 비용 vs 실제 비용
  - Cumulative 합계 (누적)
  - 프로젝트별 월별 실적 조회
  - 전체 월별 실적 조회 (대시보드용)

  **Must NOT do**:
  - 복잡한 수익 인식 로직 (단순 발생주의)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 집계 로직

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 15
  - **Blocked By**: Task 12

  **References**:
  - 기존 Finance 모델 (참조용)

  **Acceptance Criteria**:
  - [ ] 월별 CostActual 합계 계산
  - [ ] 누적 금액 정확
  - [ ] 예정 vs 실제 비교
  - [ ] 대시보드용 집계 API

  **QA Scenarios**:
  ```
  Scenario: 월별 실적 계산
    Tool: Playwright
    Preconditions: 3월~5월 실행원가 존재
    Steps:
      1. 프로젝트 월별 실적 페이지
      2. 3월~5월 데이터 확인
      3. 누적 금액 확인
    Expected Result: 각 월 합계 + 누적 정확
    Evidence: .sisyphus/evidence/task-14-monthly.png

  Scenario: API 응답 확인
    Tool: Bash
    Steps:
      1. curl http://localhost:3000/api/performance/1
    Expected Result: JSON에 월별 데이터 포함
    Evidence: .sisyphus/evidence/task-14-api.json
  ```

- [ ] 15. 월별 실적 UI (누적 표시)

  **What to do**:
  - 월별 실적 테이블 (프로젝트별)
  - 누적 막대그래프 (선택적)
  - 예정 vs 실제 비교 테이블
  - 금액 차이 표시 (절감/초과)
  - 프로젝트 선택 드롭다운

  **Must NOT do**:
  - 실시간 업데이트 (Wave 3에서 SSE 설정)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: 데이터 시각화

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 16, 17
  - **Blocked By**: Tasks 13, 14

  **References**:
  - `src/app/(dashboard)/finance/` - 기존 재무 페이지

  **Acceptance Criteria**:
  - [ ] 월별 테이블 표시
  - [ ] 누적 금액 칼럼
  - [ ] 절감/초과 차이 표시
  - [ ] 프로젝트 선택 필터

  **QA Scenarios**:
  ```
  Scenario: 월별 실적 표시
    Tool: Playwright
    Steps:
      1. 프로젝트 선택
      2. 월별 실적 테이블 확인
      3. 누적 금액 순서 확인 (3월→4월→5월)
      4. 초과 금액 빨간색 표시 확인
    Expected Result: 테이블 정상, 색상 구분
    Evidence: .sisyphus/evidence/task-15-table.png
  ```

- [ ] 16. SSE 실시간 Push 설정

  **What to do**:
  - Server-Sent Events API route
  - SSE 클라이언트 훅 (useEventSource)
  - 실행원가 변경 시 브로드캐스트
  - 월별 실적 변경 시 브로드캐스트
  - 대시보드 데이터 갱신 트리거

  **Must NOT do**:
  - WebSocket (단순 SSE로 충분)
  - Redis 등 외부 메시지 브로커 (v1)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 실시간 시스템

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 24
  - **Blocked By**: Task 15

  **References**:
  - Next.js SSE 가이드

  **Acceptance Criteria**:
  - [ ] /api/events SSE 엔드포인트
  - [ ] 클라이언트 연결 유지
  - [ ] 실행원가 변경 시 데이터 전송
  - [ ] 재연결 로직

  **QA Scenarios**:
  ```
  Scenario: SSE 연결 및 데이터 수신
    Tool: Bash
    Steps:
      1. curl -N http://localhost:3000/api/events
      2. 다른 브라우저에서 실행원가 추가
      3. SSE 데이터 수신 확인
    Expected Result: JSON 이벤트 수신
    Evidence: .sisyphus/evidence/task-16-sse.txt

  Scenario: 재연결 테스트
    Tool: Playwright
    Steps:
      1. 대시보드 접속
      2. SSE 연결 확인 (DevTools Network)
      3. 네트워크 끊기
      4. 자동 재연결 확인
    Expected Result: 3초 후 자동 재연결
    Evidence: .sisyphus/evidence/task-16-reconnect.png
  ```

- [ ] 17. Dashboard 집계 테이블

  **What to do**:
  - ProjectDashboard 모델 (실시간 KPI)
  - CPI, SPI, EAC, VAC 계산
  - 프로젝트별 집계 캐시 테이블
  - 변경 시 자동 갱신 트리거
  - 대시보드용 단일 조회 API

  **Must NOT do**:
  - 복잡한 실시간 계산 (미리 집계)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 재무 계산 로직

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 23, 25
  - **Blocked By**: Task 15

  **References**:
  - PMS 연구: Dashboard Data Aggregation
  - 기존 profit-loss.ts

  **Acceptance Criteria**:
  - [x] ProjectDashboard 테이블 생성 (prisma/schema.prisma)
  - [x] CPI 계산 (EV/AC) (src/lib/kpi.ts)
  - [x] SPI 계산 (EV/PV) (src/lib/kpi.ts)
  - [x] EAC, VAC 계산 (src/lib/kpi.ts)
  - [x] 변경 시 자동 갱신 (src/app/actions/dashboard.ts: invalidateDashboard)
  - **Status**: DONE (2026-03-20)

  **QA Scenarios**:
  ```
  Scenario: KPI 계산
    Tool: Bash
    Preconditions: 테스트 데이터 존재
    Steps:
      1. 프로젝트에 실행원가 추가
      2. curl /api/dashboard/1
      3. CPI, SPI 값 확인
    Expected Result: CPI ≈ 1.0 (예산 내)
    Evidence: .sisyphus/evidence/task-17-kpi.json
  ```

---

### Wave 4: 일정/구매 관리 (병렬)

- [ ] 18. WBS 모델 + API

  **What to do**:
  - WbsItem 모델 (작업분해)
  - 계층 구조 (parent-child)
  - 공정번호 체계 (1.2.3.4)
  - 프로젝트별 WBS 목록/조회
  - WBS 항목 CRUD

  **Must NOT do**:
  - 복잡한 정렬 로직

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 데이터 모델

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 19, 20
  - **Blocked By**: Task 2

  **References**:
  - 기존 WbsItem 모델

  **Acceptance Criteria**:
  - [ ] WBS 계층 구조
  - [ ] 공정번호 자동 생성
  - [ ] 프로젝트별 WBS 조회
  - [ ] 항목 추가/수정/삭제

  **QA Scenarios**:
  ```
  Scenario: WBS CRUD
    Tool: Playwright
    Steps:
      1. 프로젝트 WBS 페이지
      2. 상위 작업 추가: "1. 기초공사"
      3. 하위 작업 추가: "1.1 토목"
      4. 공정번호 확인
    Expected Result: 계층 구조 정상
    Evidence: .sisyphus/evidence/task-18-wbs.png
  ```

- [ ] 19. CPM 일정 계산

  **What to do**:
  - Task 모델 (CPM 계산용)
  - TaskRelation 모델 (선행-후행 관계)
  - ES, EF, LS, LF 계산
  - Critical Path 식별
  - Total Float, Free Float 계산
  -工期 계산

  **Must NOT do**:
  - 자원 최적화 (v1 미포함)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []
  - Reason: CPM 알고리즘 필요

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 20
  - **Blocked By**: Task 18

  **References**:
  - PMS 연구: CPM Scheduling Data Model

  **Acceptance Criteria**:
  - [ ] FS, SS, SF, FF 의존관계
  - [ ] 정방향 계산 (ES, EF)
  - [ ] 역방향 계산 (LS, LF)
  - [ ] Critical Path 식별
  - [ ] Float 계산

  **QA Scenarios**:
  ```
  Scenario: CPM 계산
    Tool: Bash
    Preconditions: WBS + 관계 설정됨
    Steps:
      1. API 호출: POST /api/schedule/calculate
      2. Critical Path 조회
    Expected Result: Critical Path 표시
    Evidence: .sisyphus/evidence/task-19-cpm.json

  Scenario: Float 계산
    Tool: Playwright
    Steps:
      1. Non-critical task 선택
      2. Total Float 확인
    Expected Result: Float > 0
    Evidence: .sisyphus/evidence/task-19-float.png
  ```

- [ ] 20. 간트차트 연동

  **What to do**:
  - 외부 Gantt 라이브러리 설치 (dhtmlxGantt 또는 Pragmatic DnD)
  - 간트차트 컴포넌트 생성
  - WBS 데이터 바인딩
  - 설계/발주/시공 통합 뷰
  - Drag & Drop 일정 조정
  - 마일스톤 표시
  - zoom In/Out

  **Must NOT do**:
  - 자체 간트차트 구현 (외부 라이브러리 사용)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: 복잡한 UI

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None
  - **Blocked By**: Task 19

  **References**:
  - `src/components/gantt-chart.tsx` - 기존 간트차트

  **Acceptance Criteria**:
  - [ ] 간트차트 렌더링
  - [ ] WBS 데이터 표시
  - [ ] Drag & Drop 동작
  - [ ] 마일스톤 표시
  - [ ] zoom 작동

  **QA Scenarios**:
  ```
  Scenario: 간트차트 표시
    Tool: Playwright
    Steps:
      1. 프로젝트 간트차트 페이지
      2. WBS 데이터 로드 확인
      3. 막대 그래프 확인
      4. 마일스톤(다이아몬드) 확인
    Expected Result: 간트차트 정상 렌더링
    Evidence: .sisyphus/evidence/task-20-gantt.png

  Scenario: Drag & Drop
    Tool: Playwright
    Steps:
      1. 작업 막대 Drag
      2. 일정 변경
      3. 저장
      4. 변경된 일정 확인
    Expected Result: 일정 변경 저장됨
    Evidence: .sisyphus/evidence/task-20-drag.png
  ```

- [ ] 21. 발주 모델 + API

  **What to do**:
  - Vendor 모델 (협력업체)
  - PurchaseOrder 모델 (발주)
  - PurchaseOrderItem 모델 (발주 항목)
  - 발주 상태 관리 (DRAFT, SENT, CONFIRMED, PARTIAL, COMPLETED)
  - 발주 → Commitment 연결

  **Must NOT do**:
  - Invoice/결제 연동

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 데이터 CRUD

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 22
  - **Blocked By**: Task 2

  **References**:
  - 기존 PurchaseOrder 모델
  - 기존 vendor 관련 모델

  **Acceptance Criteria**:
  - [ ] 협력업체 CRUD
  - [ ] 발주서 생성
  - [ ] 발주 상태 변경
  - [ ] Commitment 금액 업데이트

  **QA Scenarios**:
  ```
  Scenario: 발주서 생성
    Tool: Playwright
    Steps:
      1. 발주 페이지
      2. "새 발주" 클릭
      3. 협력업체 선택
      4. 품목 추가
      5. 발주 금액 확인
      6. "발주" 클릭
    Expected Result: PO 생성, Commitment 증가
    Evidence: .sisyphus/evidence/task-21-po.png
  ```

- [ ] 22. 입고 모델 + API

  **What to do**:
  - MaterialReceipt 모델 (입고)
  - ReceiptItem 모델 (입고 항목)
  - 발주 → 입고 연결
  - 입고 → CostActual 자동 생성
  - 검수 상태 (PENDING, PASSED, FAILED)

  **Must NOT do**:
  - 재고 관리 (단순 입고→실행원가)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 비즈니스 로직

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 23
  - **Blocked By**: Task 21

  **References**:
  - 기존 MaterialReceipt 모델

  **Acceptance Criteria**:
  - [x] 입고 등록 (MaterialReceipt 모델: prisma/schema.prisma)
  - [x] 발주 잔량 표시 (PurchaseOrderItem.receivedQuantity)
  - [x] 입고 → CostActual 자동 생성 (src/app/actions/purchase-orders.ts: receivePurchaseOrder)
  - [x] 검수 상태 관리 (PARTIAL/COMPLETE via receivedQuantity)
  - **Status**: DONE (2026-03-20)

  **QA Scenarios**:
  ```
  Scenario: 입고 → 원가 자동 반영
    Tool: Playwright
    Steps:
      1. 발주서 생성 (금액 100만원)
      2. "입고 등록" 클릭
      3. 입고 금액 50만원 입력
      4. 저장
      5. 실행원가에서 50만원 확인
    Expected Result: CostActual 자동 생성
    Evidence: .sisyphus/evidence/task-22-receipt.png
  ```

---

### Wave 5: 재무/대시보드 (실시간 최종)

- [ ] 23. 자금수지 모델 + API

  **What to do**:
  - CashFlow 모델 (현금흐름)
  - PlannedCashFlow (예정 수입/지출)
  - ActualCashFlow (실제 수입/지출)
  - 미결工事비 계산 (실행원가 - Invoice)
  - 잔액 계산 (수입 - 지출 - 미결)

  **Must NOT do**:
  - 외부 회계 연동

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []
  - Reason: 재무 계산

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Task 24
  - **Blocked By**: Tasks 17, 22

  **References**:
  - 기존 Finance 모델
  - PMS 연구: Cash Flow Data Model

  **Acceptance Criteria**:
  - [ ] 수입/지출 예정 등록
  - [ ] 실제 발생 반영
  - [ ] 미결工事비 계산
  - [ ] 잔액 실시간

  **QA Scenarios**:
  ```
  Scenario: 자금수지 계산
    Tool: Playwright
    Preconditions: 실행원가 존재
    Steps:
      1. 자금수지 페이지
      2. 예정 수입: 1억원
      3. 실행원가: 3천만원
      4. 잔액 확인
    Expected Result: 잔액 = 7천만원
    Evidence: .sisyphus/evidence/task-23-cashflow.png
  ```

- [ ] 24. 자금수지 실시간 UI

  **What to do**:
  - 자금수지 테이블/차트
  - 수입/지출 막대그래프
  - 잔액 추이 선 그래프
  - SSE 실시간 갱신
  - 월별/프로젝트별 필터

  **Must NOT do**:
  - 복잡한 재무 보고서

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: 재무 시각화

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: None
  - **Blocked By**: Tasks 16, 23

  **References**:
  - Recharts 라이브러리

  **Acceptance Criteria**:
  - [ ] 막대그래프/선그래프 표시
  - [ ] SSE 실시간 갱신
  - [ ] 필터 작동

  **QA Scenarios**:
  ```
  Scenario: 실시간 갱신
    Tool: Playwright
    Steps:
      1. 자금수지 페이지 접속
      2. 다른 탭에서 실행원가 추가
      3. 자금수지 자동 갱신 확인
    Expected Result: SSE 통해 자동 갱신
    Evidence: .sisyphus/evidence/task-24-realtime.gif
  ```

- [ ] 25. 대시보드 메인 페이지

  **What to do**:
  - Dashboard 집계 테이블 연동
  - 프로젝트별 KPI 카드
  - 진행 중인 프로젝트 목록
  - 빠른 액세스 메뉴
  - SSE 실시간 업데이트

  **Must NOT do**:
  - 과도한 위젯

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: 메인 페이지

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: Tasks 26, 27
  - **Blocked By**: Task 17

  **References**:
  - `src/app/(dashboard)/page.tsx` - 기존 대시보드

  **Acceptance Criteria**:
  - [ ] KPI 카드 표시
  - [ ] 프로젝트 목록
  - [ ] SSE 실시간

  **QA Scenarios**:
  ```
  Scenario: 대시보드 로드
    Tool: Playwright
    Steps:
      1. /dashboard 접속
      2. KPI 카드 로드 확인
      3. 프로젝트 목록 확인
    Expected Result: 2초 내 로드
    Evidence: .sisyphus/evidence/task-25-dashboard.png
  ```

- [ ] 26. 수주영업 현황

  **What to do**:
  - 입찰 중인 프로젝트
  - 수주 진행 현황
  - 예상 수주 목록
  - 수주율 통계

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: 비즈니스 UI

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 25와 병렬)
  - **Blocks**: None
  - **Blocked By**: Task 25

  **References**:
  - `src/app/(dashboard)/sales/` - 기존 영업 페이지

  **Acceptance Criteria**:
  - [ ] 입찰/수주 현황 테이블
  - [ ] 상태별 필터
  - [ ] 수주율 표시

  **QA Scenarios**:
  ```
  Scenario: 수주현황 확인
    Tool: Playwright
    Steps:
      1. 수주영업 현황 페이지
      2. 진행 중인 입찰 확인
      3. 수주 완료된 프로젝트 확인
    Expected Result: 상태별 분류 정상
    Evidence: .sisyphus/evidence/task-26-sales.png
  ```

- [ ] 27. KPI 카드 (CPI/SPI/EAC)

  **What to do**:
  - Cost Performance Index (CPI) 카드
  - Schedule Performance Index (SPI) 카드
  - Estimate At Completion (EAC) 카드
  - Variance At Completion (VAC) 카드
  - 색상 구분 (양호/주의/위험)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []
  - Reason: KPI 시각화

  **Parallelization**:
  - **Can Run In Parallel**: YES (Task 25와 병렬)
  - **Blocks**: None
  - **Blocked By**: Task 25

  **References**:
  - PMS 연구: Key Construction KPIs

  **Acceptance Criteria**:
  - [ ] CPI/SPI/EAC/VAC 수치
  - [ ] 색상 구분 (양호/주의/위험)
  - [ ] 경고 문구

  **QA Scenarios**:
  ```
  Scenario: KPI 색상 구분
    Tool: Playwright
    Preconditions: 테스트 프로젝트에 다양한 상태
    Steps:
      1. 대시보드 KPI 카드 확인
      2. CPI < 0.9: 빨간색 (위험)
      3. CPI 0.9~1.0: 노란색 (주의)
      4. CPI >= 1.0: 초록색 (양호)
    Expected Result: 색상 정확
    Evidence: .sisyphus/evidence/task-27-kpi.png
  ```

---

## Final Verification Wave

- [ ] F1. **전체 연동 검증** - 모든 모듈 연결 확인 (oracle)
- [ ] F2. **E2E 테스트** - 핵심 사용자 플로우 (unspecified-high)
- [ ] F3. **성능 최적화** - 대시보드 로딩, SSE 연결 (unspecified-high)
- [ ] F4. **문서화** - API 문서, 사용 가이드 (writing)

---

## Commit Strategy

| Phase | Message | Files |
|-------|---------|-------|
| 1 | `init: project scaffolding + db setup` | package.json, .env, prisma/ |
| 2 | `feat: project + cost estimate` | src/app/projects/, src/app/api/cost-estimate/ |
| 3 | `feat: execution cost + performance` | src/app/cost-execution/, src/app/performance/ |
| 4 | `feat: schedule + procurement` | src/app/schedule/, src/app/purchase/ |
| 5 | `feat: finance + dashboard` | src/app/dashboard/, src/app/cashflow/ |
| Final | `chore: integration + docs` | 전체 |

---

## Success Criteria

### Verification Commands
```bash
# 개발 서버 실행
npm run dev

# 테스트 실행
npm test

# E2E 테스트
npm run test:e2e
```

### Final Checklist
- [ ] 모든 API endpoint 응답 확인
- [ ] 모든 UI 페이지 렌더링 확인
- [ ] SSE 실시간 업데이트 동작 확인
- [ ] 대시보드 KPI 정확도 확인
- [ ] E2E 테스트 100% 통과
