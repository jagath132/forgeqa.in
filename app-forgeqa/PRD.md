# ForgeQA — Product Requirements Document (PRD)

## Version: 1.0 | Date: July 2025

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Product Goals](#4-product-goals)
5. [Architecture Overview](#5-architecture-overview)
6. [Technology Stack](#6-technology-stack)
7. [Feature Specifications](#7-feature-specifications)
8. [Working Flow](#8-working-flow)
9. [API Reference](#9-api-reference)
10. [Database Schema](#10-database-schema)
11. [Security](#11-security)
12. [Pricing](#12-pricing)
13. [Deployment](#13-deployment)
14. [Future Roadmap](#14-future-roadmap)

---

## 1. Product Overview

**ForgeQA** is an AI-powered QA automation platform that transforms requirement specifications into structured test cases, automation scripts, and regression test suites. It uses Retrieval-Augmented Generation (RAG) to inject domain-specific context from uploaded documents, producing high-quality, project-aware test artifacts.

### Core Value Proposition

> "Ship with confidence — QA automation that catches regressions before they ship."

### Key Differentiators

- **6 AI Providers** — Users choose from Gemini, OpenAI, Groq, Claude, OpenRouter, OpenCode
- **RAG Pipeline** — Upload documents (PDF, DOCX, XLSX, images) and the AI uses them as context
- **Full Automation** — From test case generation to executable scripts in one platform
- **Regression Testing** — AI-powered regression suites with CI/CD webhook integration
- **Enterprise Ready** — Multi-user teams, role-based access, audit logs, SSO

---

## 2. Problem Statement

### Current QA Challenges

| Problem                          | Impact                         |
| -------------------------------- | ------------------------------ |
| Manual test case writing is slow | Days to weeks per feature      |
| Test coverage gaps               | Regressions reach production   |
| Script maintenance burden        | Automation code rots over time |
| Knowledge silos                  | New team members lack context  |
| No regression tracking           | Broken features go unnoticed   |

### How ForgeQA Solves This

| Solution                | Benefit                                        |
| ----------------------- | ---------------------------------------------- |
| AI test case generation | 10x faster test creation                       |
| RAG from documentation  | Context-aware, relevant tests                  |
| Auto script generation  | Playwright/Cypress/Selenium scripts in seconds |
| Regression suites       | Automated regression on every build            |
| Knowledge base          | Institutional knowledge preserved              |

---

## 3. Target Users

| User Type            | Use Case                                                  |
| -------------------- | --------------------------------------------------------- |
| **QA Engineers**     | Generate test cases, write automation scripts             |
| **Test Leads**       | Manage test suites, track coverage, regression monitoring |
| **DevOps Engineers** | CI/CD integration, regression automation                  |
| **Product Managers** | Review test coverage, approve test cases                  |
| **Startups**         | Quick QA setup without dedicated QA team                  |
| **Enterprise Teams** | Multi-user collaboration, audit trails, compliance        |

---

## 4. Product Goals

| Goal                  | Metric                         | Target            |
| --------------------- | ------------------------------ | ----------------- |
| Faster test creation  | Time to generate 50 test cases | < 2 minutes       |
| Higher coverage       | Test cases per requirement     | 15-25 cases       |
| Regression prevention | Regression detection rate      | 95%+              |
| User adoption         | Monthly active users           | 10,000+ in Year 1 |
| Revenue               | Monthly recurring revenue      | ₹10L+ in Year 1   |

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                        │
│  React 19 + TypeScript + Tailwind CSS 4 + Zustand 5        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │Dashboard │Generator │Knowledge │Regression │Analytics │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP / SSE
┌─────────────────────────▼───────────────────────────────────┐
│                    SERVER (Node.js)                          │
│  Custom HTTP server (no Express) + Middleware routing        │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐  │
│  │Auth/2FA  │AI Gateway│Knowledge │Billing   │Email     │  │
│  │JWT/PBKDF2│6 Providers│RAG/OCR  │Stripe    │Resend    │  │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│              DATABASE (MongoDB Atlas)                        │
│  Collections: users, api_keys, knowledge_files,             │
│  knowledge_chunks, regression_runs, plans,                  │
│  totp_secrets, trusted_devices, audit_logs, etc.            │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Request
    │
    ▼
┌─────────────┐
│ CORS Check  │
└──────┬──────┘
       │
┌──────▼──────┐
│ Auth Check  │── JWT valid? ── No ──▶ 401 Unauthorized
└──────┬──────┘
       │ Yes
┌──────▼──────┐
│ Rate Limit  │── Exceeded? ── Yes ──▶ 429 Too Many Requests
└──────┬──────┘
       │ OK
┌──────▼──────┐
│ Route Match │
└──────┬──────┘
       │
┌──────▼──────┐
│ Handler     │── Business Logic ──▶ Response
└─────────────┘
```

---

## 6. Technology Stack

### Frontend

| Technology    | Version | Purpose                 |
| ------------- | ------- | ----------------------- |
| React         | 19.x    | UI framework            |
| TypeScript    | 5.x     | Type safety             |
| Vite          | 7.x     | Build tool & dev server |
| Tailwind CSS  | 4.x     | Utility-first CSS       |
| Zustand       | 5.x     | State management        |
| React Router  | 7.x     | Client-side routing     |
| Recharts      | 3.x     | Analytics charts        |
| Framer Motion | 12.x    | Animations              |
| Three.js      | 0.185   | 3D visualizations       |
| Axios         | 1.x     | HTTP client             |

### Backend

| Technology     | Version | Purpose             |
| -------------- | ------- | ------------------- |
| Node.js        | 24.x    | Runtime             |
| MongoDB Driver | 7.x     | Database            |
| jsonwebtoken   | 9.x     | JWT auth            |
| multer         | 2.x     | File uploads        |
| nodemailer     | 9.x     | SMTP email          |
| resend         | 6.x     | Transactional email |
| qrcode         | 1.x     | 2FA QR codes        |
| pdf-parse      | 2.x     | PDF extraction      |
| mammoth        | 1.x     | DOCX extraction     |
| xlsx           | 0.18    | Excel extraction    |
| tesseract.js   | 7.x     | Image OCR           |

### DevOps

| Technology          | Purpose          |
| ------------------- | ---------------- |
| ESLint + Prettier   | Code quality     |
| Husky + lint-staged | Git hooks        |
| Vitest              | Testing          |
| MSW                 | API mocking      |
| Sentry              | Error monitoring |

---

## 7. Feature Specifications

### 7.1 Authentication & Account Management

#### Registration Flow (5 Steps)

```
Step 1: Account Info
    │  Name, Email, Password
    │  Password validation: 8+ chars, uppercase, lowercase, number, special char
    │  Disposable email check
    ▼
Step 2: Plan Selection
    │  Free / Pro / Enterprise
    │  Price display based on selection
    ▼
Step 3: Payment (Pro/Enterprise only)
    │  Stripe checkout OR Razorpay order
    │  Redirect to payment gateway
    │  Webhook confirms payment
    ▼
Step 4: Verification Polling
    │  Poll registration status every 3 seconds
    │  Wait for admin approval (if required)
    ▼
Step 5: Product Key Activation
    │  Enter product key (XXXXX-XXXXX-XXXXX-XXXXX-XXXXX)
    │  Key validated and claimed
    │  Account activated
    ▼
Dashboard (First Login)
```

#### Login Flow

```
Email + Password
    │
    ▼
PBKDF2 Verification (600K iterations, SHA-512)
    │
    ├── Invalid ──▶ Record failed attempt
    │                 │
    │                 ├── 5+ failures ──▶ Lock account (15 min)
    │                 │
    │                 └── < 5 failures ──▶ Show "Invalid credentials"
    │
    ▼ Valid
Check 2FA Status
    │
    ├── 2FA Enabled ──▶ Check trusted device token
    │                      │
    │                      ├── Trusted ──▶ Issue JWT ──▶ Dashboard
    │                      │
    │                      └── Not trusted ──▶ Show 6-digit input
    │                                            │
    │                                            ├── "Remember device" checkbox
    │                                            │
    │                                            └── Verify TOTP code
    │                                                  │
    │                                                  ├── Valid ──▶ Issue JWT ──▶ Dashboard
    │                                                  │              (store device token if checked)
    │                                                  │
    │                                                  └── Invalid ──▶ Show error
    │
    └── 2FA Disabled ──▶ Issue JWT ──▶ Dashboard
```

#### Two-Factor Authentication (TOTP)

| Step    | Action                             | Backend                                         | Frontend                                        |
| ------- | ---------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| Setup   | User clicks "Enable 2FA"           | Generate TOTP secret (20 bytes) + QR code       | Show QR code + manual secret                    |
| Enable  | User scans QR, enters 6-digit code | Verify code against secret, set `enabled: true` | Show success, update status                     |
| Login   | User logs in with 2FA              | Check if 2FA enabled, verify code               | Show 6-digit input + "Remember device" checkbox |
| Disable | User clicks "Disable 2FA"          | Verify code, delete TOTP record                 | Update status                                   |

**TOTP Algorithm:**

- HMAC-SHA1 with 30-second time steps
- 6-digit codes
- Time window: ±1 step (90 seconds tolerance)

#### Remember This Device

| Component  | Details                                                               |
| ---------- | --------------------------------------------------------------------- |
| Token      | 32-byte random hex string                                             |
| Storage    | localStorage (client) + MongoDB `trusted_devices` collection (server) |
| Expiry     | 30 days from creation                                                 |
| Bypass     | Skip 2FA on trusted devices                                           |
| Management | View/revoke individual devices, remove all devices                    |

#### Password Reset Flow

```
User clicks "Forgot Password"
    │
    ▼
Enter email
    │
    ▼
Check if email registered
    │
    ├── Not registered ──▶ Error: "This email is not registered"
    │
    ▼ Registered
Generate reset token (32-byte random hex)
    │
    ▼
Store in password_reset_tokens (expires: 1 hour)
    │
    ▼
Send email with reset link
    │
    ▼
User clicks link ──▶ /auth/reset-password?token=...
    │
    ▼
Enter new password
    │
    ▼
Validate password strength
    │
    ▼
Update password, delete reset token
    │
    ▼
Redirect to login
```

---

### 7.2 AI Test Case Generation

#### Generation Flow

```
User enters requirement text
    │  (min 10 characters)
    ▼
┌─────────────────────────────────────────┐
│ PHASE 1: Knowledge Retrieval (RAG)      │
│  • Search knowledge base chunks         │
│  • Cosine similarity scoring            │
│  • Return top matching chunks           │
│  • Display relevance scores             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ PHASE 2: Prompt Assembly                │
│  • System prompt + RAG context          │
│  • Requirement text                     │
│  • Output format instructions           │
│  • Category definitions                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ PHASE 3: AI Generation (Streaming)      │
│  • SSE token-by-token delivery          │
│  • Real-time progress display           │
│  • Phase indicator updates              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ PHASE 4: Test Case Processing           │
│  • Parse JSON response                  │
│  • Assign TC_IDs                        │
│  • Categorize (Positive/Negative/       │
│    Edge/Validation)                     │
│  • Save to history                      │
└──────────────┬──────────────────────────┘
               │
               ▼
Display Generated Test Cases
    │  TC_ID | Category | Summary | Steps | Expected
    ▼
User can:
    • Edit test cases
    • Export (PDF/Excel)
    • Send to Automation Scripts
    • Add to Test Suites
    • Save to history
```

#### AI Provider Configuration

| Provider      | Model        | API Format                               | Notes               |
| ------------- | ------------ | ---------------------------------------- | ------------------- |
| Google Gemini | 2.0 Flash    | REST (generativelanguage.googleapis.com) | Free tier available |
| OpenAI        | GPT-4o-mini  | OpenAI Chat Completions                  | Requires API key    |
| Groq          | LLaMA 3.1 8B | OpenAI-compatible                        | Fast inference      |
| Claude        | 3.5 Sonnet   | OpenAI-compatible                        | Via proxy           |
| OpenRouter    | Various      | OpenAI-compatible                        | Multiple models     |
| OpenCode      | Various      | OpenAI-compatible                        | Custom endpoint     |

#### Test Case Output Format

```json
{
  "testCases": [
    {
      "tc_id": "TC_001",
      "category": "Positive",
      "summary": "Successful login with valid credentials",
      "test_description": "Verify that a user can log in using a registered email and correct password.",
      "test_steps": [
        "Navigate to login page",
        "Enter registered email",
        "Enter correct password",
        "Click Sign In"
      ],
      "expected": "User is redirected to the dashboard",
      "status": "draft"
    }
  ]
}
```

---

### 7.3 Knowledge Base (RAG Pipeline)

#### Document Processing Flow

```
User uploads file(s)
    │  Max 12 files, 25MB each
    ▼
┌─────────────────────────────────────────┐
│ File Type Detection                     │
│  PDF → pdf-parse                        │
│  DOCX → mammoth                         │
│  TXT/MD → direct read                   │
│  CSV → parse rows                       │
│  XLSX → xlsx library                    │
│  Images → Tesseract.js OCR              │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ Text Extraction                         │
│  • Extract raw text content             │
│  • Clean and normalize                  │
│  • Store in knowledge_files collection  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ Chunking                                │
│  • Split into ~700 char chunks          │
│  • Preserve context boundaries          │
│  • Store in knowledge_chunks collection │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ Vector Index (MongoDB Text Search)      │
│  • Text-based similarity search         │
│  • Relevance scoring                    │
│  • Ready for RAG queries                │
└─────────────────────────────────────────┘
```

#### Supported File Types

| Type   | Extension                             | Library      | Max Size |
| ------ | ------------------------------------- | ------------ | -------- |
| PDF    | .pdf                                  | pdf-parse    | 25MB     |
| Word   | .docx                                 | mammoth      | 25MB     |
| Text   | .txt, .md                             | fs.readFile  | 25MB     |
| CSV    | .csv                                  | csv-parse    | 25MB     |
| Excel  | .xlsx                                 | xlsx         | 25MB     |
| Images | .png, .jpg, .jpeg, .webp, .bmp, .tiff | tesseract.js | 25MB     |

#### SharePoint Integration

- Paste a SharePoint document URL
- Server fetches the document via HTTPS
- Processes through the same pipeline
- Only `.sharepoint.com` domains allowed

---

### 7.4 Automation Script Generation

#### Script Generation Flow

```
User selects test cases from generator
    │
    ▼
Configure options:
    │  • Framework: Playwright / Cypress / Selenium / Puppeteer
    │  • Language: JS / TS / Python / Java / C#
    │  • Mode: Headless / Headed
    │  • Viewport: Width x Height
    │  • Target URL: Application URL
    ▼
┌─────────────────────────────────────────┐
│ AI Prompt Assembly                      │
│  • Selected test cases as input         │
│  • Framework-specific instructions      │
│  • Language-specific syntax rules       │
│  • Configuration options                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ AI Generation                           │
│  • Generate executable test script      │
│  • Include imports and setup            │
│  • Add assertions and selectors         │
│  • Handle waits and navigation          │
└──────────────┬──────────────────────────┘
               │
               ▼
Display Generated Script
    │  Syntax-highlighted code viewer
    ▼
User can:
    • Copy to clipboard
    • Download as file
    • Modify and regenerate
```

#### Supported Frameworks

| Framework  | Languages            | Best For                             |
| ---------- | -------------------- | ------------------------------------ |
| Playwright | TS, JS               | Modern web apps, cross-browser       |
| Cypress    | TS, JS               | Component testing, E2E               |
| Selenium   | Python, Java, C#, JS | Legacy systems, wide browser support |
| Puppeteer  | JS, TS               | Chrome-specific automation           |
| Appium     | Python, Java         | Mobile (Android/iOS)                 |

---

### 7.5 Regression Testing

#### 3-Step Regression Workflow

```
┌─────────────────────────────────────────────────────┐
│ STEP 1: Generate Regression Test Cases              │
│  • Describe changes/feature updates                 │
│  • Select platform (Web / Mobile)                   │
│  • AI generates regression-focused test cases       │
│  • Focus on breaking changes and edge cases         │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│ STEP 2: Generate Regression Scripts                 │
│  • Select framework based on platform               │
│  • Generate automation scripts                      │
│  • Web: Playwright/Cypress/Selenium                 │
│  • Mobile: Appium                                   │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│ STEP 3: Execute & Review                            │
│  • Upload build artifact (APK/ZIP)                  │
│  • Execute regression run (simulated)               │
│  • Track results (passed/failed/error)              │
│  • View run history                                 │
└─────────────────────────────────────────────────────┘
```

#### Build Artifact Management

| Feature         | Details                                              |
| --------------- | ---------------------------------------------------- |
| Upload          | APK (Android) or ZIP (Web) files                     |
| Versioning      | Track version per platform                           |
| Latest Build    | Auto-retrieve latest artifact per platform           |
| CI/CD Webhooks  | Configure webhook URLs for build notifications       |
| Webhook Testing | Send simulated payloads to test webhook connectivity |

---

### 7.6 Test Suite Management

```
┌─────────────────────────────────────────┐
│ Create Suite                            │
│  • Name: "Smoke Tests"                  │
│  • Description: "Critical path tests"   │
│  • Color: Blue                          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│ Assign Test Cases                       │
│  • Toggle individual cases in/out       │
│  • "Add All Cases" bulk operation       │
│  • View assigned cases in table         │
└──────────────┬──────────────────────────┘
               │
┌─────────────────────────────────────────┐
│ Manage Suites                           │
│  • Create new suites                    │
│  • Delete suites                        │
│  • View case counts per suite           │
│  • Color-coded tabs                     │
└─────────────────────────────────────────┘
```

---

### 7.7 Analytics & Reporting

| Chart                 | Data Source        | Visualization                       |
| --------------------- | ------------------ | ----------------------------------- |
| Generation Trend      | History (14 days)  | Area chart                          |
| Category Distribution | Test cases         | Pie chart                           |
| Provider Usage        | Generation history | Horizontal bar chart                |
| Status Overview       | Test cases         | Bar chart (draft/reviewed/approved) |
| Summary Metrics       | All data           | KPI cards                           |

---

### 7.8 Settings & Configuration

#### Profile & Security

| Setting         | Details                                  |
| --------------- | ---------------------------------------- |
| Display Name    | Editable, shown in UI                    |
| Email           | Read-only, shown for reference           |
| Product Key     | View active key, activation date         |
| 2FA             | Enable/disable, QR code, trusted devices |
| Change Password | Current + new password                   |
| Delete Account  | Permanent, removes all data              |

#### Billing

| Section         | Details                                  |
| --------------- | ---------------------------------------- |
| Current Plan    | Shows active plan with features          |
| Available Plans | Free, Pro, Enterprise comparison         |
| Upgrade         | Stripe checkout for paid plans           |
| Usage           | Test cases, AI generations, team members |
| Billing History | Past invoices (Stripe)                   |

#### AI Provider

| Setting            | Details                          |
| ------------------ | -------------------------------- |
| Provider Selection | Choose from 6 providers          |
| API Key Management | Save/view/delete encrypted keys  |
| Key Encryption     | AES-256-GCM with per-key IV      |
| Status Indicators  | Active/Configured/Not Configured |

---

### 7.9 Admin Panel

| Feature           | Access     | Details                                 |
| ----------------- | ---------- | --------------------------------------- |
| User Management   | Admin only | List users, change roles, subscriptions |
| System Statistics | Admin only | Total users, keys, revenue              |
| Audit Logs        | Admin only | Track admin actions with IP             |
| Account Unlock    | Admin only | Unlock locked accounts                  |
| Plan Management   | Admin only | View/edit subscription plans            |

---

## 8. Working Flow

### 8.1 New User Journey

```
┌─────────────────────────────────────────────────────────────┐
│                    NEW USER JOURNEY                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Visit Landing Page (forgeqa.in)                         │
│     │  • View features, pricing, testimonials               │
│     │  • Click "Get Started" or "Sign Up"                   │
│     ▼                                                       │
│  2. Registration Page                                       │
│     │  • Step 1: Enter name, email, password                │
│     │  • Step 2: Select plan (Free/Pro/Enterprise)          │
│     │  • Step 3: Payment (if Pro/Enterprise)                │
│     │  • Step 4: Verify email                               │
│     │  • Step 5: Enter product key                          │
│     ▼                                                       │
│  3. First Login                                             │
│     │  • Welcome popup with onboarding                      │
│     │  • Guided tour of features                            │
│     ▼                                                       │
│  4. Dashboard                                               │
│     │  • View metrics and readiness checklist               │
│     │  • Quick access to key features                       │
│     ▼                                                       │
│  5. Configure AI Provider                                   │
│     │  • Go to Settings                                     │
│     │  • Select AI provider (e.g., Gemini)                  │
│     │  • Enter API key                                      │
│     ▼                                                       │
│  6. Upload Knowledge Base                                   │
│     │  • Go to Knowledge Base                               │
│     │  • Upload project documentation                       │
│     │  • Wait for processing                                │
│     ▼                                                       │
│  7. Generate Test Cases                                     │
│     │  • Go to Generator                                    │
│     │  • Paste requirement text                             │
│     │  • Click "Generate"                                   │
│     │  • Review generated test cases                        │
│     ▼                                                       │
│  8. Create Automation Scripts                               │
│     │  • Go to Test Scripts                                 │
│     │  • Select test cases                                  │
│     │  • Choose framework and language                      │
│     │  • Generate and download scripts                      │
│     ▼                                                       │
│  9. Monitor & Iterate                                      │
│     │  • View Analytics                                     │
│     │  • Track regression runs                              │
│     │  • Manage test suites                                 │
│     ▼                                                       │
│  10. Scale (Enterprise)                                     │
│     • Add team members                                     │
│     • Set up CI/CD webhooks                                 │
│     • Configure SSO/SAML                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Test Case Generation Flow (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│                 TEST CASE GENERATION                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUT                                                      │
│  ──────                                                     │
│  "As a user, I want to reset my password so that I can     │
│   regain access to my account if I forget my password."     │
│                                                             │
│  PROCESS                                                    │
│  ───────                                                    │
│                                                             │
│  1. RAG CONTEXT RETRIEVAL                                   │
│     • Search knowledge chunks for "password reset"          │
│     • Find: auth docs, API specs, user guides               │
│     • Score: 0.95, 0.87, 0.82 relevance                    │
│                                                             │
│  2. PROMPT ASSEMBLY                                         │
│     ┌─────────────────────────────────────────────┐         │
│     │ System: You are a QA expert. Generate test  │         │
│     │ cases for the following requirement.        │         │
│     │                                             │         │
│     │ Context from knowledge base:                │         │
│     │ [RAG chunks injected here]                  │         │
│     │                                             │         │
│     │ Requirement: [user's input]                 │         │
│     │                                             │         │
│     │ Output format: JSON with test cases...      │         │
│     └─────────────────────────────────────────────┘         │
│                                                             │
│  3. AI GENERATION (Streaming)                               │
│     • Tokens arrive one by one                              │
│     • Real-time display in UI                               │
│     • Phase indicator: "Generating..."                      │
│                                                             │
│  4. OUTPUT                                                  │
│     ┌─────────────────────────────────────────────┐         │
│     │ TC_001 | Positive | Valid email reset       │         │
│     │ TC_002 | Negative | Invalid email           │         │
│     │ TC_003 | Edge     | Expired token           │         │
│     │ TC_004 | Validation | Weak password         │         │
│     │ TC_005 | Positive | Successful reset        │         │
│     │ ...                                          │         │
│     │ Total: 18 test cases generated              │         │
│     └─────────────────────────────────────────────┘         │
│                                                             │
│  USER ACTIONS                                               │
│  ───────────                                               │
│  • Edit individual test cases                               │
│  • Export to PDF/Excel                                      │
│  • Send to Automation Scripts                               │
│  • Add to Test Suites                                       │
│  • Save to History                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Login & Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│              AUTHENTICATION FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LOGIN (No 2FA)                                             │
│  ──────────────                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Email +  │───▶│ PBKDF2   │───▶│ Issue    │──▶ Dashboard │
│  │ Password │    │ Verify   │    │ JWT      │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                             │
│  LOGIN (With 2FA)                                           │
│  ─────────────────                                          │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Email +  │───▶│ PBKDF2   │───▶│ Check    │              │
│  │ Password │    │ Verify   │    │ 2FA      │              │
│  └──────────┘    └──────────┘    └────┬─────┘              │
│                                       │                     │
│                              ┌────────▼────────┐           │
│                              │ Check Trusted   │           │
│                              │ Device Token    │           │
│                              └────────┬────────┘           │
│                                       │                     │
│                          ┌────────────┼────────────┐       │
│                          │            │            │       │
│                     Trusted      Not Trusted      │       │
│                          │            │            │       │
│                          ▼            ▼            │       │
│                    Issue JWT    Show 6-digit      │       │
│                          │      input             │       │
│                          │            │            │       │
│                          │      ┌─────▼─────┐     │       │
│                          │      │ Verify    │     │       │
│                          │      │ TOTP Code │     │       │
│                          │      └─────┬─────┘     │       │
│                          │            │            │       │
│                          │      Valid │ Invalid    │       │
│                          │            │            │       │
│                          │      Issue JWT   Error │       │
│                          │      (store      │     │       │
│                          │      device      │     │       │
│                          │      token)      │     │
│                          │            │            │       │
│                          ▼            ▼            │       │
│                       Dashboard                   │       │
│                                                             │
│  REGISTRATION                                               │
│  ────────────                                               │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Start    │───▶│ Select   │───▶│ Payment  │              │
│  │ Register │    │ Plan     │    │ (Stripe) │              │
│  └──────────┘    └──────────┘    └────┬─────┘              │
│                                       │                     │
│                              ┌────────▼────────┐           │
│                              │ Complete        │           │
│                              │ Registration    │           │
│                              │ (Product Key)   │           │
│                              └────────┬────────┘           │
│                                       │                     │
│                                       ▼                     │
│                              Dashboard                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. API Reference

### 9.1 Public Endpoints

| Method | Path                              | Description                     |
| ------ | --------------------------------- | ------------------------------- |
| GET    | `/api/health`                     | Health check                    |
| GET    | `/api/plans`                      | List subscription plans         |
| POST   | `/api/auth/login`                 | User login                      |
| POST   | `/api/auth/start-registration`    | Start registration              |
| POST   | `/api/auth/select-plan`           | Select plan during registration |
| POST   | `/api/auth/complete-registration` | Complete registration           |
| POST   | `/api/auth/forgot-password`       | Request password reset          |
| POST   | `/api/auth/reset-password`        | Reset password with token       |
| POST   | `/api/auth/validate-key`          | Validate product key            |
| POST   | `/api/auth/support`               | Send support message            |
| POST   | `/api/auth/enterprise-inquiry`    | Enterprise inquiry              |
| POST   | `/api/payments/create-checkout`   | Create Stripe checkout          |
| POST   | `/api/payments/create-order`      | Create Razorpay order           |

### 9.2 Authenticated Endpoints

| Method | Path                            | Description           |
| ------ | ------------------------------- | --------------------- |
| GET    | `/api/auth/me`                  | Get current user      |
| POST   | `/api/auth/welcome-seen`        | Mark welcome seen     |
| PUT    | `/api/auth/password`            | Change password       |
| POST   | `/api/auth/delete-account`      | Delete account        |
| POST   | `/api/auth/2fa/setup`           | Setup 2FA             |
| POST   | `/api/auth/2fa/enable`          | Enable 2FA            |
| POST   | `/api/auth/2fa/disable`         | Disable 2FA           |
| GET    | `/api/auth/trusted-devices`     | List trusted devices  |
| DELETE | `/api/auth/trusted-devices`     | Remove trusted device |
| GET    | `/api/settings/api-keys`        | List API keys         |
| POST   | `/api/settings/api-key`         | Save API key          |
| DELETE | `/api/settings/api-key`         | Delete API key        |
| PUT    | `/api/settings/active-provider` | Set active provider   |
| GET    | `/api/user/profile`             | Get profile           |
| POST   | `/api/user/profile`             | Save profile          |
| GET    | `/api/user/product-key`         | Get product key       |
| GET    | `/api/user/team`                | Get team              |
| POST   | `/api/user/team`                | Save team             |
| GET    | `/api/user/suites`              | Get suites            |
| POST   | `/api/user/suites`              | Save suites           |
| GET    | `/api/user/billing`             | Get billing           |
| POST   | `/api/user/billing/upgrade`     | Upgrade plan          |
| POST   | `/api/user/billing/checkout`    | Create checkout       |
| GET    | `/api/history`                  | Get history           |
| POST   | `/api/history`                  | Save history          |
| GET    | `/api/qa-result`                | Get QA result         |
| POST   | `/api/qa-result`                | Save QA result        |

### 9.3 AI Generation Endpoints

| Method | Path                              | Description                 |
| ------ | --------------------------------- | --------------------------- |
| POST   | `/api/generate-test-cases`        | Generate test cases         |
| POST   | `/api/generate-test-cases/stream` | Generate with SSE streaming |
| POST   | `/api/generate-test-scripts`      | Generate automation scripts |

### 9.4 Knowledge Base Endpoints

| Method | Path                            | Description               |
| ------ | ------------------------------- | ------------------------- |
| GET    | `/api/knowledge/files`          | List knowledge files      |
| POST   | `/api/knowledge/upload`         | Upload documents          |
| DELETE | `/api/knowledge/files/:id`      | Delete knowledge file     |
| POST   | `/api/knowledge/sharepoint`     | Fetch SharePoint document |
| GET    | `/api/knowledge/search`         | Search knowledge          |
| POST   | `/api/knowledge/chunks/refresh` | Refresh chunks            |

### 9.5 Regression Endpoints

| Method | Path                                      | Description                 |
| ------ | ----------------------------------------- | --------------------------- |
| POST   | `/api/regression/generate`                | Generate regression cases   |
| POST   | `/api/regression/scripts`                 | Generate regression scripts |
| POST   | `/api/regression/runs`                    | Create regression run       |
| GET    | `/api/regression/runs`                    | List regression runs        |
| GET    | `/api/regression/runs/:id`                | Get regression run          |
| POST   | `/api/regression/runs/:id/execute`        | Execute regression run      |
| POST   | `/api/regression/builds/upload`           | Upload build artifact       |
| GET    | `/api/regression/builds/latest/:platform` | Get latest build            |
| POST   | `/api/regression/builds/webhook`          | Save webhook URL            |
| GET    | `/api/regression/builds/webhook`          | List webhooks               |

### 9.6 Admin Endpoints

| Method | Path                                | Description         |
| ------ | ----------------------------------- | ------------------- |
| GET    | `/api/admin/users`                  | List users          |
| GET    | `/api/admin/stats`                  | Get statistics      |
| PUT    | `/api/admin/users/:id`              | Update user         |
| GET    | `/api/admin/audit-logs`             | Get audit logs      |
| POST   | `/api/admin/unlock`                 | Unlock account      |
| GET    | `/api/admin/billing/plans`          | List plans          |
| PUT    | `/api/admin/users/:id/subscription` | Update subscription |

---

## 10. Database Schema

### 10.1 Collections Overview

| Collection              | Purpose               | Key Fields                                    |
| ----------------------- | --------------------- | --------------------------------------------- |
| `users`                 | User accounts         | email, passwordHash, salt, role, subscription |
| `user_api_keys`         | Encrypted API keys    | userId, provider, encryptedKey                |
| `user_data`             | User data (key-value) | userId, key, value                            |
| `knowledge_files`       | Uploaded documents    | userId, fileName, fileType, status            |
| `knowledge_chunks`      | RAG text chunks       | fileId, chunkText, index                      |
| `regression_runs`       | Regression runs       | userId, status, results                       |
| `regression_builds`     | Build artifacts       | userId, platform, fileName                    |
| `regression_webhooks`   | CI/CD webhooks        | userId, platform, url                         |
| `product_keys`          | License keys          | key, status, customerEmail                    |
| `plans`                 | Subscription plans    | id, name, price, features                     |
| `totp_secrets`          | 2FA secrets           | userId, secret, enabled                       |
| `trusted_devices`       | Trusted devices       | userId, token, expiresAt                      |
| `rate_limits`           | Rate limiting         | ip, endpoint, count                           |
| `audit_logs`            | Admin audit trail     | adminId, action, ip                           |
| `password_reset_tokens` | Reset tokens          | token, userId, expiresAt                      |
| `pending_registrations` | Registration sessions | email, pendingId, status                      |
| `deleted_users`         | Soft-deleted users    | userId, email, deletedAt                      |

---

## 11. Security

### 11.1 Authentication Security

| Measure                   | Implementation                                       |
| ------------------------- | ---------------------------------------------------- |
| Password Hashing          | PBKDF2, 600K iterations, SHA-512, random salt        |
| Password Validation       | 8+ chars, uppercase, lowercase, number, special char |
| JWT Tokens                | HttpOnly cookies + sessionStorage (dual transport)   |
| Timing-Safe Comparison    | `crypto.timingSafeEqual` for password verification   |
| Account Lockout           | 5 failed attempts → 15-minute lockout                |
| Rate Limiting             | 10 requests per 15 minutes per IP                    |
| Disposable Email Blocking | Block temporary email domains                        |

### 11.2 Data Security

| Measure            | Implementation                             |
| ------------------ | ------------------------------------------ |
| API Key Encryption | AES-256-GCM with per-key IV and auth tag   |
| CORS               | Dynamic origin reflection with credentials |
| Content-Type       | `X-Content-Type-Options: nosniff`          |
| Request Limits     | 512KB JSON, 25MB file uploads              |
| File Upload        | Whitelist of allowed extensions            |
| HttpOnly Cookies   | `SameSite=Strict`                          |

### 11.3 Application Security

| Measure               | Implementation                  |
| --------------------- | ------------------------------- |
| Screenshot Prevention | Keyboard shortcut interception  |
| Right-Click Disabled  | Context menu prevented          |
| Image Drag Disabled   | Drag events blocked             |
| CSP Headers           | Content Security Policy enabled |
| Audit Logging         | Admin actions tracked with IP   |

---

## 12. Pricing

### 12.1 Plan Comparison

| Feature            | Free (₹0)  | Pro (₹999/mo) | Enterprise (Custom) |
| ------------------ | ---------- | ------------- | ------------------- |
| Test Cases         | 50/month   | 500/month     | Unlimited           |
| AI Providers       | 1 (Gemini) | All 6         | All 6 + Custom      |
| Knowledge Base     | 5 files    | 50 files      | Unlimited           |
| Team Members       | 1          | 5             | Unlimited           |
| Automation Scripts | 10/month   | Unlimited     | Unlimited           |
| Test Suites        | 2          | Unlimited     | Unlimited           |
| Regression Runs    | 3/month    | 50/month      | Unlimited           |
| CI/CD Webhooks     | No         | Yes           | Yes                 |
| SSO/SAML           | No         | No            | Yes                 |
| Support            | Community  | Email         | Dedicated Manager   |
| API Access         | No         | Yes           | Full Access         |
| Audit Logs         | No         | Yes           | Full History        |

### 12.2 Enterprise Volume Discounts

| Team Size | Price/User/Month | Discount |
| --------- | ---------------- | -------- |
| 1–10      | ₹1,499           | 0%       |
| 11–25     | ₹1,299           | 13%      |
| 26–50     | ₹1,099           | 27%      |
| 51–100    | ₹899             | 40%      |
| 100+      | ₹699             | 53%      |

---

## 13. Deployment

### 13.1 Deployment Options

| Option            | Command              | URL                   |
| ----------------- | -------------------- | --------------------- |
| Development       | `npm run dev`        | http://127.0.0.1:5173 |
| Production Build  | `npm run build`      | dist/ folder          |
| Production Server | `npm run start`      | Node.js server        |
| Vercel            | Auto-deploy from Git | vercel.app            |
| Railway           | Auto-deploy from Git | railway.app           |

### 13.2 Environment Variables

| Variable            | Purpose                         |
| ------------------- | ------------------------------- |
| `MONGO_URI`         | MongoDB Atlas connection string |
| `MONGO_DB_NAME`     | Database name                   |
| `JWT_SECRET`        | JWT signing secret              |
| `ENCRYPTION_SECRET` | API key encryption secret       |
| `APP_URL`           | Application URL                 |
| `RESEND_API_KEY`    | Resend email API key            |
| `RESEND_FROM`       | Sender email address            |
| `SUPPORT_EMAIL`     | Support email recipient         |
| `SMTP_HOST`         | SMTP server host                |
| `SMTP_PORT`         | SMTP server port                |
| `SMTP_USER`         | SMTP username                   |
| `SMTP_PASS`         | SMTP password                   |

---

## 14. Future Roadmap

### Phase 2 (Q3 2025)

- [ ] Stripe webhook handler for subscription lifecycle
- [ ] Usage tracking and limit enforcement
- [ ] Feature gate middleware
- [ ] Volume discount pricing for Enterprise
- [ ] Per-seat billing

### Phase 3 (Q4 2025)

- [ ] Real regression execution (not simulated)
- [ ] Selenium Grid integration
- [ ] BrowserStack/Sauce Labs integration
- [ ] Test case versioning
- [ ] Collaborative editing

### Phase 4 (Q1 2026)

- [ ] API v2 with GraphQL
- [ ] Webhook notifications
- [ ] Slack/Teams integration
- [ ] Jira/Linear integration
- [ ] Custom AI model training

---

_Document Version: 1.0 | Last Updated: July 2025_
_Author: ForgeQA Team_
