export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'pm' | 'designer' | 'constructor' | 'member';
  team: string;
  department: string;
  phone: string;
  position: string;
  date_joined: string;
  can_approve?: boolean;
}

export interface Project {
  id: number;
  name: string;
  client: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'waiting' | 'planning' | 'in_progress' | 'completed' | 'cancelled';
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
  versions?: ProjectVersion[];
  current_version?: ProjectVersion;
  latest_version_number?: string;
}

export interface ProjectVersion {
  id: number;
  version_number: string;
  estimated_cost: string;
  target_price: string;
  target_profit_rate: string;
  proposed_price: string;
  notes: string;
  created_by: number;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface BidSimulation {
  estimated_cost: string;
  target_profit_rate: string;
  suggested_price: string;
  expected_profit: string;
  actual_profit_rate: string;
}

export interface CostCategory {
  id: number;
  name: string;
  category_type: 'labor' | 'material' | 'outsource' | 'equipment' | 'etc';
  description: string;
  is_active: boolean;
}

export interface Vendor {
  id: number;
  name: string;
  business_number: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
}

export interface Budget {
  id: number;
  project: number;
  category: number;
  category_name: string;
  category_type: string;
  planned_amount: string;
  used_amount: string;
  current_amount: string;
  remaining_amount: string;
  expected_final_amount: string;
  variance: string;
  variance_status: 'savings' | 'overrun' | 'on_budget';
  description: string;
  created_by: number;
  created_at: string;
}

export interface Expense {
  id: number;
  budget: number;
  vendor: number | null;
  vendor_name: string | null;
  category_name: string;
  amount: string;
  description: string;
  expense_date: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  submitted_by: number;
  submitted_by_name: string;
  approved_by: number | null;
  approved_by_name: string | null;
  created_at: string;
}

export interface ApprovalType {
  id: number;
  name: string;
  code: string;
  description: string;
  requires_expense: boolean;
}

export interface Approval {
  id: number;
  project: number;
  project_name: string;
  approval_type: number;
  approval_type_name: string;
  title: string;
  content: string;
  amount: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
  requester: number;
  requester_name: string;
  current_approver: number | null;
  current_approver_name: string | null;
  current_step: number;
  submitted_at: string | null;
  completed_at: string | null;
  created_at: string;
  steps?: ApprovalStep[];
  actions?: ApprovalAction[];
}

export interface ApprovalStep {
  id: number;
  order: number;
  approver: number;
  approver_name: string;
  status: 'pending' | 'approved' | 'rejected';
  comment: string;
  acted_at: string | null;
}

export interface ApprovalAction {
  id: number;
  approver: number;
  approver_name: string;
  action: 'approve' | 'reject';
  comment: string;
  created_at: string;
}

export interface ResourceAllocation {
  id: number;
  project: number;
  project_name: string;
  user: number;
  user_name: string;
  role: 'pm' | 'designer' | 'constructor' | 'engineer' | 'assistant';
  role_display: string;
  start_date: string;
  end_date: string;
  allocation_rate: number;
  hours_per_month: string | null;
  description: string;
  duration_days: number;
  duration_months: number;
  created_at: string;
}

export interface ResourceConflict {
  id: number;
  user: number;
  user_name: string;
  start_date: string;
  end_date: string;
  total_allocation_rate: number;
  is_resolved: boolean;
  allocations?: ResourceAllocation[];
}

export interface Task {
  id: number;
  project: number;
  project_name: string;
  parent: number | null;
  parent_name: string | null;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  status_display: string;
  assignee: number | null;
  assignee_name: string | null;
  order: number;
  is_milestone: boolean;
  is_delayed: boolean;
  duration_days: number;
  subtasks?: Task[];
  dependencies?: { id: number; predecessor_name: string; dependency_type: string }[];
  created_at: string;
}

export interface GanttTask {
  id: number;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies: { taskId: number; type: string }[];
  assignee_name: string | null;
  is_milestone: boolean;
  status: string;
}
