export type UserRole =
  | 'ANON_GUEST'
  | 'AUTH_CUSTOMER'
  | 'DEV_PENDING'
  | 'DEV_ACTIVE'
  | 'DEV_VIDEO'
  | 'OPS_ADMIN'
  | 'SUPER_ADMIN';

export type ApprovalStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED_ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED';

export interface User {
  id: string;
  email: string | null;
  phone_number: string | null;
  full_name: string;
  role: UserRole;
  is_approved_developer?: boolean;
  can_produce_video?: boolean;
  is_admin?: boolean;
  developer_profile?: {
    approval_status: ApprovalStatus;
    can_produce_video: boolean;
    max_active_tickets: number;
    portfolio_url?: string;
    skills: string[];
  };
}

export interface Package {
  id: string;
  occasion: string;
  name: string;
  code: string;
  base_price_inr: string;
  features_json: string[];
  included_revisions: number;
  is_active: boolean;
}

export interface Occasion {
  id: string;
  slug: string;
  display_name: string;
  description: string;
  icon_name: string;
  packages: Package[];
}

export interface Addon {
  id: string;
  name: string;
  code: string;
  price_inr: string;
  addon_type: string;
  description: string;
}

export interface OrderEvent {
  id?: string;
  event_title: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  venue_name: string;
  venue_address: string;
  google_maps_url?: string;
  dress_code?: string;
}

export interface CustomerAsset {
  id: string;
  file_name: string;
  file_key: string;
  file_type: string;
  file_size_bytes: number;
  asset_category: string;
  uploaded_at: string;
}

export interface OrderDetail {
  id: string;
  order_reference: string;
  customer_name: string;
  customer_mobile: string;
  customer_email?: string;
  occasion_name: string;
  package_name: string;
  selected_language: string;
  status: string;
  total_amount_inr: string;
  special_instructions?: string;
  events: OrderEvent[];
  assets: CustomerAsset[];
  ticket_status: string;
  customer_facing_status: string;
  customer_facing_explanation: string;
  has_active_preview: boolean;
  preview_url?: string;
  published_url?: string;
  is_published: boolean;
  created_at: string;
}

export interface TicketSummary {
  id: string;
  ticket_number: string;
  status: string;
  priority: string;
  customer_name: string;
  occasion_name: string;
  package_name: string;
  assigned_developer?: string;
  assigned_developer_name?: string;
  customer_facing_status: string;
  eligible_at: string;
  assigned_at?: string;
  due_date?: string;
  is_on_hold: boolean;
  created_at: string;
}

export interface DesignVersionSummary {
  id: string;
  version_number: number;
  status: string;
  preview_token: string;
  web_preview_payload: Record<string, any>;
  watermark_text: string;
  created_at: string;
  revisions_count: number;
}

export interface TicketDetail {
  id: string;
  ticket_number: string;
  status: string;
  priority: string;
  assigned_developer?: string;
  assigned_developer_name?: string;
  eligible_at: string;
  assigned_at?: string;
  due_date?: string;
  is_on_hold: boolean;
  hold_reason?: string;
  customer_facing_status: string;
  customer_facing_explanation: string;
  order: OrderDetail;
  design_versions: DesignVersionSummary[];
  status_history: Array<{
    previous_status: string;
    new_status: string;
    changed_by_name: string;
    transition_reason?: string;
    created_at: string;
  }>;
  assignment_history: Array<{
    developer_name: string;
    assigned_by_name: string;
    assignment_type: string;
    notes?: string;
    created_at: string;
  }>;
  internal_notes: Array<{
    id: string;
    author_name: string;
    note_text: string;
    created_at: string;
  }>;
  created_at: string;
}

export interface AdminMetrics {
  total_orders: number;
  unassigned_fifo_queue: number;
  assigned_tickets: number;
  work_in_progress: number;
  awaiting_customer_response: number;
  awaiting_payment: number;
  payment_done: number;
  closed_tickets: number;
  on_hold_tickets: number;
  cancelled_orders: number;
  pending_developer_approvals: number;
  active_developers: number;
  video_production_tasks: number;
  total_revenue_inr: string;
}

export interface CentralActivityLogItem {
  id: number;
  actor_name: string;
  actor_role: string;
  action: string;
  module: string;
  record_id: string;
  previous_value: Record<string, any>;
  new_value: Record<string, any>;
  ip_address?: string;
  status: string;
  remarks?: string;
  timestamp: string;
}

