---
title: Freedom 0.8.5: the daily-driver release
description: Freedom 0.8.5 is the first release you can use as your only browser.
image: images/freedom-0.8.5-screenshot.png
---

# Freedom 0.8.5: the daily-driver release

*10 September 2026*

<figure>
  <img src="images/freedom-0.8.5-screenshot.png" alt="Freedom 0.8.5">
  <figcaption>Freedom 0.8.5 — now coming with Ethereum and Tor nodes</figcaption>
</figure>

Freedom 0.8.5 is the first release you can use as your only browser.

When we introduced Freedom in January it was read-only and narrow by design: a way to reach Swarm and IPFS content directly, without gateways. It has since learned to publish, it has a wallet and an identity, and its code has been public since February. What it lacked was everything else a browser has to do all day. 0.8.5 adds that.

## What a daily driver changes

A decentralized browser that you open only for `bzz://` links is a tool. A browser you keep open all day, that happens to speak Swarm, IPFS, Radicle, Ethereum and Tor natively, is something else: it puts the decentralized web on the same footing as the rest of the web, one address bar for both.

That is the point of Freedom, and it is why we care about the word freedom in a few specific senses:

- **Freedom to read.** Content from Swarm and IPFS arrives from peers, not through anyone's gateway. `.onion` addresses go through Tor. ENS and `.tez` names resolve from the chain. No operator sits between you and what you asked for.
- **Freedom to publish.** Swarm, IPFS and now Radicle repositories are writable from the browser. What you put there stays reachable as long as the network holds it, not as long as a company does.
- **Freedom to own.** Keys live with you: in the browser's vault, on a Ledger, on your phone, or in a Safe shared with people you choose. Payments and signatures happen without an account at a service.
- **Freedom to verify.** An app hosted in a contract shows you the chain, the block and the hash it was read from. A light client can prove that read against a chain head it synced itself.
- **Freedom from being watched.** Ad and tracker blocking is on by default. Private windows keep nothing. Sites ask before they use your camera, microphone or location.

None of this is new to 0.8.5 in principle. What is new is that you no longer have to give up a normal browser to have it.

## The everyday parts

Chrome's behaviour was the bar. These are meant to work the way you already expect, so this is a list, not a tour:

- Ad and tracker blocking, on by default, with a per-site allowlist. Filter lists update over Swarm.
- Find in page.
- A download manager, for web downloads and for `bzz://` and `ipfs://` content alike.
- Per-site permission prompts for camera, microphone, notifications, clipboard, location and MIDI.
- Private windows, with no wallet and no dApp providers inside them.
- Remappable keyboard shortcuts, and page zoom (thanks [@alexwbend](https://github.com/alexwbend)).
- Web search from the address bar and from a selection.
- Tab audio indicator and mute, background-tab clicks, a tab strip that scrolls, menus that scroll.

If any of these behave differently from Chrome, that is a bug, and we would like to hear about it.

## The decentralized parts

- **Apps hosted in a contract.** `web3://<address>/` renders what the contract returns. A shield in the address bar reports chain, block, contract and content hash, and whether the read was verified.
- **Radicle repositories in the browser.** Open a `rad:` URL, browse at any commit, file issues and patches. Radicle now runs embedded, with no separate processes and no local port.
- **Myotis.** An experimental peer-to-peer light client for Ethereum and Gnosis by [@biafra23](https://github.com/biafra23), off by default. Reads are proven against a chain head it syncs from peers.
- **Three new account types.** Ledger, phone accounts over Open Lavatory, and Safe multi-owner accounts on Gnosis. All work with the vault locked, for dApp signing and sends; Ledger and phone accounts also pay x402 requests.
- **Tor for `.onion`.** A bundled Arti client, off by default, in every macOS, Linux and Windows build. Clearnet traffic never touches it.
- **`.tez` names**, encrypted messaging for Swarm apps, and app manifests that turn a series of permission prompts into one decision.

## Under the hood

Electron 44 with Chromium 152. Installers about 15 MB smaller. Ant 0.5.44 as the bundled Swarm node. Three security fixes, two dozen smaller fixes, and a screenshot-based UI check that now runs on every pull request touching the interface. The [changelog](https://github.com/solardev-xyz/freedom-browser/blob/release/0.8.5/CHANGELOG.md) has all of it.

## Try it

Download 0.8.5 for macOS, Linux and Windows from [freedom.baby](https://freedom.baby). The code is on [GitHub](https://github.com/solardev-xyz/freedom-browser).

If you have been waiting for Freedom to be usable as your main browser, this is the release to try. Report what breaks at [t.me/freedom_browser](https://t.me/freedom_browser).
