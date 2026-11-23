# Identity and Account

This module manages the customer lifecycle from registration to account deletion. It also owns session handling and authentication checks used by protected ForgeQA APIs.

## Registration and activation

1. The customer submits name, email, and password. The start-registration handler rejects disposable email addresses and requires at least eight password characters with uppercase, lowercase, a number, and a special character. It checks for an existing account and creates or updates a pending registration with hashed credentials.
2. The customer chooses a plan. The free branch moves into verification. A paid branch can return `payment_required` and send the customer through hosted checkout. Enterprise enquiries follow the enquiry flow.
3. The registration screen polls registration status where applicable. An operator can review the pending request and assign a product key in the License Manager. A ready registration can proceed to activation using the emailed key and matching email.
4. The completion handler validates the pending registration and key, creates the user, claims the key, and marks the pending registration complete. The customer then signs in with the registration credentials. The welcome screen can mark first-use onboarding as seen.

The registration path uses `pending`, `pending_verification`, `ready`, and `completed` states. `payment_required` is a plan-selection response. See [License Manager](10-administration.md) for approval and key issuance.

## Sign-in and account management

- Login verifies an existing customer's credentials. Rate limiting and failed-attempt tracking protect authentication. The application lockout threshold is five failed attempts and the lockout duration is 15 minutes.
- The default access-token lifetime is 15 minutes and the refresh-token default is seven days. Authentication reads the access-token cookie first and accepts a bearer token. Refresh rotates the server-tracked token, and logout clears session cookies and attempts revocation.
- Password recovery starts with an email request, then validates a reset token and sets a new password. A signed-in user can change the password by verifying the current password.
- Settings supports changing the display name, viewing the product key, contacting support, signing out, and requesting account deletion. Deletion removes the user, profile data, and saved provider keys, releases matching product keys, and records the original ID, name, email, and deletion time for operator review.

## API contract

| Method and path | Function |
| --- | --- |
| `POST /api/auth/start-registration`, `POST /api/auth/select-plan` | Start registration and record a plan selection using the pending registration ID. |
| `GET /api/auth/registration-status`, `POST /api/auth/complete-registration` | Check registration progress by email and activate with the email and product key. |
| `POST /api/auth/validate-key`, `POST /api/auth/complete-payment` | Check product-key validity and process payment completion for registration. |
| `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout` | Establish, renew, or end a session. |
| `GET /api/auth/me`, `POST /api/auth/welcome-seen` | Read the signed-in account and record welcome acknowledgement. |
| `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `PUT /api/auth/password` | Request and complete password recovery or change the signed-in user's password. |
| `GET /api/user/product-key`, `GET/POST /api/user/profile` | Read the user's key and read or update profile data. |
| `GET/POST /api/user/team` | Read the account's team list. Writes require the Admin role. |
| `POST /api/auth/delete-account`, `POST /api/auth/support` | Delete an authenticated account or send a support request. |

## Function reference and storage

| Function | Responsibility |
| --- | --- |
| `handleStartRegistration`, `handleSelectPlan`, `handleCompleteRegistration` | Advance registration and activation and coordinate `pending_registrations`, `users`, and `product_keys`. |
| `hashPassword`, `authStore.findUserWithPassword` | Hash credentials with PBKDF2 and retrieve the password fields needed for verification. |
| `authenticateToken`, `generateRefreshToken`, `rotateRefreshToken`, `revokeRefreshToken` | Authenticate user requests and manage hashed refresh-token records. |
| `authStore.createPasswordResetToken`, `authStore.resetPassword` | Create and consume reset records in `password_reset_tokens`. |
| `validateProductKey`, `claimProductKey` | Check an available key and claim it for the registered account. |
| `checkRateLimit`, `checkAccountLockout`, `recordFailedAttempt`, `clearLockout` | Manage authentication throttling and lockout state in `rate_limits`. |
| `initialize`, `loginUser`, `logout` | Synchronize session state with the browser workspace. |

Sources. [Customer auth routes](../server/auth/routes.js), [Auth service](../server/auth/service.js), [Auth store](../server/auth/store.js), [Product keys](../server/auth/productKeys.js), [Rate limits](../server/rate-limit/index.js), [Registration screen](../src/pages/RegisterPage.tsx), [Settings screen](../src/pages/SettingsPage.tsx).
