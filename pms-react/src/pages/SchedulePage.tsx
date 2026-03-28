import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { scheduleApi, projectApi } from '../services/api';
import type { Task, GanttTask, Project, User } from '../types';

export const SchedulePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [ganttData, setGanttData] = useState<GanttTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const projectId = Number(id);
      const [proj, taskList, gantt] = await Promise.all([
        projectApi.getProject(projectId),
        scheduleApi.getTasks(projectId),
        scheduleApi.getGanttData(projectId),
      ]);
      setProject(proj);
      setTasks(taskList);
      setGanttData(gantt);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    } finally {
      setIsLoading(false    }
  };

  const handleCreateTask = async (data: { project: number; parent?: number; name: string; description?: string; start_date: string; end_date: string; assignee?: number; is_milestone?: boolean }) => {
    try {
      await scheduleApi.createTask(data);
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateProgress = async (taskId: number, progress: number) => {
    try {
      await scheduleApi.updateProgress(taskId, progress);
      loadData();
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string }> = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800' },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800' },
      completed: { bg: 'bg-green-100', text: 'text-green-800' },
      delayed: { bg: 'bg-red-100', text: 'text-red-800' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-500' },
    };
    return map[status] || map.pending;
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

  if (isLoading) return <div className="p-8 text-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700">← 뒤로</button>
            <h1 className="text-xl font-bold text-gray-800">일정 관리</h1>
            <span className="text-gray-500">|</span>
            <span className="text-gray-600">{project?.name}</span>
          </div>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            + 작업 추가
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">간트차트</h2>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <div className="min-w-[800px] p-4">
              {ganttData.length > 0 ? (
                <div className="relative">
                  {ganttData.map((task, idx) => {
                    const start = new Date(task.start).getTime();
                    const end = new Date(task.end).getTime();
                    const totalDays = 365;
                    const left = ((start - new Date('2025-01-01').getTime()) / (1000 * 60 * 60 * 24) / totalDays) * 100;
                    const width = ((end - start) / (1000 * 60 * 60 * 24) / totalDays) * 100;
                    
                    return (
                      <div key={task.id} className="flex items-center mb-2">
                        <div className="w-40 text-sm truncate">{task.name}</div>
                        <div className="flex-1 h-6 bg-gray-100 rounded relative">
                          {task.is_milestone ? (
                            <div className="absolute w-4 h-4 bg-yellow-500 rotate-45 left-0" style={{ left: `${left}%` }} />
                          ) : (
                            <div 
                              className={`h-full rounded ${task.status === 'completed' ? 'bg-green-500' : task.status === 'delayed' ? 'bg-red-500' : 'bg-blue-500'}`}
                              style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
                            />
                          )}
                          <span className="absolute right-2 top-1 text-xs text-gray-600">{task.progress}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">작업이 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">작업 목록 (WBS)</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">담당자</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">진행률</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tasks.filter(t => !t.parent).map((task) => (
                  <React.Fragment key={task.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTask(task)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {task.is_milestone && <span className="w-3 h-3 bg-yellow-500 rotate-45" />}
                          <span className="font-medium">{task.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{task.assignee_name || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(task.start_date)} ~ {formatDate(task.end_date)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${task.progress}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{task.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status).bg} ${getStatusBadge(task.status).text}`}>
                          {task.status}
                        </span>
                      </td>
                    </tr>
                    {task.subtasks?.map(subtask => (
                      <tr key={subtask.id} className="hover:bg-gray-50 bg-gray-50" onClick={() => setSelectedTask(subtask)}>
                        <td className="px-6 py-3 pl-10 text-sm">
                          ↳ {subtask.name}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-500">{subtask.assignee_name || '-'}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">{formatDate(subtask.start_date)} ~ {formatDate(subtask.end_date)}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-gray-200 rounded-full">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${subtask.progress}%` }} />
                            </div>
                            <span className="text-xs text-gray-500">{subtask.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(subtask.status).bg} ${getStatusBadge(subtask.status).text}`}>
                            {subtask.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
                {tasks.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">작업이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && id && (
        <TaskModal projectId={Number(id)} onClose={() => setShowModal(false)} onSubmit={handleCreateTask} />
      )}

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdateProgress={handleUpdateProgress} />
      )}
    </div>
  );
};

const TaskModal: React.FC<{
  projectId: number;
  onClose: () => void;
  onSubmit: (data: { project: number; parent?: number; name: string; description?: string; start_date: string; end_date: string; is_milestone?: boolean }) => void;
}> = ({ projectId, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isMilestone, setIsMilestone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      project: projectId,
      name,
      description,
      start_date: startDate,
      end_date: endDate,
      is_milestone: isMilestone,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">작업 추가</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">작업명</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border rounded-md" required />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 border rounded-md" rows={2} />
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
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isMilestone} onChange={(e) => setIsMilestone(e.target.checked)} />
              <span className="text-sm font-medium text-gray-700">마일스톤 여부</span>
            </label>
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

const TaskDetailModal: React.FC<{
  task: Task;
  onClose: () => void;
  onUpdateProgress: (id: number, progress: number) => void;
}> = ({ task, onClose, onUpdateProgress }) => {
  const [progress, setProgress] = useState(task.progress);

  const handleUpdate = () => {
    onUpdateProgress(task.id, progress);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{task.name}</h3>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-500">기간:</span></div>
            <div>{task.start_date} ~ {task.end_date}</div>
            <div><span className="text-gray-500">담당자:</span></div>
            <div>{task.assignee_name || '-'}</div>
            <div><span className="text-gray-500">상태:</span></div>
            <div>{task.status}</div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">진행률: {progress}%</label>
          <input 
            type="range" 
            value={progress} 
            onChange={(e) => setProgress(Number(e.target.value))} 
            className="w-full" 
            min="0" 
            max="100" 
          />
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 border rounded-md hover:bg-gray-50">취소</button>
          <button onClick={handleUpdate} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">변경</button>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;