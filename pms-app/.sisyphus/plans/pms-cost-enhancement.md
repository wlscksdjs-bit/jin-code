# PMS 원가 관리 보강 작업 계획

## TL;DR

> **목표**: 환경플랜트 PMS의 원가 관리 기능 고도화 - 견적→실행→실적 절감 추적 및 비교 UI 구현
> 
> **주요 산출물**:
> - Cost Actual CRUD 페이지 (/cost 페이지 탭 통합)
> - 견적 vs 실행 vs 실적 비교 테이블 + 그래프
> - 항목별 3단계 절감 추적 기능
> - 대시보드 Gantt 차트 통합
> - 인력 관리 통합 뷰
> 
> **기간**: 1개월 (4주)
> **검증**: 테스트 코드 + Agent 검증

---

## Context

### 기존 프로젝트 현황
- **기술 스택**: Next.js 14 + Prisma ORM + SQLite + Tailwind CSS
- **현재 상태**: CostEstimate/CostExecution/CostActual 데이터 모델 존재, copy-from-estimate API 구현
- **Gap**: CostActual UI 없음, 절감 추적 부재, 비교 뷰 없음

### 사용자 요구사항
1. **절감 추적**: 항목별(자재비, 노무비 등) + 3단계(견적→실행→실적) 추적
2. **비교 UI**: 테이블(나란히 비교) + 그래프(추이) 모두 제공
3. **실적 입력**: 기존 /cost 페이지에 탭으로 통합
4. **간트/인력**: 1개월 내 함께 구현

---

## Work Objectives

### Core Objective
1개월 내에 원가 관리 핵심 기능(절감 추적, 비교 UI, 실적 관리)을 완성하고, 간트/인력 관리 보강

### Phase 1: 원가 관리 (3주)
1. **CostActual UI 추가** - 기존 /cost 페이지에 "실적" 탭 추가
2. **비교 뷰 구현** - 견적/실행/실적 나란히 비교 테이블
3. **추이 그래프** - Line chart로 비용 추이 시각화
4. **절감 계산 로직** - 항목별 3단계 차이 자동 계산

### Phase 2: 간트 + 인력 (1주)
5. **대시보드 Gantt 통합** - 메인 대시보드에 간트 뷰 추가
6. **인력 통합 뷰** - 전체 프로젝트 인력 현황 한 화면에 표시

---

## Verification Strategy

### Test Infrastructure
- **Framework**: Jest + React Testing Library (기존 프로젝트 확인 필요)
- **검증 방식**: 테스트 코드 + Agent 직접 실행 검증
- **QA**: 각 태스크 후 Agent가 직접 실행하여 동작 확인

### QA Policy
모든 태스크는 Agent Executed QA Scenarios 포함:
- Frontend: Playwright로 브라우저 테스트
- API: curl로 엔드포인트 검증

---

## Execution Strategy

### Wave 1 (1주차): 기반 구축
- T1: 프로젝트调研 및 CostActual 모델 확인
- T2: /cost 페이지 구조 분석 및 탭 컴포넌트 설계
- T3: CostActual CRUD API 구현 (없을 경우)
- T4: 비용 계산 유틸리티 (절감 계산 로직) 구현

### Wave 2 (2주차): 비교 UI 구현
- T5: 견적 vs 실행 vs 실적 비교 테이블 컴포넌트
- T6: 추이 그래프 (Recharts/기존 라이브러리 활용)
- T7: /cost 페이지에 탭 통합 (견적/실행/실적)
- T8: 절감 자동 계산 및 표시

### Wave 3 (3주차): 원가 마무리
- T9: Profit/Loss 연동 (Cost → Finance)
- T10: Excel export 기능 보강
- T11: 테스트 코드 작성

### Wave 4 (4주차): 간트 + 인력
- T12: 대시보드 Gantt 통합
- T13: 인력 관리 통합 뷰
- T14: 최종 통합 테스트

### Wave Final
- F1: 전체 플랜 준수 감사
- F2: 코드 품질 리뷰
- F3: End-to-End 테스트
- F4: Scope 충실도 확인

---

## TODOs

> 각 태스크는 구현 + 테스트를 하나의 태스크로 통합

- [ ] 1. **프로젝트 셋업 확인** - 의존성 설치, 빌드 확인

  **What to do**: 
  - npm install 및 빌드 테스트
  - 기존 테스트 infrastructure 확인 (Jest/Vitest)
  - Prisma generate 확인

  **QA Scenarios**:
  - npm run build → 성공
  - npm run dev → 서버 기동 성공

