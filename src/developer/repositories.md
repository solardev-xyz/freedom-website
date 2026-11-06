---
title: Repositories
description: Where Freedom Browser's source lives: the GitHub repository, the Radicle mirror and its current lag, and the other open-source projects around the browser.
kick: Contribute
dek: Development happens on GitHub. A Radicle mirror exists but is behind. Around the browser sit the native cores, mobile apps, services and tools.
---

## Freedom Browser

| Where | Address | Status |
| ----- | ------- | ------ |
| GitHub | [solardev-xyz/freedom-browser](https://github.com/solardev-xyz/freedom-browser) | Where development, issues and pull requests happen |
| Radicle | `rad:z3QXuMvMmSeEX3ZgoUidZC1v5MkKE` ([view on radicle.network](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE)) | A mirror, currently behind |

**The Radicle mirror lags.** At the time of writing it is about four months
and roughly 2,700 commits behind GitHub's `main`. Bringing it up to date and
keeping it there is tracked in
[#1000](https://github.com/solardev-xyz/freedom-browser/issues/1000). Until that is done, clone from
GitHub and open issues and pull requests there.

You can still browse the mirror from Freedom itself: enable Radicle, seed the
repository and open `rad:z3QXuMvMmSeEX3ZgoUidZC1v5MkKE`.

## Native cores

| Repository | What it is |
| ---------- | ---------- |
| [ant](https://github.com/solardev-xyz/ant) | A lightweight Swarm light node in Rust; the Swarm node bundled with Freedom |
| [freedom-core](https://github.com/solardev-xyz/freedom-core) | Shared Rust core: keys, vault, signing, naming, profiles |
| [libradicle](https://github.com/solardev-xyz/libradicle) | Embeddable Radicle node (Rust) with a napi binding, used by Freedom's Radicle integration. Canonical home: `rad:z2SzCC9zYnP17QRPZUhrP2RTEwZHj` |
| [freedom-ipfs](https://github.com/solardev-xyz/freedom-ipfs) | The native IPFS addon |
| [heartwood](https://github.com/solardev-xyz/heartwood) | A mirror of Radicle's Heartwood protocol and stack |

## Mobile

| Repository | What it is |
| ---------- | ---------- |
| [freedom-browser-ios](https://github.com/solardev-xyz/freedom-browser-ios) | Freedom Browser for iOS |
| [freedom-browser-android](https://github.com/solardev-xyz/freedom-browser-android) | Freedom Browser for Android |
| [freedom-mobile-ffi](https://github.com/solardev-xyz/freedom-mobile-ffi) | Combined iOS Rust FFI: Swarm (Ant) and IPFS in one xcframework |
| [freedom-node-mobile](https://github.com/solardev-xyz/freedom-node-mobile) | An Android AAR embedding a Swarm and an IPFS node in one process |

## Services

| Repository | What it is |
| ---------- | ---------- |
| [freedom-adblock-service](https://github.com/solardev-xyz/freedom-adblock-service) | Builds Freedom's ad-block filter lists and publishes them to a signed Swarm feed |
| [radicle-index-service](https://github.com/solardev-xyz/radicle-index-service) | Indexes the Radicle network and publishes a signed, user-selectable index to Swarm |
| [freedom-bridge](https://github.com/solardev-xyz/freedom-bridge) | The wallet bridge page for signing with a phone |

## Apps, libraries and tools

| Repository | What it is |
| ---------- | ---------- |
| [swarm-kit](https://github.com/solardev-xyz/swarm-kit) | TypeScript data structures over `window.swarm`; see the [guide](guide-swarm-kit.html) |
| [canopy](https://github.com/solardev-xyz/canopy) | A GitHub-style forge for Radicle, served from Swarm |
| [pubrelay](https://github.com/solardev-xyz/pubrelay) | Peer-to-peer messaging on libp2p: rooms with synced history, live channels, browser nodes |
| [dscan](https://github.com/solardev-xyz/dscan) | A single-file Swarm reference scanner |
| [freemap](https://github.com/solardev-xyz/freemap) | A viewer for OpenStreetMap tiles hosted on Swarm |

All of them are under the [solardev-xyz](https://github.com/solardev-xyz/) organisation on GitHub. Each
has its own licence; check before you reuse code.
