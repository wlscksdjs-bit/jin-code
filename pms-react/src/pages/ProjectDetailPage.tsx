import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectApi, costApi } from '../services/api';
import type { Project, Budget, Expense, CostCategory, Vendor, BidSimulation } from '../types';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'budget' | 'expense' | 'simulation'>('budget');
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showSimulationModal, setShowSimulationModal] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const projectId = Number(id);
      const [proj, cats, vends] = await Promise.all([
        projectApi.getProject(projectId),
        costApi.getCategories(),
        costApi.getVendors(),
      ]);
      setProject(proj);
      setCategories(cats.filter((c: CostCategory) => c.is_active));
      setVendors(vends.filter((v: Vendor) => v.is_active));
      
      const [buds, exps] = await Promise.all([
        costApi.getBudgets(projectId),
        costApi.getExpenses(projectId),
      ]);
      setBudgets(buds);
      setExpenses(exps);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBudget = async (data: { category: number; planned_amount: string; description: string }) => {
    try {
      await costApi.createBudget({
        project: Number(id),
        ...data,
      });
      setShowBudgetModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to create budget:', error);
    }
  };

  const handleCreateExpense = async (data: { budget: number; vendor?: number; amount: string; description: string; expense_date: string }) => {
    try {
      await costApi.createExpense(data);
      setShowExpenseModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to create expense:', error);
    }
  };

  const handleApproveExpense = async (expenseId: number) => {
    try {
      await costApi.approveExpense(expenseId);
      loadData();
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleCreateVersion = async (data: { estimated_cost: string; target_price: string; target_profit_rate: string; notes: string }) => {
    try {
      await projectApi.createVersion(Number(id), data);
      setShowSimulationModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to create version:', error);
    }
  };

  const handleSimulateBid = async (estimatedCost: string, targetProfitRate: string): Promise<BidSimulation> => {
    return await projectApi.simulateBid({ estimated_cost: estimatedCost, target_profit_rate: targetProfitRate });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      waiting: { bg: 'bg-gray-100', text: 'text-gray-800' },
      planning: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    const s = map[status] || map.waiting;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>{status}</span>;
  };

  const formatCurrency = (value: string) => {
    const num = Number(value);
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const getVarianceClass = (status: string) => {
    if (status === 'overrun') return 'text-red-600 bg-red-50';
    if (status === 'savings') return 'text-blue-600 bg-blue-50';
    return 'text-gray-600';
  };

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>;
  if (!project) return <div className="p-8 text-center">프로젝트를 찾을 수 없습니다.</div>;

  const totalPlanned = budgets.reduce((sum, b) => sum + Number(b.planned_amount), 0);
  const totalUsed = budgets.reduce((sum, b) => sum + Number(b.used_amount), 0);
  const totalRemaining = budgets.reduce((sum, b) => sum + Number(b.remaining_amount), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700">← 목록</button>
            <h1 className="text-xl font-bold text-gray-800">{project.name}</h1>
            {getStatusBadge(project.status)}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              고객사: {project.client} | 기간: {project.start_date} ~ {project.end_date}
            </div>
            <button 
              onClick={() => navigate(`/projects/${id}/schedule`)}
              className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
            >
              일정 관리
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-md ${activeTab === 'info' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            프로젝트 정보
          </button>
          <button
            onClick={() => setActiveTab('budget')}
            className={`px-4 py-2 rounded-md ${activeTab === 'budget' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            예산 관리
          </button>
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-4 py-2 rounded-md ${activeTab === 'expense' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            비용 등록
          </button>
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-4 py-2 rounded-md ${activeTab === 'simulation' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border'}`}
          >
            입찰 시뮬레이션
          </button>
        </div>

        {activeTab === 'info' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">프로젝트 상세 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-gray-500">프로젝트명:</span> {project.name}</div>
              <div><span className="text-gray-500">고객사:</span> {project.client}</div>
              <div><span className="text-gray-500">시작일:</span> {project.start_date}</div>
              <div><span className="text-gray-500">종료일:</span> {project.end_date}</div>
              <div><span className="text-gray-500">상태:</span> {getStatusBadge(project.status)}</div>
              <div><span className="text-gray-500">최신 버전:</span> {project.latest_version_number || '-'}</div>
              <div className="col-span-2"><span className="text-gray-500">설명:</span> {project.description || '-'}</div>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
              <div className="flex gap-8">
                <div><span className="text-gray-500">총 예산:</span> <span className="font-bold">{formatCurrency(String(totalPlanned))}원</span></div>
                <div><span className="text-gray-500">사용:</span> <span className="font-bold text-orange-600">{formatCurrency(String(totalUsed))}원</span></div>
                <div><span className="text-gray-500">잔여:</span> <span className="font-bold text-green-600">{formatCurrency(String(totalRemaining))}원</span></div>
              </div>
              <button onClick={() => setShowBudgetModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                + 예산 편성
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">계획</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">사용</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">잔여</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">차이</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {budgets.map((budget) => (
                    <tr key={budget.id} className={getVarianceClass(budget.variance_status)}>
                      <td className="px-6 py-4 text-sm font-medium">{budget.category_name}</td>
                      <td className="px-6 py-4 text-sm text-right">{formatCurrency(budget.planned_amount)}</td>
                      <td className="px-6 py-4 text-sm text-right">{formatCurrency(budget.used_amount)}</td>
                      <td className="px-6 py-4 text-sm text-right">{formatCurrency(budget.remaining_amount)}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">
                        {Number(budget.variance) > 0 ? '+' : ''}{formatCurrency(budget.variance)}
                      </td>
                    </tr>
                  ))}
                  {budgets.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">예산이 없습니다. 예산을 편성해 주세요.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'expense' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => setShowExpenseModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                + 비용 등록
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">카테고리</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">세부 내용</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">금액</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">일자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 text-sm">{expense.category_name}</td>
                      <td className="px-6 py-4 text-sm">{expense.description}</td>
                      <td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(expense.amount)}</td>
                      <td className="px-6 py-4 text-sm">{expense.expense_date}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                          expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          expense.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>{expense.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        {expense.status === 'pending' && user?.can_approve && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApproveExpense(expense.id)} className="text-green-600 hover:text-green-800 text-sm">승인</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">등록된 비용이 없습니다.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold">입찰가 시뮬레이션</h2>
                <button onClick={() => setShowSimulationModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  + 새 시뮬레이션
                </button>
              </div>

              {project.versions && project.versions.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">버전</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">예상원가</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">목표입찰가</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">목표수익률</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">제안가</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">생성일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {project.versions.map((version) => (
                        <tr key={version.id}>
                          <td className="px-6 py-4 text-sm font-medium">{version.version_number}</td>
                          <td className="px-6 py-4 text-sm text-right">{formatCurrency(version.estimated_cost)}</td>
                          <td className="px-6 py-4 text-sm text-right">{formatCurrency(version.target_price)}</td>
                          <td className="px-6 py-4 text-sm text-right">{version.target_profit_rate}%</td>
                          <td className="px-6 py-4 text-sm text-right font-medium">{formatCurrency(version.proposed_price || '0')}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{version.created_at?.split('T')[0]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {(!project.versions || project.versions.length === 0) && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  등록된 버전이 없습니다. 시뮬레이션을 통해 입찰가를 계산하세요.
                </div>
              )}
            </div>
          )}
        </div>

      {showBudgetModal && (
        <BudgetModal categories={categories} onClose={() => setShowBudgetModal(false)} onSubmit={handleCreateBudget} />
      )}

      {showExpenseModal && (
        <ExpenseModal budgets={budgets} vendors={vendors} onClose={() => setShowExpenseModal(false)} onSubmit={handleCreateExpense} />
      )}

      {showSimulationModal && (
        <SimulationModal onClose={() => setShowSimulationModal(false)} onSubmit={handleCreateVersion} onSimulate={handleSimulateBid} />
      )}
    </div>
  );
};

const BudgetModal: React.FC<{
  categories: CostCategory[];
  onClose: () => void;
  onSubmit: (data: { category: number; planned_amount: string; description: string }) => void;
}> = ({ categories, onClose, onSubmit }) => {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ category: Number(category), planned_amount: amount, description });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">예산 편성</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border rounded-md" required>
              <option value="">선택</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">계획 금액</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
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

const ExpenseModal: React.FC<{
  budgets: Budget[];
  vendors: Vendor[];
  onClose: () => void;
  onSubmit: (data: { budget: number; vendor?: number; amount: string; description: string; expense_date: string }) => void;
}> = ({ budgets, vendors, onClose, onSubmit }) => {
  const [budget, setBudget] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      budget: Number(budget),
      vendor: vendor ? Number(vendor) : undefined,
      amount,
      description,
      expense_date: expenseDate,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">비용 등록</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">예산 항목</label>
            <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full px-3 py-2 border rounded-md" required>
              <option value="">선택</option>
              {budgets.map((b) => <option key={b.id} value={b.id}>{b.category_name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">협력사 (선택)</label>
            <select value={vendor} onChange={(e) => setVendor(e.target.value)} className="w-full px-3 py-2 border rounded-md">
              <option value="">선택</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">금액</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">지출일</label>
            <input type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">세부 내용</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md" rows={2} required />
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

const SimulationModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: { estimated_cost: string; target_price: string; target_profit_rate: string; notes: string }) => void;
  onSimulate: (estimatedCost: string, targetProfitRate: string) => Promise<BidSimulation>;
}> = ({ onClose, onSubmit, onSimulate }) => {
  const [estimatedCost, setEstimatedCost] = useState('');
  const [targetProfitRate, setTargetProfitRate] = useState('10');
  const [targetPrice, setTargetPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [simulation, setSimulation] = useState<BidSimulation | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    if (!estimatedCost) return;
    setIsSimulating(true);
    try {
      const result = await onSimulate(estimatedCost, targetProfitRate);
      setSimulation(result);
      setTargetPrice(result.suggested_price);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      estimated_cost: estimatedCost,
      target_price: targetPrice,
      target_profit_rate: targetProfitRate,
      notes,
    });
  };

  const formatCurrency = (value: string) => new Intl.NumberFormat('ko-KR').format(Number(value));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h3 className="text-lg font-semibold mb-4">입찰가 시뮬레이션</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">예상원가 (원)</label>
          <input 
            type="number" 
            value={estimatedCost} 
            onChange={(e) => { setEstimatedCost(e.target.value); setSimulation(null); }} 
            className="w-full px-3 py-2 border rounded-md" 
            placeholder="예: 10000000"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">목표수익률 (%)</label>
          <input 
            type="number" 
            value={targetProfitRate} 
            onChange={(e) => { setTargetProfitRate(e.target.value); setSimulation(null); }} 
            className="w-full px-3 py-2 border rounded-md" 
            placeholder="예: 10"
          />
        </div>

        <button 
          onClick={handleSimulate} 
          disabled={!estimatedCost || isSimulating}
          className="w-full mb-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isSimulating ? '계산 중...' : '시뮬레이션'}
        </button>

        {simulation && (
          <div className="mb-4 p-4 bg-blue-50 rounded-md">
            <h4 className="font-medium mb-2 text-blue-800">시뮬레이션 결과</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">예상원가:</span></div>
              <div className="text-right font-medium">{formatCurrency(simulation.estimated_cost)}원</div>
              <div><span className="text-gray-500">목표수익률:</span></div>
              <div className="text-right">{simulation.target_profit_rate}%</div>
              <div><span className="text-gray-500">권장입찰가:</span></div>
              <div className="text-right font-bold text-blue-600">{formatCurrency(simulation.suggested_price)}원</div>
              <div><span className="text-gray-500">예상이익:</span></div>
              <div className="text-right font-medium text-green-600">{formatCurrency(simulation.expected_profit)}원</div>
              <div><span className="text-gray-500">실제수익률:</span></div>
              <div className="text-right">{simulation.actual_profit_rate}%</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">제안입찰가</label>
            <input 
              type="number" 
              value={targetPrice} 
              onChange={(e) => setTargetPrice(e.target.value)} 
              className="w-full px-3 py-2 border rounded-md" 
              required 
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 border rounded-md" rows={2} />
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

export default ProjectDetailPage;