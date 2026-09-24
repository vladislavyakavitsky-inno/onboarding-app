# TASK-001 Code Review

**Verdict: NEEDS-CHANGES.** There are no blocking findings: the main list, filter and create flow is correct on the happy path. Two should-fix (Medium) findings remain, plus one scope conflict that needs a developer decision.

**Review surface:** the working tree under `src/`, plus `vite.config.ts` and `package.json`, judged against `tasks/TASK-001/requirements.md` and `implementation-plan.md`. The repository has no commits and everything is untracked, so there is no diff base. I read the files in full and did not review the rest of the repository.
**Constraints honored:** read-only, no fixes, no commands run and no tests run. Test and build results in this review come from the coder's report and were not verified by me.
Rulesets applied: `common/code-reviewer` (evidence-first), `framework/code-reviewer` (React), and the coder rules on typing and behavior tests.

## Findings (ranked by severity)

### Medium (should fix)

**M-1. A late list response can overwrite a created session, and a session created while the list is not `ready` is invisible.**
- Files: `src/features/sessions/useSessions.ts:18` and `:33-34`; `src/features/sessions/SessionsWorkspace.tsx:21-27` and `:31-42`.
- The "New session" button and the form are available in every load state, including `loading` and `error`. On success, `create` appends to local state (`useSessions.ts:34`), but the pending list request later runs `setSessions(data)` (`:18`), which replaces the whole array.
- Failure scenario: the user opens the form and submits while the initial `GET` is still pending, for example within the mock's 500 ms latency (`src/mocks/browser.ts`). If the GET response was produced before the POST, the created session vanishes from the list. Against the mock, the GET snapshot is read after its delay, so the race is hard to trigger there. A real backend would not guarantee that.
- Second scenario: with the list in `error`, the create succeeds and the form closes. The list region is not rendered (`SessionsWorkspace.tsx:31-42`), so the user sees no evidence of the new session. This conflicts with AC-14 ("appears in the visible list").
- Follow-up: `coder`, bounded to `useSessions.ts` and `SessionsWorkspace.tsx`. The choices are to disable creation until the list is `ready`, or to merge instead of replace.

**M-2. Unresolved scope conflict: the mock data does not persist across a page refresh, but you asked for that to be reviewed.**
- Files: `src/mocks/handlers.ts:10-11` and `:15` (in-memory state), and `src/main.tsx:9` (the worker is recreated on every load).
- Your prompt asks whether localStorage should keep data across a refresh. The requirements list "Persistence across page reloads (mock data may reset)" as a non-goal (`requirements.md:59`), and the plan's scope guard excludes it. The coder followed the requirements and reported the deviation.
- Failure scenario: create a session, refresh, and it is gone. That is compliant with the requirements and possibly a surprise for the person doing the manual check.
- This is not a code defect. It needs a developer decision: keep the non-goal, or amend the requirements and plan first. Do not implement it without that decision.

### Low

**L-1. The API boundary trusts the response shape with an unchecked assertion.**
- File: `src/features/sessions/api.ts:27`. The mock parses its POST body with `as NewSessionInput` at `src/mocks/handlers.ts:25`, which is lower risk because it is mock code.
- This goes against the repo rule "narrow unknown data at boundaries instead of unchecked assertions" (`rulesets/common/coder/rules/typescript-and-project-fit.md`).
- Failure scenario: a `200` response that is not an array (for example `{}`) makes `sessions.filter` throw during render (`useSessions.ts:40`). With no error boundary, the page goes blank instead of showing the recoverable error state (AC-4).

**L-2. If the mock worker fails to start, the app never renders.**
- File: `src/main.tsx:6-12`. `enableMocking().then(...)` has no `catch`.
- Failure scenario: service workers are blocked, or `public/mockServiceWorker.js` is unreachable. `worker.start` rejects, `render` is never called, and the page is blank. This is dev only, but it would silently derail the manual browser check.

**L-3. Sorting relies on every `startsAt` being in the same string format.**
- File: `src/features/sessions/useSessions.ts:41`. `localeCompare` on ISO strings orders correctly only when all values are UTC with a `Z` suffix and the same precision, which the plan's wire format (P-8) and the mock guarantee.
- Failure scenario: a server value with an offset, such as `2027-05-01T10:00:00+02:00`, sorts by its text and not by the real instant.
- Time-zone note: the local-input handling itself is correct. A `datetime-local` value has no offset, so `new Date(...)` reads it as local time (`validation.ts:25`) and `toISOString()` converts it to UTC (`:35`). I found no time-zone defect in the required flow.

