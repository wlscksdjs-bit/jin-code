'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9" />
  }

  const cycleTheme = () => {
    if (resolvedTheme === 'light') {
      setTheme('dark')
    } else if (resolvedTheme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    if (resolvedTheme === 'dark') return <Moon className="w-4 h-4" />
    if (resolvedTheme === 'light') return <Sun className="w-4 h-4" />
    return <Monitor className="w-4 h-4" />
  }

  const getLabel = () => {
    if (resolvedTheme === 'dark') return '다크 모드'
    if (resolvedTheme === 'light') return '라이트 모드'
    return '시스템'
  }

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
      title={getLabel()}
    >
      {getIcon()}
      <span className="hidden sm:inline">{getLabel()}</span>
    </button>
  )
}
