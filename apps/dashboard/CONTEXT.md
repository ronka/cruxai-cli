# Dashboard

The `@crux/dashboard` Next.js app: a hosted, multi-user view over crux session
analytics. The MVP renders a single user's analytics from a `data.json` produced
by `crux scan`, styled in the crux dashboard look. It is distinct from the
offline report that the CLI itself generates.

## Language

**Session**:
One run of an AI coding assistant captured from a log file — the atomic unit of
analysis. Produced by the parser, consumed by the Analyzer.

**Workspace**:
A project/repo grouping that sessions belong to.

**Harness**:
The AI assistant tool a session came from (VS Code, Claude, Codex, Xcode, …).

**data.json**:
The single file `crux scan` writes — a serialized `ParseResult`
(`{ sessions, editLocIndex, workspaces }`, Maps as `[key, value][]`). The MVP
dashboard's data source.
_Avoid_: "the report file", "the snapshot" (ambiguous with the HTML report).

**Analyzer**:
The `@crux/core` engine that turns rehydrated `data.json` into metrics
(stats, dashboard, credits, production, flow, …). Runs client/server-side, no fs.

**Offline report** / **Scan report**:
The self-contained HTML dashboard `crux scan` bakes (`crux-report/index.html`).
Runs the Analyzer in the browser. NOT the same thing as the **Dashboard**.
_Avoid_: calling this "the dashboard".

**Dashboard**:
The `@crux/dashboard` Next.js app. The thing this context is about.

**Employee**:
A person whose crux usage is analyzed. In the end-state, each Employee installs
crux, which uploads their data.json to a shared bucket; the Dashboard lists all
Employees grouped by **Role**. Not present in the MVP (single, anonymous user).
_Avoid_: "User" for this concept — reserve a clear word for the person.

**Role**:
An Employee's job classification (developer, accountant, IT, …) used to group
the roster. NOT derivable from data.json — it comes from the upload/identity
layer that does not exist yet. Future only.

## Relationships

- `crux scan` reads **Session** logs → writes one **data.json**
- The **Dashboard** loads a **data.json** → constructs an **Analyzer** → renders
- A **Session** belongs to one **Workspace** and one **Harness**

## Flagged ambiguities

- "the file crux-cli is loading" — crux-cli loads session-log *directories*;
  `crux scan` *writes* **data.json**, which the **Dashboard** loads. Resolved:
  the MVP data source is **data.json**, not the raw logs.
- "dashboard" was used for both the **Offline report** and the **Dashboard**
  (Next.js app). Resolved: these are distinct; "Dashboard" = the Next.js app.
