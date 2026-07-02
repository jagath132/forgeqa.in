# ForgeQA — Complete Application Workflow

## Overview

ForgeQA has two applications that share the same MongoDB database:
- **ForgeQA App** (`app.forgeqa.in`) — End-user application for QA test generation
- **ForgeKey Admin** (`admin.forgeqa.in`) — License management & user administration

---

## 1. User Registration & Activation Workflow

### 1.1 Landing Page → Registration
```
[Landing Page] ──"Get Started"──> [Register Page]
                                      │
                           ┌──────────┴──────────┐
                           │ Choose Plan:         │
                           │  • Free (₹0)         │
                           │  • Pro (paid)        │
                           │  • Enterprise (custom)│
                           └──────────┬──────────┘
                                      │
                 ┌────────────────────┼────────────────────┐
                 │ Free               │ Pro                │ Enterprise
                 ▼                    ▼                    ▼
        ┌─────────────────┐  ┌──────────────┐   ┌──────────────────┐
        │ Enter:          │  │ Enter:       │   │ Enterprise       │
        │ • Name          │  │ • Name       │   │ Inquiry Modal    │
        │ • Email         │  │ • Email      │   │ • Company Name   │
        │ • Password      │  │ • Password   │   │ • Team Size      │
        │                  │  │              │   │ • Requirements   │
        │                  │  │ Continue ──> │   │ • Contact Info   │
        │ Continue ──>     │  │ Stripe       │   └──────┬───────────┘
        │ Verify Key       │  │ Checkout     │          │Submit
        └────────┬─────────┘  └──────┬───────┘          ▼
                 │                   │           ┌──────────────────┐
                 ▼                   ▼           │ Email sent to    │
        ┌─────────────────┐  ┌────────────┐      │ SUPPORT_EMAIL    │
        │ Enter Product   │  │ Payment    │      │ "Thank You"      │
        │ Key (or wait    │  │ Complete   │      │ overlay shown    │
        │ for admin to    │  │ ──> Key    │      │ Redirect to home │
        │ send one)       │  │ Generated  │      └──────────────────┘
        └────────┬────────┘  │ & Emailed  │
                 │           └──────┬─────┘
                 ▼                  ▼
        ┌──────────────────────────────┐
        │ Activate Account             │
        │ • Enter email + product key  │
        │ • POST /api/auth/complete-   │
        │   registration               │
        │                              │
        │ Key validated → User created │
        │ → "Account Activated!"       │
        │   overlay (3s)               │
        │ → Navigate to /auth          │
        └──────────────────────────────┘
```

### 1.2 Product Key Email Flow (Admin Approval)
```
ForgeKey Admin                            User
    │                                       │
    │  Views pending registration            │
    │  Clicks "Approve"                      │
    │    │                                   │
    │    ├─ Generates product key            │
    │    ├─ Updates status to "ready"        │
    │    └─ Sends email with key ──────────> │
    │                                       │
    │                                       │  Receives email
    │                                       │  Clicks "Complete Registration" link
    │                                       │  → Register Page (verify_key step)
    │                                       │  → Enters product key
    │                                       │  → Account Activated
    │                                       │  → Logs in
    │                                       │  → Sees Welcome Popup (1st time)
```

### 1.3 Login & Welcome
```
[Auth Page] ──Login──> POST /api/auth/login
                           │
                     ┌─────┴──────┐
                     │             │
                Success         2FA Required
                     │             │
                     ▼             └─> Enter TOTP Code
            ┌──────────────────┐
            │ Check             │
            │ has_seen_welcome  │
            └────────┬─────────┘
                     │
            ┌────────┴────────┐
            │                 │
         false              true
            │                 │
            ▼                 ▼
   /dashboard?welcome=true   /dashboard
            │
            ▼
    ┌──────────────┐
    │ WelcomePopup │
    │ "Welcome to  │
    │ ForgeQA!     │
    │ Thank you    │
    │ for choosing │
    │ us!"         │
    │              │
    │ [Get Started]│──POST /api/auth/welcome-seen──> has_seen_welcome = true
    └──────────────┘
```

---

## 2. Authenticated App Workflow

