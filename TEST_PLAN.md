# ForgeQA — Master Test Plan

**Version**: 1.0  
**Application**: ForgeQA (nextest-app) + ForgeKey Admin (license-manager)  
**Test Scope**: End-to-end functional, integration, security, and regression testing  

---

## 1. Test Strategy

### 1.1 Test Levels
| Level | Scope | Responsibility |
|---|---|---|
| **Unit** | Individual functions, hooks, utility methods | Developer |
| **Integration** | API endpoints, database operations, email delivery | Developer |
| **System/E2E** | Complete user flows across both apps | QA Team |
| **Security** | Auth, rate limiting, data encryption, audit | Security team |
| **Performance** | API response times, chunk loading, DB queries | Developer |

### 1.2 Test Environment
- **Local**: `npm run dev` on `127.0.0.1:5173` + `node server/index.js` on port 3000
- **Staging**: Vercel preview deployment + Railway staging server
- **Production**: `app.forgeqa.in` + `admin.forgeqa.in`

### 1.3 Test Data
- MongoDB Atlas cluster (`forgekey` database)
- Test admin: `admin@forgekey.app` / `admin123`
- Test product keys: pre-generated in `product_keys` collection
- Disposable email detection test: `test@mailinator.com`

---

## 2. Feature Areas & Test Cases

### 2.1 User Registration

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| REG-01 | **Landing page loads** | None | 1. Navigate to `/` | Page renders hero, features, pricing, contact sections | P0 |
| REG-02 | **Register link navigates** | On landing page | 1. Click "Get Started" | Redirects to `/register` | P0 |
| REG-03 | **Account info form validation** | On `/register` step 1 | 1. Leave name empty<br>2. Enter invalid email<br>3. Enter weak password | Validation errors shown, continue button disabled | P1 |
| REG-04 | **Password strength indicator** | On `/register` step 1 | 1. Type passwords of varying strength | Strength bar + label updates: Weak/Medium/Strong | P2 |
| REG-05 | **Plan selection — Free plan** | Registration started | 1. Select "Free" plan | Moves to verify_key step (no payment) | P0 |
| REG-06 | **Plan selection — Pro plan** | Registration started | 1. Select "Pro" plan | Moves to Stripe checkout step | P0 |
| REG-07 | **Plan selection — Enterprise** | Registration started | 1. Click "Enterprise" card | Enterprise inquiry modal opens | P0 |
| REG-08 | **Enterprise inquiry — submit** | Enterprise modal open | 1. Fill company, team size, requirements<br>2. Click Submit | Inquiry saved, Thank You overlay shown, email sent to SUPPORT_EMAIL | P0 |
| REG-09 | **Enterprise inquiry — Cancel button** | Enterprise modal open | 1. Click Cancel | Modal closes, form fields reset | P0 |
| REG-10 | **Product key activation — valid key** | On verify_key step | 1. Enter valid product key<br>2. Click "Activate Account" | "Account Activated!" overlay shown, navigates to `/auth` after 3s | P0 |
| REG-11 | **Product key activation — invalid key** | On verify_key step | 1. Enter invalid/expired key<br>2. Click "Activate Account" | Error message displayed | P0 |
| REG-12 | **Product key activation — duplicate** | Account already exists | 1. Enter already-used key | Error: "An account with this email already exists" | P1 |
| REG-13 | **Pending verification auto-poll** | Status = pending_verification | 1. Wait for admin to approve<br>2. Observe polling | Step auto-advances to verify_key when status becomes "ready" | P1 |

