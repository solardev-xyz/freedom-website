---
title: Freedom 0.6.1: first open-source release
description: Freedom 0.6.1 is the first public open-source release, with keyboard shortcuts, DNS-over-HTTPS and security hardening.
---

# Freedom 0.6.1: first open-source release

*8 February 2026*

Freedom 0.6.1 is the first public open-source release.

It adds everyday keyboard shortcuts, a bookmark bar that remembers your preference, an About panel, and DNS-over-HTTPS for more reliable dnsaddr and DNSLink lookups. Soft and hard reload are split, IPFS discovery moves to delegated routing, and a round of fixes and security hardening land with it.

## New

- Keyboard shortcuts: Ctrl+PgUp/PgDn to switch tabs, Ctrl+Shift+PgUp/PgDn to reorder them, Ctrl+F4 to close a tab, Ctrl+Shift+T to reopen closed tabs, Ctrl+Shift+B to toggle the bookmark bar, F11 for fullscreen and F12 for DevTools
- A bookmark bar toggle that persists to settings and always shows on the new tab page
- An About panel with version, copyright, credits, website and app icon
- DNS-over-HTTPS resolvers (Cloudflare DoH and eth.limo) for dnsaddr and DNSLink resolution
- ESLint, Prettier and EditorConfig for consistent formatting

## Improved

- Reload is split into soft (Ctrl+R, uses cache) and hard (Ctrl+Shift+R, bypasses cache); the toolbar reload button defaults to soft, Shift+click for hard
- IPFS content discovery switches from DHT to delegated routing via cid.contact

## Fixed

- The address bar stays focused after you pick an autocomplete suggestion
- Unreadable pages in dark mode get light background and text defaults when the page itself does not support dark mode
- ENS resolution replaces broken RPC providers and fixes failed handle cleanup
- View-source updates the address bar and title correctly
- IPFS routing and DNSLink resolution on networks with broken or slow local DNS

## Security

- Content Security Policy headers on all internal HTML pages
- Validation of IPFS CIDs, IPNS names and malformed `bzz://` requests
- Hardened webview preferences, `freedomAPI` limited to internal pages, tighter local API CORS and IPC base URLs, and redacted logged URLs
- All npm audit vulnerabilities resolved (11 total)
- Dependencies updated, including Electron 39 to 40

## Links

- [Changelog](https://github.com/solardev-xyz/freedom-browser/blob/main/CHANGELOG.md#061---2026-02-08)
- Source on [GitHub](https://github.com/solardev-xyz/freedom-browser) and [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE)
