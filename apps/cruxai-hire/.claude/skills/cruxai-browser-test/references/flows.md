# cruxai Validated E2E Flows

Each flow describes what a real user does — page-by-page, click-by-click — and what should be true at each step. Drive the browser with `agent-browser`; this file tells you *what* to do, not *how* to call the tool. See `SKILL.md` for app URL, login, and patterns that bite.

---

## Flow 1 — Create a role (recruiter)

**Who**: either account works. The clean test user is fine; no questions are required.

**What you're verifying**: the recruiter can create a role, the form gates Save on the title, and the new role lands in the Roles table as a Draft.

1. Sign in. Land on the recruiter dashboard.
2. From the dashboard, click `New Role` (top-right of the page header).
3. You should now be on `/recruiters/roles/new` with a "Create New Role" heading and a "Basic Information" card. The Save Role button is **disabled** while the title is empty — confirm that before typing.
4. Fill the Role Title (e.g. `E2E Test Role`). Optionally fill the Description. As soon as the title is non-empty, the Save Role button becomes enabled and an "Attach Questions" button appears under a "Questions" heading.
5. (Optional) Click `Attach Questions` to open a dialog of the user's published questions. If you're signed in as the clean test user there will be none — close the dialog. For Flow 1's pass condition you don't need to attach any.
6. Click `Save Role`. Wait for the network to settle, plus a beat for the redirect.

**Pass condition**: the URL returns to `/recruiters`, a toast confirms creation, and a new row with the title you typed and status `Draft` appears in the Roles table.

---

## Flow 2 — Invite a candidate to a question (recruiter)

**Who**: must be `ronkamail@gmail.com` (or another user with at least one owned, published question). The clean test user has zero owned questions and cannot complete this flow.

**What you're verifying**: the recruiter can add a candidate, send a question to that candidate, and receive an invite URL to share.

### 2a. Add a candidate (skip if the candidate already exists)

1. From the recruiter dashboard, click the `Candidates` tab.
2. Click the `Add Candidate` button (top-right of the candidates panel).
3. A modal titled "Add Candidate" opens. The submit button is **disabled** until Full Name and Email Address are both filled — confirm that.
4. Fill Full Name, Email Address, and optionally Notes. The submit button enables once both required fields are valid.
5. Click `Add Candidate` (the modal's submit, not the page button) and wait for the network to settle.

**Pass condition**: the dialog closes, a "Added \<Name\>" entry appears in the activity list, and the new candidate row is visible in the Candidates table.

### 2b. Send a question (creates the invite)

1. Navigate to `/recruiters/questions` (Questions Library).
2. Find a published question card. Each card has `Send`, `Edit`, and `View` actions. Click `Send`.
3. A "Send to Candidate" dialog opens with a single Candidate dropdown and a `Create Link` button (disabled at first).
4. Open the Candidate combobox. Don't try to click an option directly — that won't register. Instead, type the candidate's name on the keyboard and press Enter. The combobox should now display the candidate's name, and Create Link should become enabled.
5. Click `Create Link`. Wait for the network to settle.

**Pass condition**: the dialog now shows a read-only input containing a URL of the form `http://localhost:<port>/invite/<short-code>`, with a Copy button next to it and a `Done` button. **Capture this URL** — Flows 3 and 4 reuse it. Close the dialog when you're finished.

---

## Flow 3 — Candidate takes the interview (candidate)

**Who**: the invite link carries its own identity, so the candidate flow does not depend on who is currently signed in. You may sign out first for realism, but it's not required.

**Prerequisite**: an invite URL captured in Flow 2 (or copied from a real invite).

1. Open the invite URL. The landing page reads "Welcome, \<Candidate Name\>" and has an "About This Assessment" section, a "Before You Begin" section, a Terms of Service checkbox, and a `Start Assignment` button (disabled until terms are accepted).
2. Tick the Terms of Service checkbox. The Start Assignment button enables.
3. Click `Start Assignment`. The page may briefly stay on the invite URL before transitioning — wait for the network to settle, then a couple more seconds.

**Pass condition for the start step**: the URL changes to `/questions/<questionId>?invite=<code>`. The page now shows the interview layout: a chat panel on one side (with a prompt textbox and a Submit button), a Sandpack preview on the other, an `End Question` button in the top-right, and a Spec toggle.

### Send a couple of prompts

For each prompt:

1. Type the prompt into the textbox labeled something like "Describe what you want to build or change".
2. Click the chat `Submit` button.
3. While the model is streaming, the Submit button is replaced by a `Stop` button. **Wait** until Submit reappears before moving on — don't queue prompts.
4. Re-snapshot before the next prompt; the textbox and button refs change between turns.

Send at least two prompts (e.g. "What does this codebase do?" and "Add a hello world button"). The exact content doesn't matter for the flow; what matters is that the assistant responds and you see it stream.

### Submit the assessment

1. Click the `End Question` button in the top-right of the page.
2. A confirmation modal appears titled "Submit your solution?" with its own Submit button. **Click that modal's Submit** — not anything in the chat area.
3. Wait for the network to settle and the redirect to occur.

**Pass condition**: the URL ends in `/invite/<code>/thank-you` and the page shows the heading "Assessment Submitted". Screenshot it.

---

## Flow 4 — Full loop: recruiter → candidate → recruiter analysis

**Who**: starts and ends as `ronkamail@gmail.com`. Middle leg is the candidate (any session — see Flow 3).

**What you're verifying**: a submission created via the recruiter UI flows all the way to the analysis page, with the candidate's chat turns recorded.

1. **Recruiter setup**. Sign in as the owner account. Optionally run Flow 1 to create a role (not required for the invite). Run Flow 2 to add a candidate (or reuse one) and to send a question. Capture the invite URL and note which candidate you picked.
2. **Candidate run**. Run Flow 3 end-to-end against that invite URL. Confirm you land on the thank-you page before continuing.
3. **Back to recruiter analysis**. If you signed out for Flow 3, sign back in as the owner. Open `/recruiters`.
4. On the dashboard's Overview tab, look at the Recent Activity panel — you should see an entry like "\<Candidate Name\> submitted" with a Submitted (or Reviewed) badge dated today. Note: the activity items are *not* clickable; they only confirm the submission landed.
5. Switch to the `Candidates` tab. Click the row for the candidate you invited. You're now on `/recruiters/candidates/<id>`.
6. Look at the "Invites & Submissions" table. Each row has a `Review` link in the Actions column. Multiple rows are normal — older ones are seeded historical data. Pick the row whose Submitted column shows today's date.
7. Click that row's `Review` link. Wait for the network and a beat for the route transition.

**Pass conditions**:

- After step 4, the candidate's submission shows up in Recent Activity with today's date.
- After step 7, the URL is `/recruiters/submissions/<submissionId>` and the page renders:
  - A "Submission Analysis" heading
  - The original question title as a sub-heading
  - A status combobox (usually `Reviewed`; may briefly show `Submitted` while analysis runs)
  - An "AI Practice Signals" panel
  - A "Moments" panel with Exemplar / Red Flag / Teaching Moment counters
  - A "Conversation Timeline" with one event per chat turn the candidate sent

Screenshot the analysis page as the run's final artifact.

> **Gotcha**: if Recent Activity shows the submission but the analysis page is missing signals or shows zero timeline events, the server-side analysis is probably still running. Wait a few seconds and reload the analysis page once before treating it as a failure.

---

## Cleanup

Close the browser when the run is done. Leave the dev server running unless you started it specifically for this run.
