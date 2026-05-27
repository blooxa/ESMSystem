export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_superuser: boolean;
  role?: string;
  shop_id?: number;
  shop_name?: string;
  full_name?: string;
}
export interface Request {
  request_id: number;
  request_number: string;
  title: string;
  description: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'hr_approved' | 'approved' | 'ordered' | 'partially_delivered' | 'delivered' | 'partially_issued' | 'completed' | 'rejected' | 'cancelled';
  status_display: string;
  comment?: string;
  created_at: string;
  created_at_formatted?: string;
  updated_at: string;
  supplier_name?: string;
  order_price?: number;
  order_date?: string;
  requester_name?: string;
  shop_id?: number;
}

export interface Employee {
  employee_id: number;
  full_name: string;
  position_name: string;
}
export interface SizeOption {
  value: string;
  label: string;
  description?: string;
  chest?: number;
  height_min?: number;
  height_max?: number;
  size_ru?: number;
  foot_length_min?: number;
  foot_length_max?: number;
  head_circumference_min?: number;
  head_circumference_max?: number;
}

export interface PPEItem {
  nomenclature_id: number;
  nomenclature_title: string;
  unit: string;
  standard_quantity: number;
  period_months: number;
  last_issue_date: string | null;
  can_order: boolean;
  selected_size: string;
  selected_quantity: number;
  size_type: string;
  size_options: SizeOption[];
  size_recommended?: string;
}

export interface EmployeeWithPPE {
  employee_id: number;
  full_name: string;
  position_name: string;
  height: number | null;
  items: PPEItem[];
}

export interface RequestHistory {
  id: number;
  status_from: string;
  status_to: string;
  changed_by_name: string;
  comment: string;
  created_at: string;
}

export interface ApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
export interface DashboardStats {
  total: number;
  pending: number;
  hr_approved?: number;
  approved: number;
  rejected: number;
  ordered: number;
  completed: number;
  cancelled?: number;
}