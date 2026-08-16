# FORGEQA — MICRO APPLICATION MARKET RELEASE PLAYBOOK & LAUNCH GUIDE

**Document Version:** 1.0.0  
**Target Product:** ForgeQA Micro-SaaS / Desktop & Web Micro Application  
**Target Audience:** Product Founder, Lead Engineer, DevOps Manager, Growth Lead  
**Last Updated:** August 2026  

---

## 1. Executive Overview & Micro-App Strategy

Releasing **ForgeQA** as a **Micro Application (Micro-SaaS)** involves packaging the platform into a lightweight, high-value, self-contained product that users can deploy instantly (cloud SaaS, local Docker container, or desktop application). 

### 1.1 Core Principles of the ForgeQA Micro-App
1. **Low Friction Onboarding:** 1-click registration or local key activation without complex infrastructure setup.
2. **Bring Your Own Key (BYOK) & Managed Tier:** Allow users to plug in their own API keys (Gemini, OpenAI, Anthropic, Groq) or purchase bundled AI credits.
3. **Zero Configuration Storage:** Support cloud MongoDB Atlas as well as lightweight local storage modes for solo QA engineers and small teams.
4. **Instant Value Delivery:** Users get automated test cases and exportable Playwright/Cypress scripts within 2 minutes of sign-up.

---

## 2. Release Prerequisites & Technical Hardening

Before launching ForgeQA to public users, complete the following 6 technical hardening steps:

### 2.1 Production Environment & Secrets Management
Ensure all production secrets are set via environment variables (never hardcoded):

```ini
# Production Environment Configuration Matrix
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/forgeqa_prod?retryWrites=true&w=majority
JWT_SECRET=<min-64-character-crypto-random-hex>
JWT_REFRESH_SECRET=<min-64-character-crypto-random-hex>
ENCRYPTION_KEY=<32-byte-hex-string-for-AES-256-GCM>
DOMAIN=https://forgeqa.in
FRONTEND_URL=https://forgeqa.in
RESEND_API_KEY=re_prod_xxxxxxxxxxxx
SENTRY_DSN=https://xxxxxx@sentry.io/xxxxxx
```

### 2.2 Database & Data Persistence Setup
- **MongoDB Atlas Cluster:** Provision a M10+ dedicated cluster with automated daily snapshots and auto-scaling.
- **Indexes Verification:** Ensure indexes exist on `users.email`, `knowledge_chunks.fileId`, `regression_runs.userId`, and `audit_logs.timestamp`.

### 2.3 Build Optimization & Assets CDN
- Run clean production build and verify bundle sizes:
  ```bash
  npm run build
  ```
- Ensure chunk splitting is optimized in `vite.config.ts` (separate vendor chunks for React, Three.js, Lucide icons).
- Enable Gzip / Brotli compression on server responses.

### 2.4 Health Checks & Telemetry
- Implement `/api/health` returning database connection state, memory footprint, and server uptime.
- Initialize Sentry reporting (`@sentry/react` on client, Node Sentry SDK on backend) for runtime error tracking.

---

## 3. Monetization, Licensing & Payment Gateway Setup

### 3.1 Recommended Micro-App Pricing Tiers

| Tier Name | Target User | Price | Features Included |
| :--- | :--- | :--- | :--- |
| **Community / Free** | Solo Testers | $0 / month | 20 AI Test Generations/mo, 1 RAG Document, Playwright Export, BYOK |
| **Pro Micro** | Freelance QA / Startups | $19 / month (or $149/yr) | Unlimited AI Generations, 50 RAG Documents, 4 Framework Exports, CI/CD YAML |
| **LTD (Lifetime Deal)** | AppSumo / Product Hunt Launch | $69 (One-Time) | Pro Features, 1 User Seat, Lifetime Updates (Generates initial cash flow) |
| **Team / Enterprise** | QA Agencies | $49 / seat / mo | Multi-seat workspace, Audit Logs, Offline License Keys, SAML SSO |

### 3.2 Licensing & Payment Pipeline Architecture

```
User Purchases Plan (Stripe / LemonSqueezy / AppSumo)
                      │
                      ▼
            Webhook Endpoint (/api/billing/webhook)
                      │
                      ▼
       Generates License Key or Assigns JWT User Role
                      │
                      ▼
     Dispatches Welcome Email via Resend + License Key
```

