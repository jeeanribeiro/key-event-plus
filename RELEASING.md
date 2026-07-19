# Releasing

Releases are driven by [Changesets](https://github.com/changesets/changesets).

## Day-to-day flow

1. Land PRs with a changeset (`pnpm changeset`) describing the user-facing change.
2. The `Release` workflow (`.github/workflows/release.yml`) opens/updates a "Version Packages"
   PR that bumps `package.json` and `CHANGELOG.md`.
3. Merging that PR makes the workflow build and publish to npm with provenance, and create the
   git tag.

## One-time npm setup (required before the workflow can publish)

The release workflow publishes via **npm trusted publishing** (OIDC — no npm token stored in
GitHub). It is gated behind a repository variable so it skips cleanly until configured:

1. On [npmjs.com](https://www.npmjs.com), open the `key-event-plus` package →
   **Settings → Trusted publisher**, and add:
   - Provider: **GitHub Actions**
   - Repository: `jeeanribeiro/key-event-plus`
   - Workflow filename: `release.yml`
2. In the GitHub repo: **Settings → Secrets and variables → Actions → Variables** → create
   `NPM_TRUSTED_PUBLISHING` with the value `true`.
3. Re-run the `Release` workflow (or push to `main`). The publish job now runs; the
   `id-token: write` permission plus `publishConfig.provenance` in `package.json` give the
   package a verifiable provenance statement.

## Manual fallback

```sh
pnpm build
pnpm changeset publish  # requires npm auth locally
git push --follow-tags
```
