# Contributing

Thanks for taking a look — issues and PRs are welcome.

## Setup

```sh
pnpm install
```

Node ≥ 24 is targeted (Node 22 works with an engine warning).

## Working on the library

- Source lives in `src/`, tests in `test/` (Vitest + happy-dom, plus a node-environment suite
  for SSR paths).
- `pnpm test` must pass and `pnpm coverage` enforces 100% statement/branch/function/line
  coverage — new code needs tests that genuinely exercise it.
- `pnpm lint && pnpm typecheck && pnpm build && pnpm size` all run in CI; run them locally
  before pushing. The size budget is < 1 kB gzipped for the whole library — this package stays
  tiny on purpose.

## Working on the demo

`pnpm dev` serves the keyboard visualizer from `demo/` (it imports the library straight from
`src/`). `pnpm capture` rebuilds the demo and refreshes `docs/assets/visualizer.png` used in
the README.

## Releasing

User-facing changes need a changeset: `pnpm changeset`. See [RELEASING.md](RELEASING.md) for
how versions and npm publishes happen.

## Commit style

Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`, `ci:`, `test:`) keep the history
readable.
