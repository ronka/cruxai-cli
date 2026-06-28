---
name: cruxai-browser-test
description: "Browser-based end-to-end testing of the cruxai app using agent-browser. Use when asked to validate, smoke-test, or browser-test any feature or flow in cruxai. Triggers on: validate behavior, test this flow, browser test, smoke test the app, e2e test, check if X works in the browser, or any request to verify cruxai UI behavior after a commit or change."
---

# cruxai Browser Testing

Drive the cruxai app the way a real user would — open pages, fill fields, click buttons, watch what happens — using the `agent-browser` skill. This skill tells you **what to do**; agent-browser handles **how to do it**.

## App setup

- cruxai runs locally at `http://localhost:3000`, falling back to `http://localhost:3001` if 3000 is already taken by another project. Probe both before assuming.
- If neither port responds, start the dev server (`npm run dev`) and wait for it to be ready.
- If the database looks empty (no seeded questions or candidates), re-run the project's migration + seed scripts and the user-seed script. The skill assumes the seeded "Extend Monday board…" question and the standard candidate set exist.

## Test accounts (from `scripts/seed-user.ts`)

| Account | Use for |
|---|---|
| **Owner / recruiter** — `ronkamail@gmail.com` | Recruiter flows. This user owns the seeded "Extend Monday board…" question, which Flows 2 and 4 require. |
| **Clean test user** — `test@test.com` | Plain auth checks, browsing public questions, or Flow 1 (no questions needed). Has **zero owned questions**, so it cannot complete Flow 2. |

Read the actual passwords from `scripts/seed-user.ts` at the start of the run.

## Logging in (boilerplate)

1. Open `/login`, wait for the page to settle.
2. Snapshot the page. The form is small: an Email textbox, a Password textbox, a `Sign in` button.
3. Fill email, fill password, click `Sign in`.
4. Wait for the network to settle, then wait ~2 more seconds — the page lingers briefly on `/login` before redirecting.
5. Confirm the URL is now `/recruiters`.

## Signing out

In the top-right header, click the avatar button (its label is the user's initials, e.g. `RK` or `TU`), then click the `Sign out` menu item. Wait for redirect back to `/login`.

## Key routes

| Route | What lives there |
|---|---|
| `/login` | Auth page |
| `/recruiters` | Recruiter dashboard — Overview / Roles / Candidates tabs |
| `/recruiters/roles/new` | Create-role form |
| `/recruiters/roles/[id]` | Role detail — invites, submissions, pipeline |
| `/recruiters/questions` | Recruiter Questions Library |
| `/recruiters/candidates/[id]` | Candidate detail — invites & submissions table |
| `/recruiters/submissions/[id]` | Submission analysis (signals, timeline) |
| `/invite/[code]` | Candidate landing — terms + Start Assignment |
| `/questions/[id]?invite=[code]` | Active interview (chat + sandpack preview) |
| `/invite/[code]/thank-you` | Assessment Submitted confirmation |

## Flows

End-to-end flows are in `references/flows.md`:

1. **Create a role** (recruiter)
2. **Invite a candidate to a question** (recruiter)
3. **Candidate takes the interview and submits** (candidate)
4. **Full loop: recruiter → candidate → recruiter analysis**

When the user asks to validate a specific feature, run the matching flow. When asked to "test the app" generally, run all four in order — they share state and Flow 4 reuses the invite link captured in Flow 2.

## Patterns that bite

These have all caused false failures in previous runs — internalize them before you start:

- **Always wait for the network to settle after navigating**, then wait a couple more seconds before asserting on URLs. Auth redirects and route transitions are asynchronous.
- **Re-snapshot after anything that opens a modal, switches tabs, or navigates.** Radix dialogs and dropdowns reuse the DOM but their interactive elements get fresh refs each time.
- **Radix `<Select>` dropdowns reject clicks on individual options.** The correct pattern is: click the combobox to open it, type the option name on the keyboard, press Enter. Whichever option is the top match for what you typed is selected.
- **The chat Submit button morphs into Stop while the model streams.** Wait until Submit returns before sending the next prompt. Don't fire prompts back-to-back.
- **End Question opens a confirmation modal.** Inside that modal is a *second* Submit button — that is the one that actually finalizes the assessment. The Submit button in the chat area only sends another prompt.
- **Recent Activity entries on the recruiter dashboard are not clickable.** Navigate to a submission via Candidates tab → candidate row → Review link.
- **Save a screenshot at every meaningful milestone** (post-login, post-create, link captured, thank-you, analysis) — they make it easy for a human to spot-check the run.
- **Close the browser when done.**

## Pre-flight checklist

Before running any flow, eyeball these:

1. Dev server reachable on 3000 or 3001 and serving cruxai (not the other project on 3000).
2. The seeded public question exists and is owned by `ronkamail@gmail.com`. If you sign in as the owner, navigating to the recruiter Questions Library should show at least one question card with a `Send` button. If it doesn't, the database needs re-seeding.
3. The standard candidate set is present. Open the recruiters dashboard → Candidates tab; you should see a populated table (Alex Johnson, Maria Garcia, etc.). If empty, re-seed.