### 2.2 Authentication

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| AUTH-01 | **Login with valid credentials** | User exists with password | 1. Enter email + password<br>2. Click Sign In | Redirected to dashboard, session persisted | P0 |
| AUTH-02 | **Login with invalid password** | User exists | 1. Enter wrong password | Error: "Invalid email or password" | P0 |
| AUTH-03 | **Login with non-existent email** | None | 1. Enter unknown email + password | Error: "Invalid email or password" (timing-safe) | P0 |
| AUTH-04 | **Session restore on page reload** | Logged in | 1. Refresh browser | Session restored, stays on dashboard | P0 |
| AUTH-05 | **Logout** | Logged in | 1. Click user dropdown → Sign Out | Redirected to landing page, session cleared | P0 |
| AUTH-06 | **Forgot password flow** | User exists with email | 1. Click "Forgot Password"<br>2. Enter email | Success message shown, email sent | P0 |
| AUTH-07 | **Password reset via email link** | Reset token generated | 1. Click reset link in email<br>2. Enter new password | Password updated, can sign in with new password | P0 |
| AUTH-08 | **2FA enrollment** | Logged in | 1. Go to Settings → Security<br>2. Enable 2FA<br>3. Scan QR code<br>4. Enter TOTP code | 2FA enabled for future logins | P1 |
| AUTH-09 | **Login with 2FA** | 2FA enabled | 1. Enter email + password<br>2. Enter TOTP code | Successfully authenticated | P1 |
| AUTH-10 | **Account lockout after failed attempts** | None | 1. Attempt login with wrong password 5+ times | Lockout message displayed after threshold | P1 |

### 2.3 Welcome Popup (First Login)

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| WEL-01 | **Welcome popup on first login** | New user (has_seen_welcome=false) | 1. Register via key activation<br>2. Log in | Redirected to `/dashboard?welcome=true`, WelcomePopup visible | P0 |
| WEL-02 | **Welcome popup message** | WelcomePopup visible | 1. Observe popup text | Title: "Welcome to ForgeQA!", Body: includes "Thank you for choosing us" | P0 |
| WEL-03 | **Welcome popup dismiss** | WelcomePopup visible | 1. Click "Get Started" | Popup closes, `has_seen_welcome` set to true | P0 |
| WEL-04 | **Welcome popup not shown second time** | has_seen_welcome=true | 1. Log out and log in again | Redirected to `/dashboard` (no `?welcome=true`), no popup | P0 |

### 2.4 Dashboard

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| DASH-01 | **Dashboard loads with KPI cards** | Logged in | 1. Navigate to `/dashboard` | 4 KPI cards visible (Test Cases, Context Files, History, Provider) | P1 |
| DASH-02 | **Readiness checklist** | No API key configured | 1. Observe checklist | API key checkbox shows "Pending" | P1 |
| DASH-03 | **Quick action card navigation** | Dashboard loaded | 1. Click "Start Test Case Generation" | Navigates to `/generator` | P1 |
| DASH-04 | **Recent generation history** | Previous generation exists | 1. Observe "Recent Generation" section | Latest history item displayed with summary and timestamp | P2 |

### 2.5 Test Case Generator

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| GEN-01 | **Generate test cases** | API key configured | 1. Enter app description<br>2. Select test type<br>3. Click Generate | Test cases generated and displayed in table | P0 |
| GEN-02 | **Streaming generation** | API key configured | 1. Enable streaming<br>2. Click Generate | Results appear progressively | P1 |
| GEN-03 | **Knowledge base context inclusion** | Knowledge files uploaded | 1. Toggle "Include Knowledge Base"<br>2. Generate | Results incorporate knowledge context | P1 |
| GEN-04 | **Export as JSON** | Test cases generated | 1. Click Export → JSON | JSON file downloaded | P1 |
| GEN-05 | **Export as PDF** | Test cases generated | 1. Click Export → PDF | PDF file downloaded | P2 |
| GEN-06 | **History sidebar** | Multiple generations | 1. Open history sidebar | Past generations listed with timestamps | P1 |
| GEN-07 | **Load generation from history** | History item exists | 1. Click a history item | Previous results load into the table | P1 |

### 2.6 Test Scripts

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| SCR-01 | **Generate Playwright script** | Test cases exist | 1. Select framework = Playwright<br>2. Click Generate Script | Playwright script displayed with syntax highlighting | P0 |
| SCR-02 | **Generate Cypress script** | Test cases exist | 1. Select framework = Cypress<br>2. Click Generate Script | Cypress script displayed | P0 |
| SCR-03 | **Copy script to clipboard** | Script generated | 1. Click Copy button | Script copied to clipboard | P1 |
| SCR-04 | **Download script** | Script generated | 1. Click Download | Script file downloaded | P1 |

