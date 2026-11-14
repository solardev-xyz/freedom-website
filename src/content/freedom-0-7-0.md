---
title: Freedom 0.7.0: wallet, identity and Swarm publishing
description: Freedom 0.7.0 adds an experimental wallet and identity system, dApp connections, Swarm publishing and a Linux AppImage.
---

# Freedom 0.7.0: wallet, identity and Swarm publishing

*19 April 2026*

Freedom 0.7.0 turns the browser from read-only into something you can publish and pay with. An experimental Identity & Wallet system, dApp connections through `window.ethereum`, Swarm publishing from a connected Bee node, and a Linux AppImage land together.

## New

- Experimental Identity & Wallet (Settings > Experimental):
  - Password-protected vault with auto-lock
  - Touch ID quick-unlock on macOS
  - Multiple wallets and accounts, with Ethereum and Gnosis Chain support
  - A Publisher Identities screen
  - Configurable ENS RPC
- dApp connections via an injected EIP-1193 `window.ethereum` provider, announced via EIP-6963:
  - Per-origin permission grants with a connection banner and management screen
  - Dedicated approval screens for message signing and transactions, with optional auto-approve
- `ethereum:` URI scheme (EIP-681): links can pre-fill the wallet Send screen for native-asset sends
- Swarm publishing from a connected Bee node:
  - `freedom://publish` setup with a readiness checklist and funding actions (chequebook deposit, CowSwap swap-to-xBZZ)
  - Stamp manager with batch list, purchase and extension
  - Publish history
  - Experimental `window.swarm` dApp provider with publish and feed journal APIs, gated by per-origin approval
- Wallet Send accepts ENS names (`.eth`, `.box`, subdomains) and shows the recipient's verified primary ENS name on the review screen
- Bee can run in light mode (previously ultra-light only)
- Linux AppImage distribution

## Improved

- ENS resolution uses the Universal Resolver: fewer RPC round-trips on cold-cache `.eth` / `.box` navigation; names normalized per ENSIP-15
- Settings move from a modal to a full `freedom://settings` page
- Toolbar icons, nodes menu and experimental settings polished for consistency
- Bundled nodes updated: Bee 2.7.0 to 2.7.1, Kubo 0.39.0 to 0.40.1, Radicle 1.6.1 to 1.8.0
- Electron upgraded to 41

## Fixed

- IPFS sites using `_redirects` resolve correctly

## Links

- [Changelog](https://github.com/solardev-xyz/freedom-browser/blob/release/0.7.0/CHANGELOG.md)
- Source tag on [GitHub](https://github.com/solardev-xyz/freedom-browser/tree/v0.7.0) and [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE)
