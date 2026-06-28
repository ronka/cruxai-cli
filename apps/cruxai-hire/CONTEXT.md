# CrUX AI

A hiring platform where candidates complete coding tasks in a chat-driven sandbox, and AI evaluates the resulting transcript to help recruiters make hiring decisions.

## Language

**Question (Private)**:
A Question created by a recruiter and owned by them (`ownerId` set, `isPublic = false`). Visible only to its owner in the library and only attachable to roles by its owner.

**Question (Public)**:
A Question seeded into the system with no individual owner (`ownerId = null`, `isPublic = true`). Visible to every authenticated user in the candidate library `/questions`, but hidden from the recruiter management page `/recruiters/questions`. No one can edit or delete it. Used today for demo seeding only.

**Submission**:
A single attempt at a Question, captured as a chat transcript plus snapshots and metadata. The unit of work that gets evaluated. Comes in two flavors based on identity:

- **Invite-flow Submission**: created by the recruiter at invite-send time with `inviteId` set and `userId` null. Mutated anonymously by the candidate (authorized by knowing the submission id). Read by the recruiter who owns the Question.
- **Public-flow Submission**: created by a logged-in user when they start a Public Question. Has `userId` set and `inviteId` null. Only the submitter can read or mutate it.

A `CHECK` constraint enforces that exactly one of `inviteId` / `userId` is set on every row.

**Evaluation**:
The umbrella for all AI-generated outputs over a Submission's transcript. Has two sibling parts: **MessageInsights** and **HireRecommendation**.
_Avoid_: Analysis (overloaded — was previously used as both the umbrella and as a synonym for MessageInsights).

**MessageInsights**:
A per-message AI judgment of the candidate's transcript: each entry has `messageIndex`, `intent`, `quality`, `flags`, and `reasoning`. One of the two siblings of an **Evaluation**.
_Avoid_: Analysis, AnalysisResult (DB column name is `analysis_result` for historical reasons; treat that as a storage detail, not the domain term).

**HireRecommendation**:
A single per-Submission verdict (`strong` | `medium` | `no_hire`) plus reasoning. The other sibling of an **Evaluation**.
_Avoid_: Verdict (used in some UI components; prefer HireRecommendation in code/types).

**Review**:
The human recruiter act of looking at a Submission and (optionally) marking it `reviewed`. Not an AI output.
_Avoid_: confusing with Evaluation.

**Snapshot**:
A point-in-time capture of the sandbox state on the Submission's timeline. Kinds: `snapshot-ai`, `snapshot-manual`, `snapshot-revert`.

## Relationships

- A **Submission** has at most one **Evaluation**
- An **Evaluation** is composed of zero-or-one **MessageInsights** set and zero-or-one **HireRecommendation**
- **MessageInsights** and **HireRecommendation** are persisted as sibling columns on the Submission row (`analysis_result` and `hire_recommendation` respectively)
- A recruiter performs a **Review** on a Submission; this is independent of whether an **Evaluation** has been generated

## Flagged ambiguities

- "Analysis" was used to mean both the umbrella and the message-insights output. Resolved: the umbrella is **Evaluation**; the per-message output is **MessageInsights**. Code/router/hook renames are tracked in the refactor plan.
- DB column `analysis_result` predates this naming and stores only **MessageInsights**. Treat the column name as legacy storage, not the canonical domain term.

## Example dialogue

> **Dev:** "Did the AI **Evaluation** finish for this **Submission**?"
> **PM:** "The **MessageInsights** came back but the **HireRecommendation** is still pending — they run as separate calls."
> **Dev:** "And the recruiter still has to **Review** it before it shows up in the hired list?"
> **PM:** "Right — **Review** is a human gate; the **Evaluation** is just AI output."
