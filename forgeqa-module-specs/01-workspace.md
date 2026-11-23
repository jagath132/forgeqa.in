# Workspace and Navigation

The public landing page introduces ForgeQA and directs visitors to registration or sign-in. After sign-in, the workspace provides navigation, onboarding, and quick access to recent QA work.

## Entry points and behaviors

| Entry point | Behavior |
| --- | --- |
| `/` | Displays the public landing page. Get Started and Sign In send signed-in users to the dashboard and other visitors to registration and sign-in respectively. |
| `/register`, `/auth/complete-registration`, `/reset-password`, `/auth/reset-password` | Open the registration, activation, or password recovery flow. |
| `/dashboard` | Shows workspace metrics, checklist items, module shortcuts, and recent test case activity. |
| `/prd-generator`, `/generator`, `/test-scripts`, `/knowledge`, `/regression` | Open the active QA workflows. |
| `/settings`, `/billing`, `/pricing` | Open account, integrations, or subscription management. |
| `/billing/success`, `/billing/canceled` | Open the hosted checkout return screens. |
| `/design-system` | Displays the component showcase. |

During initialization the app checks the session and shows a loading screen. Visitors without a session who reach a protected path see the authentication page. The workspace shell includes responsive navigation and a shared confirmation dialog. Test Case Generator and Test Scripts display a desktop-only message below 1024 pixels.

## Dashboard and search

The dashboard reads the current user, requirements history, generated scripts, and provider-key configuration from workspace state. Recent Generation displays the latest saved matrix and links to the generator, where users can restore a result from history. First-use prompts help the user configure an AI provider, add knowledge, and generate cases.

Global Search uses a predefined list of pages and actions with searchable titles, descriptions, and keywords. Selecting an item closes search and navigates to its route.

## Route availability

- `/test-runs` and `/defects` redirect to the Test Case Generator. Use `/regression` to access regression run records.
- `/analytics`, `/admin`, and `/license-manager` redirect to the ForgeQA dashboard. The stand-alone License Manager has its own entry point.
- `/ai-settings` redirects to Settings. `ProfilePage`, `TestCasesPage`, and `SuitesPage` exist in source without dedicated routes in the current router.

## Function reference

| Component or function | Responsibility |
| --- | --- |
| `App`, `AppLayout` | Initialize the store, choose the public or signed-in view, and mount the workspace routes. |
| `LandingPage` | Compose the public product, workflow, pricing, enquiry, and contact sections. |
| `DashboardPage` | Present workspace state, checklist completion, and recent work. |
| `GlobalSearch` | Match navigation entries and process the selected result. |
| `Sidebar`, `MobileHeader` | Expose module navigation across desktop and mobile layouts. |
| `DesktopOnlyGuard`, `useIsDesktop` | Choose the feature or viewport message based on the screen size. |

Sources. [App routes](../src/App.tsx), [Landing page](../src/pages/LandingPage.tsx), [Dashboard](../src/pages/DashboardPage.tsx), [Global Search](../src/components/GlobalSearch.tsx), [Sidebar](../src/components/Sidebar.tsx), [Desktop guard](../src/components/DesktopOnlyGuard.tsx).
