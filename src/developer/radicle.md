---
title: window.radicle
description: Reference for window.radicle in Freedom Browser: seed and sync repositories, disclose the user's Radicle identity, and write issues and comments through the user's own node.
kick: Radicle
dek: Seed, sync, disclose identity, and write collaborative objects through the user's Radicle node. Repository reads are plain rad: URL fetches.
source: https://github.com/solardev-xyz/freedom-browser/blob/main/src/main/radicle/radicle-provider-ipc.js
---

`window.radicle` lets a web page perform **actions** against the user's
Radicle node: seed repositories, sync them, disclose the user's Radicle
identity, and write collaborative objects (issues, issue comments, issue
state changes and patch comments). Every action is scoped to the page's
origin and gated by the user's consent. The provider reports
`specVersion: '0.2'`.

## Reads are rad: URL fetches

The provider has **no read methods** for repository data. Freedom resolves
the `rad:` URL scheme itself, so any page can `fetch()` repository metadata,
trees, files, commits, issues and patches as JSON from the user's own node
without a prompt. See [rad: URLs](rad-urls.html) for the routes.

Two limits apply: only **public** repositories are served (a private one is
`403`), and file, tree and commit routes take a full 40-character commit SHA,
not a branch name.

The provider exists for everything that is not a public read:

| Concern | Why it needs consent |
| ------- | -------------------- |
| Seeding | Commits the user's disk and bandwidth indefinitely |
| Syncing | Uses bandwidth on demand |
| Identity disclosure | The user's DID is a persistent cross-site identifier |
| COB writes | Signed with the user's key; cannot be taken back once gossiped |
| Node introspection | The seeded-repo list and node details are private information about the user |

## Provider object

`window.radicle` is installed in the page's main world of every web page's
top frame before any of the page's own scripts run, alongside `window.swarm`
and `window.ethereum`. A page's Content Security Policy does not affect it.
It is not installed in private windows, in sub-frames, or on Freedom's
internal pages. Detect it with `window.radicle?.isFreedomBrowser === true`.

```javascript
window.radicle.request({ method: string, params?: object }): Promise<any>
```

Every method also has a convenience wrapper without the `radicle_` prefix,
for example `window.radicle.seed({ rid })` or `window.radicle.getCapabilities()`.

### Events

```javascript
window.radicle.on(event, handler)              // also addListener
window.radicle.removeListener(event, handler)
window.radicle.removeAllListeners(event?)
```

