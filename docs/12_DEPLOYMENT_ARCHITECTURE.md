# TechMasters Digital Celebrations
## Deployment Architecture & Infrastructure Specification — Version 1.0

---

### Document Control
- **Product Name:** TechMasters Digital Celebrations
- **Document Version:** 1.0
- **Author:** Principal DevOps & Cloud Infrastructure Architect
- **Baseline Reference:** BRD v1.1, SAD v1.0

---

## 1. Cloud Infrastructure & Hosting Topology

```mermaid
flowchart TB
    subgraph Edge Layer [Global Edge CDN]
        V_EDGE[Vercel Edge Network / DNS]
        CF_R2_EDGE[Cloudflare Edge / R2 CDN]
    end

    subgraph Frontend Tier [Vercel Managed Hosting]
        V_APP[React + Vite Single Page Application<br/>Customer + Workspace + Admin Portals]
        V_NEUTRAL[Neutral Public Invitation App<br/>neutral-celebrations.vercel.app/:slug]
    end

    subgraph Backend Application Tier [Containerized Linux Node]
        NGINX_REV[NGINX Reverse Proxy / SSL Termination]
        GUNICORN[Gunicorn WSGI Server<br/>Django REST Framework 5.x]
    end

    subgraph Async Compute Tier [Worker Nodes]
        CELERY_DEF[Celery Default Worker<br/>Emails, SMS, QR Codes, Webhooks]
        CELERY_VID[Celery Video Worker Container<br/>Ubuntu + FFmpeg 6.x + Libx264]
        CELERY_BEAT[Celery Beat Cron Scheduler<br/>Hourly Expiry & SLA Monitor]
    end

    subgraph Managed Data Tier
        PG_DB[(Managed PostgreSQL 16<br/>Connection Pooled via PgBouncer)]
        REDIS_CACHE[(Managed Redis 7.x<br/>Celery Broker & Rate Limiting)]
        R2_BUCKET[(Cloudflare R2 Object Storage<br/>Assets, Previews, Master Deliverables)]
    end

    V_EDGE --> V_APP & V_NEUTRAL
    V_APP & V_NEUTRAL --> NGINX_REV
    NGINX_REV --> GUNICORN

    GUNICORN --> PG_DB & REDIS_CACHE
    CELERY_DEF & CELERY_VID & CELERY_BEAT --> REDIS_CACHE
    CELERY_DEF & CELERY_VID --> PG_DB
    CELERY_DEF & CELERY_VID --> R2_BUCKET
    GUNICORN --> R2_BUCKET
    CF_R2_EDGE --> R2_BUCKET
```

---

## 2. Component Specifications

### 2.1 Frontend Hosting: Vercel
- **Repository Setup:** GitHub monorepo or dedicated frontend directory (`frontend/`).
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Routing Configuration (`vercel.json`):**
  - Path rewrites ensuring client-side SPA routing for `/customer/*`, `/workspace/*`, and `/admin/*`.
  - Dynamic path matching for public neutral invitations: `/:slug` routes to the lightweight invitation viewer component.
  - Strict security headers injected at edge:
    - `X-Frame-Options: SAMEORIGIN` (except for preview emulator sandbox)
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy: strict-origin-when-cross-origin`

### 2.2 Backend Hosting: Containerized Linux Environment
- **Runtime:** Python 3.12+ inside an optimized multi-stage Docker container (`python:3.12-slim`).
- **Process Manager:** `gunicorn celebrio.wsgi:application --workers 4 --threads 2 --bind 0.0.0.0:8000`.
- **Reverse Proxy:** NGINX terminating TLS, enforcing request rate limits (`limit_req_zone`), and proxying static/media routes.

### 2.3 Object Storage: Cloudflare R2
- S3-compatible API with zero egress fees.
- **Buckets:**
  - `celebrio-prod-raw`: Customer photos, family assets, uploaded audio (Private, authenticated access only).
  - `celebrio-prod-previews`: Watermarked review images and video drafts (Accessed via 15-minute signed URLs).
  - `celebrio-prod-deliverables`: Final print-ready cards, MP4 video invitations, and QR codes.

### 2.4 Video Rendering Cluster (FFmpeg Worker)
- Dedicated Docker container with hardware acceleration and pre-installed multimedia packages:
  - `ffmpeg`, `libx264`, `libmp3lame`, `libfontconfig1`, `fonts-noto-core`.
- Isolated Celery queue:
  ```bash
  celery -A celebrio worker -Q video_render -c 2 --loglevel=info
  ```

---

## 3. Environment Variables Reference

### Backend (`backend/.env`)
```bash
# Security & Django Core
DEBUG=False
SECRET_KEY=production-crypto-secure-secret-key-min-50-chars
ALLOWED_HOSTS=api.techmasters.internal,neutral-celebrations.vercel.app,localhost

# Database (PostgreSQL)
DATABASE_URL=postgres://celebrio_user:secure_password@postgres-host:5432/celebrio_db
CONN_MAX_AGE=600

# Cache & Broker (Redis)
REDIS_URL=redis://:redis_password@redis-host:6379/0

# Object Storage (Cloudflare R2 / S3)
R2_ACCOUNT_ID=cloudflare_account_id_here
R2_ACCESS_KEY_ID=r2_access_key_here
R2_SECRET_ACCESS_KEY=r2_secret_key_here
R2_BUCKET_NAME=celebrio-prod-deliverables
R2_ENDPOINT_URL=https://<account_id>.r2.cloudflarestorage.com

# Payment Gateway (Agnostic / Razorpay Seed)
PAYMENT_GATEWAY_PROVIDER=RAZORPAY
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=razorpay_secret_key_here
RAZORPAY_WEBHOOK_SECRET=razorpay_webhook_secret_here

# SMS & WhatsApp Gateway (MSG91 / Twilio)
SMS_GATEWAY_API_KEY=sms_provider_api_key
WHATSAPP_API_TOKEN=meta_or_partner_token

# Platform URLs
PUBLIC_INVITATION_BASE_URL=https://celebrations.domain.neutral
FRONTEND_APP_URL=https://app.techmasters.internal
```

### Frontend (`frontend/.env`)
```bash
VITE_API_BASE_URL=https://api.techmasters.internal/api/v1
VITE_NEUTRAL_INVITATION_BASE_URL=https://celebrations.domain.neutral
VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
```

---

## 4. Local Development Execution Guide (Mac / Linux / Windows)

### 4.1 Backend Setup
```bash
# Clone repository and navigate to backend
cd backend

# Create and activate Python virtual environment
python3 -m venv venv
# On Mac/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and seed baseline catalog/admin
python manage.py migrate
python manage.py seed_catalog
python manage.py createsuperuser

# Start development server
python manage.py runserver 8000
```

### 4.2 Frontend Setup
```bash
# In a separate terminal, navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start Vite hot-reload server
npm run dev
```

### 4.3 Celery Worker (Asynchronous Tasks & Video Rendering)
```bash
# Start default worker
celery -A celebrio worker -l info

# Start Celery Beat scheduler
celery -A celebrio beat -l info
```