### 2.1 Dashboard (`/dashboard`)
```
┌──────────────────────────────────────────────┐
│ HEADER: "Ship with confidence"               │
│ Sub-header + quick-action buttons            │
│                                              │
│ KPI Cards:                                   │
│ • Test Cases Generated                       │
│ • Context Files                              │
│ • History Runs                               │
│ • AI Provider                                │
│                                              │
│ Readiness Checklist:                         │
│ ☑ AI provider selected                      │
│ ☑ API key available                         │
│ ☑ Generated test cases available            │
│ ☑ Automation source selected                │
│                                              │
│ Quick Action Cards:                          │
│ • Test Case Generation → /generator          │
│ • Automation Scripts   → /test-scripts       │
│ • AI Configuration     → /settings           │
│                                              │
│ Recent Generation History                    │
└──────────────────────────────────────────────┘
```

### 2.2 Test Generator (`/generator`)
```
┌──────────────────────────────────────────────┐
│ Input:                                       │
│ • App Description (textarea)                 │
│ • Test Type (dropdown):                      │
│   - Functional / Regression / Smoke / E2E    │
│ • Target Areas (multi-select)                │
│ • Include Knowledge Base context (toggle)    │
│ • AI Provider + Model selection              │
│                                              │
│ [Generate Test Cases]                        │
│   │                                         │
│   ├─ POST /api/generate-test-cases          │
│   │   (or streaming: /stream)               │
│   │                                         │
│   ▼                                         │
│ Results Table:                               │
│ • TC ID, Category, Description,              │
│   Precondition, Steps, Expected Result,      │
│   Status (draft/reviewed/approved)           │
│ • Actions: Edit, Copy, Export               │
│ • Export formats: JSON, CSV, PDF            │
│                                              │
│ History sidebar: past generations            │
└──────────────────────────────────────────────┘
```

### 2.3 Test Scripts (`/test-scripts`)
```
┌──────────────────────────────────────────────┐
│ Select test cases from latest generation     │
│ Select target framework:                     │
│ • Playwright / Cypress / Selenium /          │
│   Appium / Puppeteer                         │
│                                              │
│ [Generate Scripts]                           │
│   │                                         │
│   └─ POST /api/generate-test-scripts        │
│                                              │
│ Script preview with syntax highlighting      │
│ Actions: Copy / Download                     │
└──────────────────────────────────────────────┘
```

### 2.4 Knowledge Base (`/knowledge`)
```
┌──────────────────────────────────────────────┐
│ Two source types:                            │
│                                              │
│ 1. File Upload:                             │
│    • Supported: PDF, DOCX, XLSX, images,     │
│      HTML, JS, CSS, CSV, TXT                │
│    • Max 12 files, 25MB each                │
│    • OCR via Tesseract.js for images         │
│    • POST /api/knowledge/upload              │
│                                              │
│ 2. SharePoint Integration:                  │
│    • Site URL + List/Folder path             │
│    • POST /api/knowledge/sharepoint          │
│                                              │
│ Files list: name, type, date, status         │
│ Search across knowledge base content         │
│ (used as context for test generation)        │
└──────────────────────────────────────────────┘
```

### 2.5 Regression Testing (`/regression`)
```
┌──────────────────────────────────────────────┐
│ 1. Generate regression test cases            │
│    • POST /api/regression/generate           │
│    • From app description                    │
│                                              │
│ 2. Upload build artifacts                    │
│    • APK, AAB, ZIP, HTML, JS, CSS, etc.      │
│    • POST /api/regression/builds/upload      │
│                                              │
│ 3. Configure CI/CD webhook                   │
│    • POST /api/regression/builds/webhook     │
│    • Platform: android / web                 │
│    • Webhook URL receives build notifications│
│                                              │
│ 4. Run history table                         │
│    • Status, platform, started, completed    │
│    • View details per run                    │
│                                              │
│ 5. Generate regression scripts               │
│    • POST /api/regression/scripts             │
└──────────────────────────────────────────────┘
```

### 2.6 Suites (`/suites`)
```
┌──────────────────────────────────────────────┐
│ Create/Edit/Delete test suites               │
│ Group test cases into named suites           │
│ Reorder cases within a suite                 │
│ Run suite (execute all cases)                │
└──────────────────────────────────────────────┘
```

### 2.7 Analytics (`/analytics`)
```
┌──────────────────────────────────────────────┐
│ Charts:                                      │
│ • Test cases generated over time (line)      │
│ • Test type distribution (pie/donut)         │
│ • Knowledge sources breakdown                │
│ • AI provider usage metrics                  │
│ • Summary KPI cards                          │
└──────────────────────────────────────────────┘
```

