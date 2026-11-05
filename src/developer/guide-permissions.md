---
title: Permissions and identity
description: How Freedom's consent model works for dapps: origin-keyed grants, permission tiers, permission manifests, and which key signs your feeds and chunks.
kick: Overview
dek: Grants belong to the address-bar origin, come in tiers, and can be requested up front with a manifest. Signing uses a publisher identity the user picks.
---

## Grants belong to the origin

Freedom keys every grant by the origin in the tab's address bar, which it
derives itself; `window.location` and anything else the page controls play
no part. The key ignores the path, and for ENS names it is the name itself:
`bzz://myapp.eth/x` and `ens://myapp.eth/#/y` share `myapp.eth`. The full
mapping is in the [reference](swarm.html#permission-tiers).

Two consequences for app design:

- **Serve from a name.** A `bzz://<reference>` origin is new on every deploy,
  so users would re-approve, and the feeds the old version created would
  belong to another origin. Under an ENS name, grants and feeds carry over.
- **Feed names are private to the origin.** Two apps both using a feed called
  `profile` get different topics. To read another app's feed, pass its
  `topic` and `owner` (see [Feeds](guide-feeds.html)).

## Tiers

| You call | The user sees |
| -------- | ------------- |
| A public read (`readChunk`, `readData`, `readFeedEntry`, `listFeeds`, …) | Nothing |
| `requestAccess` | The connect prompt, once per origin |
| A publish method | A prompt on every call, unless they chose "always allow" |
| The first feed or signing call | A prompt that grants the tier and picks the signing identity |
| The first messaging call | A prompt that grants messaging; then one per send unless "always allow" |

Every rejected prompt rejects your call with `4001`, and nothing is written
before the user approves. Ask in response to a user action, explain why
first, and do not re-prompt in a loop after a `4001`.

The user can disconnect your origin at any time. Disconnecting withdraws all
grants and auto-approvals and closes subscriptions; you get a `disconnect`
event (check `origin`), and later calls fail with `4100`. Treat `4100` as the
source of truth rather than relying on events. The origin's publisher identity survives a disconnect, so its feeds
stay writable after the user reconnects.

## Ask once with a manifest

A `bzz://` app can ship a `freedom-manifest.json` at its root naming the
capabilities it needs, each with a short `why`. When the page calls
`requestAccess`, Freedom shows a single consent sheet for all of them, and
approving it also turns on "always allow" for those tiers.

```json
{
  "schema": "freedom-manifest/1",
  "name": "Notes",
  "capabilities": {
    "swarm": {
      "publish": { "why": "Save your notes to Swarm" },
      "feeds": { "why": "Keep a pointer to your latest notes" }
    }
  }
}
```

A manifest grant of `feeds` or `signing` uses an `app-scoped` identity if
the origin has none yet. Removing a capability from a redeployed manifest
withdraws what it granted.
A declined sheet stays declined until the page reloads. Details and limits:
[Permission manifests](swarm.html#permission-manifests).

## Which key signs

Feed and single-owner chunk writes are signed by the origin's **publisher
identity**, which the user chooses in the first feed or signing prompt:

| `identityMode` | What it is | Linkable across apps |
| -------------- | ---------- | -------------------- |
| `app-scoped` | A dedicated key derived from the user's vault, not shared with other apps | No |
| `bee-wallet` | The Swarm node's own key | Yes |
| `ethereum-wallet` | One of the user's Ethereum accounts | Yes: it is their public address |

Call `getSigningIdentity()` to learn the `owner` address before you write, for
example to show it or to store it where other users can find your feeds. Each
feed stays bound to the identity that created it. Signing needs the user's
vault to be unlocked, and Freedom asks them to unlock it when needed.

Messaging is different: PSS uses the node's key for every origin, and GSOC
writes use a key derived from the topic. See [Live messaging](guide-messaging.html).

## Radicle

`window.radicle` uses the same idea with its own grants: connect once, a
prompt per repository you seed or unseed, and a signing grant before
writing issues and comments with the user's Radicle identity. See
[Radicle repos and issues](guide-radicle.html).
