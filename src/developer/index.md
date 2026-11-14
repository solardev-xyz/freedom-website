---
title: Build dapps on your users' own nodes
description: Freedom Browser developer docs: build serverless dapps with window.swarm, window.radicle and rad: URLs, which publish, read, sign and message through the user's own Swarm and Radicle nodes.
kick: Overview
dek: Freedom gives every web page a consented line to the user's own Swarm and Radicle nodes. Your app publishes, reads, signs and messages without servers, gateways or API keys.
---

Freedom Browser runs a Swarm node and, if the user enables it, a Radicle
node inside the browser. Two page providers, [`window.swarm`](swarm.html)
and [`window.radicle`](radicle.html), plus the [`rad:` URL scheme](rad-urls.html)
let an ordinary web page use those nodes with the user's consent.

Building with an agent? Start at [`/llms.txt`](../llms.txt).

## Why build on Freedom

<div class="card-grid">
<div class="dcard">
<h3>Your user's node is the backend</h3>
<p>Pages publish, read and sign through the user's own Swarm and Radicle nodes. No servers, no gateways, no API keys, and no exposing the node's HTTP API to <code>localhost</code>.</p>
</div>
<div class="dcard">
<h3>Wallet-grade consent for data</h3>
<p>An EIP-1193-style API with origin-scoped grants and tiered prompts, from connecting to publishing, feeds, messaging and signing. Size limits and read budgets are enforced by the browser, not trusted to the page.</p>
</div>
<div class="dcard">
<h3>Serverless end to end</h3>
<p>Ship the app on <code>bzz://</code> or an ENS name, keep its state in Swarm feeds and single-owner chunks, and collaborate through Radicle issues and comments signed with the user's own identity.</p>
</div>
<div class="dcard">
<h3>Real time without servers</h3>
<p>PSS and GSOC messaging with <code>swarm_subscribe</code>, <code>swarm_sendPss</code> and <code>swarm_sendGsoc</code>, while durable Swarm structures stay the source of truth.</p>
</div>
<div class="dcard">
<h3>An open standard</h3>
<p><code>window.swarm</code> is proposed as <a href="https://github.com/ethersphere/SWIPs/pull/94">SWIP #94</a>, and swarm-kit's provider-compliance page checks an implementation against it.</p>
</div>
</div>

## Publish from a page in ten lines

```javascript
if (!window.swarm?.isFreedomBrowser) throw new Error('Open this page in Freedom');

await window.swarm.requestAccess();              // the user connects this site once

const { bzzUrl } = await window.swarm.publishData({
  data: '<!doctype html><h1>Hello from my own node</h1>',
  contentType: 'text/html',
});                                              // the user approves the publish

console.log(bzzUrl);                             // bzz://<reference>, open it in Freedom
```

The [Quickstart](quickstart.html) takes this further: feeds, reading, and
deploying your app to Swarm and ENS.

## Built with Freedom

<div class="card-grid">
<div class="dcard">
<h3>Canopy</h3>
<p>A GitHub-style forge for the Radicle network, served from Swarm and powered by the user's own node.</p>
<p><span class="badge community">rad: fetch</span> <span class="badge community">window.radicle</span></p>
<p class="dcard-links"><a href="https://github.com/solardev-xyz/canopy">Source on GitHub</a></p>
</div>
<div class="dcard">
<h3>Swarmit</h3>
<p>Discussion boards on Swarm: posts are Swarm content, announced on Gnosis Chain and ranked by curator feeds.</p>
<p><span class="badge community">window.swarm</span> <span class="badge community">window.ethereum</span></p>
<p class="dcard-links"><a href="https://github.com/flotob/swarmit">Source on GitHub</a></p>
<p class="dcard-links">In Freedom: <code>ens://app.swarmit.eth</code></p>
</div>
<div class="dcard">
<h3>swarm-kit chat</h3>
<p>A chat example built on swarm-kit's live messaging primitives over PSS and GSOC.</p>
<p><span class="badge community">window.swarm</span> <span class="badge community">messaging</span></p>
<p class="dcard-links"><a href="https://github.com/solardev-xyz/swarm-kit/tree/main/examples">Examples on GitHub</a></p>
</div>
</div>

More in [Demos](demos.html).

## Pick a protocol

<div class="card-grid">
<div class="dcard">
<h3><a href="swarm-hub.html">Swarm</a></h3>
<p>Publish, keep state in feeds, sign and message with <code>window.swarm</code>. Quickstart, guides for feeds, live messaging and swarm-kit, and the API reference.</p>
<p><span class="badge community">window.swarm</span></p>
</div>
<div class="dcard">
<h3><a href="radicle-hub.html">Radicle</a></h3>
<p>Read public repositories with <code>rad:</code> URLs and write issues and comments with <code>window.radicle</code>. A guide and both references.</p>
<p><span class="badge community">rad: fetch</span> <span class="badge community">window.radicle</span></p>
</div>
<div class="dcard">
<h3><a href="demos.html">Demos</a></h3>
<p>Open-source apps and example pages to read, run and copy from, tagged with the APIs they use.</p>
</div>
<div class="dcard">
<h3><a href="contributing.html">Contribute</a></h3>
<p>Work on the browser itself: setup, architecture, workflow, and issues <a href="open-issues.html">open for contribution</a>.</p>
</div>
</div>

## Shared guides

These apply to both providers:

- [Permissions and identity](guide-permissions.html): origin-keyed grants,
  permission tiers, manifests, and which key signs your data.
- [Errors and node readiness](guide-errors.html): user rejections, missing
  grants, node not ready, limits, and when to retry.
