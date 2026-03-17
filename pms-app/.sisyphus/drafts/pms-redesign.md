# Draft: pms-app 전면 재설계

## 사용자 요구사항 (원문)

> 모든것은 프로젝트 기준으로 입찰 검토 때부터 프로젝트의 개요부터 견적원가부터 등록하고 수주 확정 시 설계 스케줄링 일정을 등록하고 그것에 따른 발주 및 입고 일정을 관리하며 공사시공팀은 제작일정에 맞춰 시공 스케줄링을 하여 모두 간트차트로 관리하며, 실행원가로 넘어가며 실제 실행을 하며 월별 실적과 사용 예정 비용을 누적 관리하여 자금수지 현황을 실시간으로 관리하여 예산 대비 적정 사용률을 체크하여 최종 절감 상황인지, 비용이 초과한 상황인지, 프로젝트 전체적으로 관리가 시작부터 끝까지되어 중간부터 최종까지 손익관리가 실시간으로 예상하는 시스템으로 구축하여 수주영업 현황부터 계획 대비 현 상황을 보여주는 대시보드까지 전체가 연동되도록 유기적인 시스템으로 업그레이드

## 현재 아키텍처 요약

### Tech Stack
- Next.js 16.1.6 + React 19 + TypeScript
- Prisma 5.22 + SQLite
- React Query (@tanstack/react-query)
- NextAuth 5 (Google, Kakao OAuth)
- Radix UI + Tailwind CSS 4
- Zod validation

### 현재 모듈 (14개)
1. User & Auth
2. Customer
3. Project
4. Sales (입찰/계약)
5. Budget (예산)
6. WBS (작업분해)
7. Progress (진행률)
8. Resources (인력)
9. Finance (손익)
10. Tasks (업무)
11. Documents (문서)
12. Attachments (첨부)
13. Audit (감사로그)
14. Notifications (알림)
15. Cost Management (원가)

### 현재 문제점 (추정)
- 模块 간 연동 부족 (isolated)
- 실시간 대시보드 미비
- 간트차트 제한적
- 자금수지 실시간 관리 미흡
- 월별 실적 누적 관리 부재

## 재설계 목표

### 1. 프로젝트 중심 아키텍처 (Project-Centric)
모든 데이터가 프로젝트 기준으로 구성

### 2. 프로젝트生命周期 관리
```
입찰검토 → 수주확정 → 설계 → 발주 → 시공 → 준공
   ↓          ↓        ↓      ↓      ↓      ↓
 견적원가   계약금액  공정관리  구매관리  실행원가  손익정산
```

### 3. 간트차트 통합
- 설계 스케줄링
- 발주/입고 일정
- 시공 스케줄링
- 전부 통합 간트차트

### 4. 실시간 원가 관리
- 월별 실적 누적
- 사용 예정 비용
- 자금수지 현황
- 예산 대비 사용률

### 5. 실시간 대시보드
- 수주영업 현황
- 계획 vs 실제
- 손익 예측
- 프로젝트 건강지수

## 핵심 결정사항 (최종)

### Tech Stack
- Framework: Next.js 16+ (App Router)
- ORM: Prisma 5+
- Database: **PostgreSQL**
- Realtime: **SSE**
- Auth: NextAuth 5
- Validation: Zod
- UI: Radix UI + Tailwind CSS 4
- Gantt: 외부 라이브러리 (dhtmlxGantt 또는 Pragmatic DnD)

### 기존 코드: 전체 신규 작성
### 외부 연동: v1 미포함

## Open Questions (해결됨)

| 질문 | 결정 |
|------|------|
| 핵심 기능 | **원가 관리** |
| DB | PostgreSQL |
| Realtime | SSE |
| 간트차트 | 외부 라이브러리 |
| 외부 연동 | v1 미포함 |
| 기존 코드 | 전체 신규 작성 |
