# Administration and License Manager

License Manager is the operator application for ForgeQA registration, licensing, and account operations. It uses a separate admin session and accesses shared ForgeQA records when both deployments point to the same MongoDB database.

## Operator workflows

| Surface | Functions |
| --- | --- |
| Dashboard | Summarize customer, key, verification, and transaction activity. |
| Verifications | List registrations, approve or reject a pending request, assign a key after approval, resend the corresponding email, and remove pending records. |
| Product Keys | Generate or list keys, view key statistics, update key metadata, revoke keys, and delete records. |
| Customers | View and manage customer records and associated plan or key information. |
| Plans | Create, list, edit, or remove signup plan records. |
| Transactions | List and manage payment transaction records. Payment event routes receive Stripe and Razorpay webhooks. |
| Email Log | View outbound email history, send or resend supported messages, and remove log entries. |
| Deleted Users | Review archived accounts, restore an eligible account, or permanently remove an archive. |
| Settings and Security | Manage administrator credentials and accounts, inspect sign-in history, and review audit entries. |

Registration approval moves `pending_verification` to `ready`. Key assignment is a separate action that attaches an available product key and attempts to send the approval email with the activation link. The workflow records email delivery status for operator review. Rejecting a pending request records the rejection and attempts to notify the customer.

## License Manager API contract

| Method and path | Function |
| --- | --- |
| `GET /api/admin/setup-status`, `POST /api/admin/setup`, `POST /api/admin/login`, `GET /api/admin/me` | Initialize administrator access, sign in, and check the session. |
| `GET /api/admin/verifications`, `POST /api/admin/verifications/approve`, `POST /api/admin/verifications/reject` | List or review registrations. |
| `POST /api/admin/verifications/{id}/assign-key`, `POST /api/admin/verifications/{id}/resend-email` | Assign a license and manage notification delivery. |
| `GET /api/admin/keys`, `POST /api/admin/keys/generate`, `POST /api/admin/keys/revoke`, `GET /api/admin/keys/stats` | Read, issue, revoke, or count licenses. |
| `PUT/DELETE /api/admin/keys/{id}`, `DELETE /api/admin/verifications/{id}` | Update or remove a product key or remove a registration record. |
| `GET/POST /api/admin/customers`, `GET/POST /api/admin/plans`, `GET/POST /api/admin/transactions` | List and create records. Item-level updates and deletes use `PUT` and `DELETE` on the corresponding ID routes. |
| `GET /api/admin/email/logs`, `POST /api/admin/email/send`, `POST /api/admin/email/resend` | Read and manage notification history and dispatch. |
| `DELETE /api/admin/email/logs/{id}` | Remove an email log entry. |
| `GET /api/admin/deleted-users`, `POST /api/admin/deleted-users/{id}/restore`, `DELETE /api/admin/deleted-users/{id}` | Review, restore, or remove archived customer records. |
| `GET /api/admin/logins`, `GET /api/admin/audit-logs` | Review administrator activity. |
| `GET /api/admin/list`, `POST /api/admin/create`, `POST /api/admin/delete` | List, add, or delete administrator accounts. |
| `POST /api/admin/change-password`, `POST /api/admin/change-email` | Change the signed-in operator's credentials. |
| `POST /api/webhooks/stripe`, `POST /api/webhooks/razorpay` | Receive payment events. |

The ForgeQA customer API also exposes an Admin-role-gated namespace. It has operations for listing users, reading statistics and audit logs, changing a user's role or subscription, and clearing a user lockout. The customer web app redirects `/admin` and `/license-manager` to its dashboard.

## Function reference and data

| Function | Responsibility |
| --- | --- |
| `handleAuthRoute`, `authenticateToken` | Route operator account actions and authenticate License Manager API requests. |
| `generateProductKeys`, `listProductKeys`, `revokeProductKey`, `updateProductKey`, `deleteProductKey` | Operate on licenses in `product_keys`. |
| `sendVerificationEmail`, `sendProductKeyEmail`, `getEmailLogs`, `resendEmail` | Send activation and verification notices and manage `email_logs`. |
| `handleStripeWebhook`, `handleRazorpayWebhook` | Handle provider events for payment operations. |
| `logAudit`, `getAuditLogs` | Record and query operator actions in `audit_logs`. |
| `connectDb`, `getDb` | Connect to the configured database and provide shared record access. |

Sources. [License Manager application](../license-manager/src/App.tsx), [Operator API](../license-manager/server/api.js), [Operator authentication](../license-manager/server/auth/routes.js), [Product-key routes](../license-manager/server/keys/routes.js), [Key service](../license-manager/server/keys/service.js), [Email service](../license-manager/server/email/service.js), [License Manager database](../license-manager/server/db.js), [ForgeQA Admin APIs](../server/api.js).
