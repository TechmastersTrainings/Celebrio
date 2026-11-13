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
  description?: string;
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
  // Location-aware venue selection
  venue_type?: VenueTypeValue | '';
  venue_type_label?: string | null;
  venue_source?: VenueSourceValue | '';
  venue_source_label?: string | null;
  venue_city?: string;
  venue_locality?: string;
  venue_contact_phone?: string;
  venue_snapshot_json?: Record<string, any>;
  venue_reference?: string | null;
  // write-only selection inputs
  venue_id?: string | null;
  external_place_id?: string | null;
  country_id?: number | null;
  state_id?: number | null;
  city_id?: number | null;
  locality_id?: number | null;
  nearby_locality_id?: number | null;
  venue_latitude?: number | null;
  venue_longitude?: number | null;
  venue_is_verified?: boolean;
  venue_distance_km?: number | null;
}

export type VenueTypeValue = 'HOME' | 'FUNCTION_HALL' | 'HOTEL_RESORT' | 'RESTAURANT_BANQUET' | 'OUTDOOR' | 'OTHER';
export type VenueSourceValue = 'VERIFIED_DIRECTORY' | 'EXTERNAL_PROVIDER' | 'CUSTOMER_PROVIDED';

export interface LocationOption {
  id: number;
  name: string;
  has_coordinates?: boolean;
}

export interface VenueSearchResult {
  id: string;
  external_place_id?: string;
  name: string;
  category: string | null;
  category_label: string;
  city: string;
  city_id: number;
  locality: string | null;
  locality_id: number | null;
  full_address: string;
  google_maps_url: string | null;
  contact_phone: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
  is_in_selected_locality: boolean;
  is_verified: boolean;
  verification_status: string;
  source: 'VERIFIED_DIRECTORY' | 'EXTERNAL_PROVIDER';
  last_verified_at: string | null;
}

export interface LocalitySuggestion {
  id: number;
  name: string;
  distance_km: number | null;
  basis: 'CURATED' | 'COORDINATES' | 'SAME_CITY';
  match_count: number;
}

export interface VenueSearchResponse {
  query: string;
  scope: 'locality' | 'nearby' | 'city';
  radius_km: number;
  city: { id: number; name: string };
  locality: { id: number; name: string; has_coordinates: boolean } | null;
  results: VenueSearchResult[];
  external_results: VenueSearchResult[];
  external_provider_enabled: boolean;
  counts: { locality: number; nearby: number; city: number };
  locality_suggestions: LocalitySuggestion[];
  locality_suggestion_kind: 'NEARBY' | 'SAME_CITY' | null;
  distance_available: boolean;
}

