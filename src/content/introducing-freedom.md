---
title: Introducing Freedom
description: Freedom is a minimalist browser for the decentralized web, connecting directly to Swarm and IPFS without centralized gateways.
image: images/freedom-0.6.0-screenshot.png
---

# Introducing Freedom

*1 January 2026*

<figure>
  <img src="images/freedom-0.6.0-screenshot.png" alt="Freedom 0.6.0">
  <figcaption>Freedom 0.6.0 — connected to Swarm and IPFS</figcaption>
</figure>

Today we’re sharing the first public preview of **Freedom**, a minimalist browser built specifically for the decentralized web.

Freedom is designed for Swarm and IPFS. It allows you to enter hashes, CIDs, or ENS names directly into the address bar and loads content by connecting straight to peers. There are no centralized gateways involved in content delivery.

Instead of routing requests through third-party infrastructure, Freedom runs local Swarm and IPFS nodes and participates in the networks itself. When you use it, you are not just accessing decentralized content — you are actively contributing to the health and resilience of the network.

## Why Freedom exists

Despite years of progress, much of today’s “decentralized” browsing still depends on centralized gateways. These gateways are convenient, but they quietly reintroduce points of control, failure, and observation.

Freedom takes a different approach.

It treats decentralized networks as first-class systems rather than fallbacks. Swarm and IPFS are not accessed *through* the web — they are accessed *directly*. The browser behaves less like a client of a service and more like a piece of network infrastructure.

This has a few important consequences:

- No single operator sits between you and the content  
- Availability improves as more users participate  
- The network grows stronger through use, not abstraction  

ENS resolution today cannot yet be fully trustless without running a full Ethereum node. Freedom treats this as a temporary limitation and tracks progress in decentralized smart-contract validation and verification closely.

Freedom is intentionally minimal. It does not try to replace your everyday browser or reinvent the web. Its focus is narrow by design: making decentralized content usable without compromise.

## About this release

This is a **preview release**.

It is stable enough to explore and use, but it is not yet a complete browser. The work so far has focused on correctness, simplicity, and direct network access rather than feature breadth.

At this stage, Freedom is intentionally **read-only**. It allows you to browse decentralized content, but not yet to publish or upload it.

The codebase is not open source yet. Before opening it up, the next step is a round of auditing and cleanup to ensure that what is released publicly is easy to understand, build on, and maintain. Open sourcing Freedom is a priority and will follow shortly.

Freedom already behaves like a full browser — tabs, navigation, history, and bookmarks work as expected — but the emphasis so far has been on decentralized access rather than completeness.

## What comes next

Freedom is designed around a longer-term goal: **read, write, own**.

Browsing decentralized content is only the first step. The next phase will add publishing and upload functionality, allowing users not just to consume content, but to actively participate in decentralized networks.

Beyond that, Freedom will integrate wallet and cryptographic identity functionality. The aim is to make ownership — of content, identity, and presence — a native part of the browsing experience, rather than an external extension or afterthought.

Freedom is built to be network-agnostic by design. While the current focus is on Swarm and IPFS, other decentralized storage and replication systems are being evaluated. Some networks, such as Arweave or Hypercore-based systems, raise different trade-offs around verification, resource usage, and trust assumptions. Support for additional networks will depend on whether they can be integrated without undermining the principles of local operation and minimized trust.

As with the current release, progress will be deliberate. Features will be added only where they strengthen the core idea, not where they dilute it.

## Getting involved

Development is happening in the open, and feedback from early users matters.

If you’d like to follow development, discuss design and technical decisions, or share feedback with other early users, there is a small Telegram group at:

https://t.me/freedom_browser

To try Freedom yourself, download the preview release from the website:

https://freedombrowser.eth.limo

Freedom is an experiment in taking decentralized networks seriously — not as an add-on to the web, but as a foundation.

If that idea resonates, you’re exactly who this browser is for.