- [ ] 2. **CostActual 모델/API 확인** - 기존 API 존재 여부

  **What to do**:
  - /api/cost-actual/route.ts 분석
  - GET/POST API 구현 (없을 경우)
  - Prisma 스키마 확인

  **QA Scenarios**:
  - curl GET /api/cost-actual → 200 또는 에러 적절히 처리

- [ ] 3. **/cost 페이지 구조 분석** - 기존 페이지 阅读

  **What to do**:
  - src/app/(dashboard)/cost/page.tsx 阅读
  - 견적 탭 컴포넌트 구조 파악
  - 탭 네비게이션 패턴 확인

  **QA Scenarios**:
  - 페이지 접근 가능 확인

- [ ] 4. **CostActual CRUD 구현** - 실적 데이터 관리

  **What to do**:
  - CostActualCreateForm 컴포넌트
  - CostActualList 컴포넌트
  - 19개 비용 항목 입력 폼

  **QA Scenarios**:
  - Form 제출 후 데이터 저장 확인
  - List에 데이터 표시 확인

- [ ] 5. **탭 컴포넌트 구현** - 견적/실행/실적 탭

  **What to do**:
  - TabContainer 컴포넌트
  - CostEstimateTab, CostExecutionTab, CostActualTab
  - 탭 간 데이터 연동

  **QA Scenarios**:
  - 각 탭 클릭 시 해당 데이터 표시
  - 데이터 변경 시 탭에 반영

- [ ] 6. **비교 테이블 구현** - 3단계 나란히 비교

  **What to do**:
  - CostComparisonTable 컴포넌트
  - 항목별(자재비, 노무비 등) 행 표시
  - 견적/실행/실적 열 표시
  - 차이(절감/초과) 열 계산

  **QA Scenarios**:
  - 테이블에 3단계 데이터 표시
  - 차이 값 정확히 계산

- [ ] 7. **추이 그래프 구현** - Line chart

  **What to do**:
  - CostTrendChart 컴포넌트 (Recharts 활용)
  - X축: 시간 (월별)
  - Y축: 비용 금액
  - 선: 견적, 실행, 실적

  **QA Scenarios**:
  - 그래프 렌더링 확인
  - 데이터 변경 시 그래프 업데이트

- [ ] 8. **절감 계산 로직 구현** - 자동 계산

  **What to do**:
  - calculateSavings(estimate, execution, actual) 함수
  - 항목별 차이 계산
  - 총 절감/초과 계산
  - 화면에 표시

  **QA Scenarios**:
  - 절감 금액 정확히 계산
  - 초과 시 음수/빨강색으로 표시

- [ ] 9. **대시보드 Gantt 통합**

  **What to do**:
  - 기존 GanttChart 컴포넌트 활용
  - 대시보드 페이지에 간트 섹션 추가
  - 전체 프로젝트 일정 개요 표시

  **QA Scenarios**:
  - 대시보드에서 Gantt 표시
  - 프로젝트별 색상 구분

- [ ] 10. **인력 통합 뷰 구현**

  **What to do**:
  - AllProjectsResources 페이지/컴포넌트
  - 모든 프로젝트의 ProjectMember 조회
  - 인력별 총 배정률 표시
  - 가용성 상태 표시

  **QA Scenarios**:
  - 전체 인력 목록 표시
  - 프로젝트별 배정률 확인

- [ ] 11. **통합 테스트**

  **What to do**:
  - End-to-End 시나리오 테스트
  - 원가 입력 → 비교 → 절감 확인
  - 간트/인력 뷰 확인

  **QA Scenarios**:
  - 전체 플로우 정상 동작

- [ ] 12. **버그 수정 및 품질 개선**

  **What to do**:
  - 발견된 이슈 수정
  - UI/UX 개선
  - 성능 최적화

---

## Final Verification Wave

- [ ] F1. **플랜 준수 감사** (oracle) - 모든 Must Have 존재 확인
- [ ] F2. **코드 품질 리뷰** (unspecified-high) - tsc, lint, 테스트
- [ ] F3. **실제 수동 QA** (playwright) - 실제 브라우저에서 테스트
- [ ] F4. **Scope 충실도 확인** (deep) - 계획 대비 구현 확인

---

## Success Criteria

### Verification Commands
```bash
npm run build  # 성공
npm run lint  # 경고 없음
```

### Final Checklist
- [ ] CostActual CRUD 페이지 존재
- [ ] 견적/실행/실적 비교 테이블 동작
- [ ] 추이 그래프 표시
- [ ] 절감 자동 계산/표시
- [ ] 대시보드 Gantt 통합
- [ ] 인력 통합 뷰 구현
