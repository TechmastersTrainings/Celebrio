# TechMasters Digital Celebrations
## API Contract & Endpoint Specification — Version 1.0

---

### Document Control
- **Product Name:** TechMasters Digital Celebrations
- **Document Version:** 1.0
- **API Base URL:** `/api/v1/`
- **Specification Format:** OpenAPI 3.1 / RESTful Standard
- **Author:** Principal Software Architect & Lead Backend Engineer
- **Baseline Reference:** BRD v1.1, SAD v1.0, FRS v1.0, ERD v1.0

---

## 1. Global API Standards & Conventions

### 1.1 Content Negotiation & Encoding
- All endpoints accept and return `application/json; charset=utf-8` unless delivering binary files (e.g. PDF/MP4 assets).
- Date and time values follow ISO 8601 formatting (`YYYY-MM-DDTHH:mm:ssZ`).
- Currency values are represented as fixed-precision numeric decimals.

### 1.2 Authentication Schemes
- **Staff Access (Admin, Developer):** `Authorization: Bearer <jwt_access_token>`.
- **Customer Access:** Authenticated via session cookie or `X-Customer-Token: <customer_session_token>` generated post-OTP verification.
- **Webhooks:** Validated via HMAC-SHA256 signature passed in the header `X-Razorpay-Signature` or provider equivalent.

### 1.3 Standard Response Formats

#### Success Envelope
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-11-09T03:45:00Z"
  }
}
```

#### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Specific error explanation.",
    "details": {
      "field_name": ["Specific validation error string"]
    }
  },
  "meta": {
    "timestamp": "2026-11-09T03:45:00Z"
  }
}
```

---

## 2. API Endpoints Catalog

### 2.1 Authentication & Developer Onboarding

#### `POST /api/v1/auth/token/`
- **Description:** Authenticate internal staff member (Admin / Developer) and receive JWT pair.
- **Access:** Public.
- **Request Body:**
```json
{
  "email": "developer.priya@techmasters.internal",
  "password": "StrongPassword!2026"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access": "eyJhbGciOi...",
    "refresh": "eyJhbGciOi...",
    "user": {
      "id": "c7a8e234-90ab-4d1e-8bc7-ef1234567890",
      "email": "developer.priya@techmasters.internal",
      "full_name": "Priya Sharma",
      "role": "DEV_ACTIVE",
      "approval_status": "APPROVED_ACTIVE",
      "can_produce_video": false
    }
  }
}
```

#### `POST /api/v1/auth/developer/register/`
- **Description:** Register a new internal developer account (status defaults to `PENDING_APPROVAL`).
- **Access:** Public.
- **Request Body:**
```json
{
  "email": "new.dev@techmasters.internal",
  "password": "SecurePassword#2026",
  "full_name": "Arun Kumar",
  "phone_number": "+919876543210",
  "portfolio_url": "https://aruncreative.portfolio.com",
  "skills": ["HTML", "CSS", "UI/UX", "Kannada", "Hindi"]
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "message": "Registration submitted successfully. Account is pending Administrator approval.",
    "approval_status": "PENDING_APPROVAL"
  }
}
```

#### `POST /api/v1/auth/customer/otp/send/`
- **Description:** Dispatch a 6-digit OTP to customer mobile number for order lookup or preview review.
- **Access:** Public (Rate-limited: 3 requests / 10 minutes).
- **Request Body:**
```json
{
  "phone_number": "+919845012345",
  "order_reference": "TC-2026-00001"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "challenge_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "expires_in_seconds": 300,
    "message": "OTP has been sent to your registered mobile number."
  }
}
```

#### `POST /api/v1/auth/customer/otp/verify/`
- **Description:** Validate customer OTP and receive short-lived customer authorization session token.
- **Access:** Public.
- **Request Body:**
```json
{
  "challenge_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "otp": "481920"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "customer_token": "ctok_8f7b2c1e4d5a...",
    "order_reference": "TC-2026-00001",
    "customer_name": "Rajesh & Ananya"
  }
}
```

---

### 2.2 Catalog & Dynamic Pricing Configuration

