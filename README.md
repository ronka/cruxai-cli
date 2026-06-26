<h1 align="center">crux</h1>

<p align="center">
<strong>better agentic engineering.</strong><br>
Analyze your AI coding assistant usage — any harness, one dashboard, entirely on your machine.
</p>

<p align="center">
<a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
<img alt="Node 20+" src="https://img.shields.io/badge/node-20%2B-339933">
</p>

---

## What it does

**crux** is a local-first CLI that reads your AI session logs and turns them into actionable
insights — no data leaves your machine, no telemetry, read-only.

- **Generate an offline dashboard** — `crux scan` writes a self-contained, fully interactive HTML
  report you open in any browser
- **Report in the terminal** — `crux view` prints overview, patterns, flow, credits, and code
  production summaries
- **Detect anti-patterns** — practice-score cards across prompt quality, session hygiene, code
  review, and tool mastery
- **Measure output** — AI-generated code volume by language, workspace, model, and harness
- **Discover skills** — find repeated prompts and turn them into reusable skills
- **Score context health** — agentic-readiness checks and instruction-file audits

<details>
<summary><strong>Screenshots</strong></summary>
<br>
<p align="center"><img src="assets/screen-timeline.png" alt="Timeline" width="820"></p>
<p align="center"><img src="assets/screen-output.png" alt="Code Output" width="820"></p>
<p align="center"><img src="assets/screen-patterns-projects.png" alt="Activity Patterns - Projects" width="820"></p>
<p align="center"><img src="assets/screen-antipatterns.png" alt="Anti-Patterns" width="820"></p>
</details>

---

## Install

crux is not yet published to npm. Build it from source and link the local binary.

Prerequisites: Node.js 20+ and npm.

```bash
git clone https://github.com/ronka/cruxai-cli.git
cd cruxai-cli
npm ci
npm run build
npm link        # makes `crux` available on your PATH
```

Or run it without linking:

```bash
node ./bin/run <command>
```

---

## Commands

### `crux scan`

Generate a self-contained, interactive offline dashboard from your local session logs.

```bash
crux scan [logDir] [--out <dir>] [--from <date>] [--to <date>] \
          [--workspace <id>] [--harness <name>] [--open]
```

| Flag | Description |
|------|-------------|
| `--out` | Output folder (default: `./crux-report`) |
| `--from` / `--to` | Initial date window (ISO 8601) |
| `--workspace` | Initial workspace filter (default: all) |
| `--harness` | Initial harness filter (e.g. `Claude`) |
| `--open` | Open the generated report in your browser |

The report runs the analyzer client-side against a baked snapshot, so date/workspace/harness
filters and drill-downs keep working with no server. It ships five pages: **Dashboard**,
**Timeline**, **Output**, **Patterns**, and **Anti-Patterns**.

> ⚠️ The output folder contains a verbatim local mirror of your session data, which may include
> secrets present in your logs. Treat it as sensitive and do not share it blindly.

### `crux view`

Print a report directly in the terminal.

```bash
crux view [overview|context|patterns|flow|credits|production|all] \
          [--report <dir>] [--from <date>] [--to <date>] \
          [--workspace <id>] [--harness <name>] [--json] [--no-color]
```

### `crux context-health`

Print context-quality scores (agentic readiness, instruction-file audits) in the terminal.

```bash
crux context-health [--workspace <id>] [--from <date>] [--to <date>] \
                    [--harness <name>] [--json] [--no-color]
```

### `crux skills`

Analyze repeated prompts and surface custom-skill opportunities, optionally ranked against the
open-source community catalog.

```bash
crux skills [--workspace <id>] [--from <date>] [--to <date>] [--harness <name>] \
            [--lookback <days>] [--catalog] [--install <clusterId>] \
            [--install-catalog <catalogId>] [--force] [--json] [--no-color]
```

`crux skills` (and the Skill Finder inside `crux scan` reports) need an LLM key:
`ANTHROPIC_API_KEY` (or `OPENAI_API_KEY` + optional `OPENAI_BASE_URL`). Set
`ANTHROPIC_MODEL` / `OPENAI_MODEL` to override the default model. The key is read from the
environment and never written to disk.

---

## Privacy

- **Read-only** — crux never modifies your session files
- **Local analysis** — all parsing and analytics run entirely on your machine
- **No telemetry** — crux does not phone home or collect usage data
- **Optional AI features** — Skill Finder and catalog ranking call an LLM only when you provide a
  key and explicitly invoke them

---

## Provenance

crux originated as a fork of the MIT-licensed open-source project
[microsoft/AI-Engineering-Coach](https://github.com/microsoft/AI-Engineering-Coach). The original
Microsoft copyright notice and the MIT permission notice are retained in [`LICENSE`](LICENSE) and
[`NOTICE`](NOTICE), as the license requires. crux is an independent project and is **not**
affiliated with, endorsed by, or sponsored by Microsoft.

## Trademarks

Product names, logos, and brands referenced in this project are the property of their respective
owners and are used for identification purposes only. Their use does not imply any affiliation or
endorsement.

## License

[MIT](LICENSE)

## Disclaimer

This project is provided as-is, with no warranties or guarantees.