### 2.8 Settings (`/settings`)
```
┌──────────────────────────────────────────────┐
│ Profile: display name, email (read-only)     │
│                                              │
│ AI Provider Configuration:                   │
│ • Gemini / OpenAI / OpenRouter / Claude /    │
│   OpenCode / Groq                            │
│ • API keys stored encrypted at rest          │
│ • Test connection button                     │
│                                              │
│ Plan & Billing (read-only display)           │
│ Change Password                              │
│ Theme: Dark / Light                          │
│ Two-Factor Authentication (TOTP) Setup       │
│ Team Management (invite members)             │
│ Danger Zone: Delete Account                  │
└──────────────────────────────────────────────┘
```

---

## 3. ForgeKey Admin Workflow (`admin.forgeqa.in`)

### 3.1 Dashboard
```
┌──────────────────────────────────────────────┐
│ KPI Tiles (animated count-up):               │
│ • Total Keys / Activated / Available / Expired│
│                                              │
│ Charts:                                      │
│ • Key Generation Trend (7-day bar)           │
│ • Plan Distribution (pie — only approved     │
│   registrations with status "ready"/         │
│   "completed")                               │
│                                              │
│ Recent Activity Feed                         │
│ Quick Actions: Generate Key, View Pending    │
│ Auto-refresh every 30s                      │
└──────────────────────────────────────────────┘
```

### 3.2 Plans Management
```
┌──────────────────────────────────────────────┐
│ List all license plans (Free/Pro/Enterprise) │
│ Each plan: id, name, tier, description,      │
│   price, duration, features, maxKeys         │
│ Actions: Add / Edit / Toggle Active          │
└──────────────────────────────────────────────┘
```

### 3.3 Verifications (Pending Registrations)
```
┌──────────────────────────────────────────────┐
│ Table of users awaiting approval             │
│ Columns: Name, Email, Plan, Company, Date    │
│                                              │
│ [Approve] ──>                                 │
│   ├─ Generates unique product key            │
│   ├─ Sends email with key to user            │
│   ├─ Updates status to "ready"               │
│   └─ Audit log entry                         │
│                                              │
│ [Reject] ──>                                  │
│   ├─ Optional reason input                   │
│   ├─ Sends rejection email to user           │
│   ├─ Updates status to "rejected"            │
│   └─ Audit log entry                         │
│                                              │
│ Badge on sidebar: pending count (auto-poll)  │
└──────────────────────────────────────────────┘
```

### 3.4 Product Keys
```
┌──────────────────────────────────────────────┐
│ Table of all product keys                    │
│ Columns: Key, Customer Email, Plan, Status   │
│   (active/used/expired), Created, Expiry     │
│ Filters: by status, search by email          │
│ Actions: Generate New Key, Send Email        │
│ Available count badge on sidebar             │
└──────────────────────────────────────────────┘
```

### 3.5 Customers
```
┌──────────────────────────────────────────────┐
│ Merged list of users + rejected registrations│
│ Columns: Email, Name, Plan, Reg Date, Status │
│ Pill filters: All / Approved / Rejected      │
│   (with counts)                              │
└──────────────────────────────────────────────┘
```

### 3.6 Email Log
```
┌──────────────────────────────────────────────┐
│ All sent transactional emails                │
│ Search by recipient email                    │
│ Status: sent / failed                        │
│ Action: Resend (for failed emails)           │
└──────────────────────────────────────────────┘
```

### 3.7 Transactions (Payments)
```
┌──────────────────────────────────────────────┐
│ Payment records from Stripe & Razorpay       │
│ Auto-captured via webhooks                   │
│ Transaction history with status              │
└──────────────────────────────────────────────┘
```

### 3.8 Deleted Users
```
┌──────────────────────────────────────────────┐
│ Users who deleted their accounts             │
│ Restore capability available                 │
└──────────────────────────────────────────────┘
```

---

## 4. Email Flow

| Trigger | Email Type | Sent To | From |
|---|---|---|---|
| Admin approves registration | Product Key (with activation link) | Registrant's email | `jagathwork372@gmail.com` |
| Admin manually sends key | Product Key (with activation link) | Specified email | `jagathwork372@gmail.com` |
| User requests password reset | Password Reset Link | User's email | `jagathwork372@gmail.com` |
| User submits support form | Support Request | `jagathwork372@gmail.com` | `jagathwork372@gmail.com` (replyTo=user) |
| User submits enterprise form | Enterprise Inquiry | `jagathwork372@gmail.com` | `jagathwork372@gmail.com` (replyTo=user) |
| Admin rejects registration | Rejection Notice | Registrant's email | `jagathwork372@gmail.com` |

