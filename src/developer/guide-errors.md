---
title: Errors and node readiness
description: Handle window.swarm and window.radicle errors in a Freedom dapp: user rejections, missing grants, node not ready, limits, and when to retry.
kick: Overview
dek: Errors carry an EIP-1193-style code and usually a data.reason. Most failures fall into four groups, and only some are worth retrying.
---

Every rejection is an `Error` with `code`, `message` and, for most
validation and node failures, `data.reason`.

```javascript
async function call(method, params) {
  try {
    return await window.swarm.request({ method, params });
  } catch (err) {
    switch (err.code) {
      case 4001:  // the user said no
        throw err;
      case 4100:  // a grant is missing: data.reason says which
        await window.swarm.requestAccess();
        return window.swarm.request({ method, params });
      case 4900:  // node not available
        if (err.data?.reason === 'node-stopped' || err.data?.reason === 'node-not-ready') {
          await new Promise((r) => setTimeout(r, 3000));
          return window.swarm.request({ method, params });
        }
        throw err;
      default:
        throw err;
    }
  }
}
```

A real app should cap retries and back off; this only shows the shape.

## The four groups

**The user decided (`4001`).** Stop. Ask again only on a new user action. A
declined [manifest sheet](swarm.html#permission-manifests) stays declined
until the page reloads, so tell the user to reload rather than calling
`requestAccess` in a loop.

**A grant is missing (`4100`).** `not_connected`, `feed_not_granted` or
`messaging_not_granted`. Call `requestAccess`, or the tier's first method, to
show the prompt. A `4100` also tells you the user disconnected your origin.

**The node is not ready (`4900`).** `data.reason` says why:

- `node-stopped`: the node is not running or not answering. It also happens
  for a short while right after the user unlocks, while Freedom restarts the
  node ([#988](https://github.com/solardev-xyz/freedom-browser/issues/988)).
  Retry with backoff.
- `node-not-ready`: the node is still connecting, or a storage batch bought
  moments ago is not yet known to the network. Retry later.
- `ultra-light-mode`, `no-usable-stamps`: the node cannot publish yet
  (no Gnosis Chain connection, or no storage with room for the write).

On a write method, all four of these also open Freedom's publish setup for
the user, so tell them what is happening rather than retrying in a loop.
Reads only ever report `node-stopped`.

A `4900` without `data` means the provider is disabled (**Settings → Advanced →
Enable Identity & Wallet** is off) or the app's permission manifest could not be fetched.
Check `getCapabilities()` up front: `canPublish` is false until the origin is
connected and the node is ready.

**The request is wrong (`-32602`).** Fix the call. `data.reason` names the
problem, sometimes with `data.limit` and `data.actual`. Two are retryable:
`rate_limited` (wait for the 60 s read window, or `retryAfterMs` for new GSOC
topics) and `too_many_subscriptions` (close one first).

`-32603` is an internal error or a timeout and is usually transient. A
request that timed out may still have completed on the node, and a response
that arrives after the page navigated away is never delivered.

## Timeouts

`window.swarm` gives publish, feed, signing and messaging calls 300 s and
everything else 60 s, prompt time included. A user who takes longer than 60 s
on the connect prompt gets `-32603 Request timed out` even though the grant
still lands; call `requestAccess` again to pick it up.

`window.radicle` uses 300 s for seeding and writes and 60 s otherwise.
`radicle_unseed` currently gets only 60 s
([#1001](https://github.com/solardev-xyz/freedom-browser/issues/1001)).

## Radicle specifics

`window.radicle` uses the same codes. Its `4900` reasons are
`profile-disabled` (Radicle is off for this profile) and `node-stopped`; the
node-status, access and disconnect methods still work while the node is
stopped. Write validation failures are `-32602` with reasons such as
`invalid_rid`, `invalid_title` or `payload_too_large`. The full list is in
[Errors](radicle.html#errors).

Full tables: [`window.swarm` errors](swarm.html#errors).
