import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface CostItem {
  category_id: number;
  category_name: string;
  category_type: string;
  planned: number;
  used_previous: number;
  used_current: number;
  pending: number;
  remaining: number;
  usage_rate: number;
  status: 'overrun' | 'warning' | 'ok';
}

interface Summary {
  total_planned: number;
  total_used_previous: number;
  total_used_current: number;
  total_pending: number;
  total_remaining: number;
  total_usage_rate: number;
  status: 'overrun' | 'warning' | 'ok';
}

interface Project {
  id: number;
  name: string;
  client: string;
  status: string;
}

interface MonthlyReport {
  project: Project;
  year: number;
  month: number;
  items: CostItem[];
  summary: Summary;
}

export const MonthlyCostPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('/api/projects/projects/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects((res.data.results || res.data).filter((p: Project) => p.status !== 'cancelled'));
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadReport = async () => {
    if (!selectedProject) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`/api/cost/budgets/${selectedProject}/monthly_report/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year: selectedYear, month: selectedMonth }
      });
      setReport(res.data);
    } catch (error) {
      console.error('Failed to load report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('/api/cost/budgets/export_excel/', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project_cost_${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.post('/api/cost/budgets/import_excel/', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(`${res.data.message}\n${res.data.errors?.join('\n') || ''}`);
      loadProjects();
    } catch {
      alert('엑셀 가져오기 실패');
    }
  };

  const handleSubmitApproval = async () => {
    if (!selectedProject) return;
    setIsSubmittingApproval(true);
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`/api/cost/budgets/${selectedProject}/create_approval_from_report/`, {
        year: selectedYear,
        month: selectedMonth
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('결재가 상신되었습니다.');
      navigate('/approvals');
    } catch (error) {
      console.error('Failed to submit approval:', error);
      alert('결재 상신 실패');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      ok: { bg: 'bg-green-100', text: 'text-green-800' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      overrun: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const label: Record<string, string> = {
      ok: '정상',
      warning: '주의',
      overrun: '초과'
    };
    const { bg, text } = map[status] || map.ok;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{label[status]}</span>;
  };

  const getRowClass = (status: string) => {
    switch (status) {
      case 'overrun': return 'bg-red-50';
      case 'warning': return 'bg-yellow-50';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← 목록</button>
            <h1 className="text-xl font-bold text-gray-800">월별 원가 추이</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportExcel}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              엑셀 다운로드
            </button>
            <label className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
              엑셀 가져오기
              <input type="file" accept=".xlsx" onChange={handleImportExcel} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트</label>
              <select 
                value={selectedProject || ''} 
                onChange={(e) => setSelectedProject(Number(e.target.value) || null)}
                className="px-3 py-2 border rounded-md min-w-[200px]"
              >
                <option value="">프로젝트 선택</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 border rounded-md"
              >
                {[2023, 2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 border rounded-md"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
            <button 
              onClick={loadReport}
              disabled={!selectedProject || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '로딩 중...' : '조회'}
            </button>
          </div>
        </div>

        {report && (
          <>
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold">{report.project.name}</h2>
                  <p className="text-sm text-gray-500">{report.project.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{report.year}년 {report.month}월 보고서</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">비용항목</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">계획금액</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">기사용</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase bg-blue-50">금회사용</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">대기</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">잔액</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">사용률</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.items.map((item) => (
                    <tr key={item.category_id} className={getRowClass(item.status)}>
                      <td className="px-4 py-3 font-medium">{item.category_name}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(item.planned)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(item.used_previous)}</td>
                      <td className="px-4 py-3 text-right font-medium bg-blue-50">{formatCurrency(item.used_current)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{formatCurrency(item.pending)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${item.remaining < 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(item.remaining)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.usage_rate > 100 ? 'bg-red-500' : item.usage_rate > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                              style={{ width: `${Math.min(item.usage_rate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs">{item.usage_rate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-semibold">
                  <tr>
                    <td className="px-4 py-3">합계</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(report.summary.total_planned)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(report.summary.total_used_previous)}</td>
                    <td className="px-4 py-3 text-right bg-blue-100">{formatCurrency(report.summary.total_used_current)}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(report.summary.total_pending)}</td>
                    <td className={`px-4 py-3 text-right ${report.summary.total_remaining < 0 ? 'text-red-600' : ''}`}>
                      {formatCurrency(report.summary.total_remaining)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-bold ${report.summary.total_usage_rate > 100 ? 'text-red-600' : report.summary.total_usage_rate > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {report.summary.total_usage_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">{getStatusBadge(report.summary.status)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleSubmitApproval}
                disabled={isSubmittingApproval}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {isSubmittingApproval ? '상신 중...' : '결재 상신'}
              </button>
            </div>
          </>
        )}

        {!report && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            프로젝트를 선택하고 조회를 클릭하세요.
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyCostPage;
