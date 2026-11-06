---
title: Build on Radicle
description: Build code-collaboration dapps on Radicle in Freedom Browser: read public repositories with rad: URLs and seed, sync and write issues and comments with window.radicle, through the user's own Radicle node.
kick: Radicle
dek: Read public repositories with a plain fetch('rad:…'), and write issues and comments as the user with window.radicle. A full forge client needs no server.
---

If the user enables it, Freedom Browser runs a Radicle node inside the
browser. Pages use it in two ways: the [`rad:` URL scheme](rad-urls.html)
for reads, and [`window.radicle`](radicle.html) for everything that needs
consent. Canopy, a GitHub-style forge served from Swarm, is built exactly
this way.

## Reads and writes

<div class="card-grid">
<div class="dcard">
<h3>Reads: rad: URLs</h3>
<p>Any page, including one served from <code>bzz://</code>, can <code>fetch()</code> repository metadata, trees, files, commits, issues and patches as JSON from the user's own node. No prompt, no connection, no API key.</p>
<p><span class="badge community">rad: fetch</span></p>
</div>
<div class="dcard">
<h3>Writes: window.radicle</h3>
<p>Seed and sync repositories, disclose the user's Radicle identity, and write issues, comments, issue state changes and patch comments, each gated by the user's consent and scoped to the page's origin.</p>
<p><span class="badge community">window.radicle</span></p>
</div>
</div>

## Start here

<div class="card-grid">
<div class="dcard">
<h3><a href="guide-radicle.html">Radicle repos and issues</a></h3>
<p>Read a repository, get it onto the user's node, and write issues and comments as the user.</p>
</div>
<div class="dcard">
<h3><a href="radicle.html">window.radicle reference</a></h3>
<p>Provider object, events, errors, permission tiers, input rules and every method.</p>
</div>
<div class="dcard">
<h3><a href="rad-urls.html">rad: URLs reference</a></h3>
<p>URL forms, routes, pagination and filters, and error bodies.</p>
</div>
</div>

Two guides apply to Swarm as well and live in the Overview tab:
[Permissions and identity](guide-permissions.html) and
[Errors and node readiness](guide-errors.html).

## Related demos

<div class="card-grid">
<div class="dcard">
<h3>Canopy</h3>
<p>A GitHub-style forge for the Radicle network, served from Swarm and powered by the user's own node.</p>
<p><span class="badge community">rad: fetch</span> <span class="badge community">window.radicle</span></p>
<p class="dcard-links"><a href="demos.html#canopy">In Demos</a></p>
</div>
</div>

[radicle-index-service](demos.html#ecosystem-tooling), which indexes the
Radicle network and publishes the index to Swarm, is listed under ecosystem
tooling.
