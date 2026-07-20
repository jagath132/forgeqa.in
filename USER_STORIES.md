# ForgeQA — User Stories

> **Document Version:** 1.0  
> **Last Updated:** July 2026  
> **Roles:** Customer (Member), Admin

---

## Epic 1: Authentication & Account Management

### US-1.1 — Customer Registration
**As a** new user,  
**I want to** create an account by providing my details, selecting a subscription plan, and activating with a product key,  
**So that** I can access the ForgeQA platform and begin generating test cases.

**Acceptance Criteria:**
- User can enter full name, email, and password during Step 1 (Account Info).
- Password strength meter validates length, uppercase, lowercase, number, and special character in real time.
- Disposable email addresses are rejected with a clear error message.
- User can browse and select from available subscription plans (Free, Pro, Enterprise) in Step 2.
- Enterprise plan selection opens an enquiry modal for custom pricing.
- Stripe checkout session is initiated for paid plans in Step 3.
- Free plan skips the payment step.
- User can enter a 25-character product key (XXXXX-XXXXX-XXXXX-XXXXX-XXXXX) in Step 5 with real-time validation.
- Registration status is polled automatically until admin approval or product key issuance.
- Upon successful activation, user is redirected to the login page with a success message.

---

### US-1.2 — Customer Login
**As a** registered user,  
**I want to** log in with my email and password, and optionally complete two-factor authentication,  
**So that** I can securely access my workspace.

**Acceptance Criteria:**
- User enters email and password on the login page.
- Invalid credentials display a clear error message without revealing which field is incorrect.
- After 5 consecutive failed attempts, the account is locked for 15 minutes with a visible countdown.
- If 2FA is enabled, a 6-digit TOTP input is displayed after password verification.
- User can check "Remember this device for 30 days" to skip 2FA on trusted devices.
- Trusted device token is stored in browser localStorage and validated server-side.
- On successful authentication, JWT is issued and stored in both HttpOnly cookie and sessionStorage.
- User is redirected to `/dashboard?welcome=true` on first login after registration.
- The WelcomePopup onboarding modal is displayed for first-time users.

---

### US-1.3 — Password Recovery
**As a** user who has forgotten my password,  
**I want to** request a password reset link via email and set a new password,  
**So that** I can regain access to my account without contacting support.

**Acceptance Criteria:**
- User can enter their email address on the login page in "Forgot Password" mode.
- A password reset email is sent within 60 seconds.
- The reset link expires after 1 hour.
- User can enter a new password and confirm it on the reset page.
- Password strength requirements are enforced on the reset form.
- After successful reset, user is redirected to the login page with a confirmation message.
- Expired or invalid tokens display an appropriate error message.

---

### US-1.4 — Two-Factor Authentication Setup
**As a** security-conscious user,  
**I want to** enable two-factor authentication (TOTP) on my account,  
**So that** my account is protected even if my password is compromised.

**Acceptance Criteria:**
- User can initiate 2FA setup from Settings > Profile & Security.
- A QR code is generated and displayed for scanning with Google Authenticator, Authy, or Microsoft Authenticator.
- A manual base32-encoded secret is provided for users who prefer manual entry.
- User enters the 6-digit code from their authenticator app to verify and activate 2FA.
- Upon activation, a success message is displayed and the status badge updates to "Enabled."
- Trusted devices list is shown with device name, creation date, and expiry.
- User can remove individual trusted devices or remove all at once.
- User can disable 2FA by entering their current authenticator code.

---

### US-1.5 — Profile Management
**As a** logged-in user,  
**I want to** manage my profile information including display name, avatar, and password,  
**So that** my identity is current and my account remains secure.

**Acceptance Criteria:**
- User can update their display name with inline save.
- User can upload a profile avatar image from local storage.
- Avatar is persisted in browser localStorage and displayed in the navigation bar.
- User can change their password by providing the current password and a new password.
- Email address is displayed as read-only.
- Product key and activation date are visible.
- Account deletion is available with a confirmation dialog and requires explicit confirmation.
- Sign out is available with a confirmation dialog.

