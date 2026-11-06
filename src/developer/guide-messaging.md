---
title: Live messaging
description: Real-time features without servers in Freedom dapps: GSOC broadcast rooms, encrypted PSS direct messages, subscriptions, and how to combine them with durable Swarm data.
kick: Swarm
dek: GSOC rooms and PSS direct messages give your app real-time delivery through the user's node. Keep the truth in feeds; use messages to say something changed.
---

Freedom's messaging methods use two Swarm mechanisms:

| | GSOC | PSS |
| - | ---- | --- |
| Shape | A broadcast room named by a topic | A message to one node |
| Who can write | Anyone who knows the topic | Anyone who has your messaging identity |
| Encryption | None | Encrypted to the recipient node's key |
| Methods | `sendGsoc`, `subscribe({ kind: 'gsoc' })` | `getMessagingIdentity`, `sendPss`, `subscribe({ kind: 'pss' })` |

Both need the messaging grant, spend postage like any write, and carry up to
`limits.maxMessageBytes` (4000 bytes in Freedom; read it from
`getCapabilities()`). Check `features.includes('messaging')` first.

## A room

```javascript
window.swarm.on('message', ({ subscription, result }) => {
  const text = new TextDecoder().decode(
    Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0)),
  );
  console.log(result.kind, text);
});

const room = 'com.example.chat/v1/lobby';
const { subscriptionId } = await window.swarm.subscribe({ kind: 'gsoc', topic: room });
await window.swarm.sendGsoc({ topic: room, data: 'hello' });   // the user approves the send

// later
await window.swarm.unsubscribe({ subscriptionId });
```

The first send on a new topic derives its signing key, which usually takes
well under a second (at most 15 s); new topics are limited to 16 per origin
per minute.

## Direct messages

```javascript
// Recipient: share these two values, for example in a profile feed
const { pssPublicKey, pssTarget } = await window.swarm.getMessagingIdentity();
await window.swarm.subscribe({ kind: 'pss', topic: 'com.example.chat/v1/dm' });

// Sender
await window.swarm.sendPss({
  topic: 'com.example.chat/v1/dm',
  recipient: pssPublicKey,
  targets: pssTarget,
  data: 'psst',
});
```

PSS decrypts with the **node's** key, so the messaging identity is the same
for every app on that node. Only the first two bytes of the node's overlay
address are disclosed.

## Design rules

- **Messages are hints, not storage.** Delivery is best-effort, and only live
  traffic arrives: Freedom ignores the draft standard's `history` option, so a
  page that was closed misses what was sent. Write the durable state to a
  feed and use messages to say "there is something new". This is the model
  swarm-kit's `live.*` primitives and its chat example follow.
- **Topics are global.** Unlike feed names, a topic string names the same
  channel for every app and node. Namespace your topics, use unguessable
  ones for private rooms, and encrypt if content matters.
- **Do not trust senders.** Messages are unauthenticated at the transport layer. Sign
  payloads at the application level if you need to know who wrote them.
- **Share subscriptions.** There are at most 32 per origin, and the node's
  pool is shared with other apps. Multiplex one topic per app rather than one
  per widget.
- **Subscriptions end with the page.** Navigating to a new document, closing
  the tab or a revoked grant closes them; hash and `pushState` routing do not.
  `establish_timeout`, `node_subscription_limit` and `subscription_cancelled`
  (`4900`) are retryable.

Reference: [Messaging](swarm.html#messaging), [Events](swarm.html#events).
