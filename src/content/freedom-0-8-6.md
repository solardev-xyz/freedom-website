---
title: Freedom 0.8.6: external IPFS, ENSv2 readiness and settings search
description: Freedom 0.8.6 adds external IPFS nodes, ENSv2 readiness, settings search, Arch packages and a limit on repeated permission prompts.
---

# Freedom 0.8.6: external IPFS, ENSv2 readiness and settings search

*23 September 2026*

Freedom 0.8.6 lets you point at an external IPFS node, prepares for ENSv2, adds search in Settings, ships Arch `.pacman` packages, and stops sites from hammering permission prompts.

## New

- External IPFS node support (thanks [@ivanmmurciaua](https://github.com/ivanmmurciaua)):
  - Under Settings > Nodes
  - Your own gateway, or one detected on the standard local port
- Myotis keeps syncing after its built-in checkpoint expires:
  - A replacement needs agreeing independent sources and a local proof check
  - Progress, errors and Retry sync in the Nodes menu
- ENSv2 readiness:
  - DNS names such as `gregskril.com` as wallet recipients
  - Offchain names with every Name Resolution method
  - Per-chain addresses on chains other than Ethereum
- Settings search: a field in the Settings sidebar that finds a setting by its label or description; Enter or a click opens the matching row
- Limit on repeated permission prompts: three dismissals in a row block the site for the session, as in Chrome; shown in the address-bar indicator, where Remove lifts it
- Arch Linux `.pacman` packages for x64 and arm64, next to the AppImage and deb, with in-app updates (thanks [@jwahdatehagh](https://github.com/jwahdatehagh))

## Improved

- Myotis re-syncs from scratch once after updating to this release

## Fixed

- Opening a Chrome Web Store page no longer crashes Freedom
- Quitting with the IPFS node running no longer crashes Freedom
- Camera and microphone work on macOS, and on sites like Google Meet that check before asking
- Visiting a site no longer fetches its page a second time, without your cookies, to find its icon
- `Ctrl+W` on Windows and Linux closes the active tab instead of the whole window
- Removing a permission from the address-bar indicator no longer clears another window's session decisions
- Trust, permission and Radicle popovers close with the address-bar suggestions instead of staying over the page
- The Nodes menu no longer shows a Tor version while Tor is off
- A Swarm folder address without its trailing slash, or with a colon in its name, opens the folder
- A Settings address naming a missing section changes to the section shown; a link to a single chain opens that chain or says it is no longer configured
- Small plain-text files on IPFS open in the tab instead of downloading
- Myotis catches up on a fresh install instead of stalling, most often on Gnosis
- A transient Gnosis RPC error no longer makes the Swarm node lose a paid postage batch or deploy a second chequebook

## Security

- Back and Forward re-check an ENS name's verification instead of restoring the verdict from the first visit
- Offchain ENS lookups reach only public HTTPS gateways, within time and size limits
- Bundled Ant 0.5.44 to 0.5.45 and Myotis 0.1.7 to 0.1.11; Electron 44.3.0 to 44.4.5 and other runtime dependencies refreshed

## Links

- [Changelog](https://github.com/solardev-xyz/freedom-browser/blob/release/0.8.6/CHANGELOG.md)
- [GitHub Release](https://github.com/solardev-xyz/freedom-browser/releases/tag/v0.8.6)
- Source on [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE)
