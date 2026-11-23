# Billing and Subscriptions

Billing covers plan discovery, hosted checkout, subscription state, entitlements, invoicing, and usage. ForgeQA exposes a registration plan flow and a signed-in billing flow.

## Catalogs and customer journeys

| Surface | Behavior |
| --- | --- |
| Registration plan selection | `GET /api/plans` provides the signup catalog. Plan selection can advance to verification or payment. Signup has Stripe checkout and Razorpay order handlers. |
| Signed-in Pricing | `/pricing` reads the billing catalog and requests a hosted checkout session. Seeded catalog codes include `free`, `pro`, `team`, and `enterprise`. |
| Billing dashboard | `/billing` reads plan and usage details and supports account billing actions. Some card summary and tax fields on the dashboard are maintained as browser-local display data. |
| Checkout return | The success page polls the subscription endpoint for confirmed status. The cancel page offers a return path to pricing. |
| Administrative catalog | The License Manager manages signup plan records and transaction views. See [Administration](10-administration.md). |

The billing provider factory selects Stripe or the fake adapter using configuration. Verified provider webhooks update billing records for checkout, subscription lifecycle events, and invoice events. A stored webhook event ID supports repeat-delivery handling. Provider balances and invoice amounts use minor currency units.

## Entitlements and usage

- `getOwnerSubscriptionAndPlan` derives plan eligibility from the billing owner's subscription. It applies the configured grace period to past-due subscriptions and resolves the free plan for canceled, unpaid, or incomplete status. The grace-period default is seven days.
- The entitlement service tracks usage events and balances by owner and month. The daily usage service maintains counters used by generation routes and also attempts to update the monthly AI run balance.
- Test case and PRD generation check AI allowance and record successful use. Knowledge upload checks file allowance. The relevant endpoints can return HTTP 429 with `LIMIT_EXCEEDED`.
- Billing records include `plans`, `customers`, `subscriptions`, `invoices`, `usage_events`, `usage_balances`, `usage_counters`, and `webhook_events`.

## API contract

| Method and path | Function |
| --- | --- |
| `GET /api/plans`, `GET /api/billing/plans` | Read the signup and billing catalogs respectively. |
| `POST /api/payments/create-checkout`, `POST /api/payments/create-order` | Start the signup Stripe or Razorpay payment path. |
| `GET /api/billing/subscription`, `GET /api/billing/usage`, `GET /api/billing/invoices` | Read subscription state, current usage, and invoices. |
| `POST /api/billing/checkout`, `POST /api/billing/portal`, `POST /api/billing/change-plan` | Start checkout, open the provider portal, or change the plan. |
| `POST /api/billing/cancel`, `POST /api/billing/resume` | Schedule or reverse cancellation. |
| `POST /api/billing/webhook`, `POST /api/payments/stripe-webhook` | Receive provider events through the billing webhook handler. |
| `POST /api/billing/calculate-price`, `GET /api/user/billing`, `POST /api/user/billing/checkout` | Calculate seat pricing, read the account's tier, or start an upgrade checkout. |
| `POST /api/payments/create-portal-session`, `POST /api/user/billing/upgrade` | Open the legacy customer portal or invoke the account-level upgrade action. |

Catalog reads are public. Customer billing operations resolve the signed-in account, and webhook requests are verified by the configured adapter.

The Billing and Settings screens offer product-key redemption through `POST /api/user/redeem-key`. The server has no matching handler in this checkout. Signup activation uses `POST /api/auth/complete-registration`.

## Function reference

| Function | Responsibility |
| --- | --- |
| `handleBillingRoute` | Dispatch catalog, checkout, subscription, and invoice actions. |
| `getBillingProvider` | Select and reuse the configured payment adapter. |
| `handleBillingWebhook` | Verify and process events, synchronize billing state, and record deduplication data. |
| `getOwnerSubscriptionAndPlan`, `can`, `remaining`, `consume` | Resolve entitlement, check feature flags, and read or consume quota. |
| `getUsage`, `incrementAiGenerations`, `checkPlanLimit` | Count usage and enforce generation, file, and other supported plan limits. |
| `getVolumeTier`, `calculatePrice` | Calculate pricing from tier, seat count, and billing cycle. |
| `ensureBillingIndexes`, `seedBillingPlans` | Prepare the billing indexes and seed plan records. |

Sources. [Billing API](../server/billing/routes.js), [Billing webhook](../server/billing/webhooks.js), [Provider factory](../server/billing/providers/index.js), [Entitlements](../server/billing/entitlements.js), [Usage](../server/billing/usage.js), [Plan schema](../server/billing/schema.js), [Pricing screen](../src/pages/PricingPage.tsx), [Billing dashboard](../src/components/BillingDashboard.tsx), [Billing architecture](../docs/billing.md).
