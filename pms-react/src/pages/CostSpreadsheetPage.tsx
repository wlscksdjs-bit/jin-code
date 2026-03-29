import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface CategoryData {
  id: number;
  name: string;
  type: string;
  type_display: string;
}

interface ProjectData {
  project_id: number;
  project_name: string;
  client: string;
  status: string;
  total_planned: number;
  total_used: number;
  total_pending: number;
  total_remaining: number;
}

interface CellData {
  budget_id: number;
  planned: number;
  used: number;
  pending: number;
  remaining: number;
  status: 'overrun' | 'warning' | 'ok';
}

type MatrixRow = Record<string, any>;

export const CostSpreadsheetPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'budget' | 'used' | 'remaining'>('budget');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('/api/cost/budgets/matrix/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCategories(res.data.categories);
      setProjects(res.data.projects);
      setMatrix(res.data.matrix);
    } catch (error) {
      console.error('Failed to load matrix:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(value);
  };

  const getCellClass = (cell: CellData | null) => {
    if (!cell) return 'bg-gray-50 text-gray-400';
    switch (cell.status) {
      case 'overrun': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-white';
    }
  };

  const getProjectHeaderClass = (project: ProjectData) => {
    const remaining = project.total_remaining;
    const planned = project.total_planned;
    if (planned === 0) return 'bg-gray-100';
    const ratio = remaining / planned;
    if (ratio < 0) return 'bg-red-50 border-red-300';
    if (ratio < 0.2) return 'bg-yellow-50 border-yellow-300';
    return 'bg-green-50 border-green-300';
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      planning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
    };
    return map[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const getCategoryTypeBadge = (type: string) => {
    const map: Record<string, string> = {
      labor: 'bg-purple-100 text-purple-800',
      material: 'bg-blue-100 text-blue-800',
      outsource: 'bg-orange-100 text-orange-800',
      equipment: 'bg-cyan-100 text-cyan-800',
      etc: 'bg-gray-100 text-gray-800',
    };
    return map[type] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>;

      const categoryTypeGroups = categories.reduce((acc, cat) => {
    if (!acc[cat.type]) acc[cat.type] = [];
    acc[cat.type].push(cat);
    return acc;
  }, {} as Record<string, CategoryData[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-full mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← 목록</button>
            <h1 className="text-xl font-bold text-gray-800">원가 관리 스프레드시트</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('budget')}
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'budget' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                계획
              </button>
              <button
                onClick={() => setViewMode('used')}
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'used' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                사용
              </button>
              <button
                onClick={() => setViewMode('remaining')}
                className={`px-3 py-1.5 text-sm rounded ${viewMode === 'remaining' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                잔액
              </button>
            </div>
          </div>
        </div>
        
        <div className="border-t px-4 py-2 flex gap-4 text-xs">
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-green-50 border border-green-300 rounded"></span> 양호 (20% 이상)</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-50 border border-yellow-300 rounded"></span> 주의 (20% 미만)</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-50 border border-red-300 rounded"></span> 초과</div>
        </div>
      </header>

      <div className="max-w-full mx-auto px-4 py-4" ref={tableContainerRef}>
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="border bg-gray-100 p-2 text-left min-w-[150px] font-semibold sticky left-0 z-30" rowSpan={2}>
                  비용항목
                </th>
                {projects.map(project => (
                  <th key={project.project_id} className={`border p-2 text-center min-w-[180px] ${getProjectHeaderClass(project)}`} colSpan={3}>
                    <div className="font-semibold text-gray-800 truncate">{project.project_name}</div>
                    <div className="text-xs text-gray-600">{project.client}</div>
                    <span className={`inline-block px-1.5 py-0.5 text-xs rounded mt-1 ${getStatusBadge(project.status).bg} ${getStatusBadge(project.status).text}`}>
                      {project.status === 'planning' ? '계획' : project.status === 'in_progress' ? '진행' : '완료'}
                    </span>
                  </th>
                ))}
                <th className="border bg-gray-200 p-2 text-center min-w-[150px] font-semibold" rowSpan={2}>
                  합계
                </th>
              </tr>
              <tr>
                {projects.map(project => (
                  <React.Fragment key={project.project_id}>
                    <th className="border bg-gray-50 p-1 text-center text-xs font-medium">계획</th>
                    <th className="border bg-gray-50 p-1 text-center text-xs font-medium">사용</th>
                    <th className="border bg-gray-50 p-1 text-center text-xs font-medium">잔액</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(categoryTypeGroups).map(([type, cats]) => (
                <React.Fragment key={type}>
                  <tr>
                    <td className="border bg-gray-100 p-2 font-semibold text-center sticky left-0 z-20" colSpan={projects.length * 3 + 2}>
                      <span className={`px-2 py-1 rounded text-xs ${getCategoryTypeBadge(type)}`}>
                        {cats[0]?.type_display || type}
                      </span>
                    </td>
                  </tr>
                  {cats.map(cat => {
                    const row = matrix.find(r => r.category_id === cat.id);
                    const totals = { planned: 0, used: 0, remaining: 0 };
                    
                    projects.forEach(p => {
                      const cell = row?.[`project_${p.project_id}`] as CellData | null;
                      if (cell) {
                        totals.planned += cell.planned;
                        totals.used += cell.used;
                        totals.remaining += cell.remaining;
                      }
                    });
                    
                    return (
                      <tr key={cat.id} className="hover:bg-gray-50">
                        <td className="border p-2 font-medium sticky left-0 bg-white z-10">
                          {cat.name}
                        </td>
                {projects.map(p => {
                  const cell = row?.[`project_${p.project_id}`] as CellData | null | undefined;
                  return (
                    <React.Fragment key={p.project_id}>
                      <td className={`border p-2 text-right ${getCellClass(cell ?? null)}`}>
                        {cell ? formatCurrency(cell.planned) : '-'}
                      </td>
                      <td className={`border p-2 text-right ${getCellClass(cell ?? null)}`}>
                        {cell ? formatCurrency(cell.used) : '-'}
                      </td>
                      <td className={`border p-2 text-right font-medium ${getCellClass(cell ?? null)}`}>
                        {cell ? formatCurrency(cell.remaining) : '-'}
                      </td>
                    </React.Fragment>
                  );
                })}
                <td className="border bg-gray-50 p-2 text-right font-semibold">
                  {formatCurrency(totals.planned)}
                        </td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
              
              <tr className="bg-gray-100 font-semibold">
                <td className="border p-3 sticky left-0 bg-gray-200">총계</td>
                {projects.map(p => {
                  const totalPlanned = matrix.reduce((sum, row) => {
                    const cell = row[`project_${p.project_id}`] as CellData | null;
                    return sum + (cell?.planned || 0);
                  }, 0);
                  const totalUsed = matrix.reduce((sum, row) => {
                    const cell = row[`project_${p.project_id}`] as CellData | null;
                    return sum + (cell?.used || 0);
                  }, 0);
                  const totalRemaining = matrix.reduce((sum, row) => {
                    const cell = row[`project_${p.project_id}`] as CellData | null;
                    return sum + (cell?.remaining || 0);
                  }, 0);
                  
                  return (
                    <React.Fragment key={p.project_id}>
                      <td className="border p-2 text-right">{formatCurrency(totalPlanned)}</td>
                      <td className="border p-2 text-right">{formatCurrency(totalUsed)}</td>
                      <td className={`border p-2 text-right ${totalRemaining < 0 ? 'text-red-600 font-bold' : totalRemaining < totalPlanned * 0.2 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {formatCurrency(totalRemaining)}
                      </td>
                    </React.Fragment>
                  );
                })}
                <td className="border p-2 text-right">
                  -
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CostSpreadsheetPage;
