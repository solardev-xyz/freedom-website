---
title: Set up Freedom Browser for development
description: Build and run Freedom Browser from source: prerequisites, toolchains for optional components, the Linux sandbox fix, tests and debugging.
kick: Contribute
dek: Clone, install, run. Plus the toolchains the optional parts need, which is where most first builds get stuck.
source: https://github.com/solardev-xyz/freedom-browser/blob/main/docs/development.md
---

Thanks for helping build a browser for the decentralized web. Code, tests,
documentation, issue triage and reproducible bug reports are all welcome.
New here? Start with [Open for contribution](open-issues.html) and say hello in
the [community](community.html); we offer mentorship.

This page follows [docs/development.md](https://github.com/solardev-xyz/freedom-browser/blob/main/docs/development.md) on
`main`. When they disagree, that file and the scripts in `package.json` win.

## Prerequisites

- **Node.js 24 LTS.** The exact version is pinned in
  [`.nvmrc`](https://github.com/solardev-xyz/freedom-browser/blob/main/.nvmrc) (24.18.1 at the time of writing); with nvm, run
  `nvm install && nvm use` in the checkout.
- npm (bundled with Node.js) and Git.
- The platform build tools that Electron native modules need.
- **CMake 3.16+ and a C++ toolchain** (Xcode command-line tools on macOS, MSVC
  Build Tools on Windows, a C++ compiler and Make on Linux). `npm start`
  builds the offline whisper.cpp runtime for local dictation from pinned
  source the first time, and fails without CMake. The result is cached.
- **Linux (Debian/Ubuntu):** the udev and libusb headers, because `npm ci`
  rebuilds the Ledger USB module from source:

```bash
sudo apt install libudev-dev libusb-1.0-0-dev
```

Without `libudev-dev`, `npm ci` fails with
`fatal error: libudev.h: No such file or directory`.

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

The Swarm node (Ant) and IPFS start automatically. Radicle and Myotis are
opt-in under **Settings → Nodes → Startup**.

### Linux: the Chromium sandbox

On distributions that restrict unprivileged user namespaces (Ubuntu 24.04
and later), `npm start` aborts with
`The SUID sandbox helper binary was found, but is not configured correctly`.
Electron downloads its binary on first launch, so fetch it, then hand the
helper to root:

```bash
npx --no install-electron
sudo chown root:root node_modules/electron/dist/chrome-sandbox
sudo chmod 4755 node_modules/electron/dist/chrome-sandbox
```

Repeat after every `npm ci` and every Electron upgrade. Do not develop with
`--no-sandbox`: it hides real behaviour.

## Optional components and their toolchains

| Component | Command | Needs |
| --------- | ------- | ----- |
| Myotis supervisor | `npm run myotis:build-supervisor` | An installed C compiler: Apple clang or the command-line tools on macOS, a native C compiler on Linux, an **x64 MSVC developer shell** on Windows. Nothing is downloaded for you |
| Radicle | `npm run radicle:download` | Nothing extra; prebuilt for macOS, Linux and Windows x64/ARM64. Then enable Radicle for the profile under **Settings → Nodes** |
| Tor | `npm run tor:download` | **Rust** at or above the pinned Arti release's minimum version (`MIN_RUST_VERSION` in [`scripts/fetch-arti.js`](https://github.com/solardev-xyz/freedom-browser/blob/main/scripts/fetch-arti.js); the script checks). Arti is compiled for the host only. Linux also needs OpenSSL headers (and `libsqlite3-dev` when `pkg-config` is installed); Windows needs the x64 MSVC tools. Then enable Tor under **Settings → Advanced** |
| Linux workspace helper | built by `npm start` | `/usr/bin/gcc`. Without it, startup continues with a warning and skips the helper |

## Tests and checks

| Script | What it does |
| ------ | ------------ |
| `npm run lint` | ESLint. Run it after every code change |
| `npm test` | Jest unit suite. Most modules have a neighbouring `.test.js` |
| `npm run test:e2e` | Playwright harness with deterministic node and naming stubs; fast, no network |
| `npm run test:e2e:live` | Real nodes, protocols and name resolution; needs the downloaded binaries |
| `npm run test:e2e:packaged` | Smoke tests against a built binary (`FREEDOM_E2E_EXECUTABLE`) |
| `npm run test:e2e:startup-smoke` | Fails if the main process blocks for more than 1 s in its first 90 s |
| `npm run ant:smoke-upload` | A Swarm buy, upload and download round trip |
| `npm run ipfs:native:smoke` | Smoke-tests the native IPFS addon |
| `npm run check-binaries` | Validates packaged native binary targets |

On headless Linux, run the Playwright suites under `xvfb-run -a`. Formatting:
run `npx prettier --check` on the files you touched, because the repo-wide
`npm run format:check` currently fails on existing drift. Other scripts,
such as `radicle:build-addon` (libradicle from a sibling checkout) and
`adblock:download`, are listed in [development.md](https://github.com/solardev-xyz/freedom-browser/blob/main/docs/development.md#common-npm-scripts).

## Debugging

- **Menu (☰) → Developer Tools** (or `F12`) for the current page.
- **View → App Developer Tools** for Freedom's own UI, including navigation
  events.
- The terminal shows main-process output. `DEBUG=1 npm start` turns on
  verbose logging.
- `FREEDOM_LOG_SYNC=1` writes every log line synchronously, for chasing a
  main-thread hang or a native crash.

Next: [Architecture](architecture.html) · [Workflow](workflow.html)
