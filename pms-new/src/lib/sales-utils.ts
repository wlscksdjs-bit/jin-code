export function computeSalesCost(sales: {
  bidAmount: number
  laborCost: number
  materialCost: number
  outsourceCost: number
  equipmentCost: number
  otherCost: number
}) {
  const totalCost = sales.laborCost + sales.materialCost + sales.outsourceCost + sales.equipmentCost + sales.otherCost
  const profit = sales.bidAmount - totalCost
  const profitRate = sales.bidAmount > 0 ? (profit / sales.bidAmount) * 100 : 0
  return { totalCost, profit, profitRate }
}