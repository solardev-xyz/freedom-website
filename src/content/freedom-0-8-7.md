---
title: Freedom 0.8.7: Swarm browsing credit and a pop-up blocker
description: Freedom 0.8.7 adds Swarm browsing credit, a pop-up blocker, simpler Swarm publishing payments and a large round of fixes and security work.
---

# Freedom 0.8.7: Swarm browsing credit and a pop-up blocker

*8 October 2026*

Freedom 0.8.7 adds browsing credit for the Swarm node so you can pay peers for faster downloads and for uploads, a pop-up blocker, and a simpler one-payment publishing flow on Swarm. Settings are regrouped to match Chrome's order, and a large set of freezes, platform and security fixes lands with it.

## New

- Browsing credit for the Swarm node: pay peers for faster downloads and for uploads
  - In the wallet's Nodes tab, with credit left and recent spend
  - Top up in xDAI, or switch paying peers off
- Swarm cache size and Clear cache under Settings > Nodes
- Pop-up blocker: one new tab per click or key press, with an address-bar icon to open a blocked pop-up or allow the site
- Update progress in the browser menu and under Settings > About Freedom
- Myotis warns when a network upgrade needs a newer Freedom

## Improved

- Publishing on Swarm takes one xDAI payment to your node:
  - Plans and upgrades priced in xDAI, paid from any wallet
  - New storage is immutable: once full, it takes no more uploads
- Settings regrouped into ten sections, in Chrome's order (Ad Blocking and Site Permissions under Privacy and security; Chains, RPC Providers and Name Resolution under Networks; Experimental renamed Advanced)
- Network sources named in plain words, with the technical name under Advanced
- The first profile can be deleted once another profile exists
- The Swarm node reads chain data through Freedom's chain sources instead of a single RPC
- Video and other large files on Swarm start playing sooner

## Removed

- Ankr from the default Ethereum and Gnosis Chain RPCs, as it now requires an API key

## Fixed

- Fewer stalls that freeze every window (proof checks, `web3://` apps, Radicle files, browsing history, ad blocking, the IPFS node, Swarm messaging, profiles and Bee-era upgrades)
- Sending a transaction no longer closes the browser while it confirms
- Links such as `magnet:` and `mailto:` offer to open their app
- YouTube video ads are blocked when ad blocking is on
- A page that closes itself closes its tab
- A local `file://` page can be bookmarked
- Remapped shortcuts no longer fire twice on German and other non-US keyboards
- The Windows tab strip no longer starts behind an empty gap
- A private window's address bar, find bar and bookmark fields stay readable in the light theme
- Tor, Radicle, Ant and Myotis start on Windows 11 without the Visual C++ Redistributable
- The Linux AppImage starts on Ubuntu 24.04 without `libfuse2`, and is 18 MB smaller
- On Wayland, Freedom's windows group under its launcher icon
- Tor starts on Macs without Homebrew's xz
- Offchain ENS names with a `.onion` gateway resolve over Tor; names with an offchain answer near the 4 MB limit keep resolving
- A log query matching too many logs fails with an error instead of a shortened answer
- The Nodes menu shows peers and bandwidth again for an external IPFS node
- Myotis answers verified reads within seconds of a cold start or recovery, keeps retrying through brief checkpoint outages, and no longer stays stuck after Freedom quits unexpectedly
- Myotis gas estimates use every transaction field; a refused transaction shows as not sent
- A `bzz://` address of raw data loads; one whose data isn't on Swarm fails sooner
- Swarm video no longer cuts off when loaded right after the node starts
- Swarm content loads within about half a minute of waking from sleep, not 15 minutes
- Large Swarm uploads no longer drop thousands of peer connections
- The Swarm node no longer dials peers' private network addresses

## Security

- Web pages can no longer use your Swarm node's local API (which could spend its funds); dApps using `localhost:1633` must switch to `window.swarm`
- `bzz://` pages can't upload or control the node
- The wallet signs only the exact transaction or message you approved; Touch ID keeps the vault password out of the browser window
- A hijacked page can't reach wallet, identity, permission or publishing functions
- Site-supplied titles, filenames and payment details show only as text on internal pages
- Packaged builds ignore debugging flags and load only their own app code
- Sites can't open network shares, directory servers or system settings panes
- A site gets a TLS client certificate only if you pick one, never in a private window
- macOS builds drop two code-signing exceptions
- A permission prompt can be answered only from its own window
- External Swarm and IPFS nodes can't set cookies on the pages they serve
- Bundled nodes updated (Ant 0.5.45 to 0.5.61, Arti 2.6.0 to 2.7.0, freedom-ipfs 0.4.3 to 0.4.5, libradicle 0.7.1 to 0.8.0, Myotis 0.1.11 to 0.1.14); Electron 44.4.5 to 44.7.0

## Links

- [Changelog](https://github.com/solardev-xyz/freedom-browser/blob/release/0.8.7/CHANGELOG.md)
- [GitHub Release](https://github.com/solardev-xyz/freedom-browser/releases/tag/v0.8.7)
- Source on [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE)
