# Product Requirements Document — ForgeQA & ForgeKey

## 1. Executive Summary

ForgeQA is an AI-powered test case and test script generator built for QA teams. It includes a landing/marketing site, user registration with product-key activation, a full-featured dashboard for generating and managing test assets, knowledge-base integration (file upload, SharePoint sync, OCR), regression testing with CI/CD webhooks, and subscription/plan management.

ForgeKey is the companion **License Manager** admin portal used by the ForgeQA team to manage product keys, approve/reject user registrations, issue licenses, view customers, handle payments, and send transactional emails.

Together they form a SaaS platform where users purchase licenses (Free/Pro/Enterprise), receive a product key, activate their account, and then use ForgeQA's AI capabilities.

---

## 2. Architecture

### 2.1 Technology Stack

| Component | Technology |
|---|---|
| **Frontend (both apps)** | React 19, TypeScript, Vite 7, Tailwind CSS 4 |
| **Backend (both apps)** | Node.js 24, plain HTTP server (no Express — custom `createApiMiddleware`) |
| **Database** | MongoDB 7.x (Atlas cluster) |
| **Email** | Resend API (primary) / Nodemailer SMTP (fallback) |
| **AI/LLM** | Gemini, OpenAI, OpenRouter, Claude (configurable provider) |
| **Payments** | Stripe, Razorpay |
| **2FA** | TOTP (speakeasy) |
| **CI/CD** | Vercel (frontend builds), Railway (server hosting), Jenkins |
| **Error Tracking** | Sentry |

### 2.2 App Relationship

```
                    ┌─────────────────────┐
                    │     ForgeQA App      │
                    │  (nextest-app)       │
                    │  app.forgeqa.in      │
                    │                      │
                    │  Landing, Register,   │
                    │  Dashboard, Test Gen, │
                    │  Knowledge Base,      │
                    │  Regression, Settings │
                    └──────────┬────────────┘
                               │ same MongoDB
                               │ Atlas cluster
                    ┌──────────▼────────────┐
                    │    ForgeKey App        │
                    │  (license-manager)     │
                    │  admin.forgeqa.in      │
                    │                        │
                    │  Admin Dashboard,      │
                    │  Product Keys,         │
                    │  Customers,            │
                    │  Verifications,        │
                    │  Payments, Plans,      │
                    │  Email Log             │
                    └────────────────────────┘
```

### 2.3 Database (MongoDB — `forgekey` database)

| Collection | Purpose |
|---|---|
| `users` | User accounts (email, name, password hash, subscriptionTier) |
| `admins` | Admin accounts (email, password hash) |
| `pending_registrations` | Users awaiting approval/product key assignment |
| `product_keys` | Generated product keys (key, customerEmail, status, plan) |
| `user_api_keys` | Per-user LLM API key settings per provider |
| `user_data` | Per-user key-value data store |
| `password_reset_tokens` | Password reset tokens (auto-expire after 24h) |
| `enterprise_inquiries` | Enterprise lead form submissions |
| `knowledge_files` | Uploaded knowledge-base files metadata |
| `knowledge_chunks` | Chunked/indexed content from knowledge files |
| `regression_runs` | Regression test run metadata |
| `regression_builds` | Build artifacts for regression testing |
| `regression_webhooks` | CI/CD webhook configs for regression triggers |
| `subscription_plans` | SaaS subscription plan definitions |
| `plans` | License plan definitions (Free/Pro/Enterprise) |
| `payment_transactions` | Payment records (Stripe/Razorpay) |
| `audit_logs` | Admin action audit trail |
| `rate_limits` | IP-based rate limiting with auto-expiry |
| `totp_secrets` | TOTP 2FA secrets per user |
| `email_logs` | Sent email records |

---

## 3. ForgeQA Application (nextest-app)

### 3.1 User Flows

#### 3.1.1 Registration & Activation
1. User visits landing page (`/`) → clicks "Get Started"
2. Register page (`/register`) — selects Free/Pro/Enterprise plan
3. If Free/Pro: enters details (name, email, password, product key)
4. Product key validated against `product_keys` collection
5. Account created, subscription tier saved, redirect to `/auth?welcome=true`
6. If Enterprise: modal form collects company details → email sent to admin
7. Admin approves via ForgeKey → product key emailed to user
8. User completes registration at `/auth/complete-registration?email=&key=`

#### 3.1.2 Authentication
- Email + password login
- Password reset via email link
- Optional TOTP 2FA
- JWT stored in HttpOnly cookie
- Session restore on page load

#### 3.1.3 Dashboard (`/dashboard`)
- Welcome popup for new users
- Setup checklist (configure API key, upload knowledge base, generate test)
- Metric cards: test cases generated, knowledge sources, history count
- Recent activity feed
- Quick-action cards (Generate, Knowledge, Test Scripts, Regression)

### 3.2 Features by Page

#### Landing Page (`/`)
- Hero section with tagline and CTA
- Feature highlights (AI-powered generation, multi-format support, CI/CD integration, knowledge base, analytics)
- Pricing cards (Free / Pro / Enterprise)
- Contact section
- Sign-in / Get Started navigation
- **Note**: Uses old pre-redesign design — no framer-motion, no `--lp-` CSS tokens

