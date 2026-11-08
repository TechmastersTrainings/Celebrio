# TechMasters Digital Celebrations
## Production Platform & Service Delivery Engine

> A specialized business vertical of **TechMasters Innovations Private Limited**.

---

## 1. Project Overview

TechMasters Digital Celebrations is an enterprise-grade digital invitation service management and production platform featuring a lightweight ServiceNow-style ticketing system and an automated First-In, First-Out (FIFO) self-assignment engine.

### Three Primary Portals:
1. **Customer Portal:** Frictionless order intake (no mandatory upfront registration), multi-event ceremonial scheduling, asset onboarding, tokenized protected preview review, revision management (2 free rounds), secure payment execution, and deliverable downloads.
2. **Developer Workspace:** Protected workspace for verified TechMasters creative developers. Includes atomic FIFO queue claiming, active workload boards, template and theme customizer, watermarked preview uploader, and video task processing.
3. **Admin Portal:** Central operational headquarters for super-admins and operations managers. Controls developer account approvals/suspensions, queue telemetry, manual ticket overrides, dynamic package pricing, payment auditing, publishing authorization, and immutable audit logs.

---

## 2. Technical Documentation Library

All 14 foundational architectural specifications are preserved under [`docs/`](./docs):
- [01. Business Requirements Document (BRD v1.1)](./docs/01_BUSINESS_REQUIREMENTS_DOCUMENT.md)
- [02. System Architecture Document (SAD)](./docs/02_SYSTEM_ARCHITECTURE_DOCUMENT.md)
- [03. Functional Requirements Specification](./docs/03_FUNCTIONAL_REQUIREMENTS_SPECIFICATION.md)
- [04. Role and Permission Matrix (RBAC & PBAC)](./docs/04_ROLE_AND_PERMISSION_MATRIX.md)
- [05. Ticket Lifecycle & State Transition Spec](./docs/05_TICKET_LIFECYCLE_AND_STATE_TRANSITIONS.md)
- [06. FIFO Assignment Logic & Concurrency Engine](./docs/06_FIFO_ASSIGNMENT_LOGIC.md)
- [07. Database Design & Entity Relationship Diagram (ERD)](./docs/07_DATABASE_DESIGN_AND_ERD.md)
- [08. API Contract & OpenAPI Specification](./docs/08_API_SPECIFICATION.md)
- [09. UI/UX Sitemap & Screen Wireframe Specifications](./docs/09_UI_UX_SITEMAP_AND_SCREENS.md)
- [10. Security Architecture & Threat Mitigation](./docs/10_SECURITY_ARCHITECTURE.md)
- [11. Central Immutable Activity & Audit Logging](./docs/11_AUDIT_AND_ACTIVITY_LOGGING.md)
- [12. Deployment Architecture & Infrastructure Spec](./docs/12_DEPLOYMENT_ARCHITECTURE.md)
- [13. Development Roadmap](./docs/13_DEVELOPMENT_ROADMAP.md)
- [14. Testing Strategy & Acceptance Criteria](./docs/14_TESTING_AND_ACCEPTANCE_CRITERIA.md)

---

## 3. Technology Stack

- **Frontend:** React 18, Vite, TypeScript, Plain CSS with Custom Properties (Design Tokens).
- **Backend:** Python 3.12+, Django 5.x, Django REST Framework, SimpleJWT.
- **Database:** PostgreSQL 16+ (Local development supports SQLite out-of-the-box).
- **Asynchronous & Video Worker:** Celery, Redis, FFmpeg 6.x.
- **Storage:** Cloudflare R2 (S3-compatible, Zero-Egress).
- **Deployment:** Vercel (Frontend & Neutral Public Invitations), Containerized Linux (Backend API & Video Worker).

---

## 4. Repository Structure

