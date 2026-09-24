# TASK-001 Requirements: Training Sessions Workspace

Sources: `frontend-accelerator-onboarding/TASK.md`, `README.md`, `PASS_CRITERIA.md`; repository inspection (package manifest, `src/`).

## Goal

A trainer opens a small frontend workspace, sees training sessions loaded from a mock API, filters them by one status, and creates a new session (title + future date/time) that then appears in the list.

Success is a working, checkable main flow, not a production-ready app.

## Repository Facts (verified)

- Single frontend application at the repository root: React 19 + TypeScript + Vite (`dev`, `build`, `lint` scripts).
- `src/` holds only the Vite starter (`App.tsx`, `main.tsx`, CSS, assets).
- No test runner, no HTTP mock (MSW or otherwise), no HTTP client, and no `test` script exist yet.
- No `specs/` directory and no prior task artifacts.

## Acceptance Criteria

### Sessions list
- AC-1: On opening the workspace, sessions are requested from a mock API and displayed once loaded.
- AC-2: Each session shows its title, status, and start date/time.
- AC-3: While the list request is pending, a loading state is visible and no stale or empty list is shown as final.
- AC-4: If the list request fails, one understandable error message is shown with a retry action; activating retry re-issues the request and, on success, shows the list.

### Filtering
- AC-5: An `All` option and one filter per session status are available; exactly one is selected at a time, `All` by default.
- AC-6: Selecting a status shows only sessions with that status; selecting `All` shows every session.
- AC-7: A session created while a filter is active is added to the data and the active filter is kept (D-2). The new session (`Planned`) is visible only if it matches the active filter; it appears when `All` or `Planned` is selected.

### Create session
- AC-8: The user can open a create form from the workspace.
- AC-9: The form has a title field and a date/time field.
- AC-10: Title is trimmed before validation; the trimmed length must be 3–80 characters. Otherwise submission is blocked and a validation message states the rule.
- AC-11: Date/time is required and must be at least 1 minute after the submit time (D-4). A missing value, a past value, or one inside that margin blocks submission with a validation message.
- AC-12: Validation messages are shown near the offending field and are specific (which field, what is wrong).
- AC-13: While the create request is pending, the submit action cannot be triggered again (no duplicate session from double-click/Enter).
- AC-14: On success, the create form closes and resets (D-3), and the new session appears in the visible list (subject to AC-7) without a full page reload, with the trimmed title and chosen date/time.
- AC-15: The new session's status is `Planned`.
- AC-16: If the create request fails, the user sees an understandable error, keeps their entered values, and can retry.

### Mock boundary
- AC-17: All session data comes through an HTTP client or equivalent replaceable request boundary; UI code does not read hard-coded data directly.
- AC-18: Mocking uses a conventional HTTP mock (MSW or equivalent), since the repository has none. No backend service is implemented.

### Test and manual check
- AC-19: At least one behavior-level automated test covers the main flow (filtering or successful creation), asserts user-visible outcomes, and passes with a documented command.
- AC-20: The app starts with a documented repository command (`npm run dev`), and the list, filter, and create flow is exercised once in a browser with the actual observation recorded (by `verify`/developer, not assumed).

## Non-Goals

- Session details, drawers, deep links or routing.
- Search, multiple filters, sorting controls, pagination.
- Edit or delete of sessions; authentication or permissions.
- A complete API contract or scenario matrix.
- Screenshot sets, exhaustive responsive or accessibility validation (basic labels and keyboard operability of the form are still expected).
- Full test coverage, CI, deployment, public URL.
- Strict TypeScript migration or unrelated refactoring; visual polish/design system.
- Persistence across page reloads (mock data may reset).
- Any backend service.

## Assumptions (not confirmed truth)

- A1: Status set is small and fixed: `Planned`, `In progress`, `Completed`, `Cancelled` (decision D-1).
- A2: A newly created session gets `Planned`, because its date must be in the future.
- A3: "Future" is judged against the user's local clock and time zone; date/time is displayed in local format.
- A4: An empty list (no sessions, or no match for a filter) shows a simple empty message; this is not a mandated state but is implied by filtering.
- A5: Adding the software needed for tests and mocking (test runner, MSW) to `package.json` is acceptable, as the task requires them and none exist. Choice of tools belongs to planning/architecture.
- A6: Seed mock data includes at least one session per status so the filter is demonstrable, about 5–8 sessions in total (D-5).
- A7: Task identifier `TASK-001` corresponds to "task 001 / id 1".

## Decisions (confirmed by developer)

- D-1: Statuses are `Planned`, `In progress`, `Completed`, `Cancelled`; a new session is `Planned`.
- D-2: An active filter is kept after creation. It stays correct because the filter always reflects the selected status; a new `Planned` session simply isn't shown under, say, `Completed`.
- D-3: The create form closes and resets after success.
- D-4: A small margin is required for "future". The developer gave no number; 1 minute is used here.
- D-5: Seed data of about 5–8 sessions is acceptable.

## Open Questions

- OQ-1: Is a 1-minute margin (D-4) acceptable? It is the only value not stated by the developer. Non-blocking; the plan may proceed with 1 minute.

## Gaps and Owners

- Architecture (state ownership, request boundary shape, test/mocking tool choice): `architect`, or decided within `writing-plans` given the small scope. Not decided here.
- API contract (endpoints, payload shape, error shape): `api-integration` optional; onboarding says a full contract is not required, so `writing-plans` may define a minimal provisional shape.
- Visual direction: none required; `ui-designer` optional and not needed for onboarding.

## Readiness

Ready for `writing-plans`. No blocking questions; OQ-1 (1-minute margin) is a non-blocking default.
