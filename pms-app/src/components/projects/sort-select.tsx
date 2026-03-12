'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const sortOptions = [
  { value: 'createdAt-desc', label: '최신순' },
  { value: 'createdAt-asc', label: '오래된순' },
  { value: 'name-asc', label: '이름순 (가-하)' },
  { value: 'name-desc', label: '이름순 (하-가)' },
  { value: 'contractAmount-desc', label: '계약금액 높음' },
  { value: 'contractAmount-asc', label: '계약금액 낮음' },
  { value: 'startDate-desc', label: '시작일 최신' },
  { value: 'startDate-asc', label: '시작일 오래된' },
]

export function SortSelect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'
  const currentStatus = searchParams.get('status') || 'all'
  const search = searchParams.get('search') || ''

  const handleSortChange = (value: string) => {
    const [newSortBy, newSortOrder] = value.split('-')
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('sortBy', newSortBy)
    params.set('sortOrder', newSortOrder)
    if (currentStatus !== 'all') params.set('status', currentStatus)
    if (search) params.set('search', search)
    router.push(`/projects?${params.toString()}`)
  }

  const currentValue = `${sortBy}-${sortOrder}`

  return (
    <select
      value={currentValue}
      onChange={(e) => handleSortChange(e.target.value)}
      className="text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
    >
      {sortOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