```
.
├── .env.example              # Environment variables template with placeholders
├── .gitignore                # Comprehensive Git exclusions (venv, node_modules, secrets)
├── README.md                 # Complete system documentation and execution guide
├── docker-compose.yml        # Multi-container orchestration (DB, Redis, API, Video Worker)
├── vercel.json               # Edge routing configuration for Vercel deployment
├── docs/                     # 14 Approved Technical Architecture Specifications
│   ├── 01_BUSINESS_REQUIREMENTS_DOCUMENT.md
│   ├── 02_SYSTEM_ARCHITECTURE_DOCUMENT.md
│   ├── ...
│   └── 14_TESTING_AND_ACCEPTANCE_CRITERIA.md
├── backend/                  # Django REST Framework Backend Core
│   ├── Dockerfile            # Container definition with FFmpeg multimedia support
│   ├── manage.py             # Administrative CLI
│   ├── requirements.txt      # Python dependencies
│   ├── celebrio/             # Django root configuration & WSGI/ASGI/Celery setup
│   ├── apps/                 # Modular application domain packages
│   │   ├── accounts/         # Identity, RBAC, Customer OTP, Developer Profiles
│   │   ├── catalog/          # Occasions, Packages, Add-ons, Dynamic Pricing
│   │   ├── orders/           # Intake Wizard, Multi-Events, Customer Assets
│   │   ├── tickets/          # ServiceNow-Style Ticketing & State Machine
│   │   ├── assignments/      # Concurrency-Safe Atomic FIFO Assignment Engine
│   │   ├── designs/          # Design Versions, Watermarked Drafts, Revisions
│   │   ├── video_production/ # Video Tasks & FFmpeg Composition Pipeline
│   │   ├── payments/         # Payment Orders, Webhooks, Signature Verification
│   │   ├── publishing/       # Neutral Slugs, Dynamic QR Codes, Expiry Monitor
│   │   └── audit/            # Central Immutable Activity & Audit Logger
│   └── tests/                # Automated Acceptance & Concurrency Test Suites
└── frontend/                 # React 18 + Vite + TypeScript Application
    ├── index.html            # Application entry HTML with Indic typography
    ├── package.json          # Node dependencies and build scripts
    ├── tsconfig.json         # TypeScript compiler configuration
    ├── vite.config.ts        # Vite build tool and API reverse proxy settings
    └── src/
        ├── index.css         # Plain CSS design tokens (Gold, Maroon, Slate)
        ├── types/            # TypeScript domain interfaces
        ├── services/         # Typed API clients for backend communication
        ├── components/       # Shared UI components (Navbar, Footer)
        └── pages/            # Multi-portal page controllers
            ├── customer/     # Catalog, Order Wizard, Tracking, Deliverables
            ├── workspace/    # Developer FIFO Queue, Studio, Video Tasks
            ├── admin/        # Operations Command Center & Audit Explorer
            └── public/       # Unbranded Neutral Celebration Viewer
```

---

## 5. Local Setup & Environment Configuration

### 5.1 Environment Configuration
Copy the configuration template to `.env`:
```bash
cp .env.example .env
```
Ensure secret keys and initial seed credentials are appropriately configured in `.env`.

### 5.2 Backend Setup (Mac / Linux)
```bash
# 1. Activate virtual environment
source venv/bin/activate

# 2. Run database migrations
cd backend
python manage.py migrate

# 3. Seed initial catalog, add-ons, and staff accounts
python manage.py seed_catalog

# 4. Start backend development server (Port 8000)
python manage.py runserver 8000
```

### 5.3 Backend Setup (Windows)
```cmd
REM 1. Activate virtual environment
venv\Scripts\activate

REM 2. Run database migrations
cd backend
python manage.py migrate

REM 3. Seed initial catalog, add-ons, and staff accounts
python manage.py seed_catalog

REM 4. Start backend development server
python manage.py runserver 8000
```

### 5.4 Frontend Setup
```bash
# Navigate to frontend and start Vite development server
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173`.

---

## 6. Staff Accounts & Access Management

Initial staff accounts are created via `python manage.py seed_catalog`:

| Role | Email Address | Access Level |
| :--- | :--- | :--- |
| **Super Admin** | Configured via `SEED_ADMIN_EMAIL` | Full system governance, approvals, pricing, publishing authorization, and audit logs. |
| **Approved Developer** | `priya.dev@techmasters.internal` | Active workspace access, FIFO ticket claims, design uploads. |
| **Video Specialist** | `vikram.video@techmasters.internal` | Active workspace access + `can_produce_video = True`. |

*Note: Initial passwords are read from `SEED_ADMIN_PASSWORD` and `SEED_DEV_PASSWORD` in your `.env` file, or generated cryptographically during seeding. Previously disclosed development passwords must be rotated.*

---

## 7. Testing & Verification

Execute the automated test harness:
```bash
source venv/bin/activate
cd backend
python manage.py test tests
```

### Concurrency Stress Test Verification
The test suite includes `FIFOConcurrencyStressTests` in `backend/tests/test_platform.py` which spawns 5 concurrent worker threads claiming a single ticket simultaneously. The test guarantees that exactly 1 claim succeeds and 4 receive clean queue-empty errors with zero race conditions or duplicate assignments.

---

## 8. Deployment

- **Frontend & Neutral Public Invitations:** Configured for Vercel via [`vercel.json`](./vercel.json).
- **Backend & Worker Containers:** Orchestrated via [`docker-compose.yml`](./docker-compose.yml) and [`backend/Dockerfile`](./backend/Dockerfile).
