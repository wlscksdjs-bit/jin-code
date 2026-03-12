'use client'

import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import * as XLSX from 'xlsx'

export function printProject(project: any) {
  const printContent = `
    <html>
      <head>
        <title>프로젝트 인쇄</title>
        <style>
          body { font-family: 'Noto Sans KR', sans-serif; padding: 20px; }
          h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
          th { background-color: #f8fafc; font-weight: 600; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; }
          .status-REGISTERED { background-color: #e2e8f0; color: #475569; }
          .status-CONTRACT { background-color: #dbeafe; color: #1d4ed8; }
          .status-DESIGN { background-color: #f3e8ff; color: #7c3aed; }
          .status-CONSTRUCTION { background-color: #dcfce7; color: #16a34a; }
          .status-COMPLETED { background-color: #166534; color: #fff; }
          .status-DELAYED { background-color: #fee2e2; color: #dc2626; }
        </style>
      </head>
      <body>
        <h1>프로젝트 현황보고서</h1>
        <p>출력일: ${format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })}</p>
        
        <h2>기본 정보</h2>
        <table>
          <tr>
            <th>프로젝트 코드</th>
            <td>${project.code}</td>
            <th>프로젝트명</th>
            <td>${project.name}</td>
          </tr>
          <tr>
            <th>상태</th>
            <td><span class="status status-${project.status}">${project.status}</span></td>
            <th>유형</th>
            <td>${project.type}</td>
          </tr>
          <tr>
            <th>고객사</th>
            <td>${project.customer?.name || '-'}</td>
            <th>계약 유형</th>
            <td>${project.contractType || '-'}</td>
          </tr>
          <tr>
            <th>계약금액</th>
            <td>${project.contractAmount ? formatCurrency(project.contractAmount) : '-'}</td>
            <th>추정 예산</th>
            <td>${project.estimatedBudget ? formatCurrency(project.estimatedBudget) : '-'}</td>
          </tr>
          <tr>
            <th>시작일</th>
            <td>${project.startDate ? formatDate(project.startDate) : '-'}</td>
            <th>종료일</th>
            <td>${project.endDate ? formatDate(project.endDate) : '-'}</td>
          </tr>
          <tr>
            <th>위치</th>
            <td colspan="3">${project.location || '-'} ${project.address || ''}</td>
          </tr>
        </table>
        
        ${project.description ? `
        <h2>설명</h2>
        <p>${project.description}</p>
        ` : ''}
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `
  
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(printContent)
    printWindow.document.close()
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', { 
    style: 'currency', 
    currency: 'KRW',
    maximumFractionDigits: 0 
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'yyyy년 MM월 dd일', { locale: ko })
}

export function exportToExcel(data: any[], filename: string) {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`
  link.click()
}

export function exportToXLSX<T extends Record<string, any>>(
  data: T[],
  columns: { key: keyof T; header: string }[],
  filename: string
) {
  const transformed = data.map(row => {
    const newRow: Record<string, any> = {}
    columns.forEach(col => {
      newRow[col.header] = row[col.key]
    })
    return newRow
  })

  const worksheet = XLSX.utils.json_to_sheet(transformed)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data')

  const colWidths = columns.map(col => ({
    wch: Math.max(col.header.length, 15)
  }))
  worksheet['!cols'] = colWidths

  XLSX.writeFile(workbook, `${filename}_${format(new Date(), 'yyyyMMdd')}.xlsx`)
}
