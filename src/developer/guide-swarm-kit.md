---
title: swarm-kit
description: swarm-kit is a TypeScript library of higher-level data structures over Freedom's window.swarm provider: records, feeds, hash chains, multi-writer feeds, encryption and live messaging.
kick: Guide
dek: A library of reusable data structures on top of window.swarm, from JSON chunks to multi-writer feeds and live chat rooms. Early prototype, not on npm yet.
source: https://github.com/solardev-xyz/swarm-kit
---

[swarm-kit](https://github.com/solardev-xyz/swarm-kit) turns the provider's
low-level chunk and single-owner-chunk calls into structures apps need. It
only talks to `window.swarm`, so Freedom stays in charge of permissions,
signing, postage and limits. It is not a Bee client and does not run against
a plain node.

<p><span class="badge proposal">Early prototype</span> The package is marked
<code>private</code> in its <code>package.json</code> and is not published to
npm. Expect API changes.</p>

## Get it

```sh
git clone https://github.com/solardev-xyz/swarm-kit.git
cd swarm-kit
npm install
npm run typecheck && npm test
npm run build
```

`npm run build` compiles the library to `dist/` and also writes a
self-contained browser bundle, `swarm-kit.js`, into each folder under
`examples/`. The examples import it directly:

```javascript
import { createSwarmKit, waitForSwarm } from './swarm-kit.js';
```

The simplest way to use swarm-kit in your own page is the same: copy one of
those bundles next to your HTML. If you use a bundler, the package's
`prepare` script builds `dist/` on install, so a git dependency should work,
but the project does not document that route.

## Basic use

```javascript
import { createSwarmKit, waitForSwarm } from './swarm-kit.js';

const provider = await waitForSwarm({ requireFreedomBrowser: true });
const kit = createSwarmKit(provider);

await kit.requestAccess();
const chunk = await kit.chunks.publishJson({ hello: 'swarm' });
console.log(await kit.chunks.readJson(chunk.reference));
```

`createSwarmKit(window.swarm)` is equivalent; the provider is wrapped in a
byte-oriented driver either way.

## What is in it

| Need | Use |
| ---- | --- |
| Small immutable values | `kit.chunks` (one content-addressed chunk) |
| Larger immutable values | `kit.objects` (split across chunks) |
| Values at a key you choose | `kit.soc`, with `deriveIdentifier` for namespaced identifiers |
| An append-only stream | `createIndexedSocStream`, `kit.hashChain` |
| A revisioned record or lookup table | `kit.records`, `kit.lookup` |
| Reads by time | `kit.epochFeed` |
| Many writers, one view | `kit.multiWriterFeed` |
| Revisioned documents | `kit.did` |
| Encryption and signatures | `kit.crypto` (AES-GCM, P-256 ECDH), `kit.signedDocuments` (P-256 and Ethereum wallets) |
| Sealed values | `kit.commitReveal` |
| Real time | `kit.live.topic`, `kit.live.bus`, `kit.live.inbox`, `kit.live.multiWriterFeed` |
| Checking a provider | `runSwarmProviderCompliance` |

The full map, with examples for each, is in the
[README](https://github.com/solardev-xyz/swarm-kit#primitive-map).

Two rules the library builds on:

- **Single-owner chunk identifiers are write-once.** Writing the same owner and
  identifier twice is undefined at the network layer, so append-only
  structures use a fresh, deterministic identifier per entry.
- **Live messaging is a hint.** The `kit.live.*` primitives need
  `features.includes('messaging')`. Delivery is best-effort, unordered,
  at-least-once and unauthenticated; durable Swarm structures are the source
  of truth. Prefer one `kit.live.bus` per app over a topic per widget, since
  subscriptions are bounded node-wide. See [Live messaging](guide-messaging.html).

## Run the examples locally

Each example has a dev server that serves it on `127.0.0.1`. Open the URL in
Freedom Browser, which injects the real `window.swarm`:

| Command | Example | Default port | Port variable |
| ------- | ------- | ------------ | ------------- |
| `npm run dev:playground` | Playground (epoch feeds and more) | 4173 | `SWARM_KIT_SMOKE_PORT` |
| `npm run dev:provider-compliance` | Provider compliance checks | 4175 | `SWARM_KIT_PROVIDER_COMPLIANCE_PORT` |
| `npm run dev:test-center` | Swarm Provider Test Center | 4176 | `SWARM_KIT_TEST_CENTER_PORT` |
| `npm run dev:chat` | Live chat | 4177 | `SWARM_KIT_CHAT_PORT` |

`PORT` and `HOST` override any of them, for example
`PORT=4174 npm run dev:playground`. To deploy an example instead, run
`npm run build`, upload its folder to Swarm and open the `bzz://` URL.

The compliance page writes small test chunks and checks the provider
behaviours swarm-kit relies on. Run it when you suspect a provider bug.

### Chat across two identities

The chat example suggests opening the same room in a second Freedom profile,
with its own node and identity. Today every profile's Swarm node uses the
same local API port, so two profiles cannot run at the same time
([#993](https://github.com/solardev-xyz/freedom-browser/issues/993)). Until
that is fixed, use a second machine.
