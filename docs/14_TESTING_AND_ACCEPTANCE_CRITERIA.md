# TechMasters Digital Celebrations
## Testing Strategy & Acceptance Criteria — Version 1.0

---

### Document Control
- **Product Name:** TechMasters Digital Celebrations
- **Document Version:** 1.0
- **Author:** Principal QA Architect & Senior Full-Stack Test Lead
- **Baseline Reference:** BRD v1.1, Section 22 Acceptance Criteria

---

## 1. Testing Strategy Overview

The testing framework covers four distinct quality vectors:
1. **Unit & Integration Tests:** Django TestCase and pytest suites validating domain models, serializers, service layers, and state machines.
2. **Concurrency & Load Tests:** Multi-threaded stress testing simulating concurrent developers claiming the same FIFO ticket at the exact millisecond.
3. **Security & Boundary Penetration Tests:** Automated verification of object-level isolation (anti-IDOR), role boundaries, unapproved developer lockout, and payment webhook signature tampering.
4. **End-to-End User Journey Tests:** Playwright/Cypress end-to-end flows validating Customer, Developer, and Admin portals.

---

## 2. Release Acceptance Criteria Matrix (22 Mandatory Requirements)

| # | Acceptance Requirement | Test Case Identifier | Verification Mechanism | Success Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **AC-01** | Customer can submit an order | `TC-E2E-001` | Post valid intake payload to `/api/v1/orders/`. | Returns HTTP 201; Order stored in DB with `SUBMITTED` state; Order reference returned. |
| **AC-02** | Unique ticket is generated | `TC-INT-002` | Verify ticket generation on order intake. | Generates matching `TC-2026-XXXXX` ticket record; 1-to-1 foreign key established. |
| **AC-03** | Ticket appears in Admin monitoring | `TC-E2E-003` | Query `/api/v1/admin/tickets/` as Admin. | Newly created ticket is visible in Admin queue telemetry with `NEW_OPEN` status. |
| **AC-04** | Admin can approve developer accounts | `TC-INT-004` | Register developer, then Admin calls `/api/v1/admin/developers/:id/approve/`. | Status transitions from `PENDING_APPROVAL` to `APPROVED_ACTIVE`; approved_by_id recorded. |
| **AC-05** | Approved developer can access workspace | `TC-SEC-005` | Attempt workspace API call as Pending Dev vs Approved Dev. | Pending Dev receives HTTP 403 Forbidden; Approved Dev receives HTTP 200 OK. |
| **AC-06** | Developer can claim ticket through FIFO | `TC-INT-006` | Approved dev calls `/api/v1/workspace/tickets/claim-fifo/`. | Oldest eligible ticket is assigned; status moves to `ASSIGNED`; removed from open queue. |
| **AC-07** | Duplicate claims are prevented | `TC-CONC-007` | Spawn 10 concurrent threads claiming 1 available ticket simultaneously. | Exactly 1 thread receives 200 OK; 9 threads receive 404 Not Found; ZERO duplicate claims. |
| **AC-08** | Developer can upload designs & previews | `TC-INT-008` | Post draft payload to `/api/v1/workspace/tickets/:id/designs/`. | Design version created; preview token generated; ticket moves to `AWAITING_CUSTOMER_RESPONSE`. |
| **AC-09** | Ticket moves through defined lifecycle | `TC-UNIT-009` | Transition ticket across state graph; attempt illegal jump (e.g. `NEW_OPEN` -> `CLOSED`). | Legal transitions succeed and log history; illegal jump raises HTTP 400 Validation Error. |
| **AC-10** | Customer previews and revisions work | `TC-E2E-010` | Customer submits revision request via `/api/v1/orders/:ref/revisions/`. | Revision counter increments; Round 1 & 2 marked free; Round 3 marked billable; dev notified. |
| **AC-11** | Customer approval works | `TC-E2E-011` | Customer calls `/api/v1/orders/:ref/approve-design/`. | Design marked `APPROVED_BY_CUSTOMER`; design version locked; ticket moves to `AWAITING_PAYMENT`. |
| **AC-12** | Payment verified server-side | `TC-SEC-012` | Post valid HMAC-signed webhook vs tampered signature webhook. | Tampered signature returns HTTP 401 Unauthorized; valid signature marks payment verified. |
| **AC-13** | Admin can authorise final publication | `TC-INT-013` | Admin calls `/api/v1/admin/publishing/authorize/` on verified paid order. | Generates neutral slug; activates publication record; transitions ticket to `CLOSED`. |
| **AC-14** | Invitation URL and QR code generated | `TC-INT-014` | Inspect publication payload post-authorization. | Valid neutral URL returned; vector SVG and high-res PNG QR codes stored and linked. |
| **AC-15** | Invitation expiry works | `TC-UNIT-015` | Run Celery Beat expiry task with mock past event date (`now > event_date + grace`). | Status flipped to `EXPIRED`; public URL displays concluded celebration message. |
| **AC-16** | Video production assigned to authorized staff | `TC-SEC-016` | Developer without `can_produce_video` attempts video claim. | Returns HTTP 403 Forbidden; video specialist with permission claims successfully. |
| **AC-17** | Customer receives final deliverables | `TC-E2E-017` | Access `/api/v1/orders/:ref/deliverables/` before vs after publication. | Returns HTTP 403 before payment/publishing; returns full download URLs after publishing. |
| **AC-18** | Admin can monitor all operations | `TC-E2E-018` | Query dashboard metrics endpoint as Admin. | Returns comprehensive real-time counts across all queues, developers, and revenues. |
| **AC-19** | Central audit records every significant action | `TC-SEC-019` | Query `/api/v1/admin/audit-logs/` after completing test lifecycle. | Contains structured audit entries for order, claim, status, review, payment, and publish. |
| **AC-20** | Role and permission boundaries enforced | `TC-SEC-020` | Attempt developer access to Admin pricing API or peer developer tickets. | Returns HTTP 403 Forbidden; object-level scoping strictly prevents cross-tenant access. |
| **AC-21** | System passes integration testing | `TC-INT-021` | Execute full test suite `pytest --cov=apps`. | 100% test pass rate with zero regression or unhandled exceptions. |