### 2.7 Knowledge Base

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| KB-01 | **Upload PDF file** | Logged in | 1. Go to Knowledge page<br>2. Upload a PDF | File appears in list with status "processing" → "ready" | P0 |
| KB-02 | **Upload image (OCR)** | Logged in | 1. Upload an image file | OCR processes the image, text extracted | P1 |
| KB-03 | **Invalid file type rejection** | Logged in | 1. Upload unsupported file type | Error message: file type not allowed | P1 |
| KB-04 | **Search knowledge base** | Files uploaded + processed | 1. Enter search query | Matching chunks displayed with relevance scores | P1 |
| KB-05 | **SharePoint integration** | Sharepoint credentials | 1. Enter Site URL + List path<br>2. Click Sync | Files imported from SharePoint | P2 |
| KB-06 | **Delete file** | File exists | 1. Click delete on a file | File removed, associated chunks also deleted | P1 |

### 2.8 Regression Testing

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| REG-01 | **Generate regression cases** | API key configured | 1. Enter app description<br>2. Click Generate | Regression test cases generated | P1 |
| REG-02 | **Upload build artifact** | Logged in | 1. Click "Upload Build"<br>2. Select APK file | Artifact uploaded, visible in build history | P1 |
| REG-03 | **Configure webhook** | Logged in | 1. Enter webhook URL<br>2. Select platform | Webhook saved | P1 |
| REG-04 | **View run history** | Runs exist | 1. Navigate to regression page | Run history table with status indicators | P1 |
| REG-05 | **Generate regression scripts** | Regression cases exist | 1. Click "Generate Scripts" | Automation scripts generated | P2 |

### 2.9 Settings

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| SET-01 | **Configure Gemini API key** | Logged in | 1. Go to Settings<br>2. Select Gemini provider<br>3. Enter API key<br>4. Save | Key saved and encrypted, AI Engine status shows "Ready" | P0 |
| SET-02 | **Configure OpenAI API key** | Logged in | 1. Select OpenAI provider<br>2. Enter API key<br>3. Save | Key saved successfully | P0 |
| SET-03 | **Change password** | Logged in | 1. Enter current password + new password<br>2. Click Save | Password changed, can login with new password | P1 |
| SET-04 | **Theme toggle** | Logged in | 1. Toggle Dark/Light | Theme switches, persisted across page reload | P1 |
| SET-05 | **Delete account** | Logged in | 1. Click "Delete Account"<br>2. Confirm in dialog | Account deleted, redirected to landing page | P1 |

### 2.10 Analytics

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| ANL-01 | **Analytics charts load** | Generation history exists | 1. Navigate to `/analytics` | Charts render with data: test cases over time, type distribution | P1 |
| ANL-02 | **Empty state** | No generation history | 1. Navigate to `/analytics` | Placeholder/empty state displayed | P2 |

### 2.11 Suites

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| SUI-01 | **Create test suite** | Logged in | 1. Go to Suites<br>2. Enter name, add test cases | Suite created and listed | P1 |
| SUI-02 | **Delete test suite** | Suite exists | 1. Click delete on suite | Suite removed | P1 |

### 2.12 Navigation & UI

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| NAV-01 | **Logo redirects to dashboard** | On any module page | 1. Click ForgeQA logo in sidebar | Redirects to `/dashboard` | P1 |
| NAV-02 | **Nav logo redirects to dashboard** | On any module page | 1. Click ForgeQA logo in navbar | Redirects to `/dashboard` | P1 |
| NAV-03 | **Module navigation scrolls to top** | Page is scrolled down | 1. Click any sidebar module<br>2. Observe scroll position | Content area scrolls to top of the selected module | P1 |
| NAV-04 | **Sidebar highlights active module** | On a module page | 1. Navigate between modules | Active module highlighted in sidebar | P2 |