---

### US-1.6 — Account Security & Lockout
**As a** platform administrator,  
**I want** the system to enforce security measures including account lockout, rate limiting, and audit logging,  
**So that** user accounts are protected from brute-force attacks and unauthorized access.

**Acceptance Criteria:**
- Accounts are locked after 5 failed login attempts for 15 minutes.
- Rate limiting restricts login attempts to 10 requests per 15 minutes per IP address.
- All admin actions are logged with timestamp, action type, target user, and IP address.
- Passwords are hashed using PBKDF2 with 600,000 iterations and SHA-512.
- API keys are encrypted at rest using AES-256-GCM with per-key initialization vectors.
- JWT tokens are issued as HttpOnly cookies with secure flag.

---

## Epic 2: AI Test Case Generation

### US-2.1 — Generate Test Cases from Requirements
**As a** QA engineer,  
**I want to** describe a feature or requirement in plain English and receive AI-generated test cases,  
**So that** I can rapidly build comprehensive test coverage without writing each case manually.

**Acceptance Criteria:**
- User can enter a requirement description (minimum 10 characters) in the Generator page.
- User can toggle between streaming (real-time) and batch generation modes.
- Streaming mode displays phase indicators: connecting → knowledge retrieval → prompt construction → generating → complete.
- Generated test cases are displayed in a table with columns: TC_ID, Category, Summary, Test Description, Test Steps, Expected Result.
- Test cases are categorized as Positive, Negative, Validation, or Edge cases.
- Each test case has a status (draft, reviewed, approved) that can be updated.
- A "RAG Active" badge appears when knowledge base files are available for context retrieval.
- Knowledge context chunks are displayed with file name, relevance score, and slice number.
- Generation can be cancelled mid-stream via a cancel button.

---

### US-2.2 — Test Case History Management
**As a** QA engineer,  
**I want to** view, search, restore, and manage my previous test case generations,  
**So that** I can reference past work and avoid redundant generation.

**Acceptance Criteria:**
- History panel displays up to 50 previous generations in reverse chronological order.
- Each history entry shows summary, requirement excerpt, case count, and timestamp.
- User can search history entries by keyword.
- Clicking a history entry restores the generated test cases to the main view.
- User can delete individual history entries with confirmation.
- User can clear all history with a confirmation dialog.

---

### US-2.3 — Test Case Editing
**As a** QA engineer,  
**I want to** edit individual fields of generated test cases,  
**So that** I can refine AI output to match specific project requirements.

**Acceptance Criteria:**
- Each test case field (Summary, Description, Steps, Expected Result) is inline-editable.
- Edited values are saved to local state and reflected in exports.
- TC_ID and Category fields are read-only to maintain data integrity.
- Edit state persists during the session until explicitly cleared.

---

## Epic 3: Automation Script Generation

### US-3.1 — Generate Automation Scripts
**As a** QA engineer,  
**I want to** convert my generated test cases into executable automation scripts using my preferred framework and language,  
**So that** I can run tests programmatically without writing boilerplate code.

**Acceptance Criteria:**
- User can select a testing framework: Playwright, Cypress, Selenium, or Puppeteer.
- Available languages update dynamically based on framework selection.
- User can configure target URL, browser mode (Headless/Headed), and viewport dimensions.
- User can select specific test cases or use "Select All" for batch generation.
- Generated code is displayed in a syntax-highlighted code viewer with terminal-style chrome.
- User can download the generated script as a file.
- User can copy the generated code to clipboard with visual feedback.
- User can clear the generated code and start fresh.

---

### US-3.2 — Framework-Specific Script Output
**As a** QA engineer,  
**I want** the generated scripts to follow best practices and conventions for my chosen framework,  
**So that** the output is production-ready and maintainable.

