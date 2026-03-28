import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectApi } from '../services/api';
import type { Project } from '../types';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
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
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            + 새 프로젝트
          </button>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{project.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{project.client}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{project.start_date} ~ {project.end_date}</td>
                    <td className="px-6 py-4">{getStatusBadge(project.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{project.latest_version_number || '-'}</td>
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
    </div>
  );
};