---
title: Contribute to Freedom Browser
description: How to set up a Freedom Browser development environment, run tests, and open pull requests.
kick: Contribute
dek: Prerequisites, local setup, tests, project structure, and pull-request conventions.
---

# Contribute to Freedom Browser

Thanks for helping build a browser for the decentralized web. Contributions to code, tests, documentation, issue triage, and reproducible bug reports are welcome.

This page summarizes [CONTRIBUTING.md](https://github.com/solardev-xyz/freedom-browser/blob/v0.8.8/CONTRIBUTING.md) and [docs/development.md](https://github.com/solardev-xyz/freedom-browser/blob/v0.8.8/docs/development.md) from the **v0.8.8** tag of [solardev-xyz/freedom-browser](https://github.com/solardev-xyz/freedom-browser). When in doubt, those files and `package.json` scripts are authoritative.

## Before you start

- Search the [issue tracker](https://github.com/solardev-xyz/freedom-browser/issues) before opening a report or proposing work.
- For a bug fix, comment on the relevant issue or open a structured bug report.
- For a feature, major refactor, dependency change, or architectural change, open an issue first so maintainers can agree on scope.
- For a new integration (another wallet, protocol, or network backend), talk in the [Telegram group](https://t.me/freedom_browser) first — these are trust and maintenance decisions.
- Keep changes focused. Unrelated cleanup makes review harder.

## Prerequisites

- **Node.js 24 LTS** — the pinned version is in [`.nvmrc`](https://github.com/solardev-xyz/freedom-browser/blob/v0.8.8/.nvmrc) (`24.18.1` at v0.8.8).
- npm (bundled with Node.js) and Git.
- Platform build tools required by Electron native modules.
- On Linux (Debian/Ubuntu), the udev and libusb headers used when rebuilding Ledger USB modules:

```bash
sudo apt install libudev-dev libusb-1.0-0-dev
```

With `nvm`:

```bash
nvm install
nvm use
```

## Clone, install, run

```bash
git clone https://github.com/solardev-xyz/freedom-browser.git
cd freedom-browser
npm ci
npm run ant:download
npm run ipfs:download
npm run myotis:download
npm run myotis:build-supervisor
npm start
```

Swarm and IPFS start automatically by default. **Radicle** and **Myotis** are opt-in under **Settings → Nodes → Startup**. Install the embedded Radicle addon with `npm run radicle:download`, then enable Radicle for the profile. Optional Tor support: `npm run tor:download`, then enable under **Settings → Advanced**.

### Linux sandbox note

On distributions that restrict unprivileged user namespaces (Ubuntu 24.04+), Chromium falls back to its SUID helper. After Electron downloads its binary (first launch / after `npm ci`), configure it:

```bash
npx --no install-electron
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

Repeat after every `npm ci` and every Electron bump. Prefer a correctly configured sandbox over developing with `--no-sandbox`.

## Project structure

| Directory | Responsibility |
| --- | --- |
| `src/main/` | Electron main process: node lifecycles, protocol handlers, IPC, persistence, permissions |
| `src/renderer/` | Browser UI: tabs, navigation, menus, settings, dApp integration |
| `src/shared/` | Constants and utilities shared by main and renderer |
| `test-e2e/` | Playwright harness and live Electron tests |
| `config/` | Ant configuration, default bookmarks, platform entitlements |
| `scripts/` | Build, binary-download, smoke-test, and maintenance helpers |
| `docs/` | User, protocol, contributor, and maintainer documentation |

Protocol and privileged logic belongs in the main process. The renderer talks to it through IPC channels in `src/shared/ipc-channels.js`. Read the [architecture boundaries](https://github.com/solardev-xyz/freedom-browser/blob/v0.8.8/docs/agent-playbooks/architecture-boundaries.md) before changing process responsibilities or adding IPC.

The page providers documented on this site are injected from `src/main/webview-preload.js`; consent UX lives under `src/renderer/lib/{swarm,radicle}-provider.js`; the main-process authority is `src/main/swarm/swarm-provider-ipc.js` and `src/main/radicle/radicle-provider-ipc.js`.

## Tests and checks

| Script | Description |
| --- | --- |
| `npm start` | Launch Electron in development mode |
| `npm run lint` | ESLint |
| `npm test` | Jest unit suite |
| `npm run test:coverage` | Jest with coverage |
| `npm run test:e2e` | Deterministic Playwright harness |
| `npm run test:e2e:live` | Live node / protocol / naming tests (needs downloaded binaries) |
| `npm run check-binaries` | Validate packaged native binary targets |
| `npm run ant:download` / `ipfs:download` / `myotis:download` / `radicle:download` / `tor:download` | Fetch or build pinned native bits |

Guidance from CONTRIBUTING:

- Add or update tests for behavior changes and regressions.
- Run `npm run lint` after code changes.
- Run `npm test` when modifying files that have neighboring `.test.js` files.
- Run the relevant Playwright or live suite when the change affects UI flows, protocols, or native nodes.
- Run `npx prettier --check` on the files you touched (`npm run format:check` currently fails on pre-existing drift) and `git diff --check` before submitting.
- Never commit secrets, keys, tokens, seed phrases, or unredacted personal data.

If you cannot run a CI-only check locally, say so in the pull request rather than marking it done.

## How to pick issues

1. Browse [open issues](https://github.com/solardev-xyz/freedom-browser/issues) — look for labels that match your skills (bugs, docs, protocol work, UI).
2. Comment on the issue you want to take so work is not duplicated.
3. Prefer well-scoped bugs and docs fixes for a first contribution; large features need an agreed issue first.
4. New protocol or wallet integrations: discuss in [Telegram](https://t.me/freedom_browser) before writing code.

## Pull request conventions

Use Conventional Commit subjects:

```text
<type>(<scope>): <imperative summary>
```

Allowed types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `build`, `ci`, `perf`, `revert`.

Pull requests should:

- Add a changelog fragment for a user-visible change: one new file `changelog.d/<section>--<slug>.md` (do not edit `CHANGELOG.md` directly). See [changelog.d/README.md](https://github.com/solardev-xyz/freedom-browser/blob/v0.8.8/changelog.d/README.md).
- Link the relevant issue.
- Explain the problem and the chosen approach, user-visible impact, and risk.
- List the checks actually run.
- Include screenshots or recordings for visible UI changes. Changes under `src/renderer/` need before/after screenshots in **both** themes.
- Stay available for review questions.

Draft PRs are welcome for early feedback. AI assistance is allowed if a human reviews and understands the submission and discloses material AI help in the PR.

## Licensing and security

Freedom Browser is [MPL-2.0](https://github.com/solardev-xyz/freedom-browser/blob/v0.8.8/LICENSE). Contributions are made under that license unless agreed otherwise.

If a report may expose a security vulnerability, do not include exploit details, keys, or sensitive user data in a public issue. Contact `browser@freedom.baby` before public disclosure.

## Where to ask

| Channel | Use for |
| --- | --- |
| [Telegram — Freedom Browser](https://t.me/freedom_browser) | Questions, design discussion, new integrations |
| [GitHub Issues](https://github.com/solardev-xyz/freedom-browser/issues) | Bugs, feature proposals, tracked work |
| [Community](https://freedom.davinci.space) | Broader community space |
| `browser@freedom.baby` | Security disclosures |

Do not post credentials, seed phrases, private keys, or sensitive logs in public channels.
