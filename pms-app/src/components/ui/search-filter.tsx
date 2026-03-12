'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X, Filter, SortAsc, SortDesc } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchFilterProps {
  placeholder?: string
  searchKey?: string
  className?: string
}

export function SearchInput({ 
  placeholder = '검색...', 
  searchKey = 'search',
  className 
}: SearchFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(searchParams.get(searchKey) || '')

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(searchKey, value)
      params.set('page', '1')
    } else {
      params.delete(searchKey)
    }
    router.push(`?${params.toString()}`)
  }, [value, searchKey, searchParams, router])

  const handleClear = useCallback(() => {
    setValue('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete(searchKey)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }, [searchKey, searchParams, router])

  return (
    <form onSubmit={handleSearch} className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-10"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </form>
  )
}

interface FilterTabsProps {
  tabs: { value: string; label: string; count?: number }[]
  currentValue: string
  paramKey?: string
}

export function FilterTabs({ 
  tabs, 
  currentValue, 
  paramKey = 'status' 
}: FilterTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleClick = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(paramKey, value)
    } else {
      params.delete(paramKey)
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleClick(tab.value)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
            currentValue === tab.value
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-xs',
              currentValue === tab.value ? 'bg-white/20' : 'bg-slate-200'
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

interface SortSelectProps {
  options: { value: string; label: string }[]
  currentSort: string
  currentOrder?: 'asc' | 'desc'
}

export function SortSelect({ 
  options, 
  currentSort, 
  currentOrder = 'desc' 
}: SortSelectProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [sortBy, sortOrder] = e.target.value.split('-')
    const params = new URLSearchParams(searchParams.toString())
    params.set('sortBy', sortBy)
    params.set('sortOrder', sortOrder)
    router.push(`?${params.toString()}`)
  }

  const currentValue = `${currentSort}-${currentOrder}`

  return (
    <div className="flex items-center gap-2">
      <SortAsc className="w-4 h-4 text-slate-400" />
      <select
        value={currentValue}
        onChange={handleChange}
        className="text-sm border rounded-lg px-2 py-2 focus:ring-2 focus:ring-blue-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface DateRangeFilterProps {
  paramKeys?: { start: string; end: string }
}

export function DateRangeFilter({ 
  paramKeys = { start: 'startDate', end: 'endDate' } 
}: DateRangeFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const startDate = searchParams.get(paramKeys.start) || ''
  const endDate = searchParams.get(paramKeys.end) || ''

  const handleChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(paramKeys.start)
    params.delete(paramKeys.end)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const hasValue = startDate || endDate

  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={startDate}
        onChange={(e) => handleChange(paramKeys.start, e.target.value)}
        className="w-36"
        placeholder="시작일"
      />
      <span className="text-slate-400">~</span>
      <Input
        type="date"
        value={endDate}
        onChange={(e) => handleChange(paramKeys.end, e.target.value)}
        className="w-36"
        placeholder="종료일"
      />
      {hasValue && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  className?: string
}

export function Pagination({ 
  currentPage, 
  totalPages,
  className 
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
      >
        이전
      </Button>
      
      {getPageNumbers().map((page, i) => (
        typeof page === 'number' ? (
          <Button
            key={i}
            variant={currentPage === page ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Button>
        ) : (
          <span key={i} className="px-2 text-slate-400">...</span>
        )
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
      >
        다음
      </Button>
    </div>
  )
}

interface FilterPanelProps {
  children: React.ReactNode
  isOpen?: boolean
  onToggle?: () => void
}

export function FilterPanel({ children, isOpen = false, onToggle }: FilterPanelProps) {
  return (
    <div className="space-y-3">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        <Filter className="w-4 h-4" />
        상세 조건
      </button>
      {isOpen && (
        <div className="p-4 bg-slate-50 rounded-lg">
          {children}
        </div>
      )}
    </div>
  )
}

export function ActiveFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const filters = Array.from(searchParams.entries()).filter(
    ([key]) => !['page', 'sortBy', 'sortOrder'].includes(key)
  )

  const handleRemove = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  const handleClearAll = () => {
    const params = new URLSearchParams()
    params.set('page', '1')
    router.push(`?${params.toString()}`)
  }

  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map(([key, value]) => (
        <div 
          key={key}
          className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
        >
          <span>{key}: {value}</span>
          <button onClick={() => handleRemove(key)} className="hover:text-blue-900">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        onClick={handleClearAll}
        className="text-xs text-slate-500 hover:text-slate-700 underline"
      >
        전체 초기화
      </button>
    </div>
  )
}
