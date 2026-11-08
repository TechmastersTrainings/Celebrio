# TechMasters Digital Celebrations
## Central Activity & Audit Logging Specification — Version 1.0

---

### Document Control
- **Product Name:** TechMasters Digital Celebrations
- **Document Version:** 1.0
- **Author:** Principal Security Architect & Systems Compliance Officer
- **Baseline Reference:** BRD v1.1, SAD v1.0, FRS v1.0, ERD v1.0

---

## 1. Audit Framework Objectives & Guarantees

The Central Activity Logging engine serves as the single source of truth for all business, operational, and security events across TechMasters Digital Celebrations. It satisfies four non-negotiable guarantees:
1. **Completeness:** Every high-impact user and system action is captured with full context (Actor, Role, Action, Module, Record ID, IP, User-Agent, Result).
2. **State Delta Fidelity:** For entity modifications, the system records structured `JSONB` diffs of before-and-after values, enabling point-in-time state reconstruction.
3. **Immutability:** Audit records are strictly append-only. Application database users have `INSERT` and `SELECT` privileges only; `UPDATE`, `DELETE`, and `TRUNCATE` operations are blocked at the database engine level.
4. **Partitioned Views:**
   - **Super-Admins / Ops Managers:** Unrestricted search across all modules, actors, and state deltas.
   - **Creative Developers:** Scoped view showing only their personal activity and assignment history.
   - **Customers:** View a sanitized, high-level order milestone timeline without developer identities, internal notes, or system errors.

---

## 2. Event Taxonomy & Action Catalog

| Module Code | Action Identifier | Trigger Condition | Captured Data Diff |
| :--- | :--- | :--- | :--- |
| **`AUTH`** | `CUSTOMER_OTP_REQUESTED` | Customer requests OTP for order lookup | Mobile number (masked), order reference, IP. |
| | `CUSTOMER_OTP_VERIFIED` | Customer successfully enters 6-digit OTP | Mobile number, challenge ID, session token ID. |
| | `CUSTOMER_OTP_FAILED` | Incorrect OTP attempt entered | Attempt count, IP address, challenge ID. |
| | `DEVELOPER_REGISTERED` | New developer submits registration | Developer email, name, skills summary. |
| | `DEVELOPER_APPROVED` | Admin approves developer account | Admin ID, Developer ID, previous/new status. |
| | `DEVELOPER_SUSPENDED` | Admin suspends developer account | Admin ID, reason string, timestamp. |
| **`ORDERS`** | `ORDER_CREATED` | Customer submits order intake wizard | Order reference, occasion, package, total amount. |
| | `ASSET_UPLOADED` | Customer or Admin uploads photo/audio | File name, MIME type, size, category. |
| **`TICKETS`** | `TICKET_CLAIMED_FIFO` | Developer claims oldest ticket via FIFO | Developer ID, ticket ID, workload count. |
| | `TICKET_ASSIGNED_MANUAL` | Admin manually assigns ticket | Admin ID, Developer ID, ticket ID, justification. |
| | `TICKET_REASSIGNED` | Admin revokes and reallocates ticket | Previous developer, new developer, reason. |
| | `TICKET_STATUS_CHANGED` | Ticket moves between lifecycle states | Previous status, new status, actor ID, reason. |
| | `INTERNAL_NOTE_ADDED` | Staff member adds internal note | Ticket ID, author ID, note snippet. |
| **`DESIGNS`** | `DESIGN_PREVIEW_UPLOADED` | Developer uploads draft preview | Version number, preview token, theme payload. |
| | `REVISION_REQUESTED` | Customer submits design changes | Revision round, feedback text, billable flag. |
| | `DESIGN_APPROVED` | Customer approves final design draft | Version number, customer token, timestamp. |
| **`VIDEO`** | `VIDEO_TASK_CLAIMED` | Video specialist claims video task | Specialist ID, order ID, task ID. |
| | `VIDEO_RENDER_STARTED` | Celery FFmpeg job initiated | Job ID, resolution, duration preset. |
| | `VIDEO_RENDER_COMPLETED` | Master MP4 rendered and stored | Render duration, file size, R2 key. |
| **`PAYMENTS`** | `PAYMENT_ORDER_CREATED` | Payment gateway order initialized | Gateway order ID, amount, currency. |
| | `PAYMENT_VERIFIED` | Server validates webhook signature | Gateway payment ID, amount settled, payload. |
| | `PAYMENT_FAILED` | Gateway webhook reports failure | Error code, error description, gateway ID. |
| | `REFUND_ISSUED` | Admin executes refund | Refund ID, amount, reason, Admin ID. |
| **`PUBLISHING`**| `PUBLISHING_AUTHORIZED` | Admin authorizes live neutral URL | Admin ID, order reference, slug, expiry date. |
| | `QR_CODE_GENERATED` | Dynamic QR code rendered | SVG/PNG storage key, live URL encoded. |
| | `INVITATION_EXPIRED` | Celery Beat marks invitation expired | Publication ID, event date, view count. |

---

## 3. Database Schema & Immutability Trigger

```sql
-- PostgreSQL Append-Only Enforcement
CREATE OR REPLACE FUNCTION enforce_audit_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutability_trigger
BEFORE UPDATE OR DELETE ON central_activity_logs
FOR EACH ROW EXECUTE FUNCTION enforce_audit_immutability();
```

---

## 4. Central Audit Service Implementation

```python
# Conceptual Audit Service Helper
import json
from django.utils import timezone
from apps.audit.models import CentralActivityLog

def log_activity(actor, role, action, module, record_id, previous_value=None, new_value=None, ip_address=None, user_agent=None, status='SUCCESS', remarks=None):
    """
    Central helper to record an immutable audit log entry.
    """
    return CentralActivityLog.objects.create(
        actor=actor if (actor and actor.is_authenticated) else None,
        actor_role=role,
        action=action,
        module=module,
        record_id=str(record_id),
        previous_value=previous_value if isinstance(previous_value, dict) else {},
        new_value=new_value if isinstance(new_value, dict) else {},
        ip_address=ip_address,
        user_agent=user_agent[:500] if user_agent else None,
        status=status,
        remarks=remarks,
        timestamp=timezone.now()
    )
```