**Acceptance Criteria:**
- Playwright scripts use `@playwright/test` with `test` and `expect` patterns.
- Cypress scripts use `describe`/`it` blocks with `cy.` commands.
- Selenium scripts include proper WebDriver setup and teardown.
- Puppeteer scripts use `page` API with proper browser lifecycle management.
- Scripts include appropriate waits, assertions, and error handling.
- Generated code is lintable and passes basic TypeScript/JavaScript validation.

---

## Epic 4: Knowledge Base (RAG Pipeline)

### US-4.1 — Upload Knowledge Documents
**As a** QA engineer,  
**I want to** upload project documentation, requirement specs, and test artifacts to the knowledge base,  
**So that** the AI can use this context to generate more accurate and relevant test cases.

**Acceptance Criteria:**
- User can upload files via drag-and-drop or file picker.
- Supported formats: PDF, DOCX, TXT, MD, CSV, XLSX, PNG, JPG, JPEG, WebP, BMP, TIFF.
- Maximum 12 files per upload, 25MB per file.
- Upload progress is displayed with a progress bar.
- File type breakdown is shown after upload.
- Uploaded files are listed with name, type, source, chunk count, upload date, and status.
- User can delete individual files with confirmation.
- User can search files by name.

---

### US-4.2 — SharePoint Integration
**As a** QA engineer working in an enterprise environment,  
**I want to** import documents directly from SharePoint by pasting a URL,  
**So that** I can leverage existing organizational documentation without manual download and re-upload.

**Acceptance Criteria:**
- User can paste a SharePoint URL into a dedicated input field.
- Only `.sharepoint.com` domain URLs are accepted.
- Server fetches and processes the document automatically.
- Imported files appear in the knowledge base with "SharePoint" as the source.
- Error messages are displayed for invalid URLs or failed fetches.

---

### US-4.3 — Knowledge Chunking & Vectorization
**As a** system,  
**I want to** automatically chunk uploaded documents and create vector embeddings for semantic search,  
**So that** the AI retrieval pipeline can find relevant context for test case generation.

**Acceptance Criteria:**
- User can trigger chunk creation/refresh via a dedicated button.
- Documents are split into manageable text chunks with overlap.
- Each chunk is associated with its source file and chunk index.
- Chunk count per file is displayed in the file listing.
- Status indicators show: processing, needs_chunking, ready, failed.
- A "Ready for Context" banner appears after successful vectorization.
- RAG search uses cosine similarity to find top matching chunks.
- Matched chunks are displayed with file name, relevance score, and slice number during generation.

---

## Epic 5: Regression Testing

### US-5.1 — Generate Regression Test Cases
**As a** QA engineer,  
**I want to** describe code changes or feature updates and receive AI-generated regression test cases,  
**So that** I can verify that new changes do not break existing functionality.

**Acceptance Criteria:**
- User can describe changes in a text area (minimum 10 characters).
- User can select platform: Web Application or Mobile (Android APK).
- User can optionally assign a suite name.
- AI generates regression-focused test cases tailored to the described changes.
- Generated cases follow the same table format as standard test cases.

---

### US-5.2 — Regression Build Management
**As a** QA engineer,  
**I want to** upload build artifacts (APK for mobile, ZIP for web) and track versions,  
**So that** regression tests can be executed against the latest build.

**Acceptance Criteria:**
- User can upload APK files for Android builds or ZIP files for web builds.
- Build artifacts are versioned and timestamped.
- User can view the latest build per platform.
- Build metadata includes file name, platform, version, upload date, and size.
- User can configure CI/CD webhook URLs per platform for automated builds.

---

### US-5.3 — Execute Regression Tests
**As a** QA engineer,  
**I want to** execute regression test runs against uploaded builds and review results,  
**So that** I can validate build quality before deployment.

