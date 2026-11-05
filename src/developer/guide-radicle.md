---
title: Radicle repos and issues
description: Build a code-collaboration dapp on Radicle in Freedom: read repositories with rad: URLs, get a repository onto the user's node, and write issues and comments with window.radicle.
kick: Guide
dek: Read public repositories with fetch('rad:…'), ask the user's node to seed what it does not have, and write issues and comments as the user.
---

A Freedom page can be a full forge client without a server. Canopy, a
GitHub-style forge served from Swarm, works exactly this way.

## Read with rad: URLs

Reads are plain `fetch()` calls against the user's own node, with no prompt
and no connection:

```javascript
const rid = 'z…';   // the bare repository id
const res = await fetch(`rad:${rid}`);
if (res.status === 404) {
  // the node does not have it (yet): see the next section
}
const repo = await res.json();
const head = repo.payloads['xyz.radicle.project'].meta.head;
const issues = await (await fetch(`rad:${rid}/issues?status=open&perPage=50`)).json();
```

Revisions must be full 40-character SHAs, so start from the metadata's
`head`. Routes, pagination and error bodies are in [rad: URLs](rad-urls.html).

## Get a repository onto the node

`rad:` only serves what the node stores. To open a repository the node does
not have, ask the user to seed it and wait for the fetch:

```javascript
const fullRid = `rad:${rid}`;

function fetched() {
  return new Promise((resolve, reject) => {
    const onStatus = (s) => {
      if (s.rid !== fullRid) return;
      if (s.state === 'fetched') { done(); resolve(s); }
    };
    const done = () => window.radicle.removeListener('seedStatus', onStatus);
    window.radicle.on('seedStatus', onStatus);
  });
}

await window.radicle.requestAccess();            // prompts once per origin
const waiting = fetched();                       // listen before seeding
const { status } = await window.radicle.seed({ rid: fullRid });  // prompts for this repo
if (status.state !== 'fetched') await waiting;
```

Things to know:

- `seed` resolves as soon as the policy is written; the fetch runs in the
  background. Show `progress.phase` (`resolving`, `connecting`, `fetching`, …)
  so the user sees it moving; there are no percentages.
- A `failed` state is not final: the node keeps retrying, and you can call
  `sync({ rid })` to restart the fetch without another prompt. A real app
  should also give up waiting after a while and say so.
- After a reload, `getSeedStatus({ rid })` returns the latest snapshot.
- `seed` and `unseed` prompt every time, per repository.

## Write issues and comments

Writes are signed with the user's Radicle node identity, the same author
everywhere, after a one-time signing grant:

```javascript
const me = await window.radicle.getIdentity();   // asks for the signing grant
const { id } = await window.radicle.createIssue({
  rid: fullRid,
  title: 'Crash when opening settings',
  description: 'Steps to reproduce: …',
  labels: ['bug'],
});
await window.radicle.commentIssue({ rid: fullRid, issueId: id, body: 'Also on Linux.' });
await window.radicle.editIssueState({ rid: fullRid, issueId: id, state: 'closed' });
```

Each write goes into the node's own storage, the same storage `rad:` reads
from, and is announced to the network before the call resolves. A write that timed out may
still have landed, so read before you retry rather than posting twice.

Limits and input rules (title 200 bytes, body 64 KiB, up to 10 labels) are
in the [reference](radicle.html#input-rules). Patches can be commented on
but not created from a page in this version; see
[Not in this version](radicle.html#not-in-this-version).

## Test against a real repository

Freedom Browser's own Radicle mirror,
`rad:z3QXuMvMmSeEX3ZgoUidZC1v5MkKE`, is public and fine for read tests. Do
not create test issues on someone else's repository: initialise your own with
the Radicle CLI and use that.