#### Auth Page (`/auth`)
- Login form (email + password)
- "Forgot Password?" link
- Sign-up redirect
- Success greeting after product key activation (3-second auto-redirect to `/auth`)

#### Register Page (`/register`)
- Plan selection cards (Free, Pro, Enterprise)
- Registration form (name, email, password, product key)
- Enterprise plan → opens modal inquiry form (company, email, details)
- Product key activation flow with success overlay
- Password strength validation (min 8 chars, upper+lower+digit+special)

#### Reset Password (`/reset-password/:token`)
- Password reset form with token validation
- Set new password

#### Complete Registration (`/auth/complete-registration`)
- For users who received product key email from admin
- Final registration step (name, password)

#### Dashboard (`/dashboard`)
- KPI metrics + setup checklist + recent activity

#### Test Generator (`/generator`)
- Configure: app description, test types, targeted areas
- Select AI provider + model
- Generate test cases (with streaming support)
- View, edit, copy, export test cases
- Knowledge-base context inclusion
- History of past generations

#### Test Scripts (`/test-scripts`)
- Convert test cases to executable scripts
- Supports Playwright, Cypress, Selenium, Appium, Puppeteer
- Script preview with copy/download

#### Knowledge Base (`/knowledge`)
- Upload files (PDF, DOCX, XLSX, images, HTML, JS, CSS, CSV, TXT)
- OCR for image-based files (Tesseract.js)
- SharePoint integration (site URL, list, folder)
- Search across knowledge base content
- View/delete uploaded files

#### Analytics (`/analytics`)
- Charts: test cases over time, test types distribution
- Knowledge sources breakdown
- AI provider usage metrics
- Dashboard-style metrics summary

#### Suites (`/suites`)
- Organized test suite management
- Create, edit, delete test suites
- Group test cases into suites

#### Regression (`/regression`)
- Generate regression test cases from app descriptions
- Upload build artifacts (APK, AAB, ZIP, etc.)
- CI/CD webhook integration
- Regression run history with status tracking
- Script generation for regression tests

#### Settings (`/settings`)
- Profile management (display name, email, avatar)
- API key configuration per provider (Gemini, OpenAI, OpenRouter, Claude, OpenCode, Groq)
- Subscription/plan display
- Password change
- Theme toggle (dark/light)
- Team management
- Account deletion

#### Admin (`/admin`) — ForgeQA internal admin
- User management (list users, view details)
- Stats dashboard
- Audit log viewer
- Account unlock
- Billing plan management

### 3.3 AI Providers Supported
- **Gemini** (Google) — default, with streaming
- **OpenAI** — with streaming
- **OpenRouter** — multi-model access
- **Claude** (Anthropic)
- **OpenCode**
- **Groq**

### 3.4 Security
- JWT authentication with HttpOnly cookies
- Password hashing (bcrypt-like via crypto)
- Rate limiting per IP + endpoint
- Account lockout after failed attempts
- TOTP 2FA
- Encrypted API key storage at rest
- Disposable email detection at registration
- CORS with credentials support
- Audit logging for admin actions
- MongoDB injection protection (parameterized queries)

---

## 4. ForgeKey Application (license-manager)

### 4.1 Admin Authentication
- Landing page with "Sign In" button
- Login page (email + password)
- Session via JWT token stored in localStorage
- Auto-logout on token expiry

### 4.2 Dashboard
- **KPI Tiles**: Total Keys, Activated, Available, Expired (with count-up animations)
- **Charts**: Key generation trend (7-day bar chart), Plan Distribution (pie chart)
- **Recent Activity Feed**: Key generation, usage, registrations, approvals/rejections
- **Quick Actions**: Generate Key, View Pending Verifications (with count badge)
- Auto-refresh every 30 seconds

### 4.3 Plans Management (`/plans`)
- CRUD for license plans (Free, Pro, Enterprise)
- Each plan has: id, name, tier, description, price, duration, features list, maxKeys
- Toggle active/inactive status

### 4.4 Verifications (`/verifications`)
- Lists pending user registrations (`status: "pending_verification"`)
- Shows: name, email, selected plan, company, timestamp
- **Approve**: generates a product key, sends email with key, updates status to "ready"
- **Reject**: sends rejection email, updates status to "rejected" with optional reason
- Pending count badge on sidebar

### 4.5 Product Keys (`/keys`)
- Table of all generated product keys
- Columns: key, customer email, plan, status (active/used/expired), created date, expiry
- Generate new key manually
- Filter/search keys
- Available count badge on sidebar

### 4.6 Customers (`/customers`)
- Table of all registered users (from `users` collection) merged with rejected registrations
- Columns: email, name, plan, registration date, status badges (Active/Approved/Rejected/Expired)
- Pill filter buttons with counts (All, Approved, Rejected)
- Plan distribution summary

### 4.7 Email Log (`/email`)
- Log of all sent transactional emails
- Search by recipient email
- Resend failed emails
- Status tracking (sent/failed)