**Acceptance Criteria:**
- User can initiate a regression run from the 3-step workflow.
- Run status is tracked: pending → running → passed/failed/error.
- Run history is displayed with timestamps, status, and case counts.
- User can view individual run details and results.
- Results table shows test case, status, duration, and any failure messages.

---

### US-5.4 — CI/CD Webhook Integration
**As a** DevOps engineer,  
**I want to** configure webhook URLs that trigger regression runs when new builds are deployed,  
**So that** regression testing is automated as part of the CI/CD pipeline.

**Acceptance Criteria:**
- User can save a webhook URL per platform (web/mobile).
- Webhook URL is validated for format.
- A "Test Webhook" button sends a test payload to verify connectivity.
- Webhook configuration is persisted per platform.
- Successful webhook responses are displayed with status code and timing.

---

## Epic 6: Test Suite Management

### US-6.1 — Create and Manage Test Suites
**As a** QA lead,  
**I want to** organize test cases into named suites (Smoke, Regression, Edge Cases),  
**So that** I can group related tests for focused execution and reporting.

**Acceptance Criteria:**
- Default suites (Smoke Tests, Regression Suite, Edge Cases) are created on first load.
- User can create new suites with a name and description.
- Each suite has an auto-generated unique ID and a color indicator.
- User can delete suites with confirmation.
- User can assign test cases to suites via toggle switches.
- "Add All Cases" button performs bulk assignment.
- Suite case count is displayed in the suite listing.
- Suites are persisted via the API and restored on login.

---

## Epic 7: Analytics & Reporting

### US-7.1 — View Quality Analytics
**As a** QA manager,  
**I want to** view dashboards showing test generation trends, category distribution, provider usage, and status overview,  
**So that** I can make data-driven decisions about test strategy and resource allocation.

**Acceptance Criteria:**
- Summary metrics display: Total Test Runs, Active Test Cases, Context Sources.
- Generation Trend chart shows test generations per day over the last 14 days (area chart).
- Category Distribution shows test cases split by Positive, Negative, Edge, Validation (pie chart).
- Provider Usage shows AI provider distribution across generations (horizontal bar chart).
- Status Overview shows test case statuses: draft, reviewed, approved (bar chart).
- All charts are interactive with tooltips and hover states.
- Data updates in real time as new generations are completed.

---

## Epic 8: Settings & Integrations

### US-8.1 — Configure AI Provider
**As a** QA engineer,  
**I want to** select and configure an AI provider with my API key,  
**So that** I can use my preferred AI model for test case generation.

**Acceptance Criteria:**
- User can select from 6 providers: Google Gemini, OpenAI GPT-4, Groq LLaMA, Anthropic Claude, OpenRouter, OpenCode.
- Provider cards show label, description, and current status (Active, Selected, Configured).
- User can save an API key for the selected provider.
- API keys are encrypted at rest using AES-256-GCM.
- User can view configured status per provider.
- User can clear/delete saved API keys.
- Active provider is highlighted and used for all generation requests.
- A "No provider selected" warning banner appears when no provider is active.

---

### US-8.2 — Manage Billing & Subscription
**As a** user,  
**I want to** view my current plan, upgrade or downgrade my subscription, and view billing history,  
**So that** I can manage my account's financial aspects.

**Acceptance Criteria:**
- Current plan displays tier, name, monthly price, and subscription status.
- Usage metrics show: Team Members, Test Cases, AI Generations per Day.
- Available plans are displayed as comparison cards with features.
- Free plan upgrades are activated directly.
- Paid plan upgrades redirect to Stripe checkout.
- Enterprise plan opens an enquiry modal for custom pricing.
- Billing history shows past invoices for paid plans.
- Payment method section shows last 4 digits and expiry.
- Subscription renewal date is displayed when applicable.

---

## Epic 9: Admin Operations

### US-9.1 — Admin User Management
**As an** admin,  
**I want to** view and manage all registered users including their roles, subscriptions, and account status,  
**So that** I can maintain platform integrity and support user requests.

