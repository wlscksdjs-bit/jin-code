/**
 * PMS Cost Management - Profit Calculation Utility
 */

export interface CostFields {
  materialCost: number;
  laborCost: number;
  outsourceFabrication: number;
  outsourceService: number;
  consumableOther: number;
  consumableSafety: number;
  travelExpense: number;
  insuranceWarranty: number;
  dormitoryCost: number;
  miscellaneous: number;
  paymentFeeOther: number;
  rentalForklift: number;
  rentalOther: number;
  vehicleRepair: number;
  vehicleFuel: number;
  vehicleOther: number;
  welfareBusiness: number;
  reserveFund: number;
  indirectCost: number;
  contractAmount: number;
  sellingAdminRate: number;
}

export interface CalculatedProfit {
  totalExpense: number;
  totalDirectCost: number;
  totalManufacturingCost: number;
  sellingAdminCost: number;
  grossProfit: number;
  operatingProfit: number;
  profitRate: number;
}

export function calculateTotalExpense(cost: CostFields): number {
  return (
    cost.outsourceFabrication +
    cost.outsourceService +
    cost.consumableOther +
    cost.consumableSafety +
    cost.travelExpense +
    cost.insuranceWarranty +
    cost.dormitoryCost +
    cost.miscellaneous +
    cost.paymentFeeOther +
    cost.rentalForklift +
    cost.rentalOther +
    cost.vehicleRepair +
    cost.vehicleFuel +
    cost.vehicleOther +
    cost.welfareBusiness +
    cost.reserveFund
  );
}

export function calculateDirectCost(cost: CostFields): number {
  return cost.materialCost + cost.laborCost + calculateTotalExpense(cost);
}

export function calculateManufacturingCost(cost: CostFields): number {
  return calculateDirectCost(cost) + cost.indirectCost;
}

export function calculateSellingAdminCost(contractAmount: number, rate: number): number {
  return contractAmount * (rate / 100);
}

export function calculateGrossProfit(contractAmount: number, manufacturingCost: number): number {
  return contractAmount - manufacturingCost;
}

export function calculateOperatingProfit(grossProfit: number, sellingAdminCost: number): number {
  return grossProfit - sellingAdminCost;
}

export function calculateProfitRate(operatingProfit: number, contractAmount: number): number {
  if (contractAmount === 0) return 0;
  return (operatingProfit / contractAmount) * 100;
}

export function calculateProfit(cost: CostFields): CalculatedProfit {
  const totalExpense = calculateTotalExpense(cost);
  const totalDirectCost = cost.materialCost + cost.laborCost + totalExpense;
  const totalManufacturingCost = totalDirectCost + cost.indirectCost;
  const sellingAdminCost = calculateSellingAdminCost(cost.contractAmount, cost.sellingAdminRate);
  const grossProfit = calculateGrossProfit(cost.contractAmount, totalManufacturingCost);
  const operatingProfit = calculateOperatingProfit(grossProfit, sellingAdminCost);
  const profitRate = calculateProfitRate(operatingProfit, cost.contractAmount);
  
  return {
    totalExpense,
    totalDirectCost,
    totalManufacturingCost,
    sellingAdminCost,
    grossProfit,
    operatingProfit,
    profitRate
  };
}

export function toCostFields<T extends Partial<CostFields>>(record: T): CostFields {
  return {
    materialCost: record.materialCost ?? 0,
    laborCost: record.laborCost ?? 0,
    outsourceFabrication: record.outsourceFabrication ?? 0,
    outsourceService: record.outsourceService ?? 0,
    consumableOther: record.consumableOther ?? 0,
    consumableSafety: record.consumableSafety ?? 0,
    travelExpense: record.travelExpense ?? 0,
    insuranceWarranty: record.insuranceWarranty ?? 0,
    dormitoryCost: record.dormitoryCost ?? 0,
    miscellaneous: record.miscellaneous ?? 0,
    paymentFeeOther: record.paymentFeeOther ?? 0,
    rentalForklift: record.rentalForklift ?? 0,
    rentalOther: record.rentalOther ?? 0,
    vehicleRepair: record.vehicleRepair ?? 0,
    vehicleFuel: record.vehicleFuel ?? 0,
    vehicleOther: record.vehicleOther ?? 0,
    welfareBusiness: record.welfareBusiness ?? 0,
    reserveFund: record.reserveFund ?? 0,
    indirectCost: record.indirectCost ?? 0,
    contractAmount: record.contractAmount ?? 0,
    sellingAdminRate: record.sellingAdminRate ?? 12
  };
}

