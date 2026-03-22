# PMS 2.0 - 프로젝트 관리 시스템

대규모 건설/엔지니어링 프로젝트의 예산, 일정, 원가를 통합 관리하는 웹 애플리케이션입니다.

## 주요 기능

### 프로젝트 관리
- 프로젝트 등록, 수정, 삭제
- 프로젝트별 WBS(Work Breakdown Structure) 관리
- 프로젝트 현황 대시보드 (KPI 카드, 예산 사용률, 일정 현황)

### 영업 수주
- 수주 영업 프로세스 관리 (입찰 → 제출 → 평가 → 낙차/유찰)
- 고객별 수주 현황 추적

### 원가 관리
- **견적원가**: 프로젝트별 상세 견적 작성
- **실행원가**: 월별 실행 예산 등록 및 추적
- **월별 실적**: 원가 실적 분석

### 발주 및 입고
- 자재/용역 발주서 관리
- 입고 처리 및 재고 추적

### 자금 수지
- 프로젝트별 현금 흐름 관리
- 수입/지출 계획 대비 실제 실적

### 실시간 알림
- SSE 기반 실시간 알림
- 예산 초과, 일정 근접 등 중요 알림 자동推送

### 데이터 내보내기
- Excel 내보내기 지원:
  - `/api/export/projects` - 프로젝트 목록
  - `/api/export/cost-estimate/[id]` - 견적원가
  - `/api/export/cost-execution/[id]` - 실행원가
  - `/api/export/cashflow/[projectId]` - 자금수지

### Google 연동
- Google Sheets: 견적원가, 실행원가 동기화
- Google Drive: 프로젝트 문서 저장 및 공유

## 기술 스택

| 구분 | 기술 |
|------|------|
| Framework | Next.js 15.5.14 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma 7.5.0 |
| Auth | NextAuth 5 (Credentials) |
| UI | Radix UI + Tailwind CSS 4 |
| Testing | Playwright (E2E), Vitest (Unit) |
| Excel | xlsx 라이브러리 |
| Google APIs | googleapis |

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Prisma 설정

```bash
npx prisma generate
npx prisma db push
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

### 4. 로그인

기본 계정:
- 이메일: `admin@pms.com`
- 비밀번호: `admin123`

## 빌드

```bash
npm run build
```

## 테스트

### 단위 테스트

```bash
npm run test:run
```

### E2E 테스트

```bash
npx playwright install
npm run test:e2e
```

## 환경 변수

`.env.local` 파일에 설정:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="your-secret-key"

# Google OAuth (선택)
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Google Service Account (선택)
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
GOOGLE_DRIVE_PMS_FOLDER_ID="your-folder-id"
```

## 데이터 모델

30개 Prisma 모델로 구성:

- **핵심**: Project, ProjectMember, User, Customer
- **영업**: Sales
- **예산**: Budget, BudgetItem
- **WBS**: WbsItem, Progress, Task
- **원가**: CostEstimate, CostEstimateItem, CostExecution, CostExecutionItem, CostActual, CostActualItem
- **발주**: PurchaseOrder, PurchaseOrderItem, MaterialReceipt
- ** 자금**: CashFlow, Finance
- **기타**: Notification, Document, Attachment, AuditLog, Resource, TimeSheet

## 디렉토리 구조

```
src/
├── app/
│   ├── (dashboard)/     # 대시보드 레이아웃 + 페이지
│   ├── actions/         # Server Actions
│   └── api/             # API Routes
├── components/
│   ├── ui/              # shadcn/ui 컴포넌트
│   └── *.tsx            # 커스텀 컴포넌트
└── lib/
    ├── auth.ts          # NextAuth 설정
    ├── prisma.ts        # Prisma Client
    ├── google.ts        # Google APIs 클라이언트
    ├── excel-export.ts  # Excel 내보내기
    └── utils.ts         # 유틸리티
```

## 라이선스

MIT
