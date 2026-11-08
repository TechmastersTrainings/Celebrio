# TechMasters Digital Celebrations
## Functional Requirements Specification (FRS) — Version 1.0

---

### Document Control
- **Product Name:** TechMasters Digital Celebrations
- **Document Version:** 1.0
- **Author:** Senior Business Analyst & Product Management Team
- **Baseline Reference:** BRD v1.1 & SAD v1.0

---

## 1. Module FRS-01: Customer Portal & Order Management

### 1.1 Service Catalog & Package Exploration
- **FR-01.1.1:** The customer portal must display all active celebration categories (Birthday, Naming Ceremony, Anniversary, Engagement, Marriage).
- **FR-01.1.2:** Each category must dynamically present its active packages, included features, baseline pricing (retrieved from the database, never hard-coded), and available add-on options (e.g., Video Invitations, Expedited Turnaround).
- **FR-01.1.3:** The UI must display live interactive demo previews of sample invitation websites and card designs for each occasion category.

### 1.2 Customer Order Intake Wizard
- **FR-01.2.1:** Upfront customer registration must NOT be required to initiate an order.
- **FR-01.2.2:** The intake wizard must capture:
  - Customer Information: Primary Contact Name, Mobile Number (mandatory), Email Address (optional).
  - Event Details: Occasion Type, Primary Hosts / Couple / Celebrant Names, Event Dates, Multiple Sub-events (e.g., Sangeet, Muhurtham, Reception) with respective venues, timings, dress codes.
  - Venue Metadata: Venue Name, Detailed Address, Google Maps link or raw GPS coordinates.
  - Multilingual Content: Selected language (English, Kannada, Hindi, Telugu, Marathi, Urdu, Tamil, Malayalam, Bengali, Gujarati, Punjabi), regional ceremony headings, and custom religious invocations.
  - Creative Preferences: Preferred color theme, music genre or custom audio track, and special instructions.
- **FR-01.2.3:** Asset Upload: The wizard must allow multi-file upload for photographs, family portraits, and audio files. File uploads must be validated for type (JPEG, PNG, MP3) and size (max 25MB per photo, 15MB per audio track).
- **FR-01.2.4:** Order Submission: Upon successful submission, the system must generate a unique Order Reference and ticket ID (format: `TC-YYYY-XXXXX`), trigger an automated SMS/WhatsApp confirmation to the customer, and route the order to the internal queue.

### 1.3 Customer Tracking, Preview & Revision Workflow
- **FR-01.3.1:** Order Lookup: Customers can access their order anytime using their Mobile Number + OTP verification + Order Reference.
- **FR-01.3.2:** Status Display: Customers must see a sanitized, customer-friendly status indicator (e.g., "Requirement Confirmed", "Designing in Progress", "Preview Ready for Review", "Awaiting Payment", "Published & Delivered"). Internal developer notes, developer identities, and internal audit logs must never be shown.
- **FR-01.3.3:** Protected Preview Access: When a preview is ready, the customer can launch a tokenized preview of their digital website and download watermarked card drafts.
- **FR-01.3.4:** Revision Requests: Customers can submit specific revision requests (e.g., text correction, photo reordering). The system must track revision counts.
  - Revisions 1 & 2: Free of charge.
  - Revision 3+: Automatically flag order for additional configurable revision billing before further work is performed.
- **FR-01.3.5:** Design Acceptance: Customers can click "Approve Final Design", which locks the design version and transitions the order to the payment step.

### 1.4 Payment Execution & Deliverable Access
- **FR-01.4.1:** Upon design approval, the portal presents the dynamic invoice breakdown (Base Package + Add-ons + Extra Revisions).
- **FR-01.4.2:** Customers initiate payment via the integrated payment gateway checkout modal.
- **FR-01.4.3:** Upon verified payment confirmation AND Admin publishing authorization, the portal unlocks:
  - Neutral public invitation URL (e.g., `neutral-domain.vercel.app/:slug`).
  - High-resolution, unwatermarked digital cards (JPG, PNG, print-ready PDF).
  - Final animated MP4 video invitation (if purchased).
  - Dynamic QR code for sharing and print media.
  - 1-Click WhatsApp share drawer with pre-formatted invitation message and direct link.

---

