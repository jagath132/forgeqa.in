# ForgeQA Complete Application Testing Strategy & Master Execution Plan

---

## 1. Document Overview & Strategy

This document details the master end-to-end testing plan for the **ForgeQA** AI-powered test automation platform. It serves as the single source of truth for verifying application stability, functional correctness, API integrations, security controls, and performance metrics across the entire stack.

### Testing Objectives
1. **100% Core Feature Coverage**: Verify all primary features (AI Test Case Generator, Multi-Framework Code Viewer, Knowledge Base RAG, Test Suites, Regression Runner, Settings & License Management).
2. **Zero Vendor Lock-in Code Quality**: Ensure generated test scripts in Playwright, Cypress, Selenium, and Puppeteer adhere to valid syntax and executable code standards.
3. **Resilient Authentication**: Validate JWT token generation, cookie parsing, silent refresh token rotation, and password reset flows.
4. **Enterprise Security**: Validate screen capture / screenshot blocking event listeners (`PrintScreen`, `Win+Shift+S`, right-click blocking).
5. **Regression & CI/CD Safety**: Maintain continuous pass status across all automated Vitest unit, component, and integration suites.

---

## 2. Application Architecture & Test Scope

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                FORGEQA PLATFORM STACK                                  │
├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
│     Frontend (React 19/Vite)  │   Backend API (Node/Express)  │   Database & Storage   │
├───────────────────────────────┼───────────────────────────────┼────────────────────────┤
│ • React 19 + TypeScript       │ • Custom Express HTTP Engine  │ • MongoDB Database     │
│ • Tailwind CSS + Glassmorphism│ • JWT Auth + SHA256 Refresh   │ • In-Memory Fallback   │
│ • Zustand State Store         │ • AI Provider Proxies         │ • File System Uploads  │
│ • React Router v7 Navigation  │ • Document Chunker / RAG      │ • Cookie Session Store │
└───────────────────────────────┴───────────────────────────────┴────────────────────────┘
```

### In-Scope Functional Modules
- [x] **Landing Page & Public Routes** (`/`, `/register`, `/auth`, `/reset-password/*`)
- [x] **Dashboard Workspace** (`/dashboard` - Platform health, metrics, quick start)
- [x] **AI Test Case Generator** (`/generator` - AI provider selection, prompt engineering, case filtering)
- [x] **Automation Script Engine & Code Viewer** (`/test-scripts` - Dynamic framework code viewer, line numbers, dry-run sandbox, CI/CD YAML generator)
- [x] **Knowledge Base RAG** (`/knowledge` - File dropzone, PDF/DOCX chunking, score preview)
- [x] **Test Suites Manager** (`/suites` - Custom suites, tag color coding, test case binding)
- [x] **Regression Execution Pipeline** (`/regression` - Web & Mobile build upload, webhook configuration, test execution runner)
- [x] **Platform Settings & License Manager** (`/settings` - Profile setup, AI Provider API keys, Product key activation, Team seat management)

---

## 3. Detailed Multi-Phase Test Execution Plan

### Phase 1: Frontend Unit & Component Testing

Focuses on validating individual React components, custom hooks, and Zustand store state transitions in isolation.

| Test ID | Targeted Component | Test Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-UI-01** | `TestScriptCodeViewer` | Render empty state when no script exists | Displays exact text `Terminal Buffer Empty` and guidance button |
| **TC-UI-02** | `TestScriptCodeViewer` | Dynamic framework selection (Playwright, Cypress, Selenium, Puppeteer) | Header badge, file extension, feature pills, and CI/CD YAML update dynamically |
| **TC-UI-03** | `TestScriptCodeViewer` | Language state selection (TypeScript, JavaScript, Python, Java, C#) | Status bar displays `SELECT LANGUAGE` when unselected and active language when set |
| **TC-UI-04** | `TestScriptCodeViewer` | Interactive Sandbox Runner simulation | Dry-run logs render line-by-line with timestamps and status indicators |
| **TC-UI-05** | `NavBar` & `Sidebar` | Navigation routing & active state styling | Active route highlights correctly and mobile drawer toggles smoothly |
| **TC-UI-06** | `ConfirmDialog` | Confirmation modal trigger & callback execution | Prompts user before destructive actions and fires `onConfirm` |
| **TC-UI-07** | `PageHeader` & `MobileHeader` | Responsive viewport adaptivity | Renders desktop breadcrumbs on large screens and mobile headers on small screens |

---

### Phase 2: Backend API & Auth Integration Testing

Focuses on server middleware, authentication endpoints, encryption, and database collections.

| Test ID | Targeted Endpoint | Test Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **API-AUTH-01** | `POST /api/auth/start-registration` | Initiate user registration with valid email & password | Returns `pendingId` and HTTP 200 |
| **API-AUTH-02** | `POST /api/auth/login` | Authenticate existing user | Sets HTTP-only `token` and `refreshToken` cookies |
| **API-AUTH-03** | `POST /api/auth/refresh` | Silent token rotation using valid refresh cookie | Revokes old token, issues new pair, returns HTTP 200 |
| **API-GEN-01** | `POST /api/qa-result` | Save & retrieve AI generated test cases | Persists test cases to DB and syncs with state |
| **API-SCRIPT-01**| `POST /api/test-scripts/generate` | Synthesize framework-specific test script | Returns valid code string and correct `fileName` |
| **API-REG-01** | `POST /api/regression/builds/upload` | Upload `.apk` or `.zip` web build artifact | Saves file to `.data/uploads` and creates artifact record |
| **API-LICENSE-01**| `GET /api/user/product-key` | Validate product license key | Returns key metadata or null if unactivated |

---

### Phase 3: End-to-End (E2E) Browser User Journey Testing

Tests full user journeys from entry point to goal completion using simulated browser steps.

```
Flow 1: Authentication & Onboarding Journey
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Landing Page    │ ──> │ Registration     │ ──> │ Plan Selection   │ ──> │ Workspace        │
│  ("Get Started") │     │ (Email/Password) │     │ (Community/Pro)  │     │ Dashboard        │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘

Flow 2: Test Case Generation & Automation Export Journey
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Input Software  │ ──> │ Synthesize AI    │ ──> │ Select Test      │ ──> │ Generate &       │
│  Requirement     │     │ Test Cases       │     │ Cases & Scope    │     │ Inspect Script   │
└──────────────────┘     └──────────────────┘     └──────────────────┘     └──────────────────┘
```

#### Detailed Flow Walkthroughs
1. **Flow 1: Registration & Onboarding**
   - User visits `http://localhost:5173/`.
   - Clicks **Get Started** -> Navigates to `/register`.
   - Fills registration form -> Selects plan -> Arrives at `/dashboard`.
   - Session cookie is stored and verified on page reload.

2. **Flow 2: Requirement to Automated Test Script**
   - User navigates to `/generator`.
   - Inputs requirement prompt: *"Verify user login with invalid credentials displays error notification"*.
   - Clicks **Generate Test Cases** -> AI synthesizes positive, negative, and edge cases.
   - User navigates to `/test-scripts`.
   - Selects **Cypress** framework and **TypeScript** language.
   - Selects synthesized test cases -> Clicks **Generate Automation Script**.
   - Code viewer displays syntax-highlighted Cypress TypeScript code (`spec.cy.ts`).
   - User tests **Copy Code** and **Download File** actions.

3. **Flow 3: Knowledge Base RAG File Integration**
   - User navigates to `/knowledge`.
   - Drops `API_Specification.pdf` into upload area.
   - Server parses and chunks document -> Displays chunk count & readiness status.
   - User returns to `/generator` and generates context-aware test cases based on the uploaded document.

4. **Flow 4: Regression Pipeline Execution**
   - User navigates to `/regression`.
   - Clicks **Upload Build Artifact** -> Uploads `app-v1.2.0.apk` or web package.
   - Sets target URL and platform to **Web**.
   - Clicks **Run Regression Build**.
   - Execution runner simulates real-time step execution, recording pass/fail output and duration.

---

## 4. Security, Screen Guard & Resilience Testing

### Security Controls Verification
- [x] **Screen Capture / Screenshot Prevention**: Verify event listeners catch `PrintScreen`, `Win+Shift+S`, `Alt+PrintScreen`, and `Meta+Shift+3/4/5`, rendering the security overlay banner.
- [x] **Right-Click & Image Drag Protection**: Verify `contextmenu` and image `dragstart` events are intercepted.
- [x] **API Key AES-256-GCM Encryption**: Verify AI provider API keys are encrypted at rest using AES-256-GCM prior to storage.
- [x] **JWT Security**: Verify expired tokens return HTTP 401 and trigger automatic token rotation.

---

## 5. Verification Commands & Quality Gates

Run the following standard commands in your workspace terminal to execute the test suite:

```bash
# 1. Type Check (TypeScript compilation validation)
npm run typecheck

# 2. Automated Vitest Unit & Integration Test Suite
npx vitest run

# 3. Code Style & Linter Audit
npm run lint

# 4. Start Local Development Server
npm run dev
```

### Quality Gate Pass Criteria
- **TypeScript Compilation**: `0 errors`
- **Vitest Test Suite Pass Rate**: `100%` (Minimum 10/10 test suites passing)
- **ESLint Code Quality**: `0 warnings / 0 errors`
- **Development Server**: Launches cleanly on `http://127.0.0.1:5173` without unhandled runtime exceptions.

---

*Document prepared for ForgeQA platform release validation.*
