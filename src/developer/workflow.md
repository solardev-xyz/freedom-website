---
title: Contribution workflow
description: How to contribute to Freedom Browser: picking an issue, branching, Conventional Commits, changelog fragments, pull request checklist, dependencies and AI assistance.
kick: Contribute
dek: From picking an issue to a reviewed pull request, following the project's CONTRIBUTING.md.
source: https://github.com/solardev-xyz/freedom-browser/blob/main/CONTRIBUTING.md
---

This page summarises [CONTRIBUTING.md](https://github.com/solardev-xyz/freedom-browser/blob/main/CONTRIBUTING.md). When in doubt,
that file wins.

## 1. Pick something

- **Bug fixes:** comment on the issue, or open a
  [bug report](https://github.com/solardev-xyz/freedom-browser/issues/new/choose) with steps to reproduce.
- **Features, larger refactors, dependency or architecture changes:** open an
  issue first so maintainers and contributors can agree on scope.
- **New integrations** (another wallet, protocol or network backend): talk to
  us in [Telegram](https://t.me/freedom_browser) first. These are trust and
  maintenance decisions.
- Looking for a start? [Open for contribution](open-issues.html) lists
  issues that are well scoped and close to the developer APIs.

Comment on the issue you take, so nobody duplicates the work. Draft pull
requests are welcome for early feedback; maintainers decide whether and when
a contribution fits the roadmap.

## 2. Branch and change

- Branch from an up-to-date `main`.
- Match the naming and organisation of nearby code, and keep the change
  focused: unrelated cleanup makes review harder.
- Read the [architecture boundaries](https://github.com/solardev-xyz/freedom-browser/blob/main/docs/agent-playbooks/architecture-boundaries.md)
  before changing process responsibilities or IPC.
- **Do not add or upgrade dependencies without maintainer approval.** They
  affect the attack surface, native builds, package size and licence
  obligations.
- Add or update tests for behaviour changes and regressions. Never commit
  secrets, keys, tokens, seed phrases or unredacted personal data.

## 3. Commit

Use [Conventional Commit](https://www.conventionalcommits.org/) subjects:

```text
<type>(<scope>): <imperative summary>
```

Allowed types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`,
`build`, `ci`, `perf`, `revert`. Explain why in the body when the change
is not trivial.

### Changelog fragments

A **user-visible** change adds one file, `changelog.d/<section>--<slug>.md`,
instead of editing `CHANGELOG.md`. `<section>` is `added`, `changed`,
`deprecated`, `removed`, `fixed` or `security`; the slug can be the issue
number, e.g. `fixed--280-settings-deeplink.md`. The body is the entry as it
should read, as bullets, ending in a link to the issue. Developer-only fixes,
in-release polish, test-only and internal work need no fragment. Details:
[changelog.d/README.md](https://github.com/solardev-xyz/freedom-browser/blob/main/changelog.d/README.md).

## 4. Check

Before you open the pull request:

```bash
npm run lint
npm test                       # or the tests next to the files you changed
npx prettier --check <files you changed>
git diff --check
```

Run the relevant Playwright or live suite when the change affects UI flows,
protocols or nodes; see [Setup](contributing.html#tests-and-checks). The CI
matrix runs more native and integration checks. If you could not run one,
say so in the pull request instead of ticking it.

## 5. Open the pull request

The [pull request template](https://github.com/solardev-xyz/freedom-browser/blob/main/.github/pull_request_template.md) asks for:

- what changed, why, and what users or developers will notice;
- the related issue (`Closes #123`);
- whether a changelog fragment is included;
- the checks you actually ran;
- for anything under `src/renderer/`: before and after screenshots in
  **both themes**, following
  [ui-consistency.md](https://github.com/solardev-xyz/freedom-browser/blob/main/docs/agent-playbooks/ui-consistency.md).

Stay available for review questions and follow-up changes.

## AI-assisted contributions

AI help is allowed, but a human stays accountable. Review and understand
everything you submit, verify generated claims and tests, and disclose
material AI assistance in the pull request. Unreviewed automated submissions
may be closed.

## Licence

Freedom Browser is licensed under the
[Mozilla Public License 2.0](https://github.com/solardev-xyz/freedom-browser/blob/main/LICENSE). Contributions are made under
MPL-2.0 unless agreed otherwise. Only submit work you have the right to
contribute.