#### `GET /api/v1/catalog/occasions/`
- **Description:** List all active celebration categories with their packages and dynamic pricing.
- **Access:** Public.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "e1f1c2d3-...",
      "slug": "marriage",
      "display_name": "Marriage / Wedding",
      "description": "Celebrate your holy union with interactive web invitations...",
      "packages": [
        {
          "id": "p1a2b3c4-...",
          "code": "PKG_WEDDING_PREMIUM",
          "name": "Premium Marriage Grand",
          "base_price_inr": "999.00",
          "included_revisions": 2,
          "features": ["Interactive Web App", "Full Event Schedule", "Card Suite", "Google Maps", "Countdown", "Music"]
        }
      ]
    }
  ]
}
```

---

### 2.3 Customer Order Intake & Lifecycle

#### `POST /api/v1/orders/`
- **Description:** Submit celebration order intake wizard. Generates ticket, assigns reference, and triggers queue ingestion.
- **Access:** Public.
- **Request Body:**
```json
{
  "customer_name": "Rahul & Sneha",
  "customer_mobile": "+919886012345",
  "customer_email": "rahul.celebration@example.com",
  "occasion_id": "e1f1c2d3-...",
  "package_id": "p1a2b3c4-...",
  "selected_language": "Kannada",
  "special_instructions": "Please use traditional temple maroon and gold accents.",
  "events": [
    {
      "event_title": "Muhurtham",
      "event_date": "2026-12-14",
      "start_time": "09:30:00",
      "venue_name": "Gayathri Vihar, Palace Grounds",
      "venue_address": "Gate No 4, Bellary Road, Bangalore - 560006",
      "google_maps_url": "https://maps.app.goo.gl/example123"
    }
  ]
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "order_reference": "TC-2026-00001",
    "status": "SUBMITTED",
    "customer_facing_status": "Order Received",
    "total_amount_inr": "999.00",
    "message": "Order successfully submitted! Keep your Order Reference TC-2026-00001 to track progress."
  }
}
```

#### `GET /api/v1/orders/lookup/`
- **Description:** Retrieve order details and progress using Order Reference and Customer Session.
- **Access:** Verified Customer (`X-Customer-Token`) or Staff.
- **Query Parameters:** `?ref=TC-2026-00001`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "order_reference": "TC-2026-00001",
    "customer_name": "Rahul & Sneha",
    "customer_facing_status": "Preview Ready for Review",
    "package_name": "Premium Marriage Grand",
    "revisions_used": 0,
    "free_revisions_total": 2,
    "has_active_preview": true,
    "preview_url": "https://app.techmasters.internal/preview/tok_abc123xyz",
    "payment_status": "UNPAID",
    "published_url": null
  }
}
```

#### `POST /api/v1/orders/{ref}/revisions/`
- **Description:** Submit customer design revision request.
- **Access:** Verified Customer (`X-Customer-Token`).
- **Request Body:**
```json
{
  "feedback_text": "Please update the Muhurtham time to 10:00 AM instead of 09:30 AM, and switch the second couple photo with the one in traditional attire."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "revision_round": 1,
    "is_billable": false,
    "customer_facing_status": "Designing Your Invitation",
    "message": "Revision request submitted to your designer. We will notify you when the updated preview is ready."
  }
}
```

#### `POST /api/v1/orders/{ref}/approve-design/`
- **Description:** Customer approves the final preview design, advancing order to payment.
- **Access:** Verified Customer (`X-Customer-Token`).
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "customer_facing_status": "Design Approved — Awaiting Payment",
    "payment_required_inr": "999.00",
    "message": "Design approved! Please proceed with payment to activate your celebration link and receive final deliverables."
  }
}
```

---

### 2.4 Developer Workspace & Atomic FIFO Queue

#### `GET /api/v1/workspace/tickets/available/`
- **Description:** Retrieve available unassigned tickets ordered strictly by FIFO eligibility timestamp.
- **Access:** Approved Developer (`DEV_ACTIVE`, `DEV_VIDEO`).
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "ticket_id": "7a8b9c0d-...",
      "ticket_number": "TC-2026-00001",
      "occasion_name": "Marriage / Wedding",
      "package_name": "Premium Marriage Grand",
      "selected_language": "Kannada",
      "eligible_at": "2026-11-09T03:40:00Z",
      "waiting_time_minutes": 25,
      "event_date": "2026-12-14",
      "priority": "NORMAL"
    }
  ]
}
```

