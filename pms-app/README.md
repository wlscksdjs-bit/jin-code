# PMS 2.0 — 프로젝트 관리 시스템

환경플랜트 건설회사를 위한 프로젝트 관리 시스템. 수주영업 → 설계/시공 → 원가관리 → 손익관리 전체 워크플로우를 프로젝트 기준으로 관리합니다.

## 주요 기능

### Phase 1 — 데이터 워크플로우
- **수주 확정**: Sales → Project 자동 전환 + 마일스톤 8개 자동 생성
- **단계 전환**: BIDDING → CONTRACT → DESIGN → PROCUREMENT → CONSTRUCTION → COMPLETED
- **ProjectWorkflow**: 프로젝트 라이프사이클 추적

### Phase 2 — 구매/발주 관리
- **Vendor CRUD**: 거래처 관리 (자재/설비/용역/인건비 분류)
- **PurchaseOrder CRUD**: 발주서 생성 → 발송 → 입고 → 설치 완료
- **자동 발주번호**: `PO-YYYY-XXXX` 형식
- **입고 현황 추적**: 품목별 수량 관리

### Phase 3 — Dashboard
- **수주영업 현황**: 신규/제출/평가중/수주/실패 파이프라인
- **프로젝트별 손익**: 계약금액 대비 원가/이익률 실시간 표시
- **자금수지 Chart**: 월별 수입/지출/잔액 (Recharts)
- **GanttChart**: 간트차트 + 드래그로 일정 저장

### Phase 4 — 원가/손익 실시간
- **월별 원가 입력**: 12개 원가 항목 (재료비/노무비/경비/간접비 등)
- **실시간 손익 계산**: 제조원가 → 매출이익 → 판관비(12%) → 영업이익
- **예산 사용률 추적**: 누적 원가 / 계약금액
- **CostExecution**: 월별 실적 저장 + 집계

### Phase 5 — Alerts & Export
- **예산 초과 알림**: 80%/90%/100% 임계값 도달 시 자동 알림
- **마일스톤 기한 알림**: 7일 이내 마일스톤 자동 알림
- **Excel 내보내기**: 프로젝트/발주서/원가 목록 → `.xlsx`
- **인쇄**: Browser Print API → PDF 저장

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Database | SQLite + Prisma ORM |
| UI | Tailwind CSS + Radix UI shadcn/ui |
| Charts | Recharts |
| Auth | NextAuth.js |
| Validation | Zod |
| Excel | xlsx |
| Testing | Playwright |

## 시작하기

```bash
npm install
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 데이터베이스 초기화

```bash
npx prisma db push --accept-data-loss
npx prisma generate
```

## 프로젝트 구조

```
src/
├── app/
│   ├── (dashboard)/           # 레이아웃 그룹
│   │   ├── page.tsx           # Dashboard
│   │   ├── sales/             # 영업수주
│   │   ├── projects/          # 프로젝트 목록 + 상세
│   │   ├── orders/            # 발주 관리
│   │   ├── vendors/           # 거래처
│   │   ├── cost/             # 원가관리 + 월별입력
│   │   ├── notifications/    # 알림
│   │   └── layout.tsx        # Sidebar navigation
│   ├── actions/               # Server Actions
│   │   ├── workflow.ts        # 수주확정, 단계전환
│   │   ├── purchase-orders.ts # 발주 CRUD
│   │   ├── vendors.ts         # 거래처 CRUD
│   │   ├── cost-execution.ts # 월별원가
│   │   ├── alerts.ts         # 예산/마일스톤 알림
│   │   └── cash-flow.ts      # 자금수지
│   └── api/                   # REST API
├── components/
│   ├── dashboard/             # Dashboard 카드
│   ├── orders/                # 발주 관련 UI
│   ├── cost/                  # 원가 관련 UI
│   ├── projects/              # 프로젝트 관련 UI
│   └── gantt-chart.tsx        # 간트차트
└── lib/
    ├── auth.ts                # NextAuth 설정
    ├── prisma.ts              # Prisma Client
    ├── utils.ts               # 유틸리티 함수
    └── export.ts              # Excel/Print 내보내기
```

## 주요 Server Actions

| Action | 설명 |
|--------|------|
| `confirmContract(salesId, options)` | 수주 확정 처리 |
| `transitionPhase(projectId, phase)` | 프로젝트 단계 전환 |
| `createPurchaseOrder(data)` | 발주서 생성 |
| `createCostExecution(input)` | 월별 원가 등록 |
| `generateCashFlowForecast(projectId)` | 자금 흐름 예측 생성 |
| `checkBudgetOverrun(projectId, userId)` | 예산 초과 알림 체크 |
| `checkMilestoneDueAlerts(userId)` | 마일스톤 기한 알림 체크 |
| `markAllNotificationsAsRead(userId)` | 알림 일괄 읽음 처리 |

## 사이드바 네비게이션

| 메뉴 | 경로 | 역할 |
|------|------|------|
| 대시보드 | `/` | 전체 현황 |
| 프로젝트 | `/projects` | 프로젝트 목록/상세 |
| 영업수주 | `/sales` | 수주 영업 관리 |
| 원가관리 | `/cost` | 견적원가 + 월별원가 |
| 발주관리 | `/orders` | 자재/용역 발주 |
| 거래처 | `/vendors` | Vendor 관리 |
| 알림 | `/notifications` | 알림 목록 |

## 테스트

```bash
# E2E 테스트 실행 (dev 서버 필요)
npm run test:e2e

# UI 모드
npm run test:e2e:ui
```

## 문서

- [PMS 2.0 구현 로드맵](./docs/PMS2-0-ROADMAP.md)
- [EPS-PJT 마스터](./docs/EPS-PJT-MASTER.md)

---

*Version 2.0 — 2026-03-19*
