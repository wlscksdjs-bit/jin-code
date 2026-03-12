'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { addProjectMember, updateMemberAllocation, removeProjectMember } from '@/app/actions/resource-allocation'
import { Plus, Minus, AlertTriangle, Trash2, User as UserIcon, GripVertical, CheckCircle, Clock, Briefcase } from 'lucide-react'

interface User {
  id: string
  name: string | null
  department: string | null
}

interface Member {
  id: string
  role: string
  allocation: number
  user: User
}

interface ResourceAllocationProps {
  projectId: string
  members: Member[]
  availableUsers: User[]
  onUpdate?: () => void
}

const ALLOCATION_OPTIONS = [
  { value: 1.0, label: '100%' },
  { value: 0.5, label: '50%' },
  { value: 0.33, label: '33%' },
  { value: 0.25, label: '25%' },
]

const ROLE_LABELS: Record<string, string> = {
  PM: 'PM',
  LEADER: '리더',
  MEMBER: '팀원',
}

export function ResourceAllocation({ projectId, members, availableUsers, onUpdate }: ResourceAllocationProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [allocation, setAllocation] = useState(1.0)
  const [selectedRole, setSelectedRole] = useState('MEMBER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [draggedUser, setDraggedUser] = useState<User | null>(null)
  const [dropTargetActive, setDropTargetActive] = useState(false)

  const handleAddMember = async () => {
    if (!selectedUserId) return
    setLoading(true)
    setError('')

    const result = await addProjectMember(projectId, selectedUserId, selectedRole, allocation)
    
    if (result.error) {
      setError(result.error)
    } else {
      setShowAddForm(false)
      setSelectedUserId('')
      setAllocation(1.0)
      setSelectedRole('MEMBER')
      onUpdate?.()
    }
    setLoading(false)
  }

  const handleRemoveMember = async (memberId: string) => {
    setLoading(true)
    await removeProjectMember(projectId, memberId)
    onUpdate?.()
    setLoading(false)
  }

  const handleAllocationChange = async (memberId: string, newAllocation: number) => {
    setLoading(true)
    const result = await updateMemberAllocation(projectId, memberId, newAllocation)
    
    if (result.error) {
      setError(result.error)
    } else {
      onUpdate?.()
    }
    setLoading(false)
  }

  const handleDragStart = (e: React.DragEvent, user: User) => {
    setDraggedUser(user)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', user.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetActive(true)
  }

  const handleDragLeave = () => {
    setDropTargetActive(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDropTargetActive(false)
    
    const userId = e.dataTransfer.getData('text/plain')
    if (!userId) return
    
    const user = availableUsers.find(u => u.id === userId)
    if (user) {
      setSelectedUserId(user.id)
      setShowAddForm(true)
    }
    setDraggedUser(null)
  }

  const totalAllocation = members.reduce((sum, m) => sum + m.allocation, 0)
  const availableUsersForProject = availableUsers.filter(
    user => !members.some(m => m.user.id === user.id)
  )

  const getAllocationColor = (value: number) => {
    if (value >= 1.0) return 'bg-red-100 text-red-700 border-red-300'
    if (value >= 0.5) return 'bg-blue-100 text-blue-700 border-blue-300'
    return 'bg-green-100 text-green-700 border-green-300'
  }

  return (
    <Card className={dropTargetActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <UserIcon className="w-5 h-5" />
          인력 배정
        </CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-sm">
            <Briefcase className="w-4 h-4 text-slate-400" />
            <span className={`font-medium ${
              totalAllocation > 1.0 ? 'text-red-600' :
              totalAllocation > 0.8 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {Math.round(totalAllocation * 100)}%
            </span>
          </div>
          <Button size="sm" onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="mb-4 p-4 border rounded-lg bg-slate-50">
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium text-slate-600">인력 선택</label>
                <select 
                  className="w-full mt-1 p-2 border rounded-md"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">인력 선택...</option>
                  {availableUsersForProject.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.department || '부서 미지정'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-slate-600">역할</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="PM">PM</option>
                    <option value="LEADER">리더</option>
                    <option value="MEMBER">팀원</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">투입 비율</label>
                  <select 
                    className="w-full mt-1 p-2 border rounded-md"
                    value={allocation}
                    onChange={(e) => setAllocation(parseFloat(e.target.value))}
                  >
                    {ALLOCATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddMember} disabled={loading || !selectedUserId}>
                  추가
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  취소
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {members.map(member => (
            <div 
              key={member.id} 
              className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                member.allocation >= 1.0 ? 'bg-red-50 border-red-200' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                  {member.user.name?.[0] || '?'}
                </div>
                <div>
                  <div className="font-medium">{member.user.name}</div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{member.user.department || '부서 미지정'}</span>
                    <span className="px-1.5 py-0.5 bg-slate-100 rounded">{ROLE_LABELS[member.role] || member.role}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {ALLOCATION_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleAllocationChange(member.id, option.value)}
                      disabled={loading}
                      className={`px-2 py-1 text-xs rounded-md border transition-colors ${
                        Math.abs(member.allocation - option.value) < 0.01
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {members.length === 0 && !showAddForm && (
            <div 
              className={`text-center py-8 border-2 border-dashed rounded-lg transition-colors ${
                dropTargetActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {dropTargetActive ? (
                <>
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-blue-600 font-medium">인력을 여기에 놓으세요</p>
                </>
              ) : (
                <>
                  <UserIcon className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p>인력을 드래그하여 추가하거나</p>
                  <Button 
                    variant="link" 
                    onClick={() => setShowAddForm(true)}
                    className="mt-2"
                  >
                    버튼으로 추가
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {availableUsersForProject.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-slate-500 mb-2">사용 가능한 인력 (드래그하여 추가)</p>
            <div className="flex flex-wrap gap-2">
              {availableUsersForProject.map(user => (
                <div
                  key={user.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, user)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-grab hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <GripVertical className="w-3 h-3 text-slate-400" />
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
                    {user.name?.[0] || '?'}
                  </div>
                  <span className="text-sm">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