### 2.13 ForgeKey Admin — Login & Dashboard

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| ADM-01 | **Admin login** | Admin account exists | 1. Go to `admin.forgeqa.in`<br>2. Click Sign In<br>3. Enter admin credentials | Redirected to admin dashboard | P0 |
| ADM-02 | **Dashboard KPI tiles** | Logged in to ForgeKey | 1. Observe KPI section | Total Keys, Activated, Available, Expired tiles show with animated counts | P0 |
| ADM-03 | **Plan Distribution chart** | Registrations with "ready"/"completed" status exist | 1. Observe Plan Distribution chart | Pie chart shows plans, only approved registrations counted | P1 |
| ADM-04 | **Plan Distribution — no approved registrations** | No "ready"/"completed" registrations | 1. Observe Plan Distribution chart | All counts show 0, Enterprise does NOT show 1 | P0 |

### 2.14 ForgeKey Admin — Verifications

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| VER-01 | **View pending verifications** | Pending registrations exist | 1. Click "Verifications" in sidebar | Table shows users with status = pending_verification | P0 |
| VER-02 | **Approve registration** | Pending registration exists | 1. Click "Approve" on a user | Key generated, email sent, status updated to "ready" | P0 |
| VER-03 | **Reject registration** | Pending registration exists | 1. Click "Reject"<br>2. Enter reason (optional) | Rejection email sent, status updated to "rejected" | P0 |
| VER-04 | **Pending count badge** | Pending registrations exist | 1. Observe sidebar | Badge with count shown on Verifications nav item | P1 |

### 2.15 ForgeKey Admin — Plans & Keys

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| PLN-01 | **List plans** | Logged in | 1. Click "Plans" | All license plans listed with details | P1 |
| PLN-02 | **Toggle plan active/inactive** | Plan exists | 1. Toggle active switch | Plan status updated | P1 |
| KEY-01 | **View product keys** | Keys exist | 1. Click "Product Keys" | Table of all keys with status filter | P0 |
| KEY-02 | **Generate new key** | Logged in | 1. Click "Generate New Key" | New key created and added to table | P1 |
| KEY-03 | **Manual email send** | Key exists | 1. Click "Send Email" on a key | Product key email sent | P1 |

### 2.16 ForgeKey Admin — Customers & Email Log

| TC ID | Test Case | Precondition | Steps | Expected Result | Priority |
|---|---|---|---|---|---|
| CUS-01 | **View customers** | Users + rejected registrations exist | 1. Click "Customers" | Merged list with status badges | P0 |
| CUS-02 | **Filter customers by status** | Mixed statuses exist | 1. Click "Approved" pill | Only approved users shown | P1 |
| CUS-03 | **View email log** | Emails have been sent | 1. Click "Email Log" | All sent emails listed with status | P0 |
| CUS-04 | **Resend failed email** | Failed email exists | 1. Click "Resend" on failed entry | Email re-sent | P1 |

---

## 3. Security Test Cases

| TC ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| SEC-01 | **SQL/Mongo injection** | 1. Attempt injection in email/login fields | Rejected, no data leak | P0 |
| SEC-02 | **XSS in form fields** | 1. Enter `<script>alert('xss')</script>` in name/message | Sanitized/stripped, no execution | P0 |
| SEC-03 | **Rate limiting** | 1. Rapidly call login endpoint 100 times | 429 after threshold | P1 |
| SEC-04 | **JWT token tampering** | 1. Modify token in sessionStorage | Session rejected, redirect to login | P0 |
| SEC-05 | **Unauthenticated API access** | 1. Call `/api/admin/*` without token | 401 Unauthorized | P0 |
| SEC-06 | **CORS origin validation** | 1. Send request from unauthorized origin | Blocked by CORS | P1 |
| SEC-07 | **Password reset token reuse** | 1. Use a previously used reset token | Token invalidated after use | P1 |
| SEC-08 | **Disposable email rejection** | 1. Register with `test@mailinator.com` | Rejected: temporary email not allowed | P1 |

---

## 4. Performance Test Cases

