# EPS (Environmental Plant Suite) - PJT 마스터 문서

## 프로젝트 개요

**프로젝트명**: EPS (Environmental Plant Suite)
**프로젝트 유형**: 환경플랜트 통합 사업관리 시스템 (Full-Stack Web Application)
**시작일**: 2026년 3월
**예상 기간**: 6개월 (30명 수석급 엔지니어)
**기술 스택**: 
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: Next.js Server Actions, Prisma ORM
- Database: SQLite (Dev) / PostgreSQL (Prod)
- Auth: NextAuth v5

---

## PJT 명명 규칙

### 1. 파일 및 디렉토리
- **Server Actions**: `src/actions/[domain]/[action].ts`
- **Zod Schema**: `src/lib/schemas/[domain].ts`
- **Components**: `src/components/[domain]/[ComponentName].tsx`
- **Types**: `src/types/[domain].ts`

### 2. Phase 및 Milestone
- **형식**: `[Phase]-[序号]-[작업명]`
- **예시**: `Phase 1-2-ServerActionsProjectsCRUD`

### 3. 브랜치 전략
- **형식**: `eps/[phase]-[序号]-[작업명`
- **예시**: `eps/phase-1-2-projects-crud`

---

## 전체 구조 (Phase별)

### Phase 1: 데이터 관리 고도화 (1-2개월)
- [x] 1-1: PJT 마스터 문서 생성 및 구조 설계
- [x] 1-2: Server Actions 구현 (Projects CRUD)
- [x] 1-3: Server Actions 구현 (Sales CRUD)
- [x] 1-4: Server Actions 구현 (Budget CRUD)
- [x] 1-5: Server Actions 구현 (Progress, Resources, Finance)
- [x] 1-6: Zod 검증 스키마 구현
- [x] 1-7: 상세 검색/필터 컴포넌트 구현
- [x] 1-8: 페이지네이션 및 정렬 구현

### Phase 2: UX/UI 고도화 (2-3개월)
- [x] 2-1: 모바일 UX 최적화
- [x] 2-2: PWA 지원 추가
- [x] 2-3: 다크 모드 지원

### Phase 3: 보안 및 인증 강화 (3-4개월)
- [x] 3-1: SSO/OAuth 통합 (Google, Kakao)
- [x] 3-2: 2FA 인증 추가
- [x] 3-3: 감사 로깅 (Audit Log)

### Phase 4: 고급 기능 (4-5개월)
- [x] 4-1: 알림 시스템 구현
- [x] 4-2: 실시간 업데이트 (WebSocket)
- [x] 4-3: 인쇄/Export 기능 (PDF, Excel)

### Phase 5: 통합 및 최적화 (5-6개월)
- [x] 5-1: 성능 최적화
- [x] 5-2: 테스트 및 QA
- [x] 5-3: 문서화 및 배포

---

## 현재 상태 (2026-03-12) - PJT 고도화 진행 중

### 완료된 작업
- Next.js 16 프로젝트 셋업
- Prisma + SQLite DB 스키마 (14개 모델)
- NextAuth v5 인증 (Credentials + OAuth)
- RBAC (ADMIN/PM/STAFF)
- Zod 검증 스키마 (14개 모델)
- 검색/필터/정렬/페이지네이션
- 모바일 UX 최적화
- PWA 지원
- 다크 모드 지원
- OAuth (Google, Kakao)
- 2FA 필드 추가
- 감사 로깅 모델 추가

### 최근 고도화 작업 (2026-03-12)
- [x] **Zod 검증 통합**: notifications.ts에 CreateNotificationSchema 적용
- [x] **READ operations 추가**: 8개 도메인에 getX, listX 함수 추가
  - projects, sales, budget, tasks, finance, progress, resources, notifications
- [x] **알림 UI 페이지**: /notifications 페이지 생성
- [x] **Export 기능**: xlsx 라이브러리 설치, Excel 내보내기 버튼 추가
- [x] **사이드바 내비게이션**: Bell 아이콘으로 알림 페이지 연결

### 진행 중인 작업
- Phase 4-1: 알림 시스템 구현 (완료)
- Phase 4-3: Export 기능 (완료)
- Phase 5-3: 문서화 (진행 중)

---

## 새로 추가된 데이터 모델

15. **AuditLog**: 감사 로그
16. **Notification**: 알림

---

## 새로 추가된 파일

- `src/lib/schemas/index.ts` - Zod 검증 스키마
- `src/components/ui/search-filter.tsx` - 검색/필터/페이지네이션
- `src/components/ui/theme-toggle.tsx` - 다크 모드 토글
- `src/components/ui/theme-provider.tsx` - Theme Provider
- `public/manifest.json` - PWA 매니페스트
- `docs/EPS-PJT-MASTER.md` - PJT 마스터 문서

## 새로 추가된 파일 (2026-03-12 고도화)

### Server Actions
- `src/app/actions/notifications.ts` - 알림 CRUD + Zod 검증
- `src/app/actions/projects.ts` - getProject, listProjects 추가
- `src/app/actions/sales.ts` - getSales, listSales 추가
- `src/app/actions/budget.ts` - getBudget, listBudgets 추가
- `src/app/actions/tasks.ts` - getTask, listTasks 추가
- `src/app/actions/finance.ts` - getFinance, listFinance 추가
- `src/app/actions/progress.ts` - getProgress, listProgress 추가
- `src/app/actions/resources.ts` - getResource, listResources 추가

### Pages & Components
- `src/app/(dashboard)/notifications/page.tsx` - 알림 목록 페이지
- `src/app/(dashboard)/notifications/notification-list.tsx` - 알림 목록 컴포넌트
- `src/components/projects/projects-export-button.tsx` - Excel 내보내기 버튼

### Utilities
- `src/lib/export.ts` - exportToXLSX, exportToCSV 함수 추가

---

## 데이터 모델 (11개)

1. **User**: 사용자 및 인증
2. **Customer**: 고객사 관리
3. **Project**: 프로젝트 기본 정보
4. **ProjectMember**: 프로젝트 멤버
5. **Sales**: 영업수주관리
6. **Budget**: 예산수립 및 실행
7. **BudgetItem**: 예산 항목
8. **WbsItem**: WBS (Work Breakdown Structure)
9. **Progress**: 설계/공사 진행 관리
10. **Resource**: 인원리소스 관리
11. **Finance**: 최종 손익관리
12. **Task**: 작업 및 이슈
13. **Document**: 문서 관리
14. **Attachment**: 첨부파일

---

## 권장 개발 가이드

### Server Actions 작성 규칙
```typescript
'use server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createProject(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  
  // ... 로직
  revalidatePath('/projects')
}
```

### Zod Schema 작성 규칙
```typescript
import { z } from 'zod'

export const ProjectSchema = z.object({
  name: z.string().min(1, '프로젝트명을 입력하세요'),
  code: z.string().min(1, '프로젝트 코드를 입력하세요'),
  // ...
})
```

---

## 참고 문서

- Next.js 16 Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth v5: https://next-auth.js.org/
- Tailwind CSS 4: https://tailwindcss.com/

---

*본 문서는 추후 계속 업데이트 됩니다.*
