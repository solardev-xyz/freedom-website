---
title: Architecture
description: How Freedom Browser is put together: Electron main and renderer processes, protocol handlers, embedded nodes, the page providers and the security model.
kick: Contribute
dek: An Electron app whose main process owns protocols, nodes, permissions and the wallet. The renderer is UI, and pages only reach privileged features through narrow providers.
source: https://github.com/solardev-xyz/freedom-browser/blob/main/README.md#architecture
---

## Processes

| Layer | Directory | Owns |
| ----- | --------- | ---- |
| Main process | [`src/main/`](https://github.com/solardev-xyz/freedom-browser/tree/main/src/main) | Protocol handlers, per-profile node lifecycles, permissions, wallet, downloads, updates, persistence |
| Renderer | [`src/renderer/`](https://github.com/solardev-xyz/freedom-browser/tree/main/src/renderer) | Browser UI: tabs, navigation, menus, settings, internal `freedom://` pages, dapp integration and consent prompts |
| Shared | [`src/shared/`](https://github.com/solardev-xyz/freedom-browser/tree/main/src/shared) | Constants and utilities used by both, including the IPC channel allowlist |

The renderer talks to the main process only through the allowlisted channels
in [`src/shared/ipc-channels.js`](https://github.com/solardev-xyz/freedom-browser/blob/main/src/shared/ipc-channels.js). Protocol
and privileged logic belongs in the main process. Before you move
responsibilities between processes or add an IPC channel, read the
[architecture boundaries playbook](https://github.com/solardev-xyz/freedom-browser/blob/main/docs/agent-playbooks/architecture-boundaries.md);
changes to those boundaries need maintainer approval.

Other top-level directories: `test-e2e/` (Playwright), `config/` (runtime
templates, default data, entitlements), `scripts/` (build, download,
smoke-test tooling), `assets/` (icons) and `docs/`.

## Protocols and nodes

The main process handles `bzz:`, `ipfs:`, `ipns:`, `web3:`, `rad:` and
`.onion` navigation, runs each profile's nodes, and resolves decentralized
names.

- **Swarm** runs on Ant (`antd`), a node that speaks the Bee HTTP API. Its
  wire and identity contract (endpoints, port 1633, config keys, key files)
  deliberately keeps Bee's names; the playbook lists what must not be renamed.
- **IPFS** uses the freedom-ipfs native addon.
- **Radicle** runs in-process through the embedded libradicle addon. No CLI,
  HTTP daemon or local port is involved, and `rad:` URLs are served from the
  node's storage.
- **`web3:`** needs no node: the handler reads a contract's ERC-8244
  `html()` document through the chain-data router the wallet uses.
- **Tor** is an optional Arti binary for `.onion` sites.

## Page providers

`window.swarm`, `window.radicle` and `window.ethereum` are installed in the
main world of every web page's top frame before the page's own scripts run.
A request travels through three places:

| Step | Files |
| ---- | ----- |
| Page shim (injected) | [`src/main/webview-preload.js`](https://github.com/solardev-xyz/freedom-browser/blob/main/src/main/webview-preload.js) |
| Consent prompts and UX | [`src/renderer/lib/swarm-provider.js`](https://github.com/solardev-xyz/freedom-browser/blob/main/src/renderer/lib/swarm-provider.js), [`src/renderer/lib/radicle-provider.js`](https://github.com/solardev-xyz/freedom-browser/blob/main/src/renderer/lib/radicle-provider.js) |
| Authority: grants, validation, node calls | [`src/main/swarm/swarm-provider-ipc.js`](https://github.com/solardev-xyz/freedom-browser/blob/main/src/main/swarm/swarm-provider-ipc.js), [`src/main/radicle/radicle-provider-ipc.js`](https://github.com/solardev-xyz/freedom-browser/blob/main/src/main/radicle/radicle-provider-ipc.js) |

The main process re-checks every grant; the renderer's prompts are UX, not
the security boundary. Grants are keyed by the address-bar origin, which the
main process derives itself. Requests from pages to the local node API on
port 1633 are blocked, so pages reach the node only through the provider.

## Security model

- Context isolation is on and Node integration is off in web content.
- Privileged internal APIs are limited to trusted `freedom://` pages or the
  narrow provider surfaces above.
- Web permissions are denied by default and granted through per-site prompts.
- Nodes run locally by default; external endpoints are explicit per-profile
  settings.

File security findings publicly on GitHub; see [Community](community.html#security).
