# Contributing to crux

This project welcomes contributions and suggestions.

## How to Contribute

1. **Fork** the repository and create your branch from `main`.
2. **Install dependencies**: `pnpm install`
3. **Build the CLI**: `pnpm nx build cli`
4. **Run tests**: `pnpm test`
5. **Lint + typecheck + spellcheck + knip**: `pnpm check`
6. If you've added code, add tests that cover your changes.
7. Ensure the test suite passes and linting is clean.
8. Submit a **pull request**.

### Monorepo structure

```
apps/cli/       → @crux/cli — published CLI (esbuild, Preact webview)
apps/dashboard/ → @crux/dashboard — Next.js dashboard (work in progress)
packages/core/  → @crux/core — shared analysis engine (private package)
```

Nx manages cross-project builds: `pnpm nx run-many -t lint test build`.
Module boundaries are enforced by ESLint (`@nx/enforce-module-boundaries`):
`apps/dashboard` cannot import from `apps/cli` and vice-versa;
both may depend on `packages/core`.

## Reporting Issues

Please use [GitHub Issues](https://github.com/ronka/cruxai-cli/issues) to report bugs or
request features. Before filing a new issue, please check if one already exists.

## Security

If you discover a security vulnerability, please follow the instructions in [SECURITY.md](SECURITY.md).
**Do not** report security vulnerabilities through public GitHub issues.

## Creating Rules and Metrics

Detection rules and metrics are the primary extensibility surface of crux. Each one is
a self-contained markdown file with YAML frontmatter and a small DSL — no code changes required to
ship a new one. Built-in rules live in [`packages/core/src/rules/`](packages/core/src/rules/) and metrics in
[`packages/core/src/metrics/`](packages/core/src/metrics/).

See [docs/AUTHORING_RULES.md](docs/AUTHORING_RULES.md) for the full authoring guide: file format,
annotated rule and metric examples, the local testing workflow, and links to the DSL reference.