export interface AdminVenue {
  id: string;
  name: string;
  category: string;
  category_label: string;
  city: number;
  city_name: string;
  locality: number | null;
  locality_name: string | null;
  full_address: string;
  latitude: string | null;
  longitude: string | null;
  google_maps_url: string;
  contact_phone: string;
  contact_verified: boolean;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verification_status_label: string;
  is_active: boolean;
  data_source: string;
  data_source_label: string;
  external_place_id: string;
  last_verified_at: string | null;
  verified_by_name: string | null;
  admin_notes: string;
  order_event_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminLocality {
  id: number;
  name: string;
  city: number;
  city_name: string;
  pincode: string;
  latitude: string | null;
  longitude: string | null;
  has_coordinates: boolean;
  nearby_localities: number[];
  data_source: string;
  is_active: boolean;
  venue_count: number;
}

export interface CustomerAsset {
  id: string;
  file_name: string;
  file_key: string;
  file_type: string;
  file_size_bytes: number;
  asset_category: string;
  uploaded_at: string;
  url?: string;
  download_url?: string;
  preview_url?: string;
  readable_size?: string;
  uploaded_by?: string;
  extension?: string;
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
  base_amount_inr?: string;
  auto_discount_amount_inr?: string;
  coupon_discount_amount_inr?: string;
  total_amount_inr: string;
  applied_coupon_code?: string;
  quotation_snapshot_json?: any;
  has_physical_card?: boolean;
  physical_card_notes?: string;
  ocr_extracted_text?: string;
  ocr_data_json?: any;
  occasion_requirements_json?: any;
  missing_fields_json?: string[];
  is_information_confirmed?: boolean;
  is_ready_for_production?: boolean;
  completeness_score?: number;
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
  updated_at?: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  is_public: boolean;
  min_order_value: string;
  max_discount_amount?: string;
  total_usage_limit?: number;
  current_usage_count: number;
  usage_count?: number;
  per_customer_limit: number;
  can_combine_with_auto_discount: boolean;
  is_system_default_offer: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CallbackRequest {
  id: string;
  customer_name: string;
  customer_mobile: string;
  preferred_callback_time: string;
  assistance_required: string;
  order_reference?: string;
  status: 'REQUESTED' | 'PENDING' | 'CONTACTED' | 'FOLLOWUP_REQUIRED' | 'RESOLVED';
  assigned_staff?: string;
  assigned_staff_name?: string;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface TicketSummary {
  id: string;
  ticket_number: string;
  order_reference?: string;
  occasion?: string;
  occasion_slug?: string;
  status: string;
  priority: string;
  customer_name: string;
  customer_mobile?: string;
  customer_email?: string;
  occasion_name: string;
  package_name: string;
  invitation_type?: string;
  event_date?: string;
  short_description?: string;
  assigned_team?: string;
  assigned_developer?: string;
  assigned_developer_name?: string;
  customer_facing_status: string;
  eligible_at: string;
  assigned_at?: string;
  due_date?: string;
  is_on_hold: boolean;
  hold_reason?: string;
  assets_count?: number;
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
  order_reference?: string;
  customer_name?: string;
  customer_mobile?: string;
  customer_email?: string;
  occasion?: string;
  customer_requirements?: string;
  events?: any[];
  status: string;
  priority: string;
  assigned_team?: string;
  assigned_developer?: string;
  assigned_developer_name?: string;
  assigned_developer_email?: string;
  assignment_count?: number;
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
    author_role?: string;
    note_text: string;
    clean_note_text?: string;
    note_type?: 'WORK_NOTE' | 'CUSTOMER_UPDATE';
    is_customer_visible?: boolean;
    created_at: string;
  }>;
  created_at: string;
  updated_at?: string;
}

export interface AdminMetrics {
  total_orders: number;
  new_unassigned?: number;
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
  actor_email?: string;
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

export interface AdminUserItem {
  id: string;
  email: string | null;
  phone_number: string | null;
  full_name: string;
  role: string;
  role_display: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  created_at: string;
  developer_profile?: {
    approval_status: string;
    max_active_tickets: number;
    can_produce_video: boolean;
    skills: string[];
  } | null;
}

export interface AdminPaymentItem {
  id: string;
  order_reference: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  occasion?: string;
  package_name?: string;
  amount_inr: string;
  status: string;
  gateway_provider: string;
  gateway_order_id: string;
  gateway_payment_id?: string;
  ticket_status?: string;
  created_at: string;
}

export interface AdminFinancialsData {
  revenue: {
    gross_revenue_inr: string;
    paid_orders_count: number;
    average_order_value_inr: string;
    by_occasion: Array<{ occasion: string; amount_inr: string }>;
    by_package: Array<{ package: string; amount_inr: string }>;
    recent_transactions: Array<{
      id: string;
      gateway_payment_id: string;
      order_reference: string;
      customer_name: string;
      occasion: string;
      amount_inr: string;
      verified_at: string;
    }>;
  };
  profit_and_loss: {
    gross_revenue_inr: string;
    cogs: {
      developer_payouts_inr: string;
      dev_payout_pct: string;
      gateway_processing_fees_inr: string;
      gateway_fee_pct: string;
      cloud_and_sms_delivery_inr: string;
      total_cogs_inr: string;
    };
    gross_profit_inr: string;
    opex: {
      fixed_server_and_maintenance_inr: string;
    };
    net_profit_inr: string;
    net_profit_margin_pct: string;
  };
}