export function toProfitFields(calculated: CalculatedProfit) {
  return {
    totalExpense: calculated.totalExpense,
    totalDirectCost: calculated.totalDirectCost,
    totalManufacturingCost: calculated.totalManufacturingCost,
    sellingAdminCost: calculated.sellingAdminCost,
    grossProfit: calculated.grossProfit,
    operatingProfit: calculated.operatingProfit,
    profitRate: calculated.profitRate
  };
}

export interface CostCategorySeed {
  code: string;
  name: string;
  nameEn: string;
  type: 'MATERIAL' | 'LABOR' | 'EXPENSE' | 'INDIRECT';
  level: number;
  parentCode?: string;
  defaultRate?: number;
}

export const COST_CATEGORY_SEED: CostCategorySeed[] = [
  { code: 'M01', name: '재료비', nameEn: 'Material Cost', type: 'MATERIAL', level: 1 },
  { code: 'L01', name: '노무비', nameEn: 'Labor Cost', type: 'LABOR', level: 1 },
  { code: 'E01', name: '외주비', nameEn: 'Outsourcing Cost', type: 'EXPENSE', level: 1 },
  { code: 'E01_01', name: '외주가공비-설비', nameEn: 'Outsource Fabrication - Equipment', type: 'EXPENSE', level: 2, parentCode: 'E01' },
  { code: 'E01_02', name: '외주용역비', nameEn: 'Outsource Service', type: 'EXPENSE', level: 2, parentCode: 'E01' },
  { code: 'E02', name: '소모품비', nameEn: 'Consumable Cost', type: 'EXPENSE', level: 1 },
  { code: 'E02_01', name: '소모품비-기타', nameEn: 'Consumable - Other', type: 'EXPENSE', level: 2, parentCode: 'E02' },
  { code: 'E02_02', name: '소모품비-안전용품', nameEn: 'Consumable - Safety Equipment', type: 'EXPENSE', level: 2, parentCode: 'E02' },
  { code: 'E03', name: '여비교통비', nameEn: 'Travel Expense', type: 'EXPENSE', level: 1 },
  { code: 'E04', name: '보험료-보증', nameEn: 'Insurance - Warranty', type: 'EXPENSE', level: 1 },
  { code: 'E05', name: '사택관리비', nameEn: 'Dormitory Cost', type: 'EXPENSE', level: 1 },
  { code: 'E06', name: '잡급', nameEn: 'Miscellaneous', type: 'EXPENSE', level: 1 },
  { code: 'E07', name: '지급수수료-기타', nameEn: 'Payment Fee - Other', type: 'EXPENSE', level: 1 },
  { code: 'E08', name: '지급임차료', nameEn: 'Rental Cost', type: 'EXPENSE', level: 1 },
  { code: 'E08_01', name: '지급임차료-지게차', nameEn: 'Rental - Forklift', type: 'EXPENSE', level: 2, parentCode: 'E08' },
  { code: 'E08_02', name: '지급임차료-기타', nameEn: 'Rental - Other', type: 'EXPENSE', level: 2, parentCode: 'E08' },
  { code: 'E09', name: '차량유지비', nameEn: 'Vehicle Maintenance', type: 'EXPENSE', level: 1 },
  { code: 'E09_01', name: '차량유지비-수선비', nameEn: 'Vehicle - Repair', type: 'EXPENSE', level: 2, parentCode: 'E09' },
  { code: 'E09_02', name: '차량유지비-유류대', nameEn: 'Vehicle - Fuel', type: 'EXPENSE', level: 2, parentCode: 'E09' },
  { code: 'E09_03', name: '차량유지비-기타', nameEn: 'Vehicle - Other', type: 'EXPENSE', level: 2, parentCode: 'E09' },
  { code: 'E10', name: '복리후생비-업무추진비', nameEn: 'Welfare - Business Promotion', type: 'EXPENSE', level: 1 },
  { code: 'E11', name: '예비비', nameEn: 'Reserve Fund', type: 'EXPENSE', level: 1 },
  { code: 'I01', name: '제조간접비', nameEn: 'Manufacturing Indirect Cost', type: 'INDIRECT', level: 1 },
  { code: 'S01', name: '판관비', nameEn: 'Selling & Administrative Cost', type: 'EXPENSE', level: 1, defaultRate: 12 }
];
