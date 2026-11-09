const PRIMARY_API = '/api/v1';
const FALLBACK_API = 'http://127.0.0.1:8000/api/v1';

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
    const data = text ? JSON.parse(text) : {};
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
    return this.request('/catalog/occasions/');
  }

  static async getAddons(): Promise<any[]> {
    return this.request('/catalog/addons/');
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

  static async getAssignedTickets(): Promise<any[]> {
    return this.request('/workspace/tickets/assigned/');
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

  static async updateTicketStatus(ticketId: string, newStatus: string, reason?: string) {
    return this.request(`/tickets/${ticketId}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, reason }),
    });
  }

  static async addInternalNote(ticketId: string, noteText: string) {
    return this.request(`/tickets/${ticketId}/notes/`, {
      method: 'POST',
      body: JSON.stringify({ note_text: noteText }),
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
}