**L-4. Title length counts UTF-16 code units.**
- File: `src/features/sessions/validation.ts:11` and `:14`. Emoji and some scripts count as more than one character.
- Failure scenario: a 45-emoji title is rejected as "at most 80 characters". The requirement says 3–80 characters, so this is a boundary interpretation to confirm, not an error.

**L-5. The form's double-submit guard depends on the parent unmounting it.**
- File: `src/features/sessions/CreateSessionForm.tsx:34-42`. On success, `isSubmittingRef` and `isSubmitting` are never reset. That is correct today only because `SessionsWorkspace.tsx:14` closes and unmounts the form.
- Failure scenario: if the form is ever reused without unmounting, submit stays disabled after a successful create.
- The guard itself is sound: the ref check at `:24` blocks a second call in the same tick, and the disabled button (`:89`) blocks later clicks.

### Test quality

**T-1. The "1-minute margin" test does not exercise the margin.**
- File: `src/features/sessions/SessionsWorkspace.test.tsx:177-188`, specifically `localValueFromNow(0)` at `:182`.
- `datetime-local` has minute precision, so `now` truncated to the minute is always in the past and the test proves only "past is rejected". Changing `START_MARGIN_MS` (`validation.ts:7`) to 0 would not fail it.
- The clock-dependent rule is pure and easy to test deterministically. `validateStartsAt(raw, now)` takes `now` as an argument, but there is no unit test for it. It is the natural place for the boundary cases: exactly now + 60 s (accepted), now + 59 s (rejected), and an empty or invalid input.

**T-2. Double-submit coverage is partial.**
- File: `SessionsWorkspace.test.tsx:190-211`. The test uses `dblClick` on the submit button and asserts that exactly one POST was sent (`postCount` at `:209`) and one item shown. That is a real check of the duplicate outcome.
- It would pass with only the disabled button and cannot prove the ref guard in `CreateSessionForm.tsx:24`. Submitting twice through the Enter key is not covered.

**T-3. Coverage vs. the requirements is good, apart from the state in M-1.**
- The tests cover loading (`:39-56`), error and retry (`:58-69`), empty and filtered-empty, filter narrowing, create success, an active filter kept after create, validation (title, blank date, past date, 81 characters), a failed create keeping values, and double submit.
- Not covered: creating while the list is loading or errored (M-1), and a non-array response (L-1).
- Filter tests hard-code the seed counts 6 and 2 (`:85`, `:88`, `:94`, `:174`), so they couple to `src/mocks/seed.ts`. This is acceptable, but any seed change requires a test change.
- The tests build their dates relative to the real clock and in local time, so they do not depend on the machine's time zone.

## Requirements Check

| AC | Status | Note |
| --- | --- | --- |
| AC-1, 2 | Met | List loads via the mock; title, status and start shown. |
| AC-3 | Met | `role="status"` while loading; the list is hidden on retry. |
| AC-4 | Met, with L-1 | Error state with Retry works. A malformed 200 is not handled. |
| AC-5, 6 | Met | `All` default and four statuses, in one radio group. |
| AC-7 | Met | The filter is kept. See M-1 for the state where the list is not visible. |
| AC-8, 9 | Met | The form opens with title and date/time. |
| AC-10 | Met | Trimmed, 3–80 characters (see L-4 for the counting). |
| AC-11 | Met | The 1-minute margin is implemented; test T-1 does not prove it. |
| AC-12 | Met | Messages appear next to the fields, with `aria-invalid` and `aria-describedby`. |
| AC-13 | Met | The ref guard and the disabled button (see L-5, T-2). |
| AC-14 | Partly | Closes, resets and appears in the list. Fails while the list is not `ready` (M-1). |
| AC-15 | Met | The mock sets `planned`. |
| AC-16 | Met | Values are kept and retry is possible; a test covers it. |
| AC-17, 18 | Met | Requests go through `api.ts`; MSW is dev only and stays out of the production bundle (per the coder's build report). |
| AC-19 | Met on paper | 11 tests exist. I did not run them. |
| AC-20 | Unverified | No browser run has been recorded. |

## Residual gaps

- No manual browser run has been recorded yet (AC-20). The dev-mode service worker path and the 500 ms loading state are unconfirmed.
- The mock is dev-only, so `npm run preview` or a deployed build would show the list error state because there is no `/api`. That is expected for onboarding.
- The `package.json` diff review from the plan (versions and the extra `@testing-library/dom`) is still pending on the developer.

## Recommended follow-up (a bounded role, not started)

- `coder`, for M-1 and optionally L-1 and L-2 (a small, bounded fix).
- `test-generator` or `coder`, for T-1 (a deterministic `validateStartsAt` unit test).
- Developer decision on M-2 before any persistence work.