## 2. Module FRS-02: Developer Workspace & Production Management

### 2.1 Developer Onboarding & Approval Lifecycle
- **FR-02.1.1:** Prospective developers must register via an internal registration portal.
- **FR-02.1.2:** New accounts default to `PENDING_APPROVAL` status with zero workspace privileges.
- **FR-02.1.3:** Unapproved or suspended developers attempting to access the workspace must be blocked with an HTTP 403 Forbidden status.
- **FR-02.1.4:** Only an Admin can approve a developer account, transitioning status to `APPROVED_ACTIVE`.

### 2.2 Available FIFO Queue & Ticket Claiming
- **FR-02.2.1:** The Developer Workspace must provide an "Available Tickets" tab displaying only unclaimed tickets in `NEW_OPEN` status.
- **FR-02.2.2:** Queue Order: Tickets must be sorted strictly in FIFO order (oldest `eligible_at` timestamp first).
- **FR-02.2.3:** Ticket Summary Display: Developer can view occasion type, delivery deadline, package tier, and language. Sensitive customer contact details (phone, email) are obfuscated until claimed.
- **FR-02.2.4:** Atomic Claim Action: The developer clicks "Claim Ticket". The system executes an atomic database transaction with row-level locking (`SELECT ... FOR UPDATE SKIP LOCKED`).
  - If successful: The ticket status transitions to `ASSIGNED`, developer assignment is recorded, and the ticket is immediately removed from the queue for all other developers.
  - If another developer claimed it concurrently: The system returns an immediate notification "Ticket already claimed by another team member" without data corruption.
- **FR-02.2.5:** Workload Throttling: A developer cannot claim a new ticket if their active `WORK_IN_PROGRESS` count reaches the configured threshold (default: 3 active tickets, configurable by Admin).

### 2.3 Production Workspace & Deliverable Management
- **FR-02.3.1:** Assigned Ticket View: Shows full customer brief, ceremonial dates, venue coordinates, regional text strings, and downloadable raw customer photos.
- **FR-02.3.2:** Template Selection & Configuration: Developer selects a base responsive template from the catalog and customizes colors, typography, and section ordering.
- **FR-02.3.3:** Preview Upload: Developer uploads web preview build link or deploys preview assets to the protected staging storage. A watermarked version is generated automatically.
- **FR-02.3.4:** Internal Review Handshake: Developer marks preview as "Ready for Review". If internal review policy is active, an Admin checks it before customer dispatch; otherwise, it dispatches directly to the customer.
- **FR-02.3.5:** Revision Management: When a customer requests changes, the ticket automatically returns to `WORK_IN_PROGRESS` on the developer's board with a badge indicating the revision round and customer notes.
- **FR-02.3.6:** Final Deliverable Upload: Once approved and paid, developer uploads high-resolution cards (JPG, PNG, PDF) and confirms public website build readiness.

---

## 3. Module FRS-03: Video Production Sub-System

### 3.1 Permission-Gated Video Assignment
- **FR-03.1.1:** Video invitations are managed as distinct `VideoTask` records linked to the parent order.
- **FR-03.1.2:** Only developers with explicit Admin-granted `can_produce_video = True` can view or claim video production tasks.
- **FR-03.1.3:** Video tasks maintain their own FIFO queue and lifecycle states: `QUEUED`, `ASSIGNED`, `IN_RENDER`, `PREVIEW_READY`, `APPROVED`, `COMPLETED`.

### 3.2 Media Composition & Preview Pipeline
- **FR-03.2.1:** Video specialist accesses approved event photos, ceremonial details, and customer-selected music preferences.
- **FR-03.2.2:** Media processing is offloaded to the asynchronous Celery FFmpeg worker to render multi-slide animated sequences with Ken Burns effects, typography transitions, and audio sync.
- **FR-03.2.3:** Video previews must automatically embed a dynamic semi-transparent watermark ("PREVIEW ONLY - TECHMASTERS") across the video stream.
- **FR-03.2.4:** Upon final customer approval and verified payment, the clean 1080p MP4 master is rendered and stored in the deliverables bucket.

---

## 4. Module FRS-04: Admin Portal & Operational Governance

