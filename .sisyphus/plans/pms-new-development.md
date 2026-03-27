# PMS 신규 개발 실행 계획

## 개요

- **프로젝트명**: PMS (프로젝트 관리 시스템)
- **기술 스택**: Django REST Framework (Backend) + React.js (Frontend)
- **개발 방식**: 기존 pms-new 폐기, 지침서 기반 신규 개발
- **Phase 진행**: 순차 진행 (Phase 1 → 2 → 3 → 4 → 5)

---

## Phase 1: 시스템 기반 구축 (DB, Auth, 수주 기획)

### Django Backend

1. **프로젝트 구조 생성**
   - `pms-django/` 루트 디렉토리
   - `accounts` 앱: 사용자 관리 및 인증
   - `projects` 앱: 프로젝트 및 버전 관리
   - `core` 앱: 공통 설정

2. **User 모델 확장 (RBAC)**
   - AbstractUser 기반 커스텀 User 모델
   - Role 필드: 최고관리자(admin), 경영진(manager), PM(pm), 설계담당(designer), 시공담당(constructor), 팀원(member)
   - Team 필드: 소속 팀
   - 부서, 연락처 등 추가 필드

3. **JWT 인증 구현**
   - djangorestframework-simplejwt 활용
   - Login, Logout, Token Refresh API
   - Role 기반 접근 권한 검증

4. **Project & ProjectVersion 모델**
   - Project: 프로젝트명, 고객사, 시작일, 종료일, 상태(대기/진행/완료/취소)
   - ProjectVersion: 버전(v1.0, v1.1), 입찰가, 원가 분석, 생성일

5. **수주 기획 REST API**
   - 프로젝트 파이프라인 CRUD
   - 버전 생성 및 히스토리 조회
   - 목표 이익률 기반 입찰가 시뮬레이션

### React Frontend

1. **프로젝트 초기 세팅**
   - Create React App 또는 Vite
   - TailwindCSS 설정
   - React Router 설정

2. **인증 상태 관리**
   - JWT 토큰 저장 (localStorage)
   - Axios 인터셉터 설정
   - 로그인/로그아웃 로직

3. **로그인 페이지**
   - 아이디/비밀번호 입력
   - JWT 인증 요청
   - 오류 처리

4. **프로젝트 관리 UI**
   - 프로젝트 목록 (테이블)
   - 프로젝트 생성 폼
   - 버전 히스토리 모달

---

## Phase 2: 실행 예산 관리 및 결재 워크플로우

### Backend

1. **원가 관리 모델**
   - CostCategory: 인건비, 자재비, 외주비 등
   - Budget: 항목별 실행 예산
   - Expense: 실제 집행 내역

2. **비용 트래킹 로직**
   - 계획 vs 기사용 vs 당회 vs 잔여 계산
   - 원가 절감/초과 로직 (적자=빨강, 흑자=파랑)

3. **전자 결재 모델**
   - Approval: 결재 유형, 상태, 결재선
   - 결재 워크플로우 (상신→검토→승인/반려)

4. **기성 관리 로직**
   - 승인 시 당회 → 기사용 자동 이관
   - 트랜잭션 롤백 검증

### Frontend

1. **원가 관리 UI**
   - 예산 편성 폼
   - 비용 입력 그리드
   - 색상 하이라이트 (초과/절감)

2. **결재 처리 UI**
   - 결재 상신 버튼
   - 승인/반려アクション
   - 결재 히스토리

---

## Phase 3: 리소스 할당 및 WBS/일정 관리

### Backend

1. **ResourceAllocation 모델**
   - 프로젝트-사용자 매핑
   - 투입 기간, 투입률 (M/M)

2. **충돌 감지 API**
   - 합산 투입률 100% 초과 감지
   - 필수 포지션 공백 경고

3. **Task(WBS) 모델**
   - 작업 트리 구조
   - 선행/후행 관계
   - 진행률 추적

4. **간트차트 데이터**
   - JSON 데이터 파이프라인
   - 자동 일정 Push 로직

### Frontend

1. **인력 배치 UI**
   - 리소스 히트맵
   - 충돌 시각적 경고

2. **간트차트 UI**
   - Drag & Drop 일정 변경
   - 진행률 표시

---

## Phase 4: 경영진 대시보드 및 실시간 알림

### Backend

1. **대시보드 집계 API**
   - 수주 달성률
   - 원가 집행률 (EAC/ETC)
   - 지연 프로젝트 Top 5

2. **이상 감지 스케줄러**
   - 비용 95% 초과 감지
   - 마일스톤 2주 지연 감지
   - 인력 공백 감지

3. **Notification 모델**
   - 알림 타입, 대상자, 읽음 여부

### Frontend

1. **대시보드 UI**
   - 차트 위젯 (Pie, Bar, Line)
   - 반응형 모바일 최적화

2. **알림 UI**
   - 팝업 알림
   - Bell 아이콘 카운트

---

## Phase 5: 통합 테스트 및 버그 픽스

- E2E 테스트
- 데이터 흐름 검증
- 모바일 최적화 검증