# Mangalam eBus — Digital Bus Pass & Transport

Mangalam eBus is a student-developed frontend prototype exploring a digital bus-pass and campus transport experience for Mangalam Educational Institutions. It includes student pass and transport demo pages, plus a staff portal for reviewing fictional bus rosters.

This is a prototype, not a live transport service. It is not connected to institutional systems and does not imply institutional approval or endorsement.

## Current routes

| Route | Purpose |
| --- | --- |
| `/` | Public product landing page with an overview of the intended transport experience |
| `/student/login` | Student-specific sign-in interface; authentication is not connected |
| `/staff/login` | Staff-specific sign-in interface; authentication is not connected |
| `/student` | Student dashboard with synthetic student, pass, route, and application details |
| `/student/pass` | Read-only illustrative digital pass; not valid for travel |
| `/student/transport` | Fictional route, stop, and schedule information |
| `/student/application` | Status and history for the seeded demo application, with correction-request editing and resubmission |
| `/student/profile` | Synthetic student profile |
| `/staff` | Staff dashboard with data-derived counts for the demonstration staff member's assigned bus |
| `/staff/applications` | Demo review queue for student bus-pass applications |
| `/staff/applications/:reference` | Application detail and demo review actions |
| `/staff/roster` | Searchable and filterable roster for the demonstration staff member's assigned bus |
| `/staff/buses` | Coordinator-style overview of fictional buses and their roster summaries |
| Any other path | Not-found page with a link back to the landing page |

The coordinator-style bus view opens a selected bus roster at `/staff/roster?bus=<bus-id>`. These screens are demonstrations only; no coordinator access controls are implemented.

## Project structure

```text
src/
  assets/       # Reserved for application assets
  components/   # Shared wordmark and login form components
  config/       # Reserved for application configuration
  features/
    staff/      # Staff portal layouts, pages, mock data, types, and tests
    student/    # Student portal layouts, pages, mock data, types, and tests
  layouts/      # Shared application shell and navigation
  lib/          # Reserved for shared utilities
  pages/        # Landing, login, and not-found route pages
  App.tsx       # Client-side route definitions
  index.css     # Tailwind CSS v4 import and global design tokens
  main.tsx      # React application entry point
```

The application is frontend-only. Student and staff transport screens use fictional, local mock data; no backend, database, real student records, or institutional service is connected. Authentication and authorization are not implemented. Staff login does not send or save credentials. The multi-bus view is a coordinator-style visual demonstration, not an access-controlled workflow. The student pass is explicitly marked `PROTOTYPE — NOT VALID FOR TRAVEL`.

Demo workflow state is persisted in the browser's `localStorage`, so applications, review history, and issued demo passes can survive page reloads in that browser. On the staff dashboard, choosing **Reset demo data** and confirming returns the workflow to its fictional default data and clears the saved workflow state. Malformed, unsupported, or otherwise invalid saved data may be ignored; in that case, the fictional defaults are restored. This is browser-local prototype persistence only, not backend storage.

The demo review lifecycle is `submitted` → `under_review` → either `approved` or `corrections_requested`; a student may edit permitted fields and resubmit a corrected application, returning it to `submitted`. Approval is only a prototype review outcome and does not grant institutional approval or travel permission.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` (as required by the installed Vite version)
- npm

## Install and run

From the project directory:

```sh
npm install
npm run dev
```

Vite prints the local development URL in the terminal.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm test -- --run` | Run the Vitest suite once (non-interactive) |
| `npm run lint` | Run Oxlint |
| `npm run build` | Run TypeScript project checks and create the Vite production build in `dist/` |
| `npm run preview` | Serve the production build locally for manual review |

## Automated tests

Tests use Vitest with jsdom, React Testing Library, `user-event`, and `jest-dom` matchers. They exercise required-field validation, accessible error descriptions, focus management, password visibility, prototype-only submission behavior, role-specific login pages, the student portal, the staff portal, roster search/status filtering, and the not-found route.

The student and staff portal test suites cover the synthetic dashboard, transport, pass, profile, route navigation, the seeded approved application and its alignment across student and staff views, dashboard status consistency, persistence and restoration, malformed and unsupported saved data, storage failures, reset behavior, valid and invalid application transitions, correction-note validation and resubmission, status history, reference uniqueness, roster search, bus summary reconciliation, and pass-issuance safeguards.

Run the test, lint, and build checks from the project directory with:

```sh
npm test -- --run
npm run lint
npm run build
```

## Prototype limitations

- There is no real authentication or authorization.
- No backend services or database are connected.
- The interface does not process payments.
- Student names, IDs, pass statuses, bus assignments, schedules, and routes shown in portal views are fictional mock data and are not live or authoritative.
- Workflow state is stored only in this browser's `localStorage`; clearing browser data or using another browser/device will not preserve it. Invalid saved data may be discarded in favor of the fictional defaults.
- The digital pass is a demonstration only and is not valid for real travel.
- The staff dashboard represents one demonstration staff member and one assigned demonstration bus.
- The multi-bus screen does not enforce coordinator permissions or access restrictions.
- Submitting a complete login form displays a message that authentication is not connected; credentials are not sent or saved.
- No approved Mangalam institutional emblem or product logo is included. The interface uses a restrained text wordmark and a Lucide icon.

Any future integration, authentication, live information, or institutional branding requires appropriate specification, approval, and technical review before implementation.
