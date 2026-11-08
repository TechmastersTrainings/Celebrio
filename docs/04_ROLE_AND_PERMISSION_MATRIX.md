# TechMasters Digital Celebrations
## Role and Permission Matrix (RBAC & PBAC) — Version 1.0

---

### Document Control
- **Product Name:** TechMasters Digital Celebrations
- **Document Version:** 1.0
- **Author:** Principal Security Architect & Lead Backend Engineer
- **Baseline Reference:** BRD v1.1, SAD v1.0, FRS v1.0

---

## 1. System Role Definitions

| Role Identifier | Role Name | Type | Description |
| :--- | :--- | :--- | :--- |
| **`ANON_GUEST`** | Anonymous Visitor | External | Public visitor browsing celebration packages, demo invitations, or viewing an active published celebration website. |
| **`AUTH_CUSTOMER`** | Verified Customer | External | Host/celebrant authenticated via Mobile Number + 6-digit OTP and bound to one or more specific Order References. |
| **`DEV_PENDING`** | Pending Developer | Internal | TechMasters internal designer who has registered but has not yet been approved by an Administrator. Has ZERO access to the workspace or tickets. |
| **`DEV_ACTIVE`** | Approved Creative Developer | Internal | Verified TechMasters creative developer who can claim tickets via FIFO, design web invitations, and upload design versions. |
| **`DEV_VIDEO`** | Video Production Specialist | Internal | Approved Creative Developer who has additionally been granted the granular `CAN_PRODUCE_VIDEO` capability flag by an Admin. |
| **`OPS_ADMIN`** | Operations Administrator | Internal | TechMasters operations lead responsible for developer approvals, queue balance, payment audits, and publishing authorization. |
| **`SUPER_ADMIN`** | System Super Administrator | Internal | TechMasters engineering leads with unrestricted operational, infrastructural, and audit privileges. |

---

## 2. Granular Capability Flags (PBAC)

In addition to base roles, TechMasters enforces Permission-Based Access Control (PBAC) via granular boolean flags on user profiles:
- `can_claim_fifo_tickets`: Permits the user to invoke the atomic FIFO ticket claiming endpoint.
- `can_produce_video`: Permits the user to view the video task queue, claim video tasks, and submit video renders.
- `can_authorize_publishing`: Permits the user to activate the final public celebration URL on the neutral domain.
- `can_manage_pricing`: Permits updating package prices, revision tiers, and add-on costs.
- `can_manage_developers`: Permits approving, suspending, and editing developer access profiles.
- `can_view_audit_logs`: Permits querying and filtering the central immutable audit log.
- `can_manage_financials`: Permits viewing business revenue reports, inspecting payment gateway webhooks, and issuing refunds.

---

## 3. Comprehensive Role & Permission Matrix

> **Legend:**
> - **C:** Create / Submit
> - **R:** Read / View
> - **U:** Update / Edit
> - **D:** Delete / Archive
> - **OWN:** Permitted only for records owned by or directly assigned to the user
> - **X:** Denied / Forbidden (HTTP 403)

