# PMS 원가 관리 고도화 - 설계 요약

## 1. 개요

### 목적
- 기존 PMS의 원가 관리 기능을 3단계 추적 및 19개 세부 항목으로 세분화
- 견적원가 → 실행원가 → 실행 및 예정(실적) 연동을 통한 손익 자동化管理

### 범위
- 원가 항목: 제조원가(재료비, 노무비, 경비 17항목), 제조간접비
- 손익: 매출이익, 판관비, 영업이익

---

## 2. 데이터 모델 요약

### 2.1 신규 모델 (6개)

| 모델 | 용도 | 주요 필드 |
|------|------|----------|
| `CostCategory` | 원가 항목 마스터 | 19개 항목의 코드/명칭/분류 |
| `CostEstimate` | 견적 원가 | 계약금액, 19개 원가 항목, 손익 |
| `CostEstimateItem` | 견적 상세 | 품목별 내역 (수량, 단가) |
| `CostExecution` | 실행 원가 | 월별/시점별 실제 원가 |
| `CostExecutionItem` | 실행 상세 | 실행 원가 상세 내역 |
| `CostActual` | 실행 및 예정 | 실적 + 전망 통합 관리 |

### 2.2 기존 모델 확장

| 모델 | 추가 필드 |
|------|----------|
| `Project` | costAdminRate, activeCostEstimateId, currentGrossProfit 등 |

---

## 3. 원가 항목 상세 (19개)

### 직접원가

| 코드 | 항목명 | 분류 |
|------|--------|------|
| M01 | 재료비 | 직접원가 |
| L01 | 노무비 | 직접원가 |
| E01_01 | 외주가공비-설비 | 경비 |
| E01_02 | 외주용역비 | 경비 |
| E02_01 | 소모품비-기타 | 경비 |
| E02_02 | 소모품비-안전용품 | 경비 |
| E03 | 여비교통비 | 경비 |
| E04 | 보험료-보증 | 경비 |
| E05 | 사택관리비 | 경비 |
| E06 | 잡급 | 경비 |
| E07 | 지급수수료-기타 | 경비 |
| E08_01 | 지급임차료-지게차 | 경비 |
| E08_02 | 지급임차료-기타 | 경비 |
| E09_01 | 차량유지비-수선비 | 경비 |
| E09_02 | 차량유지비-유류대 | 경비 |
| E09_03 | 차량유지비-기타 | 경비 |
| E10 | 복리후생비-업무추진비 | 경비 |
| E11 |预备비 | 경비 |

### 간접원가

| 코드 | 항목명 | 분류 |
|------|--------|------|
| I01 | 제조간접비 | 간접원가 |

---

## 4. 손익 계산 로직

```
[제조원가(직접원가)] = 材料비 + 노무비 + (경비 17항목 합계)

[총 제조원가] = 제조원가(직접원가) + 製造間接費

[매출이익] = 계약금액 - 총 제조원가

[판관비] = 계약금액 × 판관비율 (기본 12%, 조정 가능)

[영업이익] = 매출이익 - 판관비
```

### 3단계 추적

| 단계 | 시점 | 데이터 |
|------|------|--------|
| **견적원가** | 입찰 시 | CostEstimate |
| **실행원가** | 월별/진행별 | CostExecution |
| **실행 및 예정** | 실적 통합 | CostActual |

---

## 5. 연관 관계도

```
Project
  ├── CostEstimate (1:N)
  │     └── CostEstimateItem (1:N)
  ├── CostExecution (1:N)
  │     └── CostExecutionItem (1:N)
  └── CostActual (1:N)
        └── CostActualItem (1:N)

CostCategory (Master)
  ├── CostEstimateItem (참조)
  ├── CostExecutionItem (참조)
  └── CostActualItem (참조)
```

---

## 6. 구현 우선순위

### Phase 1 (기반 구축)
1. CostCategory 마스터 데이터 설계
2. CostEstimate / CostEstimateItem 구현

### Phase 2 (실행 관리)
3. CostExecution / CostExecutionItem 구현

### Phase 3 (실적 분석)
4. CostActual / CostActualItem 구현
5. 손익 자동 계산 로직 구현

### Phase 4 (고도화)
6. 대시보드 연동
7.报警 기능
8. 히스토리 추적

---

## 7. 참고 사항

### 판관비율 관리
- 기본값: 12%
- 프로젝트별 개별 설정 가능
- CostCategory의 defaultRate 활용

### 데이터 무결성
- CostEstimate 승인 시 실행 원가 생성 가능
- 월별 CostExecution 합산 → CostActual 연동

### 확장성
- 새로운 원가 항목 추가 시 CostCategory에만 등록
- 기존 데이터 영향 없음

---

## 8. 파일 위치

- 스키마: `src/generated/prisma/cost-management.prisma`
- 기존 스키마: `src/generated/prisma/schema.prisma`
- 병합 후: `src/generated/prisma/schema.prisma`에 통합

---

*문서 생성일: 2026-03-12*
