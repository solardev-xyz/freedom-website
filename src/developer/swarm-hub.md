---
title: Build on Swarm
description: Build serverless dapps on Swarm in Freedom Browser with window.swarm: publish, read chunks and feeds, sign and message through the user's own Swarm node. Quickstart, guides, API reference and demos.
kick: Swarm
dek: window.swarm gives every page a consented line to the user's own Swarm node. Publish, keep state in feeds, sign and message, with no gateway, server or API key.
---

Freedom Browser runs a Swarm node inside the browser, and
[`window.swarm`](swarm.html) is how a page uses it. It is Freedom's
implementation of the provider API proposed in
[SWIP #94](https://github.com/ethersphere/SWIPs/pull/94), so what you build
here targets an open standard rather than one browser.

## Why build on window.swarm

<div class="card-grid">
<div class="dcard">
<h3>The user's node is the backend</h3>
<p>Pages publish and read through the user's own Swarm node. It is the only way a page reaches the node: the node's local HTTP API is blocked for web content.</p>
</div>
<div class="dcard">
<h3>Consent per origin</h3>
<p>Grants belong to the address-bar origin and come in tiers, from connecting to publishing, feeds, messaging and signing. Limits and read budgets are enforced by the browser.</p>
</div>
<div class="dcard">
<h3>Mutable state on immutable storage</h3>
<p>Feeds give your app a stable, signed pointer to the latest version of its content, or an append-only log of entries.</p>
</div>
<div class="dcard">
<h3>Real time without servers</h3>
<p>GSOC rooms and encrypted PSS direct messages deliver live updates through the user's node, while feeds stay the source of truth.</p>
</div>
<div class="dcard">
<h3>An open standard</h3>
<p>Every method in the reference carries a SWIP #94 status badge, and swarm-kit's provider-compliance example checks an implementation against the draft.</p>
</div>
</div>

## Start here

<div class="card-grid">
<div class="dcard">
<h3><a href="quickstart.html">Quickstart</a></h3>
<p>From an empty HTML file to an app served from Swarm: detect Freedom, connect, publish, keep state in a feed, deploy.</p>
</div>
<div class="dcard">
<h3><a href="guide-feeds.html">Feeds and mutable content</a></h3>
<p>A stable URL for changing content, append-only data logs, and reading other users' feeds.</p>
</div>
<div class="dcard">
<h3><a href="guide-messaging.html">Live messaging</a></h3>
<p>GSOC broadcast rooms, encrypted PSS direct messages, subscriptions, and how to combine them with durable data.</p>
</div>
<div class="dcard">
<h3><a href="guide-swarm-kit.html">swarm-kit</a></h3>
<p>Higher-level data structures over <code>window.swarm</code>: records, feeds, hash chains, multi-writer feeds, encryption and live messaging.</p>
</div>
<div class="dcard">
<h3><a href="swarm.html">window.swarm reference</a></h3>
<p>Every method, error, permission tier and limit, with its SWIP #94 status.</p>
</div>
</div>

## Before you publish

Publishing spends postage, so the user's node needs storage first. If it has
none, Freedom opens its publish setup for the user the first time a page
tries to publish; reads work without it. The
[Quickstart](quickstart.html) walks through this, and the reference lists the
readiness errors (`node-not-ready`, `ultra-light-mode`, `no-usable-stamps`)
under [Errors](swarm.html#errors) and the size and rate caps under
[Limits](swarm.html#limits).

Two guides apply to Radicle as well and live in the Overview tab:
[Permissions and identity](guide-permissions.html) and
[Errors and node readiness](guide-errors.html).

## Related demos

<div class="card-grid">
<div class="dcard">
<h3>Swarmit</h3>
<p>Discussion boards on Swarm, ranked by curator feeds.</p>
<p><span class="badge community">window.swarm</span> <span class="badge community">window.ethereum</span></p>
<p class="dcard-links"><a href="demos.html#swarmit">In Demos</a></p>
</div>
<div class="dcard">
<h3>Freedom Community</h3>
<p>Communities on Swarm: members write to their own feeds; a steward is woken by a GSOC doorbell.</p>
<p><span class="badge community">window.swarm</span> <span class="badge community">GSOC</span></p>
<p class="dcard-links"><a href="demos.html#freedom-community">In Demos</a></p>
</div>
<div class="dcard">
<h3>swarm-kit examples</h3>
<p>Chat over PSS and GSOC, a playground for every data structure, and provider compliance checks.</p>
<p><span class="badge community">window.swarm</span> <span class="badge community">swarm-kit</span></p>
<p class="dcard-links"><a href="demos.html#swarm-kit-examples">In Demos</a></p>
</div>
</div>
