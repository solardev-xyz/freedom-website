---
title: Freedom 0.7.1: verified ENS and native dweb schemes
description: Freedom 0.7.1 verifies ENS across multiple public RPCs and loads Swarm and IPFS under native bzz://, ipfs:// and ipns:// schemes.
---

# Freedom 0.7.1: verified ENS and native dweb schemes

*7 May 2026*

Freedom 0.7.1 makes ENS resolution check several public RPCs before you navigate, and moves Swarm and IPFS onto native `bzz://`, `ipfs://` and `ipns://` schemes.

## New

- ENS resolution verified across multiple public RPCs:
  - A verification shield in the address bar; clicking it opens a popover with the full resolved URI and per-provider answers
  - An interstitial confirmation page when a resolution can't reach quorum, gated by "Block unverified ENS navigation" (on by default)
  - A "Cross-RPC verification" section in Settings exposing quorum parameters and toggles
  - An editable list of public Ethereum RPC providers in Settings

## Improved

- Swarm, IPFS and IPNS pages load under custom `bzz://`, `ipfs://` and `ipns://` standard schemes:
  - Origin is the scheme itself (`bzz://<hash>/`, `ipfs://<cid>/`, `ipns://<name>/`)
  - Sub-resources proxy through a main-process handler with retries
  - ENS-backed sites use the human-readable name as host, so storage origin stays stable across contenthash updates
- CIDv0 / base58btc inputs canonicalise to CIDv1 base32 / libp2p-key base36, so Chromium's lowercase host parsing no longer corrupts mixed-case encodings
- ENS names display under their resolved transport, with stricter scheme rules (mismatched transport schemes show an error; in-page ENS links must carry a scheme)
- Speculative gateway prefetch during ENS quorum waves for faster first paint on cold-cache lookups

## Fixed

- Bee's raw 404 JSON is suppressed during cold-content Swarm lookups; the spinner keeps running, and timeouts show the "Content not ready yet" page
- IPFS / IPNS loads on macOS no longer fail with "kubo gateway unreachable"

## Security

- Electron updated from 41.2.1 to 41.5.0 (latest Chromium 146 and Node 24 patches)
- Bundled nodes updated: Kubo 0.40.1 to 0.41.0; `@ethersphere/bee-js` 11.1.1 to 12.1.0

## Links

- [Changelog](https://github.com/solardev-xyz/freedom-browser/blob/release/0.7.1/CHANGELOG.md)
- Source tag on [GitHub](https://github.com/solardev-xyz/freedom-browser/tree/v0.7.1) and [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE)