| Functional Domain / Resource | Action / Resource Target | `ANON_GUEST` | `AUTH_CUSTOMER` | `DEV_PENDING` | `DEV_ACTIVE` | `DEV_VIDEO` | `OPS_ADMIN` | `SUPER_ADMIN` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Catalog & Packages** | View Public Packages & Demos | R | R | R | R | R | R | R |
| | Create / Edit Packages & Prices | X | X | X | X | X | CRUD | CRUD |
| **Orders & Enquiries** | Submit Order Intake Wizard | C | C | X | X | X | C (Assisted) | C (Assisted) |
| | View Order Details & Progress | X | R (OWN) | X | R (OWN Ticket) | R (OWN Video) | R (ALL) | R (ALL) |
| | Upload Customer Photos & Assets | X | C / U (OWN) | X | X | X | C / U (Assisted) | C / U |
| **ServiceNow-Style Tickets**| View Available FIFO Queue | X | X | X | R (Queue Only) | R (Queue Only) | R (ALL) | R (ALL) |
| | Claim Ticket (Atomic FIFO) | X | X | X | C (FIFO Rules) | C (FIFO Rules) | X (Manual Assign) | X (Manual Assign) |
| | View Assigned Ticket Details | X | X | X | R (OWN) | R (OWN) | R (ALL) | R (ALL) |
| | Update Ticket Status | X | X | X | U (Permitted States)| U (Permitted States)| U (ALL States)| U (ALL States)|
| | Manually Reassign / Override Ticket | X | X | X | X | X | U (Any Ticket)| U (Any Ticket)|
| | Add Internal Staff Notes | X | X | X | C / R (OWN Ticket)| C / R (OWN Ticket)| C / R (ALL)| C / R (ALL)|
| | View Internal Staff Notes | X | X | X | R (OWN Ticket) | R (OWN Ticket) | R (ALL) | R (ALL) |
| **Design & Previews** | Upload Design Draft / Preview | X | X | X | C / U (OWN Ticket)| C / U (OWN Ticket)| C / U (ALL)| C / U (ALL)|
| | View Watermarked Draft Preview | X | R (OWN Order) | X | R (OWN Ticket) | R (OWN Ticket) | R (ALL) | R (ALL) |
| | Submit Revision Request | X | C (OWN Order) | X | X | X | C (On Behalf) | C (On Behalf) |
| | Approve Final Design | X | U (OWN Order) | X | X | X | U (On Behalf) | U (On Behalf) |
| **Video Production** | View Video Production Queue | X | X | X | X | R | R (ALL) | R (ALL) |
| | Claim Video Task | X | X | X | X | C (FIFO) | U (Manual Assign)| U (Manual Assign)|
| | Upload MP4 Video Draft | X | X | X | X | C / U (OWN) | C / U (ALL)| C / U (ALL)|
| **Payments** | Initiate Payment via Gateway | X | C (OWN Order) | X | X | X | C (On Behalf) | C (On Behalf) |
| | Verify Payment Webhook (Server) | X | X | X | X | X | R / Audit | R / Audit |
| | View Financial Revenue Reports | X | X | X | X | X | R | R |
| | Issue Refund | X | X | X | X | X | C / U | C / U |
| **Publishing & Expiry** | Authorize Public URL Publishing | X | X | X | X | X | U | U |
| | Access Live Published Invitation | R (Live Only)| R (Live Only) | R (Live Only)| R (Live Only) | R (Live Only) | R (ALL) | R (ALL) |
| | Extend / Reactivate Expiry Date | X | X | X | X | X | U | U |
| **Developer Governance** | Register Developer Account | C | X | X | X | X | X | X |
| | Approve / Suspend Developer | X | X | X | X | X | U | U |
| | Grant Video Production Perm | X | X | X | X | X | U | U |
| **Central Audit Logging** | View Immutable Audit Logs | X | X | X | R (OWN History)| R (OWN History)| R (ALL) | R (ALL) |
| | Edit or Delete Audit Logs | **FORBIDDEN**| **FORBIDDEN** | **FORBIDDEN** | **FORBIDDEN** | **FORBIDDEN** | **FORBIDDEN**| **FORBIDDEN** |

---

## 4. Enforcement Architecture in Code (Django REST Framework)

Access control is enforced declaratively using custom DRF permission classes:

```python
# Conceptual Implementation Blueprint
from rest_framework.permissions import BasePermission

class IsAdminUserRole(BasePermission):
    """Enforces that the authenticated user has OPS_ADMIN or SUPER_ADMIN role."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and request.user.role in ['OPS_ADMIN', 'SUPER_ADMIN']
        )

class IsApprovedDeveloper(BasePermission):
    """Enforces that developer account has been explicitly approved by Admin."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and request.user.role in ['DEV_ACTIVE', 'DEV_VIDEO']
            and request.user.approval_status == 'APPROVED_ACTIVE'
        )

class CanProduceVideoPermission(BasePermission):
    """Enforces video production authorization flag."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated 
            and request.user.can_produce_video is True
        )

class IsAssignedDeveloperOrAdmin(BasePermission):
    """Enforces object-level isolation: developers can only access their assigned tickets."""
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['OPS_ADMIN', 'SUPER_ADMIN']:
            return True
        return obj.assigned_developer == request.user

class IsVerifiedCustomerOwner(BasePermission):
    """Enforces customer isolation: customer can only access their authenticated orders."""
    def has_object_permission(self, request, view, obj):
        # Customer verified via session mobile and order reference
        customer_session = getattr(request, 'customer_session', None)
        return customer_session and customer_session.mobile == obj.customer_mobile
```

