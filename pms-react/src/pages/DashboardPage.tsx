import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectApi, excelApi } from '../services/api';
import { createProjectTemplate, downloadExcel } from '../services/excel';
import type { Project } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<{
    name: string;
    client: string;
    description: string;
    start_date: string;
    end_date: string;
    status: 'waiting' | 'planning' | 'in_progress' | 'completed' | 'cancelled';
  }>({
    name: '',
    client: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'waiting',
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await projectApi.getProjects();
      setProjects(res.results || res);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await projectApi.createProject(formData);
      setShowModal(false);
      setFormData({ name: '', client: '', description: '', start_date: '', end_date: '', status: 'waiting' });
      loadProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleDeleteClick = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteProject(project);
    setDeleteStep(1);
    setDeleteConfirmText('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteProject) return;
    
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    
    if (deleteStep === 2) {
      if (deleteConfirmText !== deleteProject.name) {
        alert('프로젝트 이름이 일치하지 않습니다.');
        return;
      }
      
      setIsDeleting(true);
      try {
        await projectApi.deleteProject(deleteProject.id);
        setDeleteProject(null);
        setDeleteStep(0);
        setDeleteConfirmText('');
        loadProjects();
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('삭제 실패: ' + (error as any)?.response?.data?.error || '알 수 없는 오류');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const closeDeleteModal = () => {
    setDeleteProject(null);
    setDeleteStep(0);
    setDeleteConfirmText('');
  };

  const handleDownloadTemplate = () => {
    try {
      const buffer = createProjectTemplate();
      downloadExcel(buffer, '프로젝트_양식.xlsx');
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
      await excelApi.importProjects(file);
      alert('프로젝트를 성공적으로 가져왔습니다.');
      loadProjects();
    } catch (error) {
      console.error('Failed to import projects:', error);
      alert('가져오기에 실패했습니다.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await excelApi.exportProjects();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '프로젝트_목록.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export projects:', error);
      alert('내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string }> = {
      waiting: { bg: 'bg-gray-100', text: 'text-gray-800' },
      planning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const { bg, text } = statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-800' };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>{status}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">PMS 대시보드</h1>
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <Link to="/users" className="text-sm text-blue-600 hover:text-blue-800">사용자 관리</Link>
            )}
            <Link to="/monthly-cost" className="text-sm text-blue-600 hover:text-blue-800">월별 원가</Link>
            <Link to="/cost-spreadsheet" className="text-sm text-blue-600 hover:text-blue-800">원가 스프레드</Link>
            <Link to="/resources" className="text-sm text-blue-600 hover:text-blue-800">인력 관리</Link>
            <Link to="/approvals" className="text-sm text-blue-600 hover:text-blue-800">전자 결재</Link>
            <span className="text-sm text-gray-600">{user?.first_name}{user?.last_name} ({user?.role})</span>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-800">프로젝트 목록</h2>
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
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              + 새 프로젝트
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">프로젝트가 없습니다.</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">프로젝트명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객사</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">버전</th>
                  {user?.role === 'admin' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>{project.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{project.client}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{project.start_date} ~ {project.end_date}</td>
                    <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{project.latest_version_number || '-'}</td>
                    {user?.role === 'admin' && (
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => handleDeleteClick(project, e)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          삭제
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">새 프로젝트 생성</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트명</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">고객사</label>
                <input type="text" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border rounded-md" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-3 py-2 border rounded-md" required />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-md hover:bg-gray-50">취소</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">생성</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            {deleteStep === 1 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">프로젝트 삭제</h3>
                    <p className="text-sm text-gray-500">삭제 전 최종 확인</p>
                  </div>
                </div>
                
                <div className="mb-4 p-3 bg-red-50 rounded-md">
                  <p className="text-sm text-red-800">
                    <strong>"{deleteProject.name}"</strong> 프로젝트를 삭제하시겠습니까?
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ 이 작업은 되돌릴 수 없습니다.
                  </p>
                </div>
                
                <div className="flex justify-end gap-2">
                  <button onClick={closeDeleteModal} className="px-4 py-2 border rounded-md hover:bg-gray-50">취소</button>
                  <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">삭제 진행</button>
                </div>
              </>
            )}

            {deleteStep === 2 && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">2차 확인</h3>
                    <p className="text-sm text-gray-500">프로젝트 이름 입력</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                   삭제를 확인하려면 프로젝트 이름 <strong>"{deleteProject.name}"</strong>을(를) 아래에 입력하세요.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="프로젝트 이름 입력"
                    className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <button onClick={closeDeleteModal} className="px-4 py-2 border rounded-md hover:bg-gray-50" disabled={isDeleting}>취소</button>
                  <button 
                    onClick={handleDeleteConfirm} 
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    disabled={isDeleting || deleteConfirmText !== deleteProject.name}
                  >
                    {isDeleting ? '삭제 중...' : '삭제 확인'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};