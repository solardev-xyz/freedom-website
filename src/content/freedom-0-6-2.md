---
title: Freedom 0.6.2: Radicle in the browser
description: Freedom 0.6.2 adds experimental Radicle support on macOS and Linux, plus Swarm encrypted references.
---

# Freedom 0.6.2: Radicle in the browser

*1 March 2026*

Freedom 0.6.2 brings experimental Radicle into the browser on macOS and Linux, and adds support for Swarm encrypted references.

## New

- Experimental Radicle (decentralized Git hosting) on macOS and Linux:
  - Enable or disable it from Settings > Experimental
  - `rad://` URL handling across navigation and rewriting
  - Bundled Radicle node lifecycle and packaging
  - An integrated repo browser and a GitHub-to-Radicle import bridge
  - Automatic seeding of Freedom's canonical Radicle repository when the bundled node runs
- Swarm encrypted reference support in navigation and URL rewriting, including 64- and 128-character hex references

## Fixed

- `Cmd/Ctrl+L` reliably focuses the address bar even when web content has focus
- `Cmd/Ctrl+L` and Escape consistently close open menus and clear stale focus highlights
- Pinned tabs can no longer be closed through keyboard-accelerator close-tab actions

## Security

- Protocol-specific identifiers in IPC handlers and URL rewriting are validated to block malformed or malicious input

## Links

- [Changelog](https://github.com/solardev-xyz/freedom-browser/blob/v0.6.2/CHANGELOG.md)
- Source tag on [GitHub](https://github.com/solardev-xyz/freedom-browser/tree/v0.6.2) and [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE)