#### `POST /api/v1/workspace/tickets/claim-fifo/`
- **Description:** Atomically claim the oldest eligible ticket using row-level locking.
- **Access:** Approved Developer (`DEV_ACTIVE`, `DEV_VIDEO`).
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "ticket_id": "7a8b9c0d-...",
    "ticket_number": "TC-2026-00001",
    "status": "ASSIGNED",
    "assigned_at": "2026-11-09T03:45:00Z",
    "message": "Ticket successfully claimed and assigned to your workspace."
  }
}
```

#### `GET /api/v1/workspace/tickets/assigned/`
- **Description:** Retrieve all active tickets currently assigned to the requesting developer.
- **Access:** Approved Developer.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "ticket_id": "7a8b9c0d-...",
      "ticket_number": "TC-2026-00001",
      "status": "WORK_IN_PROGRESS",
      "customer_name": "Rahul & Sneha",
      "language": "Kannada",
      "due_date": "2026-11-10T12:00:00Z",
      "revisions_count": 0
    }
  ]
}
```

#### `POST /api/v1/workspace/tickets/{id}/designs/`
- **Description:** Upload a design version / preview payload.
- **Access:** Assigned Developer or Admin.
- **Request Body:**
```json
{
  "template_id": "tpl_royal_kannada_01",
  "web_preview_payload": {
    "theme_color": "#800020",
    "accent_color": "#D4AF37",
    "audio_track": "https://r2.domain.com/assets/carnatic_instrumental.mp3",
    "sections": ["HeroCountdown", "MuhurthamSchedule", "CoupleStory", "PhotoGallery", "GoogleMapPin"]
  }
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "design_version": 1,
    "preview_token": "tok_abc123xyz",
    "preview_url": "https://app.techmasters.internal/preview/tok_abc123xyz",
    "ticket_status": "AWAITING_CUSTOMER_RESPONSE"
  }
}
```

---

### 2.5 Payments & Server-Side Verification

#### `POST /api/v1/payments/create-order/`
- **Description:** Initialize payment gateway order after customer design approval.
- **Access:** Verified Customer or Admin.
- **Request Body:**
```json
{
  "order_reference": "TC-2026-00001"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "gateway_provider": "RAZORPAY",
    "gateway_order_id": "order_EKf300000001",
    "amount_inr": "999.00",
    "currency": "INR",
    "key_id": "rzp_live_masked123"
  }
}
```

#### `POST /api/v1/payments/webhook/`
- **Description:** Ingest and verify signed payment gateway webhooks.
- **Access:** Public (Secured by HMAC-SHA256 signature verification).
- **Headers:** `X-Razorpay-Signature: 4a3c2b1e...`
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Payment verified and recorded successfully."
}
```

---

### 2.6 Admin Operations & Publishing Authorization

#### `POST /api/v1/admin/publishing/authorize/`
- **Description:** Super-admin or Ops Manager authorizes final publication on neutral domain.
- **Access:** `OPS_ADMIN`, `SUPER_ADMIN`.
- **Request Body:**
```json
{
  "order_reference": "TC-2026-00001",
  "custom_slug": "rahul-sneha-wedding"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "published_url": "https://celebrations.domain.neutral/rahul-sneha-wedding",
    "qr_code_svg_url": "https://r2.domain.com/deliverables/TC-2026-00001/qr.svg",
    "qr_code_png_url": "https://r2.domain.com/deliverables/TC-2026-00001/qr.png",
    "expires_at": "2027-01-13T23:59:59Z",
    "ticket_status": "CLOSED"
  }
}
```

#### `GET /api/v1/admin/audit-logs/`
- **Description:** Query immutable central audit logs with multi-parameter filtering.
- **Access:** `OPS_ADMIN`, `SUPER_ADMIN`.
- **Query Parameters:** `?module=TICKETS&actor_role=DEV_ACTIVE&status=SUCCESS&limit=50`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 10452,
      "actor_name": "Priya Sharma",
      "actor_role": "DEV_ACTIVE",
      "action": "TICKET_CLAIMED_FIFO",
      "module": "ASSIGNMENTS",
      "record_id": "7a8b9c0d-...",
      "timestamp": "2026-11-09T03:45:00Z",
      "ip_address": "49.207.210.15",
      "status": "SUCCESS"
    }
  ]
}
```

