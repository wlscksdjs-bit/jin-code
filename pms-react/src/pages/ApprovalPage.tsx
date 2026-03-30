import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { approvalApi, projectApi, excelApi } from '../services/api';
import { createProjectTemplate, downloadExcel } from '../services/excel';
import type { Approval, ApprovalType, Project } from '../types';

export const ApprovalPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [approvalTypes, setApprovalTypes] = useState<ApprovalType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my' | 'pending' | 'create'>('my');
  const [showModal, setShowModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [apps, pends, typs] = await Promise.all([
        approvalApi.getApprovals(),
        user?.can_approve ? approvalApi.getPendingApprovals() : Promise.resolve([]),
        approvalApi.getApprovalTypes(),
      ]);
      setApprovals(apps);
      setPendingApprovals(pends);
      setApprovalTypes(typs);
      
      const allProjects = await projectApi.getProjects();
      setProjects(allProjects.results || allProjects);
    } catch (error) {
      console.error('Failed to load approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApproval = async (data: { project: number; approval_type: number; title: string; content: string; amount?: string; approvers: number[] }) => {
    try {
      await approvalApi.createApproval(data);
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to create approval:', error);
    }
  };

  const handleApprove = async (id: number, comment?: string) => {
    try {
      await approvalApi.approveApproval(id, comment);
      loadData();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleReject = async (id: number, comment: string) => {
    try {
      await approvalApi.rejectApproval(id, comment);
      loadData();
    } catch (error) {
      console.error('Failed to reject:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      approved: { bg: 'bg-green-100', text: 'text-green-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
    };
    const s = map[status] || map.draft;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{status}</span>;
  };

  const formatCurrency = (value: string | null | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('ko-KR').format(Number(value)) + '원';
  };

  const handleDownloadTemplate = () => {
    try {
      const buffer = createProjectTemplate();
      downloadExcel(buffer, '결재_양식.xlsx');
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
      await excelApi.importApprovals(file);
      alert('결재 데이터를 성공적으로 가져왔습니다.');
      loadData();
    } catch (error) {
      console.error('Failed to import approvals:', error);
      alert('가져오기에 실패했습니다.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await excelApi.exportApprovals();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '결재_목록.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export approvals:', error);
      alert('내보내기에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← 목록</button>
            <h1 className="text-xl font-bold text-gray-800">전자 결재</h1>
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
              + 새 결재
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-md ${activeTab === 'my' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            내 결재 ({approvals.length})
          </button>
          {user?.can_approve && (
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-md ${activeTab === 'pending' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
            >
              결재 대기 {pendingApprovals.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded">{pendingApprovals.length}</span>}
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className={`px-4 py-2 rounded-md ${activeTab === 'create' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            결재 상신
          </button>
        </div>

        {activeTab === 'my' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">결재 유형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">프로젝트</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">금액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">현재 결재자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {approvals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedApproval(approval)}>
                    <td className="px-6 py-4 text-sm">{approval.approval_type_name}</td>
                    <td className="px-6 py-4 text-sm font-medium">{approval.title}</td>
                    <td className="px-6 py-4 text-sm">{approval.project_name}</td>
                    <td className="px-6 py-4 text-sm text-right">{formatCurrency(approval.amount)}</td>
                    <td className="px-6 py-4">{getStatusBadge(approval.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{approval.current_approver_name || '-'}</td>
                  </tr>
                ))}
                {approvals.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">결재 목록이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">결재 유형</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상신자</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">금액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingApprovals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="px-6 py-4 text-sm">{approval.approval_type_name}</td>
                    <td className="px-6 py-4 text-sm font-medium">{approval.title}</td>
                    <td className="px-6 py-4 text-sm">{approval.requester_name}</td>
                    <td className="px-6 py-4 text-sm text-right">{formatCurrency(approval.amount)}</td>
                    <td className="px-6 py-4">{getStatusBadge(approval.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleApprove(approval.id)} className="text-green-600 hover:text-green-800 text-sm font-medium">승인</button>
                        <button onClick={() => { const comment = prompt('반려 사유:'); if (comment) handleReject(approval.id, comment); }} className="text-red-600 hover:text-red-800 text-sm font-medium">반려</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pendingApprovals.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">결재 대기 목록이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <ApprovalModal projects={projects} approvalTypes={approvalTypes} users={[]} onClose={() => setShowModal(false)} onSubmit={handleCreateApproval} />
      )}

      {selectedApproval && (
        <ApprovalDetailModal approval={selectedApproval} onClose={() => setSelectedApproval(null)} />
      )}
    </div>
  );
};

const ApprovalModal: React.FC<{
  projects: Project[];
  approvalTypes: ApprovalType[];
  users: { id: number; name: string }[];
  onClose: () => void;
  onSubmit: (data: { project: number; approval_type: number; title: string; content: string; amount?: string; approvers: number[] }) => void;
}> = ({ projects, approvalTypes, onClose, onSubmit }) => {
  const [project, setProject] = useState('');
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      project: Number(project),
      approval_type: Number(type),
      title,
      content,
      amount: amount || undefined,
      approvers: [],
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">결재 상신</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트</label>
            <select value={project} onChange={(e) => setProject(e.target.value)} className="w-full px-3 py-2 border rounded-md" required>
              <option value="">선택</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">결재 유형</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2 border rounded-md" required>
              <option value="">선택</option>
              {approvalTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">금액 (선택)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">결재 내용</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full px-3 py-2 border rounded-md" rows={4} required />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">취소</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">상신</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApprovalDetailModal: React.FC<{
  approval: Approval;
  onClose: () => void;
}> = ({ approval, onClose }) => {
  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      approved: { bg: 'bg-green-100', text: 'text-green-800' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    return map[status] || map.draft;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">{approval.title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">결재 유형:</span></div>
            <div>{approval.approval_type_name}</div>
            <div><span className="text-gray-500">프로젝트:</span></div>
            <div>{approval.project_name}</div>
            <div><span className="text-gray-500">상신자:</span></div>
            <div>{approval.requester_name}</div>
            <div><span className="text-gray-500">상태:</span></div>
            <div><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(approval.status).bg} ${getStatusBadge(approval.status).text}`}>{approval.status}</span></div>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">결재 내용</h4>
          <div className="p-4 border rounded-md whitespace-pre-wrap text-sm">{approval.content}</div>
        </div>

        {approval.steps && approval.steps.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">결재선</h4>
            <div className="space-y-2">
              {approval.steps.map((step, idx) => (
                <div key={step.id} className={`flex items-center gap-2 p-2 rounded ${step.status === 'approved' ? 'bg-green-50' : step.status === 'rejected' ? 'bg-red-50' : 'bg-gray-50'}`}>
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">{idx + 1}</span>
                  <span className="flex-1">{step.approver_name}</span>
                  <span className={`text-xs ${step.status === 'approved' ? 'text-green-600' : step.status === 'rejected' ? 'text-red-600' : 'text-gray-500'}`}>{step.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {approval.actions && approval.actions.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium mb-2">결재 이력</h4>
            <div className="space-y-2">
              {approval.actions.map((action) => (
                <div key={action.id} className="p-2 bg-gray-50 rounded text-sm">
                  <span className="font-medium">{action.approver_name}</span>
                  <span className="ml-2 text-gray-500">→ {action.action}</span>
                  {action.comment && <div className="text-gray-600 mt-1">{action.comment}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">닫기</button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalPage;