---
title: Freedom 0.7.2: Colibri ENS verification
description: Freedom 0.7.2 makes cryptographic ENS verification via Colibri the default, and unifies chains and RPC endpoints in one network registry.
---

# Freedom 0.7.2: Colibri ENS verification

*24 May 2026*

Freedom 0.7.2 switches default ENS resolution to cryptographic verification with Colibri, and gathers chains, RPC endpoints and providers into one network registry.

## New

- Cryptographic ENS verification via Colibri as the new default resolution path:
  - Forward and reverse lookups verified locally rather than trusted across public RPCs
  - The address-bar shield popover distinguishes Colibri verification from quorum verification
  - A verification mark next to cryptographically verified recipient names on the wallet send review screen
  - A warning when a recipient address claims an ENS name that doesn't forward-verify
  - Reload on an ENS page re-runs verification under the current method (hard reload also bypasses the 15-minute cache)
  - Settings > ENS Resolution: choose between Colibri, the public-RPC quorum, or your own RPC
- Unified network registry as the single source for chains, RPC endpoints, prover endpoints and keyed RPC providers:
  - Settings > Chains: per-chain endpoint list across your RPCs, commercial keyed providers and public RPCs
  - Add a chain via the chainlist.org catalogue or by hand
  - Settings > RPC Providers: manage Alchemy / Infura / DRPC API keys
- Destination URL preview on link hover, shown in the bottom-left like Chrome and Firefox

## Improved

- Default ENS resolution changed from public-RPC quorum to Colibri (custom-RPC users keep their direct-RPC-first path)
- Wallet, ENS and the Bee node manager all read chains and RPC endpoints from the unified network registry

## Fixed

- Address-bar copy and paste work as expected on all platforms

## Security

- Swarm dApp provider permission prompts key on the committed page URL, not on the address-bar draft
- Electron updated from 41.5.0 to 41.7.0; Radicle from 1.8.0 to 1.9.1; other runtime dependencies refreshed
- `ws` overridden under `ethers` to clear an uninitialised-memory disclosure

## Links

- [Changelog](https://github.com/solardev-xyz/freedom-browser/blob/release/0.7.2/CHANGELOG.md)
- Source tag on [GitHub](https://github.com/solardev-xyz/freedom-browser/tree/v0.7.2) and [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE)
