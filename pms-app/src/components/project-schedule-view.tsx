'use client'

import { useState } from 'react'
import { GanttChart } from '@/components/gantt-chart'
import { Button } from '@/components/ui/button'
import { Plus, Flag } from 'lucide-react'

interface WbsItem {
  id: string
  code: string
  name: string
  startDate: Date | null
  endDate: Date | null
  progress: number
  status: string
  phaseType: string | null
  isMilestone?: boolean
  milestoneType?: string | null
  componentOrders?: any[]
}

interface ProjectScheduleViewProps {
  wbsItems: WbsItem[]
  projectStartDate: Date | null
  projectEndDate: Date | null
  onAddMilestone?: () => void
}

const MILESTONE_TYPES = [
  { value: 'PROJECT_START', label: '프로젝트 시작' },
  { value: 'PROJECT_END', label: '프로젝트 완료' },
  { value: 'DESIGN_COMPLETE', label: '설계 완료' },
  { value: 'CONSTRUCTION_START', label: '시공 시작' },
  { value: 'CONSTRUCTION_COMPLETE', label: '시공 완료' },
  { value: 'COMMISSIONING', label: '시운전' },
  { value: 'HANDOVER', label: '인수인계' },
]

export function ProjectScheduleView({ wbsItems, projectStartDate, projectEndDate, onAddMilestone }: ProjectScheduleViewProps) {
  const [viewMode, setViewMode] = useState<'list' | 'gantt'>('gantt')
  const [showMilestonesOnly, setShowMilestonesOnly] = useState(false)

  const tasks = wbsItems.map(wbs => ({
    id: wbs.id,
    name: wbs.name,
    startDate: wbs.startDate ? new Date(wbs.startDate) : null,
    endDate: wbs.endDate ? new Date(wbs.endDate) : null,
    progress: wbs.progress,
    status: wbs.status,
    phaseType: wbs.phaseType,
    isMilestone: wbs.isMilestone,
    milestoneType: wbs.milestoneType
  }))

  const filteredItems = showMilestonesOnly 
    ? wbsItems.filter(w => w.isMilestone)
    : wbsItems

  const milestones = wbsItems.filter(w => w.isMilestone)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            목록
          </button>
          <button
            onClick={() => setViewMode('gantt')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'gantt' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            간트차트
          </button>
        </div>
        
        <div className="flex gap-2">
          {milestones.length > 0 && (
            <button
              onClick={() => setShowMilestonesOnly(!showMilestonesOnly)}
              className={`px-3 py-1 text-sm rounded-md transition-colors flex items-center gap-1 ${
                showMilestonesOnly 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Flag className="w-3 h-3" />
              마일스톤 ({milestones.length})
            </button>
          )}
          {onAddMilestone && (
            <Button size="sm" onClick={onAddMilestone}>
              <Plus className="w-4 h-4 mr-1" />
              마일스톤 추가
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'gantt' ? (
        <GanttChart 
          tasks={filteredItems} 
          startDate={projectStartDate ? new Date(projectStartDate) : undefined}
          endDate={projectEndDate ? new Date(projectEndDate) : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredItems.map((wbs) => (
            <div key={wbs.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  {wbs.isMilestone && <Flag className="w-4 h-4 text-yellow-500" />}
                  <div className="text-sm font-medium text-slate-500">{wbs.code}</div>
                  <span className="font-medium">{wbs.name}</span>
                  {wbs.phaseType && !wbs.isMilestone && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      wbs.phaseType === 'DESIGN' ? 'bg-purple-100 text-purple-700' :
                      wbs.phaseType === 'CONSTRUCTION' ? 'bg-green-100 text-green-700' :
                      wbs.phaseType === 'PROCUREMENT' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {wbs.phaseType}
                    </span>
                  )}
                  {wbs.isMilestone && wbs.milestoneType && (
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                      {wbs.milestoneType}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    wbs.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    wbs.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    wbs.status === 'DELAYED' ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {wbs.status}
                  </span>
                  <span className="text-sm font-bold">{wbs.progress}%</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      wbs.status === 'COMPLETED' ? 'bg-green-500' :
                      wbs.status === 'DELAYED' ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${wbs.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              {showMilestonesOnly ? '마일스톤이 없습니다' : '등록된 공정이 없습니다'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