### 4.8 Payments / Transactions (`/payments`)
- Payment records from Stripe and Razorpay
- Webhook handlers for both providers
- Transaction history table

### 4.9 Deleted Users (`/deleted-users`)
- View users who deleted their accounts
- Restoration capability (re-activate deleted account)

### 4.10 Security
- JWT authentication via localStorage
- Admin-only access (admins collection)
- Audit logging for all admin actions

---

## 5. Email System

### 5.1 Email Types

| Email Type | Trigger | Sent From | Sent To |
|---|---|---|---|
| Product Key | Admin approves registration | `jagathwork372@gmail.com` | New user |
| Product Key | Admin manually sends from Keys page | `jagathwork372@gmail.com` | Specified email |
| Password Reset | User clicks "Forgot Password" | `jagathwork372@gmail.com` | User's email |
| Support Request | User submits support form | `jagathwork372@gmail.com` | `jagathwork372@gmail.com` |
| Enterprise Inquiry | User submits enterprise form | `jagathwork372@gmail.com` | `jagathwork372@gmail.com` |
| Registration Rejection | Admin rejects a registration | `jagathwork372@gmail.com` | Registrant's email |

### 5.2 Email Architecture
- **Primary**: Resend API (when `RESEND_API_KEY` is set)
- **Fallback**: SMTP via nodemailer (configured via `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`)
- **Dev fallback**: Ethereal email (temporary test accounts)
- All email addresses hardcoded to `jagathwork372@gmail.com`

---

## 6. Product Key System

### 6.1 Key Format
- Alphanumeric uppercase + digits
- Generated with 48 bits of random entropy
- Format: `XXXX-XXXX-XXXX-XXXX`

### 6.2 Key Lifecycle
1. **Generated** — Admin creates key (manually or via approval)
2. **Assigned** — Key associated with a customer email
3. **Activated** — User enters key during registration → status set to "used"
4. **Expired** — Key past its expiry date

### 6.3 Key Validation
- Format check on client side (regex)
- Server-side uniqueness check
- Status check (must be "active" to be claimed)
- Email matching (key is tied to specific email)

---

## 7. Payment & Billing

### 7.1 Supported Processors
- **Stripe** — checkout sessions, webhooks
- **Razorpay** — order creation, webhooks

### 7.2 Billing Plans
- Defined in `plans` and `subscription_plans` collections
- Features: tier name, duration, price, feature descriptions, max key count
- Managed via ForgeKey Plans page

---

## 8. Hosting & Deployment

| App | Domain | Frontend Host | Server Host |
|---|---|---|---|
| ForgeQA (nextest-app) | `app.forgeqa.in` | Vercel | Railway |
| ForgeKey (license-manager) | `admin.forgeqa.in` | Vercel | Railway (same instance) |

### 8.1 Environment Variables Required

**ForgeQA (nextest-app)**
```
MONGO_URI, MONGO_DB_NAME, JWT_SECRET, ENCRYPTION_SECRET,
RESEND_API_KEY, RESEND_FROM, SUPPORT_EMAIL,
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM,
GEMINI_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY,
CLAUDE_API_KEY, OPENCODE_API_KEY, GROQ_API_KEY,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, PORT, APP_URL
```

**ForgeKey (license-manager)**
```
MONGO_URI, MONGO_DB_NAME, JWT_SECRET,
ADMIN_EMAIL, ADMIN_PASSWORD,
RESEND_API_KEY, RESEND_FROM,
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
PORT, APP_URL, app_forgeqa_in_APP_URL
```

### 8.2 Build & Deploy
- Vite builds static assets to `dist/`
- Production server: `node --dns-result-order=ipv4first server/index.js`
- `--dns-result-order=ipv4first` required on Windows/Node 24.x for MongoDB Atlas NAT64 resolution
- Vercel functions in `api/` directory for serverless API
- Railway runs the full Node server

---

## 9. Known Constraints & Technical Debt

1. **No Express.js** — Both apps use a custom `createApiMiddleware` with manual URL routing (no Express/Koa)
2. **Landing page uses old design** — Explicitly reverted to commit `bd9d1d8` to avoid framer-motion and `--lp-` CSS tokens
3. **Both apps share the same MongoDB database** — collections prefixed by convention, not enforced
4. **Resend domain verification incomplete** — `forgeqa.in` not verified; emails come from `onboarding@resend.dev`
5. **Plan Distribution counts only approved** — Dashboard pie chart filters to `status: "ready"` or `"completed"` registrations only
6. **Enterprise inquiry in RegisterPage** — Uses `<div>` + `type="button"` instead of `<form>` to prevent full-page POST navigation on Vercel
7. **No automated test coverage** for server routes (only UI component tests exist)

---

## 10. Future Roadmap

- Complete Resend domain verification for `forgeqa.in`
- Add `plan` field to `product_keys` collection for direct plan distribution aggregation
- Migrate to Express.js or Fastify for better middleware support
- Add rate-limit configuration UI in ForgeKey
- Implement subscription auto-renewal with Stripe
- Add team/collaboration features in ForgeQA
- Enhanced analytics with custom date ranges and export
- Mobile app (React Native) for test case review