| Event | Payload | When |
| ----- | ------- | ---- |
| `connect` | `{ origin }` | The origin is granted access **for the first time** (a repeat `radicle_requestAccess` does not emit it) |
| `disconnect` | `{ origin }` | **Only** after the page's own [`radicle_disconnect`](#radicle_disconnect) call |
| `seedStatus` | a [seed status](#radicle_getSeedStatus) object | Replication progress for seed and sync actions this origin started |

Freedom v0.8.8 has no settings screen that lists or revokes Radicle grants,
so there is no user-side revocation that would emit `disconnect`. Treat a
`4100` from a later call as the reliable signal that access is gone.

### Timeouts

The page shim rejects unanswered requests with
`{ code: -32603, message: 'Request timed out' }` after:

- **300 s** for methods that can open a consent prompt:
  `radicle_requestAccess`, `radicle_seed`, `radicle_getIdentity` and the four
  COB writes;
- **60 s** for everything else, **including `radicle_unseed`**, which does
  prompt. A user who takes longer than a minute to answer the unseed prompt
  gets a timeout on the page even though the decision still takes effect.
  This is a bug, tracked in
  [#1001](https://github.com/solardev-xyz/freedom-browser/issues/1001).

A timed-out promise does not cancel a grant or write that already reached
the node, so retry COB writes carefully. A response that arrives after the
tab navigated to another document is dropped, and the request rejects with
`4900`.

## Errors

Rejections are `{ code, message, data? }`, aligned with `window.swarm`:

| Code | Meaning | `data.reason` |
| ---- | ------- | ------------- |
| `4001` | The user rejected the prompt | — |
| `4100` | Not authorized | `not_connected` (no connection grant), `signing_not_granted` (a signing-tier method without the signing grant), `agent_custody` (see [Consent](#consent-and-permission-tiers)) |
| `4200` | Unknown method | — |
| `4900` | Radicle unavailable | `profile-disabled` (on every method, including `radicle_getCapabilities`), `node-stopped` (the node is not running **or still starting**) |
| `-32602` | Invalid params | `invalid_rid`, `invalid_id`, `invalid_title`, `invalid_body`, `invalid_labels`, `invalid_state`, `payload_too_large`, `not_seeded` |
| `-32603` | Internal or node error | `repo_not_found`, `announce_failed`, `native_failed`, `seed_failed`, `unseed_failed`, `sync_failed`, `status_failed` |

The checks run in this order: unknown method (`4200`), Radicle disabled for
the profile (`4900 profile-disabled`), then for every method except
`radicle_getCapabilities`: no connection grant (`4100 not_connected`),
signing tier without the signing grant (`4100 signing_not_granted`), and
node not running (`4900 node-stopped`). Only `radicle_getNodeStatus`,
`radicle_requestAccess` and `radicle_disconnect` work while the node is
stopped.

Note the asymmetry while the node is starting: method calls fail with
`node-stopped`, while `radicle_getCapabilities` reports
`reason: 'node-not-ready'`.

## Consent and permission tiers

Grants are keyed by the origin of the tab's address bar, derived by Freedom
and never by anything the page controls. The key rules are the same as for
`window.swarm`; see its [origin key table](swarm.html#permission-tiers).

| Tier | Methods | Prompt |
| ---- | ------- | ------ |
| None | `radicle_getCapabilities` | never |
| Connection | `radicle_requestAccess` | once per origin |
| | `radicle_getNodeStatus`, `radicle_listSeededRepos`, `radicle_sync`, `radicle_getSeedStatus`, `radicle_disconnect` | never (need the connection grant) |
| | `radicle_seed`, `radicle_unseed` | every call, per repository |
| Signing | `radicle_getIdentity`, `radicle_createIssue`, `radicle_commentIssue`, `radicle_editIssueState`, `radicle_commentPatch` | the first call asks for the signing grant; later writes do not prompt |

- `seed` and `unseed` always prompt: one commits disk and bandwidth, the
  other drops a policy the user chose. The permission record has
  `autoApprove` flags, but v0.8.8 ships no UI to set them.
- `sync` does not prompt, so it only accepts repositories that already have a
  seeding policy (`-32602 not_seeded` otherwise).
- Writes sign with the user's **node identity**. There are no per-origin
  sub-identities: a forge needs the user to be the same author everywhere.
- On a tab that Freedom Agent holds, the signing grant does not answer a
  write on its own: each write prompts with its content, and a write
  answered only by the grant is refused with `4100 agent_custody`.
- There is no per-origin rate limit on writes in v0.8.8.

## Input rules

- **Repository ids** (`rid`) are accepted as `rad:z…`, `rad://z…` or a bare
  `z…`, where the `z…` part is 20 to 60 base58 characters. They are
  normalized to `rad:z…`. Anything else is `invalid_rid`.
- **COB ids** (`issueId`, `patchId`, `revisionId`, `replyTo`) are 6 to 40
  lowercase hex characters (`invalid_id`).
- **Text**: titles, descriptions, comment bodies and labels must be
  non-empty after trimming whitespace.
- **Sizes**: title at most 200 bytes, description and body at most
  65,536 bytes (`payload_too_large`), each label at most 100 bytes, at most
  10 labels (`invalid_labels`).

## Methods at a glance

| Method | Tier | Returns |
| ------ | ---- | ------- |
| [`radicle_requestAccess`](#radicle_requestAccess) | connection | `{ connected, origin, capabilities }` |
| [`radicle_disconnect`](#radicle_disconnect) | connection | `{ connected: false }` |
| [`radicle_getCapabilities`](#radicle_getCapabilities) | none | capability object |
| [`radicle_getNodeStatus`](#radicle_getNodeStatus) | connection | node status |
| [`radicle_listSeededRepos`](#radicle_listSeededRepos) | connection | seeded repositories |
| [`radicle_seed`](#radicle_seed) | connection, prompts | `{ rid, seeded: true, status }` |
| [`radicle_unseed`](#radicle_unseed) | connection, prompts | `{ rid, seeded: false }` |
| [`radicle_getSeedStatus`](#radicle_getSeedStatus) | connection | seed status |
| [`radicle_sync`](#radicle_sync) | connection | `{ rid, status }` |
| [`radicle_getIdentity`](#radicle_getIdentity) | signing | `{ did, nid, alias }` |
| [`radicle_createIssue`](#radicle_createIssue) | signing | `{ id }` |
| [`radicle_commentIssue`](#radicle_commentIssue) | signing | `{ id }` |
| [`radicle_editIssueState`](#radicle_editIssueState) | signing | `{ id, state }` |
| [`radicle_commentPatch`](#radicle_commentPatch) | signing | `{ id }` |

## Connection

### `radicle_requestAccess`

**Params** none · **Returns** `{ connected: true, origin, capabilities }` · **Tier** connection (prompts once)

Prompts the user to connect the origin. Repeat calls return the current
state without a prompt. `capabilities` is the
[`radicle_getCapabilities`](#radicle_getCapabilities) object. Works while the
node is stopped. Emits `connect` on the first grant only.

### `radicle_disconnect`

**Params** none · **Returns** `{ connected: false }` · **Tier** connection

The page gives up its own access: the connection grant, the signing grant
and any auto-approvals. No prompt. Works while the node is stopped. Emits
`disconnect`.

### `radicle_getCapabilities`

**Params** none · **Returns** capability object · **Tier** none

```javascript
{
  specVersion: '0.2',
  canUseNode: boolean,   // connected AND node running
  reason: null | 'not-connected' | 'node-not-ready' | 'node-stopped',
  writes: ['issue', 'issueComment', 'issueState', 'patchComment']
}
```

When Radicle is disabled for the profile, this call fails with
`4900 profile-disabled` instead of returning an object.

## Node

### `radicle_getNodeStatus`

**Params** none · **Returns** node status · **Tier** connection

```javascript
{
  running: boolean,   // status === 'running'
  status: string,     // the node's lifecycle status
  peers?: number,     // when running and the connection count can be read
  alias?: string,     // the public node alias, when running
  nid?: string        // only when the origin also has the signing grant
}
```

`nid` identifies the user, so it stays behind the signing grant. `alias` is
gossiped network-wide anyway.

### `radicle_listSeededRepos`

**Params** none · **Returns** the repositories the node seeds · **Tier** connection

The repositories the user's node has a seeding policy for, including one
whose first fetch has not finished yet. The list comes straight from the
native Radicle library; expect at least each repository's `rid`, and treat
metadata such as `name` and `description` as optional (it is missing until
the first fetch lands). Unlike `swarm_listFeeds`, this needs a connection:
the list is private information about the user.

### `radicle_seed`

**Params** `{ rid }` · **Returns** `{ rid, seeded: true, status }` · **Tier** connection, prompts per repository

Writes the seeding policy and starts a **background** fetch from the
network. It resolves straight away; `status` has the
[`radicle_getSeedStatus`](#radicle_getSeedStatus) shape. Subscribe to
`seedStatus` before you call it, and use `radicle_getSeedStatus` to restore
the latest snapshot after a reload. This is how a page gets a repository the
node does not have yet. A rejected prompt is `4001` and the node is not
touched. Errors: `invalid_rid`, `seed_failed`.

### `radicle_unseed`

**Params** `{ rid }` · **Returns** `{ rid, seeded: false }` · **Tier** connection, prompts per repository

Removes the seeding policy and cancels any fetch in flight. Errors:
`invalid_rid`, `unseed_failed`. Mind the
[60 s timeout](#timeouts).

### `radicle_getSeedStatus`

**Params** `{ rid }` · **Returns** seed status · **Tier** connection

A replication snapshot. `seedStatus` events carry the same shape.

```javascript
{
  rid,
  state: 'fetched' | 'fetching' | 'failed' | 'cancelled' | 'idle',
  inStorage: boolean,           // the repo is served locally
  seedersKnown: number | null,  // network seeders found for the fetch
  attemptCount: number,
  recentAttempts: [{ nid, ok, error?, at }],  // last 5 per-seed results
  progress: { phase, candidates?, nid?, addr?, index?, total?, reason? } | null,
  lastError: string | null,
  startedAt: number | null,
  finishedAt: number | null
}
```

`progress.phase` is one of `starting`, `resolving`, `connecting`,
`fetching`, `peer-failed`, `done`, `failed` or `cancelled`. There are no
byte-level percentages. `idle` means nothing is known about the repository
this session. A `failed` repository can still turn `fetched` later, because
the node keeps retrying in the background. Errors: `invalid_rid`,
`status_failed`.

### `radicle_sync`

**Params** `{ rid }` · **Returns** `{ rid, status }` · **Tier** connection

Restarts the background fetch for a repository that already has a seeding
policy, for example after `state: 'failed'`, without a second prompt.
Follow `seedStatus` for progress. Errors: `invalid_rid`, `not_seeded`,
`sync_failed`.

## Identity and writes

### `radicle_getIdentity`

**Params** none · **Returns** `{ did, nid, alias }` · **Tier** signing

The user's Radicle identity. The first call asks for the signing grant, so
this is the natural way to request it before the first write.

### `radicle_createIssue`

**Params** `{ rid, title, description, labels? }` · **Returns** `{ id }` · **Tier** signing

Opens an issue signed by the user and announces it to the network before
resolving. Errors: `invalid_rid`, `invalid_title`, `invalid_body`,
`invalid_labels`, `payload_too_large`, `repo_not_found`, `announce_failed`,
`native_failed`.

### `radicle_commentIssue`

**Params** `{ rid, issueId, body, replyTo? }` · **Returns** `{ id }` · **Tier** signing

Comments on an issue, optionally as a reply to the comment `replyTo`.
Errors as `radicle_createIssue`, plus `invalid_id`.

### `radicle_editIssueState`

**Params** `{ rid, issueId, state }` · **Returns** `{ id, state }` · **Tier** signing

`state` is `'open'`, `'closed'` or `'solved'` (`invalid_state` otherwise).

### `radicle_commentPatch`

**Params** `{ rid, patchId, body, revisionId? }` · **Returns** `{ id }` · **Tier** signing

Comments on a patch revision. Without `revisionId`, the comment goes on the
patch's **first** revision (the patch id doubles as that revision's id).

## Not in this version

- Creating patches or repositories (`rad init`): both need a working copy.
  Issues and patch comments cover the collaboration around existing patches.
- Private repositories, through `rad:` URLs or the provider.
- A settings screen to list or revoke Radicle grants, or to turn on
  auto-approval.
- Per-origin write rate limits.

<details>
<summary>Design notes</summary>

**One identity.** Every origin with the signing grant acts as the user's
single Radicle identity. A code forge is a reputation system: per-origin
sub-identities, as `window.swarm` uses for feeds, would split the user into
unlinkable authors and break Radicle's delegate model. The identity is only
disclosed behind the signing grant.

**Policy and replication are separate.** A fetch can take seconds, fail per
seed, or never complete, so `radicle_seed` resolves once the policy is
written and reports replication through `seedStatus`.

**In-process node.** Every method calls Freedom's embedded Radicle library
against the profile's own node and storage. No Radicle CLI, HTTP daemon or
local port is involved. See [Architecture](architecture.html).

</details>

## Example {#example}

```javascript
if (!window.radicle?.isFreedomBrowser) throw new Error('Open this app in Freedom');

const rid = 'rad:z…';  // your repository id

window.radicle.on('seedStatus', (status) => {
  if (status.rid === rid) console.log(status.state, status.progress?.phase);
});

await window.radicle.requestAccess();        // prompts once
await window.radicle.seed({ rid });          // prompts for this repo

await window.radicle.getIdentity();          // asks for the signing grant
const { id } = await window.radicle.createIssue({
  rid,
  title: 'Typo in README',
  description: 'Second paragraph, "teh" should be "the".',
});
```