### Email Routing
- **Primary**: Resend API (if `RESEND_API_KEY` is set)
- **Fallback**: SMTP (if `SMTP_HOST` + `SMTP_PASS` are set)
- **Dev fallback**: Ethereal (temporary test accounts)

---

## 5. Authentication & Security Flow

```
User → Login → POST /api/auth/login
                  │
            ┌─────┴──────┐
            │ Validate    │
            │ credentials │
            └─────┬──────┘
                  │
            ┌─────┴──────┐
            │ 2FA Enabled?│
            └─────┬──────┘
                  │
         ┌────────┴────────┐
         │ No              │ Yes
         ▼                 ▼
   JWT Generated     Verify TOTP Code
   + HttpOnly        └──> JWT Generated
   Cookie set             + HttpOnly Cookie
         │
         ▼
   Session stored in sessionStorage (token)
   + HttpOnly cookie for server-side validation
         │
         ▼
   User fetched → initialize() restores session
   on page load via GET /api/auth/me
```

### Security Layers
- Rate limiting per IP + endpoint (MongoDB TTL index auto-cleanup)
- Account lockout after repeated failed login attempts
- Disposable email detection at registration
- Encrypted API key storage (per-provider)
- Audit logging for admin actions
- JWT with configurable secret
- CORS with credentials for API requests
- MongoDB injection protection (parameterized queries)

---

## 6. AI Provider Integration Flow

```
User configures API key in Settings
  │
  ▼
POST /api/settings/api-keys
  │
  ▼
Encrypted and stored in user_api_keys collection
  │
  ▼
User selects provider + model in Generator
  │
  ▼
POST /api/generate-test-cases
  │
  ├─ Get encrypted key from user_api_keys
  ├─ Decrypt key
  ├─ Call provider API (Gemini/OpenAI/Claude/etc.)
  │  - Supports streaming via /api/generate-test-cases/stream
  │
  └─ Parse response → structured test cases
     → Save to history
     → Return to UI
```

---

## 7. Build & Deploy Pipeline

```
Development:
  npm run dev → Vite dev server on 127.0.0.1:5173

Production Build:
  npm run build → Vite builds to dist/

Production Server:
  node --dns-result-order=ipv4first server/index.js

Hosting:
  ForgeQA App: Vercel (frontend) + Railway (server)
  ForgeKey Admin: Vercel (frontend) + Railway (server)

CI/CD:
  Jenkins pipeline (Jenkinsfile in repo root)
  Husky pre-commit hooks → lint-staged
```

---

## 8. Database Collections & Relationships

```
users
  ├─ _id, email, passwordHash, salt, name, role,
  │  createdAt, has_seen_welcome, activeProvider,
  │  subscriptionTier, subscriptionStatus
  │
  ├── user_api_keys (1:N) ── userId, provider, encrypted key
  ├── user_data (1:N) ── userId, key, value
  ├── password_reset_tokens (1:1) ── userId, token, expiresAt
  ├── knowledge_files (1:N) ── userId, file metadata
  ├── knowledge_chunks (1:N) ── fileId, chunkText, score
  ├── regression_runs (1:N) ── userId, status, startedAt
  ├── regression_builds (1:N) ── userId, platform, artifact
  ├── regression_webhooks (1:1) ── userId, platform, url
  └── totp_secrets (1:1) ── userId, secret

pending_registrations
  ├─ email, passwordHash, salt, name, plan, status,
  │  createdAt, company, teamSize, requirements
  └─ product_keys (1:N when approved) ── email, key, status

product_keys
  ├─ key, customerEmail, status, plan, expiresAt
  └─ users (1:1 when activated)

enterprise_inquiries
  └─ email, company, teamSize, requirements, contact, createdAt

admins
  └─ email, passwordHash

audit_logs
  └─ adminId, action, resource, resourceId, details, ip, createdAt

rate_limits
  └─ ip, endpoint, count, expiresAt (TTL index)

email_logs
  └─ to, subject, productKey, status, messageId, sentAt
```
