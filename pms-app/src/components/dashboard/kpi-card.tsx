'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getKPIColor, getVACLabel, getCPIStatus, getSPIStatus } from '@/lib/kpi'
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'

interface KPICardProps {
  cpi: number
  spi: number
  eac?: number
  vac: number
  progress: number
}

export function KPICard({ cpi, spi, eac, vac, progress }: KPICardProps) {
  const cpiStatus = getCPIStatus(cpi)
  const spiStatus = getSPIStatus(spi)

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="w-4 h-4" />
          프로젝트 KPI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPIMetric
            label="CPI"
            value={cpi.toFixed(2)}
            sub={cpiStatus === 'good' ? '양호' : cpiStatus === 'warning' ? '주의' : '위험'}
            color={getKPIColor(cpi, 'cpi')}
            icon={cpi >= 1 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          />
          <KPIMetric
            label="SPI"
            value={spi.toFixed(2)}
            sub={spiStatus === 'good' ? '양호' : spiStatus === 'warning' ? '주의' : '지연'}
            color={getKPIColor(spi, 'spi')}
            icon={spi >= 1 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          />
          <KPIMetric
            label="VAC"
            value={vac >= 0 ? '+' : ''}
            sub={getVACLabel(vac)}
            color={vac >= 0 ? 'text-green-600' : 'text-red-600'}
            icon={vac >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          />
          <KPIMetric
            label="진행률"
            value={`${progress.toFixed(0)}%`}
            sub="전체 완료"
            color="text-blue-600"
            icon={<Activity className="w-4 h-4" />}
          />
        </div>
      </CardContent>
    </Card>
  )
}

function KPIMetric({
  label,
  value,
  sub,
  color,
  icon
}: {
  label: string
  value: string
  sub: string
  color: string
  icon: React.ReactNode
}) {
  return (
    <div className="text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-xl font-bold flex items-center justify-center gap-1 ${color}`}>
        {icon}
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  )
}