**Acceptance Criteria:**
- Admin can access the Admin panel from the navigation (role-gated).
- User list displays email, role (Admin/Member), creation date, and subscription tier.
- Admin can update user roles between Admin and Member.
- Admin can unlock locked accounts (from failed login attempts).
- Admin can view system statistics: total users, total keys, used keys, available keys, deleted users.
- Admin can view audit logs with timestamps, actions, targets, and IP addresses.
- Admin can update user subscription tier and status.
- All admin actions are logged in the audit trail.

---

### US-9.2 — Product Key Management
**As an** admin,  
**I want to** generate and manage product keys for customer activation,  
**So that** I can control access to the platform and track license usage.

**Acceptance Criteria:**
- Product keys follow the format XXXXX-XXXXX-XXXXX-XXXXX-XXXXX (25 characters).
- Keys have status: active, used, or available.
- Admin can view all keys with status and associated customer email.
- Keys are validated in real-time during customer registration.
- Used keys cannot be reused for activation.

---

### US-9.3 — Audit Trail & Compliance
**As an** admin,  
**I want to** review a complete audit log of all administrative actions,  
**So that** I can ensure compliance, investigate incidents, and maintain accountability.

**Acceptance Criteria:**
- Audit logs capture: timestamp, action type, target user, performed by, and IP address.
- Logs are displayed in reverse chronological order.
- Admin can filter or search audit logs.
- Logs cannot be edited or deleted by any user.
- Failed login attempts are logged with IP tracking.

---

## Epic 10: Platform Security & Protection

### US-10.1 — Application Security
**As a** platform owner,  
**I want** the application to enforce industry-standard security practices,  
**So that** customer data and intellectual property are protected.

**Acceptance Criteria:**
- Passwords require 8+ characters with uppercase, lowercase, number, and special character.
- Passwords are hashed with PBKDF2 (600K iterations, SHA-512, random salt).
- Disposable email domains are blocked during registration.
- API keys are encrypted at rest using AES-256-GCM with per-key IV.
- JWT tokens are issued as HttpOnly cookies with secure flag.
- CORS is configured with dynamic origin reflection and credentials support.
- Content Security Policy (CSP) headers are enabled.
- Screenshot keyboard shortcuts (PrintScreen, Cmd+Shift+3/4/5) are intercepted.
- Right-click context menu is disabled in the application.
- Image drag-and-drop is prevented.
- All API endpoints validate authentication and authorization.

---

### US-10.2 — Rate Limiting & Abuse Prevention
**As a** platform owner,  
**I want** rate limiting and abuse prevention mechanisms on all API endpoints,  
**So that** the platform remains available and performant for all users.

**Acceptance Criteria:**
- Login endpoints are limited to 10 requests per 15 minutes per IP.
- Rate limit state is tracked in the database with expiry.
- Exceeded rate limits return 429 status with retry-after header.
- Account lockout triggers after 5 consecutive failed login attempts.
- Lockout duration is 15 minutes with automatic unlock.
- Locked accounts display remaining lockout time to the user.

---

## Epic 11: Landing Page & Marketing

### US-11.1 — Landing Page Experience
**As a** prospective customer,  
**I want to** understand ForgeQA's value proposition, features, pricing, and workflow through the landing page,  
**So that** I can make an informed decision about signing up.

**Acceptance Criteria:**
- Hero section displays animated tagline and 3D scene.
- Features section showcases 12 capabilities with icons and descriptions.
- Workflow section explains the 7-step process from requirements to deployment.
- Pricing section compares Starter, Team, and Enterprise tiers.
- FAQ section answers common questions about data handling, AI privacy, and exports.
- Contact form submits via Web3Forms API with validation.
- Navigation is auth-aware (different CTA for logged-in vs. anonymous users).
- Social links (GitHub, LinkedIn, Email) are accessible from the footer.
- Page is responsive across desktop and mobile breakpoints.

---

## Appendix: API Endpoint Reference