---

## 3. Concurrency Stress Test Specification (Zero Duplicate Claims)

```python
# Concurrency Verification Test Script
import concurrent.futures
from django.test import TransactionTestCase
from apps.tickets.models import Ticket, TicketStatus
from apps.accounts.models import User, DeveloperProfile
from apps.assignments.services import claim_next_fifo_ticket

class FIFOConcurrencyTestCase(TransactionTestCase):
    def setUp(self):
        # Create single ticket
        self.ticket = Ticket.objects.create(
            ticket_number="TC-2026-TEST01",
            status=TicketStatus.NEW_OPEN
        )
        # Create 5 approved developers
        self.devs = []
        for i in range(5):
            u = User.objects.create_user(
                email=f"dev{i}@test.com", password="password123",
                role="DEV_ACTIVE"
            )
            DeveloperProfile.objects.create(
                user=u, approval_status="APPROVED_ACTIVE"
            )
            self.devs.append(u)

    def test_concurrent_fifo_claims(self):
        """Verify that out of 5 concurrent claims, exactly 1 succeeds and 4 fail cleanly."""
        results = []
        
        def attempt_claim(dev_user):
            try:
                t = claim_next_fifo_ticket(dev_user)
                return ("SUCCESS", t.id, dev_user.email)
            except Exception as e:
                return ("FAILED", str(e), dev_user.email)

        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            futures = [executor.submit(attempt_claim, dev) for dev in self.devs]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

        successes = [r for r in results if r[0] == "SUCCESS"]
        failures = [r for r in results if r[0] == "FAILED"]

        self.assertEqual(len(successes), 1, "Exactly one developer must claim the ticket.")
        self.assertEqual(len(failures), 4, "Four developers must receive queue-empty errors.")
```

