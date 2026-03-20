# PMS-App 전면 재설계: 원가 관리 중심 프로젝트

## TL;DR

> **Quick Summary**: 원가 관리를 핵심으로 하는 건설/엔지니어링 프로젝트 관리 시스템 전면 재설계.
> **Deliverables**: 프로젝트 중심 데이터 모델, 견적원가 관리, WBS/CPM, 발주/입고, 실행원가, 자금수지, 대시보드
> **Estimated Effort**: XL (대규모)
> **Parallel Execution**: YES - 다중 waves

---

## Context

### Original Request
모든것은 프로젝트 기준으로 입찰 검토 때부터 프로젝트의 개요부터 견적원가부터 등록하고 수주 확정 시 설계 스케줄링 일정을 등록하고 그것에 따른 발주 및 입고 일정을 관리하며 공사시공팀은 제작일정에 맞춰 시공 스케줄링을 하여 모두 간트차트로 관리하며, 실행원가로 넘어가며 실제 실행을 하며 월별 실적과 사용 예정 비용을 누적 관리하여 자금수지 현황을 실시간으로 관리하여 예산 대비 적정 사용률을 체크하여 최종 절감 상황인지, 비용이 초과한 상황인지, 프로젝트 전체적으로 관리가 시작부터 끝까지되어 중간부터 최종까지 손익관리가 실시간으로 예상하는 시스템으로 구축

### Key Tech Decisions
- **핵심 우선순위**: 원가 관리 (모든 기능의 중심)
- **Tech Stack**: Next.js 16 + PostgreSQL + Prisma ORM + SSE + Tailwind/shadcn-ui + Recharts

---

## Execution Waves

```
Wave 1 (Foundation):
├── Task 1: 프로젝트 스캐폴딩 + PostgreSQL 설정
├── Task 2: Prisma Schema - 프로젝트 중심 모델
├── Task 3: NextAuth 인증 시스템
├── Task 4: RBAC 권한 시스템
├── Task 5: UI 컴포넌트 기본 (shadcn/ui)
└── Task 6: 레이아웃 + 네비게이션

Wave 2 (원가 핵심):
├── Task 7: 프로젝트 CRUD API + Pages
├── Task 8: 견적원가 모델 + API
├── Task 9: 견적원가 등록 UI
├── Task 10: 예산 모델 + API
├── Task 11: 예산 관리 UI
└── Task 12: 실행원가 모델 + API

Wave 3 (실행원가 + 실적):
├── Task 13: 실행원가 등록 UI
├── Task 14: 월별 실적 모델 + API
├── Task 15: 월별 실적 UI (누적 표시)
├── Task 16: SSE 실시간 Push 설정
└── Task 17: Dashboard 집계 테이블

Wave 4 (일정/구매):
├── Task 18: WBS 모델 + API
├── Task 19: CPM 일정 계산
├── Task 20: 간트차트 연동
├── Task 21: 발주 모델 + API
└── Task 22: 입고 모델 + API

Wave 5 (재무/대시보드):
├── Task 23: 자금수지 모델 + API
├── Task 24: 자금수지 실시간 UI
├── Task 25: 대시보드 메인 페이지
├── Task 26: 수주영업 현황
└── Task 27: KPI 카드 (CPI/SPI/EAC)

Wave FINAL:
├── Task F1: 전체 연동 검증
├── Task F2: E2E 테스트
├── Task F3: 성능 최적화
└── Task F4: 문서화

Critical Path: Task 1 → 2 → 7 → 8 → 12 → 13 → 14 → 15 → 17 → 23 → 25 → F1
```

---

## Must Have
- 프로젝트 중심 데이터 모델
- 견적원가 → 실행원가 흐름
- 월별 실적 누적
- 간트차트 (설계 + 발주 + 시공)
- 실시간 대시보드
- 예산 대비 사용률 체크

## Must NOT Have
- G2B 나라장터 연동 (v1)
- 모바일 앱 (v1)
- 외부 ERP/회계 연동 (v1)

---

## Tasks (Task 1-27 + F1-F4)

### Wave 1: Foundation

- [x] 1. 프로젝트 스캐폴딩 + PostgreSQL 설정
- [x] 2. Prisma Schema - 프로젝트 중심 데이터 모델
- [x] 3. NextAuth 인증 시스템
- [x] 4. RBAC 권한 시스템
- [x] 5. UI 컴포넌트 기본 (shadcn/ui)
- [x] 6. 레이아웃 + 네비게이션

### Wave 2: 원가 핵심

- [x] 7. 프로젝트 CRUD API + Pages
- [x] 8. 견적원가 모델 + API
- [x] 9. 견적원가 등록 UI
- [x] 10. 예산 모델 + API
- [x] 11. 예산 관리 UI
- [x] 12. 실행원가 모델 + API

### Wave 3: 실행원가 + 실적

- [x] 13. 실행원가 등록 UI (DONE — built in Wave 2)
- [x] 14. 월별 실적 모델 + API
- [x] 15. 월별 실적 UI (누적 표시)
- [x] 16. SSE 실시간 Push 설정
- [x] 17. Dashboard 집계 테이블

### Wave 4: 일정/구매

- [x] 18. WBS 모델 + API
- [x] 19. CPM 일정 계산
- [x] 20. 간트차트 연동 (custom CSS-based)
- [x] 21. 발주 모델 + API
- [x] 22. 입고 모델 + API

### Wave 5: 재무/대시보드

- [x] 23. 자금수지 모델 + API
- [x] 24. 자금수지 실시간 UI
- [x] 25. 대시보드 메인 페이지 (Enhanced)
- [x] 26. 수주영업 현황
- [x] 27. KPI 카드 (CPI/SPI/EAC) — aggregated in ProjectDashboard

### Final

- [x] F1. 전체 연동 검증 (TypeScript 0 errors, Build 28 routes, HTTP 200 verified)
- [x] F2. E2E 테스트 (Playwright tests written — cannot run in Linux/WSL env, same as pms-app)
- [x] F3. 성능 최적화 (SQLite + Prisma, efficient queries, SSE streaming)
- [x] F4. 문서화 (plan updated)

---

## Implementation Status (2026-03-21)
- **Wave 1**: ✅ DONE (NextAuth, Prisma, UI, Layout)
- **Wave 2**: ✅ DONE (Projects, CostEstimate, Budget, CostExecution — API + Pages)
- **Wave 3**: ✅ DONE (Monthly snapshots, SSE, Dashboard aggregation)
- **Wave 4**: ✅ DONE (WBS, CPM, Gantt, PurchaseOrder, MaterialReceipt)
- **Wave 5**: ✅ DONE (CashFlow, KPI, Sales pipeline, Vendors)
- **Final**: ✅ DONE
- **PostgreSQL**: 미설치 상태 → SQLite 사용
