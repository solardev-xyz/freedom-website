---
title: Feeds and mutable content
description: Use Swarm feeds from a Freedom dapp: a stable URL for changing content, append-only data logs, reading other users' feeds, and the current read-shape caveat.
kick: Guide
dek: Content on Swarm is immutable. Feeds give you a stable, signed pointer to the latest version, or an append-only log of entries.
---

A feed is a sequence of entries at indexes `0, 1, 2, …` under a topic, signed
by one owner. Freedom derives the topic from your origin and a feed name, so
your app only ever deals with names.

## Pattern 1: a stable URL for changing content

Create a feed once, then point it at each new version you publish:

```javascript
const feed = await window.swarm.createFeed({ name: 'site' });
// feed.bzzUrl is bzz://<manifestReference>: share this one, it never changes

const { reference } = await window.swarm.publishData({
  data: '<h1>Version 2</h1>',
  contentType: 'text/html',
});
await window.swarm.updateFeed({ feedId: 'site', reference });
// feed.bzzUrl now serves version 2
```

`createFeed` is idempotent: calling it again with the same name returns the
stored feed without writing.

## Pattern 2: an append-only log

Write payloads directly as entries:

```javascript
await window.swarm.createFeed({ name: 'events' });
const { index } = await window.swarm.writeFeedEntry({
  name: 'events',
  data: JSON.stringify({ type: 'joined', at: Date.now() }),
});
```

Without `index` the entry goes to the next free slot, and concurrent writes
to one feed get distinct indexes. With an explicit `index`, an existing entry
is never overwritten (`index_already_exists`).

## Reading

```javascript
// your own feed, latest entry
const latest = await window.swarm.readFeedEntry({ name: 'events' });

// a specific entry
const first = await window.swarm.readFeedEntry({ name: 'events', index: 0 });

// someone else's feed: topic and owner are required
const theirs = await window.swarm.readFeedEntry({ topic, owner });
```

Reads need no permission but count against the per-origin
[read budget](swarm.html#limits). `data` comes back base64-encoded.

To let others read your feed, publish its `topic` and `owner` somewhere they
can find them. `listFeeds()` returns both for every feed your origin created,
and `getSigningIdentity()` gives the `owner` before the first write.

## Pitfalls

- **Latest vs indexed reads may return different things.** Developer feedback
  in [#989](https://github.com/solardev-xyz/freedom-browser/issues/989)
  reports that a read without `index` returns the content the latest entry
  points at, while a read with `index` returns the raw entry (an 8-byte
  timestamp plus a 32-byte reference). Until that is settled, check which one
  you got before decoding.
- **`nextIndex` after an indexed read is `index + 1`,** not the next free
  slot. To append, call `writeFeedEntry` without `index`.
- **`feed_empty` and `entry_not_found`** can also mean the node failed while
  looking. If the feed should exist, retrying once is cheap.
- **Feeds are bound to their creating identity.** If the user later switches
  the origin's publisher identity, old feeds keep their old owner.

For richer structures on top of feeds and single-owner chunks (records,
hash chains, multi-writer feeds), see [swarm-kit](guide-swarm-kit.html).
Reference: [Feeds](swarm.html#feeds).