### 4.1 Developer Management & RBAC Oversight
- **FR-04.1.1:** Admin can view all developer registrations, inspect developer profiles, and execute actions: `APPROVE`, `REJECT`, `SUSPEND`, `REACTIVATE`.
- **FR-04.1.2:** Admin can toggle developer specialized permissions, specifically `can_produce_video` and `max_active_tickets`.

### 4.2 Queue Monitoring & Operational Overrides
- **FR-04.2.1:** Live Queue Dashboard: Displays all tickets grouped by status, waiting times, and SLA indicators (Green: on track, Amber: approaching SLA, Red: breached).
- **FR-04.2.2:** Manual Reassignment: Admin can reassign any ticket from one developer to another or release a stalled ticket back into the public FIFO queue, appending an immutable audit record with justification.

### 4.3 Catalog, Pricing & Package Configuration
- **FR-04.3.1:** Dynamic Packages: Admin can create, edit, activate, or archive packages for any occasion category.
- **FR-04.3.2:** Price Governance: Admin can adjust package base prices, add-on prices, extra revision fees, and expedited delivery rates. Changes take effect on new orders immediately without altering existing locked orders.

### 4.4 Financial Verification & Publishing Gatekeeper
- **FR-04.4.1:** Payment Audit: Admin can view all gateway transaction logs, verify matching webhook payloads, inspect settlement amounts, and process refunds.
- **FR-04.4.2:** Publishing Authorization: A final celebration website CANNOT be published publicly solely through automated scripts. Admin must review and grant `AUTHORIZE_PUBLISHING` flag, ensuring quality and copyright compliance.

---

## 5. Module FRS-05: ServiceNow-Style Ticketing System

### 5.1 Ticket Identification & Structure
- **FR-05.1.1:** Every order generates a strictly formatted Ticket ID: `TC-YYYY-XXXXX` (e.g., `TC-2026-00001`), where `YYYY` is the current year and `XXXXX` is a sequential 5-digit zero-padded number.
- **FR-05.1.2:** A ticket encapsulates:
  - Identification: Ticket ID, UUID, Order Reference.
  - Lifecycle: Current Ticket Status, Assignment Timestamp, SLA Due Date.
  - Entities: Customer Reference, Assigned Developer Reference, Video Specialist Reference.
  - Context: Occasion Type, Package Details, Raw Assets, Design Versions, Revision History.
  - Collaboration: Internal Notes (staff-only), Customer Communications Log, Activity Timeline.

### 5.2 State Machine Enforcement
- **FR-05.2.1:** State transitions must strictly follow the authorized state machine graph (detailed in Document 05). Illegal transitions (e.g. from `NEW_OPEN` straight to `PAYMENT_DONE`) must be rejected with HTTP 400 Validation Error.
- **FR-05.2.2:** Every transition automatically generates an activity log entry capturing actor, previous state, new state, timestamp, and optional remarks.

---

## 6. Module FRS-06: Neutral Publishing, Slugs & Expiry

### 6.1 Unbranded Neutral URL Architecture
- **FR-06.1.1:** Published customer invitations must be served from an unbranded neutral domain (e.g., `neutral-domain.vercel.app/:slug` or a neutral custom domain).
- **FR-06.1.2:** Slugs are auto-generated from host/couple names and validated for uniqueness (e.g., `/rahul-priya-wedding`, `/aarav-first-birthday`).

### 6.2 Dynamic QR Code Generation
- **FR-06.2.1:** Upon publication, the system generates high-resolution SVG and PNG QR codes encoding the final live invitation URL with error-correction level 'H' (allows custom center icon embedding).

### 6.3 Automated Event Expiration Controller
- **FR-06.3.1:** Each published invitation stores an `expires_at` timestamp calculated as:
  $$\text{expires\_at} = \text{event\_date} + \text{grace\_period\_days (default: 30)}$$
- **FR-06.3.2:** Celery Beat hourly job scans for expired invitations and flips status to `EXPIRED`.
- **FR-06.3.3:** When an expired invitation is visited, the public page displays a polite event conclusion notice ("This celebration has concluded. Thank you for your warm wishes.") rather than breaking with a 404 or exposing raw backend errors.
- **FR-06.3.4:** Expiration never purges transaction history, audit trails, or order records. Admin can extend or reactivate an expired invitation if requested.