- Integrate **LemonSqueezy** or **Stripe Checkout** for global SaaS payments and auto tax compliance.
- Connect existing `license-manager/` module to handle offline serial activation keys for enterprise/desktop buyers.

---

## 4. Legal, Compliance & Data Privacy Safeguards

To sell software commercially, the following legal policies must be accessible in your app footer:

### 4.1 Required Legal Documents
1. **Privacy Policy:** Disclose collection of email, usage telemetry, and clarify that user-uploaded RAG documents are not used to train global AI models.
2. **Terms of Service (ToS):** Standard SaaS operational agreement, uptime disclaimers, acceptable usage policy.
3. **End User License Agreement (EULA):** Required if distributing desktop builds (`.exe`, `.dmg`) or Docker images.
4. **AI Data Handling Disclosure:** Explicitly state zero-data-retention compliance from AI providers (OpenAI, Gemini API policies).

---

## 5. Deployment & Hosting Topologies

### Option A: Standard Managed Cloud SaaS (Recommended for Web Micro-App)
- **Frontend Hosting:** Vercel / Netlify (Global Edge CDN, auto SSL).
- **Backend Hosting:** Railway / Render / DigitalOcean App Platform (Node.js container auto-scaling).
- **Database:** MongoDB Atlas M10.

### Option B: Self-Hosted Docker Micro-App (For Security-Conscious Customers)
Provide a single `docker-compose.yml` for customers who want on-premise execution:

```yaml
version: '3.8'
services:
  forgeqa-app:
    image: forgeqa/app:latest
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/forgeqa
      - JWT_SECRET=change_me_in_prod
    depends_on:
      - mongo
  mongo:
    image: mongo:7.0
    volumes:
      - mongo_data:/data/db
volumes:
  mongo_data:
```

---

## 6. Go-To-Market (GTM) & Micro-App Launch Strategy

### 6.1 Pre-Launch Phase (T-30 Days to T-7 Days)
- [ ] Create high-converting Landing Page with interactive demo / video preview.
- [ ] Set up Email Waitlist & offer 30% launch discount.
- [ ] Release Beta access to 20 QA engineers for feedback & testimonials.
- [ ] Prepare Product Hunt launch media kit (GIFs, screenshots, founder comment).

### 6.2 Launch Week Execution (T-0 Days)

```
Day 1 (Tuesday): Product Hunt & Hacker News Launch ("Show HN: ForgeQA")
Day 2 (Wednesday): Post on Reddit (r/QualityAssurance, r/webdev, r/MicroSaaS)
Day 3 (Thursday): LinkedIn & Twitter/X Video Walkthrough posts targeting QA Leads
Day 4 (Friday): AppSumo / Lifetime Deal listing launch for initial revenue spike
```

### 6.3 Content Lead Magnets for QA Audience
- Publish free downloadable cheat-sheets: *"Playwright vs Cypress Selector Strategy Guide 2026"*.
- Offer free interactive QA Test Case Generator tool on public homepage (without login required for 3 trial queries).

---

## 7. Master Step-by-Step Release Checklist

### Phase 1: Code & Security Readiness
- [x] Run full typecheck: `npm run typecheck` (0 errors)
- [x] Run full test suite: `npx vitest run` (100% pass)
- [x] Code audit & linter check: `npm run lint` (0 errors)
- [ ] Verify API Key AES-256 encryption in database
- [ ] Enable CORS whitelist for `https://forgeqa.in`

### Phase 2: Commercial & Administrative Readiness
- [ ] Connect Stripe/LemonSqueezy merchant account
- [ ] Test webhook payment flow in sandbox mode
- [ ] Configure transactional emails (Welcome, Password Reset, License Key)
- [ ] Publish Privacy Policy, ToS, and EULA pages

### Phase 3: Infrastructure & DNS Readiness
- [ ] Point domain `forgeqa.in` DNS records (A & CNAME) to Vercel/Railway
- [ ] Enable SSL (HTTPS) certificate
- [ ] Configure Sentry error monitoring & uptime alert bot (BetterStack / UptimeRobot)

### Phase 4: Customer Support & Feedback Readiness
- [ ] Embed chat widget (Crisp / Intercom) or support email button
- [ ] Create Help Center / Documentation site with quick-start guides
- [ ] Set up Discord community server or GitHub Discussions board

---

*Document prepared to guide ForgeQA commercial release as a high-growth micro application.*