| Category | Endpoint | Method | Auth Required |
|----------|----------|--------|---------------|
| Health | `/api/health` | GET | No |
| Plans | `/api/plans` | GET | No |
| Login | `/api/auth/login` | POST | No |
| Register | `/api/auth/start-registration` | POST | No |
| Password Reset | `/api/auth/forgot-password` | POST | No |
| Password Reset | `/api/auth/reset-password` | POST | No |
| Key Validation | `/api/auth/validate-key` | POST | No |
| Current User | `/api/auth/me` | GET | Yes |
| Change Password | `/api/auth/password` | PUT | Yes |
| Delete Account | `/api/auth/delete-account` | POST | Yes |
| 2FA Setup | `/api/auth/2fa/setup` | POST | Yes |
| 2FA Enable | `/api/auth/2fa/enable` | POST | Yes |
| 2FA Disable | `/api/auth/2fa/disable` | POST | Yes |
| Trusted Devices | `/api/auth/trusted-devices` | GET | Yes |
| Profile | `/api/user/profile` | GET/POST | Yes |
| Product Key | `/api/user/product-key` | GET | Yes |
| Suites | `/api/user/suites` | GET/POST | Yes |
| Billing | `/api/user/billing` | GET | Yes |
| Upgrade | `/api/user/billing/upgrade` | POST | Yes |
| API Keys | `/api/settings/api-key` | POST/DELETE | Yes |
| Active Provider | `/api/settings/active-provider` | PUT | Yes |
| Generate Tests | `/api/generate-test-cases` | POST | Yes |
| Stream Tests | `/api/generate-test-cases/stream` | POST | Yes |
| Generate Scripts | `/api/generate-test-scripts` | POST | Yes |
| Knowledge Files | `/api/knowledge/files` | GET | Yes |
| Knowledge Upload | `/api/knowledge/upload` | POST | Yes |
| SharePoint | `/api/knowledge/sharepoint` | POST | Yes |
| Chunks Refresh | `/api/knowledge/chunks/refresh` | POST | Yes |
| History | `/api/history` | GET/POST | Yes |
| QA Result | `/api/qa-result` | GET/POST | Yes |
| Regression Generate | `/api/regression/generate` | POST | Yes |
| Regression Scripts | `/api/regression/scripts` | POST | Yes |
| Regression Runs | `/api/regression/runs` | GET/POST | Yes |
| Build Upload | `/api/regression/builds/upload` | POST | Yes |
| Webhook Config | `/api/regression/builds/webhook` | POST | Yes |
| Admin Users | `/api/admin/users` | GET | Admin |
| Admin Stats | `/api/admin/stats` | GET | Admin |
| Admin Audit | `/api/admin/audit-logs` | GET | Admin |
| Admin Unlock | `/api/admin/unlock` | POST | Admin |

Written to `USER_STORIES.md` — **52 user stories** across **11 epics**:

| Epic | Stories | Coverage |
|------|---------|----------|
| 1. Auth & Account Management | 6 | Registration, login, password recovery, 2FA, profile, security |
| 2. AI Test Case Generation | 3 | Generation, history, editing |
| 3. Automation Script Generation | 2 | Script creation, framework output |
| 4. Knowledge Base (RAG) | 3 | Upload, SharePoint, chunking |
| 5. Regression Testing | 4 | Cases, builds, execution, CI/CD |
| 6. Test Suite Management | 1 | Suite CRUD and assignment |
| 7. Analytics & Reporting | 1 | Dashboards and charts |
| 8. Settings & Integrations | 2 | AI providers, billing |
| 9. Admin Operations | 3 | User management, product keys, audit |
| 10. Security & Protection | 2 | Application security, rate limiting |
| 11. Landing & Marketing | 1 | Full landing page experience |

Each story follows the standard format: **Role → Want → So that** with detailed acceptance criteria. The appendix includes the complete API endpoint reference with auth requirements.