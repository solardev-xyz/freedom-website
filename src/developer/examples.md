---
title: Examples
description: Open-source apps and example code that use Freedom Browser's window.swarm, window.radicle and rad: APIs, plus Swarm and Radicle tooling from the ecosystem.
kick: Examples
dek: Real apps to read, run and copy from. All of them are open source.
---

## Apps

<div class="card-grid">
<div class="dcard">
<h3>Canopy</h3>
<p>A GitHub-style forge for the Radicle network, served from Swarm and powered entirely by the user's own node. Reads repositories, issues and patches with <code>rad:</code> URLs and writes issues and comments with <code>window.radicle</code>.</p>
<p><span class="badge ext">rad: fetch</span> <span class="badge ext">window.radicle</span></p>
<p class="dcard-links"><a href="https://github.com/solardev-xyz/canopy">Repository</a></p>
</div>
<div class="dcard">
<h3>Swarmit</h3>
<p>Discussion boards on Swarm. Posts are immutable Swarm content announced on Gnosis Chain; curators index submissions and publish board and thread views as feeds, and readers pick their curator.</p>
<p><span class="badge ext">window.swarm</span> <span class="badge ext">window.ethereum</span></p>
<p class="dcard-links"><a href="https://github.com/flotob/swarmit">App</a> · <a href="https://github.com/flotob/swarmit-curator">Curator service</a></p>
</div>
<div class="dcard">
<h3>Freedom Community</h3>
<p>Communities on Swarm: a protocol, a reference steward and node deployment for Freedom Browser. Members write to their own feeds; the steward is woken by a GSOC doorbell.</p>
<p><span class="badge ext">window.swarm</span> <span class="badge ext">GSOC</span></p>
<p class="dcard-links"><a href="https://github.com/flotob/freedom-community">Repository</a></p>
</div>
</div>

## swarm-kit examples

The [swarm-kit](guide-swarm-kit.html) repository ships four example pages,
each a single `index.html` plus the library bundle. Run them with the
`npm run dev:*` commands in the guide, or upload a folder to Swarm.

| Example | What it shows |
| ------- | ------------- |
| [chat](https://github.com/solardev-xyz/swarm-kit/tree/main/examples/chat) | Rooms with durable history in a multi-writer feed, live delivery over GSOC (`kit.live.bus`, `kit.live.multiWriterFeed`) and encrypted direct messages over PSS (`kit.live.inbox`) |
| [epoch-feed-smoke](https://github.com/solardev-xyz/swarm-kit/tree/main/examples/epoch-feed-smoke) | The playground: a tab each for epoch feeds, objects, encryption, signed documents, records, DID documents, hash chains, multi-writer feeds, lookup and commit-reveal |
| [provider-compliance](https://github.com/solardev-xyz/swarm-kit/tree/main/examples/provider-compliance) | Contract checks against the real `window.swarm` |
| [test-center](https://github.com/solardev-xyz/swarm-kit/tree/main/examples/test-center) | Black-box diagnostics for Freedom Browser Swarm providers |

## Snippets in these docs

- [Quickstart](quickstart.html): connect, publish, a feed, deploy.
- [`window.swarm` example](swarm.html#example) and
  [`window.radicle` example](radicle.html#example).
- [rad: URLs](rad-urls.html): reading a repository's metadata, README and issues.

## Ecosystem tooling

These tools work with Swarm and Radicle data directly rather than through
Freedom's page APIs, so they are useful next to your app rather than as
templates for it.

| Project | What it is |
| ------- | ---------- |
| [radicle-index-service](https://github.com/solardev-xyz/radicle-index-service) | Indexes the Radicle network and publishes a signed, user-selectable index to Swarm |
| [dscan](https://github.com/solardev-xyz/dscan) | A single-file Swarm reference scanner: classify references, browse manifests and feeds, check chunk health. It reads from a Swarm gateway |
| [FreeMap](https://github.com/solardev-xyz/freemap) | A viewer for OpenStreetMap tiles hosted on Swarm, live at `bzz://freemap.eth/` |

Built something? Tell us in the [community](community.html) and we may add
it here.
