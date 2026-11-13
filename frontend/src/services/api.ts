import { OFFICIAL_OCCASIONS, OFFICIAL_ADDONS } from '../data/defaultCatalog';
import type { LocationOption, LocalitySuggestion, VenueSearchResponse, AdminVenue, AdminLocality } from '../types';

const envApi = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
const PRIMARY_API = envApi ? `${envApi}/api/v1` : '/api/v1';
const FALLBACK_API = envApi ? `${envApi}/api/v1` : 'http://127.0.0.1:8000/api/v1';

export class ApiService {
  private static getHeaders(isCustomer = false, isMultipart = false): HeadersInit {
    const headers: Record<string, string> = {};

    if (!isMultipart) {
      headers['Content-Type'] = 'application/json';
    }

    if (isCustomer) {
      const customerToken = localStorage.getItem('celebrio_customer_token');
      if (customerToken) {
        headers['X-Customer-Token'] = customerToken;
      }
    } else {
      const staffToken = localStorage.getItem('celebrio_staff_token');
      if (staffToken) {
        headers['Authorization'] = `Bearer ${staffToken}`;
      }
    }

    return headers;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}, isCustomer = false): Promise<T> {
    const isMultipart = options.body instanceof FormData;
    const headers = {
      ...this.getHeaders(isCustomer, isMultipart),
      ...(options.headers as Record<string, string> || {}),
    };

    let res: Response;
    try {
      res = await fetch(`${PRIMARY_API}${endpoint}`, {
        ...options,
        headers,
      });
      if (!res.ok && res.status >= 500) {
        throw new Error(`Proxy error ${res.status}`);
      }
    } catch {
      res = await fetch(`${FALLBACK_API}${endpoint}`, {
        ...options,
        headers,
      });
    }

    const text = await res.text();
    let data: any;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}. Database connection or server initializing.`);
      }
      throw new Error(`Invalid response format from server`);
    }

    if (!res.ok) {
      const message = data?.error?.message || (typeof data?.error === 'string' ? data.error : JSON.stringify(data?.error)) || `Request failed (${res.status})`;
      throw new Error(message);
    }

    return (data && data.data !== undefined) ? data.data : data;
  }

  // --- Auth Endpoints ---
  static async staffLogin(email: string, password: string) {
    let res: Response;
    try {
      res = await fetch(`${PRIMARY_API}/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok && res.status >= 500) {
        throw new Error('Proxy error');
      }
    } catch {
      res = await fetch(`${FALLBACK_API}/auth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    }

    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Backend service returned HTTP ${res.status}. Server may be initializing migrations.`);
    }
    if (!res.ok) throw new Error(data?.error?.message || data?.detail || 'Invalid credentials');
    
    const token = data?.access || data?.data?.access;
    const user = data?.user || data?.data?.user;
    if (token) localStorage.setItem('celebrio_staff_token', token);
    if (user) localStorage.setItem('celebrio_staff_user', JSON.stringify(user));
    return user;
  }

  static async registerDeveloper(payload: any) {
    return this.request('/auth/developer/register/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  static async getDeveloperMe() {
    return this.request('/auth/developer/me/');
  }

  static async sendCustomerOTP(phoneNumber: string, orderReference?: string) {
    return this.request('/auth/customer/otp/send/', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber, order_reference: orderReference }),
    });
  }

  static async requestCustomerOTP(phoneNumber: string, orderReference?: string) {
    return this.sendCustomerOTP(phoneNumber, orderReference);
  }

  static async verifyCustomerOTP(challengeId: string, otp: string) {
    const data: any = await this.request('/auth/customer/otp/verify/', {
      method: 'POST',
      body: JSON.stringify({ challenge_id: challengeId, otp }),
    });
    if (data?.customer_token) {
      localStorage.setItem('celebrio_customer_token', data.customer_token);
    }
    return data;
  }

  // --- Catalog Endpoints ---
  static async getOccasions(): Promise<any[]> {
    try {
      const data = await this.request<any[]>('/catalog/occasions/');
      if (Array.isArray(data) && data.length > 0) return data;
      return OFFICIAL_OCCASIONS;
    } catch (e) {
      console.warn('API getOccasions fallback activated:', e);
      return OFFICIAL_OCCASIONS;
    }
  }

  static async getAddons(): Promise<any[]> {
    try {
      const data = await this.request<any[]>('/catalog/addons/');
      if (Array.isArray(data) && data.length > 0) return data;
      return OFFICIAL_ADDONS;
    } catch (e) {
      console.warn('API getAddons fallback activated:', e);
      return OFFICIAL_ADDONS;
    }
  }

  static async updatePackagePrice(packageId: string, newPrice: number) {
    return this.request(`/catalog/packages/${packageId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ base_price_inr: newPrice }),
    });
  }

  // --- Orders & Customer Portal ---
  static async submitOrder(orderPayload: any) {
    return this.request('/orders/', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    });
  }

  static async lookupOrder(ref: string) {
    return this.request(`/orders/lookup/?ref=${encodeURIComponent(ref)}`, {}, true);
  }

  static async uploadAsset(orderRef: string, file: File, category = 'COUPLE_PHOTO') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('asset_category', category);
    formData.append('file_name', file.name);

    return this.request(`/orders/${orderRef}/assets/`, {
      method: 'POST',
      body: formData,
    }, true);
  }

  static async approveDesign(orderRef: string) {
    return this.request(`/orders/${orderRef}/approve-design/`, {
      method: 'POST',
    }, true);
  }

  static async requestRevision(orderRef: string, feedbackText: string) {
    return this.request(`/orders/${orderRef}/revisions/`, {
      method: 'POST',
      body: JSON.stringify({ feedback_text: feedbackText }),
    }, true);
  }

  static async getDeliverables(orderRef: string) {
    return this.request(`/orders/${orderRef}/deliverables/`, {}, true);
  }

  // --- Developer Workspace ---
  static async getAvailableTickets(): Promise<any[]> {
    return this.request('/workspace/tickets/available/');
  }

  static async claimNextFIFOTicket() {
    return this.request('/workspace/tickets/claim-fifo/', {
      method: 'POST',
    });
  }

  static async claimSpecificTicket(ticketId: string) {
    return this.request(`/workspace/tickets/${ticketId}/claim/`, {
      method: 'POST',
    });
  }

  static getMediaUrl(fileKeyOrUrl: string): string {
    if (!fileKeyOrUrl) return '';
    if (fileKeyOrUrl.startsWith('http://') || fileKeyOrUrl.startsWith('https://') || fileKeyOrUrl.startsWith('data:')) {
      return fileKeyOrUrl;
    }
    const base = envApi || '';
    const cleanKey = fileKeyOrUrl.replace(/^\/+/, '');
    if (cleanKey.startsWith('media/')) {
      return `${base}/${cleanKey}`;
    }
    return `${base}/media/${cleanKey}`;
  }

  static async getAssignedTickets(scope?: string): Promise<any[]> {
    const qs = scope ? `?scope=${encodeURIComponent(scope)}` : '';
    return this.request(`/workspace/tickets/assigned/${qs}`);
  }

  static async getClosedTickets(): Promise<any[]> {
    return this.getAssignedTickets('closed');
  }

  static async uploadDesignVersion(ticketId: string, webPayload: any, watermark?: string) {
    return this.request(`/workspace/tickets/${ticketId}/designs/`, {
      method: 'POST',
      body: JSON.stringify({
        web_preview_payload: webPayload,
        watermark_text: watermark || 'TECHMASTERS PREVIEW - NOT FINAL',
      }),
    });
  }

  static async getVideoTasks(): Promise<any[]> {
    return this.request('/workspace/video-tasks/');
  }

  static async claimVideoTask(taskId: string) {
    return this.request(`/workspace/video-tasks/${taskId}/claim/`, {
      method: 'POST',
    });
  }

  // --- Tickets ---
  static async getTicketDetail(ticketId: string) {
    return this.request(`/tickets/${ticketId}/`);
  }

  static async updateTicketStatus(ticketId: string, newStatus: string, reason?: string, workNotes?: string) {
    return this.request(`/tickets/${ticketId}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: newStatus,
        reason: reason || workNotes,
        work_notes: workNotes || reason,
      }),
    });
  }

  static async updateTicketDetails(ticketId: string, payload: {
    status?: string;
    priority?: string;
    is_on_hold?: boolean;
    hold_reason?: string;
    reason?: string;
    work_notes?: string;
  }) {
    return this.request(`/tickets/${ticketId}/status/`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  static async addInternalNote(ticketId: string, noteText: string, noteType: 'WORK_NOTE' | 'CUSTOMER_UPDATE' = 'WORK_NOTE') {
    return this.request(`/tickets/${ticketId}/notes/`, {
      method: 'POST',
      body: JSON.stringify({ note_text: noteText, note_type: noteType }),
    });
  }

  // --- Asset Management & Download ---
  static getAssetPreviewUrl(assetId: string): string {
    const base = PRIMARY_API;
    return `${base}/orders/assets/${assetId}/preview/`;
  }

  static async downloadAssetBlob(assetId: string): Promise<Blob> {
    const staffToken = localStorage.getItem('celebrio_staff_token');
    const customerToken = localStorage.getItem('celebrio_customer_token');
    const headers: Record<string, string> = {};
    if (staffToken) {
      headers['Authorization'] = `Bearer ${staffToken}`;
    } else if (customerToken) {
      headers['X-Customer-Token'] = customerToken;
    }

    let res: Response;
    try {
      res = await fetch(`${PRIMARY_API}/orders/assets/${assetId}/download/`, { headers });
      if (!res.ok && res.status >= 500) throw new Error(`Proxy error ${res.status}`);
    } catch {
      res = await fetch(`${FALLBACK_API}/orders/assets/${assetId}/download/`, { headers });
    }

    if (!res.ok) {
      throw new Error(`Failed to download file (HTTP ${res.status})`);
    }

    return await res.blob();
  }

  static async downloadAssetFile(assetId: string, fileName: string): Promise<void> {
    const blob = await this.downloadAssetBlob(assetId);
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName || `asset_${assetId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
  }

  static async uploadOrderAsset(orderRef: string, file: File, category = 'DESIGNER_UPLOAD'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('asset_category', category);
    return this.request(`/orders/${orderRef}/assets/`, {
      method: 'POST',
      body: formData,
    });
  }

  // --- OCR Extraction ---
  static async extractCardOCR(file: File, occasionType = 'wedding'): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('occasion_type', occasionType);
    return this.request('/orders/ocr-extract/', {
      method: 'POST',
      body: formData,
    });
  }

  // --- Locations & Venue Directory ---
  static async getVenueOptions(): Promise<{ venue_types: { value: string; label: string }[]; venue_categories: { value: string; label: string }[]; external_provider_enabled: boolean }> {
    return this.request('/locations/options/');
  }

  static async getCountries(): Promise<LocationOption[]> {
    return this.request('/locations/countries/');
  }

  static async getStates(countryId: number): Promise<LocationOption[]> {
    return this.request(`/locations/states/?country=${countryId}`);
  }

  static async getCities(stateId: number): Promise<LocationOption[]> {
    return this.request(`/locations/cities/?state=${stateId}`);
  }

  static async getAllCities(): Promise<(LocationOption & { state_name?: string })[]> {
    return this.request('/locations/cities/');
  }

  static async getLocalities(cityId: number): Promise<LocationOption[]> {
    return this.request(`/locations/localities/?city=${cityId}`);
  }

  static async getNearbyLocalities(localityId: number, radiusKm = 5): Promise<{ nearby: LocalitySuggestion[] }> {
    return this.request(`/locations/localities/${localityId}/nearby/?radius_km=${radiusKm}`);
  }

  static async searchVenues(
    params: { city: number; locality?: number | null; q: string; scope?: string; radius_km?: number; category?: string },
    signal?: AbortSignal,
  ): Promise<VenueSearchResponse> {
    const qs = new URLSearchParams();
    qs.set('city', String(params.city));
    if (params.locality) qs.set('locality', String(params.locality));
    qs.set('q', params.q);
    if (params.scope) qs.set('scope', params.scope);
    if (params.radius_km) qs.set('radius_km', String(params.radius_km));
    if (params.category) qs.set('category', params.category);
    return this.request(`/locations/venues/search/?${qs.toString()}`, { signal });
  }

  static async getAdminVenues(filters: Record<string, string> = {}): Promise<{ venues: AdminVenue[]; counts: Record<string, number> }> {
    const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== ''));
    return this.request(`/locations/admin/venues/?${qs.toString()}`);
  }

  static async createAdminVenue(data: Record<string, any>): Promise<AdminVenue> {
    return this.request('/locations/admin/venues/', { method: 'POST', body: JSON.stringify(data) });
  }

  static async updateAdminVenue(id: string, data: Record<string, any>): Promise<AdminVenue> {
    return this.request(`/locations/admin/venues/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  static async verifyAdminVenue(id: string, decision: 'VERIFY' | 'REJECT' | 'RESET', notes = ''): Promise<AdminVenue> {
    return this.request(`/locations/admin/venues/${id}/verify/`, { method: 'POST', body: JSON.stringify({ decision, notes }) });
  }

  static async getAdminLocalities(cityId?: number): Promise<AdminLocality[]> {
    return this.request(`/locations/admin/localities/${cityId ? `?city=${cityId}` : ''}`);
  }

  static async createAdminLocality(data: Record<string, any>): Promise<AdminLocality> {
    return this.request('/locations/admin/localities/', { method: 'POST', body: JSON.stringify(data) });
  }

  static async updateAdminLocality(id: number, data: Record<string, any>): Promise<AdminLocality> {
    return this.request(`/locations/admin/localities/${id}/`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  // --- Offers & Coupons ---
  static async getPublicCoupons(): Promise<{ default_offer: any; coupons: any[] }> {
    return this.request('/orders/coupons/public/');
  }

  static async validateCoupon(couponCode: string, amount: number, occasionId?: string): Promise<any> {
    return this.request('/orders/coupons/validate/', {
      method: 'POST',
      body: JSON.stringify({
        coupon_code: couponCode,
        amount,
        occasion_id: occasionId,
      }),
    });
  }

  static async getAdminCoupons(): Promise<any[]> {
    return this.request('/orders/coupons/admin/');
  }

  static async createAdminCoupon(data: any): Promise<any> {
    return this.request('/orders/coupons/admin/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateAdminCoupon(couponId: string, data: any): Promise<any> {
    return this.request(`/orders/coupons/admin/${couponId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteAdminCoupon(couponId: string): Promise<any> {
    return this.request(`/orders/coupons/admin/${couponId}/`, {
      method: 'DELETE',
    });
  }

  // --- Customer Support & Callbacks ---
  static async requestCallback(data: {
    customer_name: string;
    customer_mobile: string;
    preferred_callback_time: string;
    assistance_required: string;
    order_reference?: string;
  }): Promise<any> {
    return this.request('/orders/callbacks/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getAdminCallbacks(): Promise<any[]> {
    return this.request('/orders/callbacks/admin/');
  }

  static async updateAdminCallback(callbackId: string, data: any): Promise<any> {
    return this.request(`/orders/callbacks/admin/${callbackId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- Requirements & Missing Information Governance ---
  static async updateOrderMissingInfo(orderRef: string, data: {
    occasion_requirements?: any;
    missing_fields?: string[];
    is_information_confirmed?: boolean;
    is_ready_for_production?: boolean;
  }): Promise<any> {
    return this.request(`/orders/${orderRef}/missing-info/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // --- Payments ---
  static async createPaymentOrder(orderReference: string) {
    return this.request('/payments/create-order/', {
      method: 'POST',
      body: JSON.stringify({ order_reference: orderReference }),
    });
  }

  static async verifyPaymentWebhook(gatewayOrderId: string, gatewayPaymentId: string) {
    return this.request('/payments/webhook/', {
      method: 'POST',
      body: JSON.stringify({
        gateway_order_id: gatewayOrderId,
        gateway_payment_id: gatewayPaymentId,
        status: 'captured',
      }),
    });
  }

  static async initiateMockPayment(orderReference: string, amount?: string) {
    const orderData: any = await this.createPaymentOrder(orderReference);
    const gatewayOrderId = orderData?.gateway_order_id || `MOCK_GW_${Date.now()}`;
    const gatewayPaymentId = `PAY_${Date.now()}`;
    return this.verifyPaymentWebhook(gatewayOrderId, gatewayPaymentId);
  }

  // --- Publishing & Neutral Invitations ---
  static async authorizePublishing(orderReference: string, customSlug?: string, graceDays = 30) {
    return this.request('/publishing/authorize/', {
      method: 'POST',
      body: JSON.stringify({
        order_reference: orderReference,
        custom_slug: customSlug,
        grace_period_days: graceDays,
      }),
    });
  }

  static async getPublicInvitation(slug: string) {
    return this.request(`/publishing/invite/${slug}/`);
  }

  static async getPreviewInvitation(token: string) {
    return this.request(`/publishing/preview/${token}/`);
  }

  // --- Admin Operations ---
  static async getAdminMetrics() {
    return this.request('/admin-ops/metrics/');
  }

  static async getAdminTickets(statusFilter?: string) {
    const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    return this.request(`/admin-ops/tickets/${q}`);
  }

  static async reassignTicket(ticketId: string, developerId: string, reason?: string) {
    return this.request(`/admin-ops/tickets/${ticketId}/reassign/`, {
      method: 'POST',
      body: JSON.stringify({ developer_id: developerId, reason }),
    });
  }

  static async releaseTicket(ticketId: string, reason?: string) {
    return this.request(`/admin-ops/tickets/${ticketId}/release/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  static async getAdminDevelopers(approvalStatus?: string) {
    const q = approvalStatus ? `?approval_status=${encodeURIComponent(approvalStatus)}` : '';
    return this.request(`/auth/admin/developers/${q}`);
  }

  static async updateDeveloperStatus(userId: string, action: string, canProduceVideo?: boolean, maxActiveTickets?: number, reason?: string) {
    return this.request(`/auth/admin/developers/${userId}/action/`, {
      method: 'PATCH',
      body: JSON.stringify({ action, can_produce_video: canProduceVideo, max_active_tickets: maxActiveTickets, reason }),
    });
  }

  static async getAuditLogs(module?: string, statusFilter?: string) {
    const params = new URLSearchParams();
    if (module) params.append('module', module);
    if (statusFilter) params.append('status', statusFilter);
    return this.request(`/admin-ops/audit-logs/?${params.toString()}`);
  }

  // --- Superman Admin Controls (Users, Tickets, Payments, Financials) ---
  static async getAdminUsers(role?: string, search?: string) {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (search) params.append('search', search);
    return this.request(`/admin-ops/users/?${params.toString()}`);
  }

  static async updateAdminUser(userId: string, data: {
    role?: string;
    is_active?: boolean;
    full_name?: string;
    password?: string;
    max_active_tickets?: number;
    can_produce_video?: boolean;
  }) {
    return this.request(`/admin-ops/users/${userId}/update/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async deleteAdminUser(userId: string) {
    return this.request(`/admin-ops/users/${userId}/delete/`, {
      method: 'DELETE',
    });
  }

  static async updateAdminTicketStatus(ticketId: string, status: string, reason?: string, workNotes?: string) {
    return this.request(`/admin-ops/tickets/${ticketId}/status/`, {
      method: 'POST',
      body: JSON.stringify({ status, reason, work_notes: workNotes }),
    });
  }

  static async deleteAdminTicket(ticketId: string) {
    return this.request(`/admin-ops/tickets/${ticketId}/delete/`, {
      method: 'DELETE',
    });
  }

  static async getAdminPayments(statusFilter?: string) {
    const q = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
    return this.request(`/admin-ops/payments/${q}`);
  }

  static async markAdminPaymentPaid(orderReference: string, paymentMethod = 'MANUAL_UPI_CASH', notes?: string) {
    return this.request('/admin-ops/payments/mark-paid/', {
      method: 'POST',
      body: JSON.stringify({ order_reference: orderReference, payment_method: paymentMethod, notes }),
    });
  }

  static async getAdminFinancials(devPayoutPct = 35.0, gatewayFeePct = 2.0, fixedOverhead = 1500.0) {
    const params = new URLSearchParams({
      dev_payout_pct: devPayoutPct.toString(),
      gateway_fee_pct: gatewayFeePct.toString(),
      fixed_overhead: fixedOverhead.toString(),
    });
    return this.request(`/admin-ops/financials/?${params.toString()}`);
  }
}

