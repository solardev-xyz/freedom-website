---
title: Freedom 0.7.4: pay as you browse with x402
description: Freedom 0.7.4 adds native x402 payments from the built-in wallet, Swarm publisher identities and chunk-level window.swarm methods.
---

# Freedom 0.7.4: pay as you browse with x402

*1 June 2026*

Freedom 0.7.4 lets you pay as you browse with native x402 support from the built-in wallet, and adds Swarm publisher identities so you can choose which identity signs what you publish.

## New

- Native x402 payment support — pay as you browse, straight from the built-in wallet:
  - An approval card with optional per-origin auto-pay caps
  - Transparent subresource payments, no x402 SDK required
  - Payment history at `freedom://payments` and in the wallet sidebar
- Swarm publisher identities — pick which identity signs the content you publish:
  - Use a browser EVM wallet as a publisher identity, alongside the existing app and Bee-node identities
  - Manage identities and choose one from a selector when publishing
- `window.swarm` gains chunk-level read and write methods for dApps

## Fixed

- Setting up a wallet publisher identity on Windows no longer fails with an EPERM error

## Security

- Electron updated from 41.7.0 to 41.7.1; Colibri and other dependencies refreshed

## Links

- [Changelog](https://github.com/solardev-xyz/freedom-browser/blob/release/0.7.4/CHANGELOG.md)
- Source tag on [GitHub](https://github.com/solardev-xyz/freedom-browser/tree/v0.7.4) and [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE)