| TC ID | Test Case | Measurement | Target | Priority |
|---|---|---|---|---|
| PERF-01 | **Initial page load (JS bundle)** | Main chunk size | < 400 KB | P1 |
| PERF-02 | **API response time — test generation** | Time to first result | < 5s (streaming) / < 15s (full) | P0 |
| PERF-03 | **API response time — knowledge search** | Time to results | < 3s | P1 |
| PERF-04 | **Dashboard data load** | Time to render | < 2s | P1 |
| PERF-05 | **MongoDB query performance** | With indexes | < 200ms per query | P1 |

---

## 5. Email Deliverability Test Cases

| TC ID | Test Case | Steps | Expected Result | Priority |
|---|---|---|---|---|
| EML-01 | **Product key email arrives** | 1. Admin approves registration | Email received in registrant's inbox (not spam) | P0 |
| EML-02 | **Support email arrives** | 1. Submit support form | Email received at SUPPORT_EMAIL | P0 |
| EML-03 | **Enterprise inquiry email arrives** | 1. Submit enterprise inquiry | Email received at SUPPORT_EMAIL | P0 |
| EML-04 | **Password reset email arrives** | 1. Request password reset | Email received with reset link | P0 |
| EML-05 | **Rejection email arrives** | 1. Admin rejects registration | Email received by registrant | P0 |

---

## 6. Regression Test Scenarios

### 6.1 Critical End-to-End Flow: Free Plan
```
Landing → Register → Free plan → Verify Key → Enter key via email
  → Account Activated → Login → Welcome Popup → Dismiss
  → Dashboard loads → Configure API key in Settings
  → Generate test cases → Export as PDF → Logout
```

### 6.2 Critical End-to-End Flow: Pro Plan (Paid)
```
Landing → Register → Pro plan → Stripe Checkout → Pay
  → Key generated & emailed → Complete Registration
  → Login → Welcome Popup → Dashboard → Generate
```

### 6.3 Critical End-to-End Flow: Enterprise
```
Landing → Register → Enterprise → Inquiry modal → Submit
  → Thank You → Admin receives email → Admin approves in ForgeKey
  → User receives key email → Complete Registration → Login
```

### 6.4 Critical End-to-End Flow: Admin Rejection
```
Landing → Register → Free plan → Pending → Admin rejects
  → User receives rejection email
```

---

## 7. Test Environment Configuration

### 7.1 Required Environment Variables (Test)
```bash
# ForgeQA (nextest-app/.env)
MONGO_URI=mongodb://localhost:27017/forgekey_test
MONGO_DB_NAME=forgekey_test
JWT_SECRET=test-jwt-secret
ENCRYPTION_SECRET=test-encryption-secret-32chars..
APP_URL=http://localhost:5173
RESEND_API_KEY=re_test_xxx
RESEND_FROM=test@example.com
SUPPORT_EMAIL=test@example.com
```

### 7.2 Test DB Setup
```bash
# Seed test data
mongosh forgekey_test --eval '
  db.admins.insertOne({ email: "admin@test.com", passwordHash: "...", name: "Test Admin" });
  db.product_keys.insertOne({ key: "TESTK-KEY01-12345-ABCDE-FGHIJ", status: "active", customerEmail: null });
  db.plans.insertMany([
    { id: "free", name: "Free", price: 0, tier: "free", active: true, features: ["1 user", "Basic generation"] },
    { id: "pro", name: "Pro", price: 2900, tier: "pro", active: true, features: ["5 users", "Advanced generation"] },
  ]);
'
```

---

## 8. Known Issues & Risk Areas

| # | Risk Area | Impact | Mitigation |
|---|---|---|---|
| 1 | Resend FROM domain not verified | Emails flagged as spam | Use SMTP with Gmail App Password as fallback |
| 2 | AI provider API key changes | Generation fails | Add test connection button + error handling |
| 3 | MongoDB Atlas NAT64 issue (Windows) | Connection failure | `--dns-result-order=ipv4first` flag in start scripts |
| 4 | Vercel serverless timeout (10s) | Long generations fail | Use streaming API for large generations |
| 5 | MongoDB connection pool exhaustion | Slow queries under load | `maxPoolSize: 10` configured |
