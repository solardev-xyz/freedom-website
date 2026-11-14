---
title: Freedom 0.8.0: Ant, freedom-ipfs and profiles
description: Freedom 0.8.0 replaces Bee and Kubo with in-house Ant and freedom-ipfs nodes, and adds multiple profiles side by side.
---

# Freedom 0.8.0: Ant, freedom-ipfs and profiles

*2 July 2026*

Freedom 0.8.0 swaps the bundled Swarm and IPFS nodes for in-house Rust implementations built with mobile in mind, and lets you run multiple profiles side by side.

## New

- In-house Rust implementations of the bundled Swarm and IPFS nodes, built for the upcoming mobile apps (smaller binaries, bounded memory, and room for specialised node features on every platform)
- [Ant](https://github.com/freedom-hq/ant) 0.5.33, a lean Swarm light node, replaces bundled Bee:
  - Full Bee parity: retrieval, feeds, stamp purchase, publishing and chequebook payments
  - Instant publishing setup (no lengthy Gnosis chain-state download)
  - Node data and Swarm identity migrate in place on first launch
- [freedom-ipfs](https://github.com/solardev-xyz/freedom-ipfs) 0.4.3, a retrieval-only IPFS implementation, replaces bundled Kubo:
  - The node runs inside the browser process instead of as a separate daemon
  - No standing peer connections; it connects when IPFS content loads
  - IPFS load progress in the status bar (Settings > Experimental)
- Multiple profiles with separate tabs, history, settings, wallet, identities and nodes, running side by side in separate windows:
  - Profiles flyout in the browser menu, a native Profiles menu and a `freedom://profiles` manager page
  - Existing data carries over as the first profile on upgrade
- Prompt to adopt system Swarm or Radicle nodes found on their default ports as external nodes
- `.wei` and `.gwei` name resolution alongside ENS, for navigation and wallet recipients
- "Tabs in title bar" setting on Linux, off by default (thanks [@agazso](https://github.com/agazso))

## Improved

- Freedom-managed nodes use dedicated ports (Ant 11633, Radicle 18780), leaving the ecosystem defaults (1633, 8780) to system nodes
- Internal `freedom://` pages (History, Settings, Profiles) open as singleton tabs, focusing the existing tab instead of duplicating it

## Removed

- Local Kubo API and gateway ports (5001, 8080); the embedded IPFS node exposes no local endpoints

## Fixed

- Opening an `ipfs://` or `ipns://` page with the IPFS node stopped shows a friendly error page instead of raw JSON
- Swarm publishing setup: Swap xDAI to xBZZ opens the swap flow again instead of the wallet receive screen
- ENS resolution falls back to the public-RPC quorum during Colibri prover or network outages
- Radicle peer discovery follows the community seeds' move to radicle.network
- The Linux taskbar and dock show the Freedom icon instead of a generic placeholder

## Security

- Electron updated from 41.7.1 to 43.0.0 (Chromium 150, Node 24.17); other runtime and build dependencies refreshed

## Links

- [Changelog](https://github.com/solardev-xyz/freedom-browser/blob/release/0.8.0/CHANGELOG.md)
- Source tag on [GitHub](https://github.com/solardev-xyz/freedom-browser/tree/v0.8.0) and [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE)
