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
