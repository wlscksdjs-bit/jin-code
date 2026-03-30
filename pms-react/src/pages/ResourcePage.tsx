import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { resourceApi, projectApi, excelApi } from '../services/api';
import { createResourceTemplate, downloadExcel } from '../services/excel';
import type { ResourceAllocation, ResourceConflict, Project, User, Vendor } from '../types';

export const ResourcePage: React.FC = () => {
  const navigate = useNavigate();
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([]);
  const [conflicts, setConflicts] = useState<ResourceConflict[]>([]);
  const [heatmap, setHeatmap] = useState<{ id: number; name: string; type: 'internal' | 'external'; total_rate: number; projects: { project_name: string; rate: number }[] }[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'heatmap' | 'conflicts'>('list');
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  const loadData = async () => {
    try {
      const [allocs, confs, projs, usersData, vendorsData] = await Promise.all([
        resourceApi.getAllocations(),
        resourceApi.getConflicts(),
        projectApi.getProjects(),
        fetchUsers(),
        fetchVendors(),
      ]);
      setAllocations(allocs);
      setConflicts(confs);
      setProjects((projs.results || projs).filter((p: Project) => p.status !== 'completed' && p.status !== 'cancelled'));
      setUsers(usersData);
      setVendors(vendorsData);
      
      const heatmapData = await resourceApi.getHeatmap(selectedYear, selectedMonth);
      setHeatmap(heatmapData);
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (): Promise<User[]> => {
    const res = await fetch('/api/accounts/users/', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });
    const data = await res.json();
    return data.results || data;
  };

  const fetchVendors = async (): Promise<Vendor[]> => {
    const res = await fetch('/api/cost/vendors/', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    });
    const data = await res.json();
    return data.results || data;
  };

  const handleCreateAllocation = async (data: { project: number; user?: number; vendor?: number; role: string; start_date: string; end_date: string; allocation_rate: number; description: string }) => {
    try {
      await resourceApi.createAllocation(data);
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to create allocation:', error);
    }
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  const handleDownloadTemplate = () => {
    try {
      const buffer = createResourceTemplate();
      downloadExcel(buffer, '인력_양식.xlsx');
    } catch (error) {
      console.error('Failed to download template:', error);
      alert('양식 다운로드에 실패했습니다.');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await excelApi.importResources(file);
      alert('인력 데이터를 성공적으로 가져왔습니다.');
      loadData();
    } catch (error) {
      console.error('Failed to import resources:', error);
      alert('가져오기에 실패했습니다.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await excelApi.exportResources();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '인력_목록.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export resources:', error);
      alert('내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      pm: { bg: 'bg-purple-100', text: 'text-purple-800' },
      designer: { bg: 'bg-blue-100', text: 'text-blue-800' },
      constructor: { bg: 'bg-green-100', text: 'text-green-800' },
      engineer: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      assistant: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };
    return map[role] || map.assistant;
  };

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← 목록</button>
            <h1 className="text-xl font-bold text-gray-800">인력 관리</h1>
          </div>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              양식 다운로드
            </button>
            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {isImporting ? '가져오는 중...' : '가져오기'}
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              {isExporting ? '내보내는 중...' : '내보내기'}
            </button>
            <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              + 인력 배치
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            배치 목록
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-4 py-2 rounded-md ${activeTab === 'heatmap' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            인력 히트맵
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-4 py-2 rounded-md ${activeTab === 'conflicts' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            충돌 목록 {conflicts.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded">{conflicts.length}</span>}
          </button>
        </div>

        {activeTab === 'list' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">프로젝트</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기간</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">투입률</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium">{alloc.project_name}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{alloc.assigned_name}</span>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${alloc.assigned_type === 'external' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                          {alloc.assigned_type === 'external' ? '외주' : '사원'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(alloc.role).bg} ${getRoleBadge(alloc.role).text}`}>
                        {alloc.role_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(alloc.start_date)} ~ {formatDate(alloc.end_date)}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      <span className={alloc.allocation_rate > 100 ? 'text-red-600' : alloc.allocation_rate > 80 ? 'text-yellow-600' : 'text-green-600'}>
                        {alloc.allocation_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {allocations.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">배치된 인력이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="space-y-4">
            <div className="flex gap-2 items-center">
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="px-3 py-2 border rounded-md">
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
              </select>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="px-3 py-2 border rounded-md">
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}월</option>)}
              </select>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당자</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">총 투입률</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">프로젝트별 투입</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {heatmap.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span className={`px-1.5 py-0.5 text-xs rounded ${item.type === 'external' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                            {item.type === 'external' ? '외주' : '사원'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={`font-bold ${item.total_rate > 100 ? 'text-red-600' : item.total_rate > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {item.total_rate}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {item.projects.map((proj, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {proj.project_name}: {proj.rate}%
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {heatmap.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">데이터가 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'conflicts' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기간</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">총 투입률</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">프로젝트</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {conflicts.map((conflict) => (
                  <tr key={conflict.id} className="bg-red-50">
                    <td className="px-6 py-4 text-sm font-medium text-red-800">{conflict.user_name}</td>
                    <td className="px-6 py-4 text-sm text-red-600">{formatDate(conflict.start_date)} ~ {formatDate(conflict.end_date)}</td>
                    <td className="px-6 py-4 text-sm text-right font-bold text-red-600">{conflict.total_allocation_rate}%</td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {conflict.allocations?.map(a => a.project_name).join(', ')}
                    </td>
                  </tr>
                ))}
                {conflicts.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">충돌이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AllocationModal projects={projects} users={users} vendors={vendors} onClose={() => setShowModal(false)} onSubmit={handleCreateAllocation} />
      )}
    </div>
  );
};

const AllocationModal: React.FC<{
  projects: Project[];
  users: User[];
  vendors: Vendor[];
  onClose: () => void;
  onSubmit: (data: { project: number; user?: number; vendor?: number; role: string; start_date: string; end_date: string; allocation_rate: number; description: string }) => void;
}> = ({ projects, users, vendors, onClose, onSubmit }) => {
  const [project, setProject] = useState('');
  const [user, setUser] = useState('');
  const [vendor, setVendor] = useState('');
  const [assignedType, setAssignedType] = useState<'internal' | 'external'>('internal');
  const [role, setRole] = useState('pm');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [allocationRate, setAllocationRate] = useState('100');
  const [description, setDescription] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  useEffect(() => {
    if (assignedType === 'internal' && user && startDate && endDate && Number(allocationRate) > 0) {
      checkConflicts();
    } else {
      setConflictWarning(null);
    }
  }, [user, startDate, endDate, allocationRate, assignedType]);

  const checkConflicts = async () => {
    try {
      const result = await fetch(`/api/resources/check_conflicts/?user_id=${user}&start_date=${startDate}&end_date=${endDate}&allocation_rate=${allocationRate}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      const data = await result.json();
      if (data.has_conflict) {
        setConflictWarning(data.message);
      } else {
        setConflictWarning(null);
      }
    } catch {
      // silently ignore
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user && !vendor) {
      alert('직원 또는 협력사를 최소 하나 이상 선택해주세요.');
      return;
    }
    onSubmit({
      project: Number(project),
      user: assignedType === 'internal' && user ? Number(user) : undefined,
      vendor: assignedType === 'external' && vendor ? Number(vendor) : undefined,
      role,
      start_date: startDate,
      end_date: endDate,
      allocation_rate: Number(allocationRate),
      description,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">인력 배치</h3>
        {conflictWarning && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            ⚠️ {conflictWarning}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트</label>
            <select value={project} onChange={(e) => setProject(e.target.value)} className="w-full px-3 py-2 border rounded-md" required>
              <option value="">선택</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">배정 유형</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="assignedType" checked={assignedType === 'internal'} onChange={() => setAssignedType('internal')} />
                <span className="text-sm">직원</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="assignedType" checked={assignedType === 'external'} onChange={() => setAssignedType('external')} />
                <span className="text-sm">협력사</span>
              </label>
            </div>
          </div>
          {assignedType === 'internal' ? (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">담당자 (직원)</label>
            <select value={user} onChange={(e) => setUser(e.target.value)} className="w-full px-3 py-2 border rounded-md">
              <option value="">선택</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
            </select>
          </div>
          ) : (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">협력사</label>
            <select value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full px-3 py-2 border rounded-md">
              <option value="">선택</option>
              {vendors.filter(v => v.is_active).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 border rounded-md">
              <option value="pm">PM</option>
              <option value="designer">설계담당</option>
              <option value="constructor">시공담당</option>
              <option value="engineer">엔지니어</option>
              <option value="assistant">보조</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">투입률 (%)</label>
            <input type="number" value={allocationRate} onChange={(e) => setAllocationRate(e.target.value)} className="w-full px-3 py-2 border rounded-md" min="1" max="200" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md" rows={2} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">취소</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">저장</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourcePage;