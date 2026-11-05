---
title: rad: URLs
description: Read public Radicle repositories from any page in Freedom Browser with fetch('rad:<rid>/…'): routes, parameters, pagination and errors.
kick: API reference
dek: Any page can fetch public repository data as JSON from the user's own Radicle node. No prompt, no server, no API key.
source: https://github.com/solardev-xyz/freedom-browser/blob/main/src/main/radicle-api-protocol.js
---

Freedom resolves the `rad:` scheme in-process. A page, including one served
from `bzz://`, can read a public Radicle repository with a plain `fetch()`.
This is the read side of Radicle in Freedom; writes such as seeding and
issues go through [`window.radicle`](radicle.html).

```javascript
const rid = 'z3QXuMvMmSeEX3ZgoUidZC1v5MkKE';   // freedom-browser's Radicle mirror
const repo = await (await fetch(`rad:${rid}`)).json();
const head = repo.payloads['xyz.radicle.project'].meta.head;

const readme = await (await fetch(`rad:${rid}/readme/${head}`)).json();
const openIssues = await (await fetch(`rad:${rid}/issues?status=open`)).json();
```

## URL forms

Both forms work and are equivalent:

```text
rad:<rid>/<route>
rad://<rid>/<route>
```

`<rid>` is the bare repository id, `z` followed by 20 to 60 base58
characters (no `rad:` prefix inside the URL). The scheme is registered as
non-standard, so the browser does not lowercase it and the case-sensitive id
reaches Freedom intact.

## Rules

- **Read only**: `GET` and `HEAD`. Any other method is `405`. `HEAD` returns
  the same status and headers without a body.
- **Public repositories only**: a repository whose visibility is not public
  is `403` (`repository is not public`).
- **The node must have the repository.** `rad:` reads from the user's local
  storage. To read a repository the node does not have yet, ask the user to
  seed it with [`radicle_seed`](radicle.html#radicle_seed) and wait for
  `state: 'fetched'`.
- **Full commit SHAs**: routes that take a revision need the full
  40-character lowercase hex SHA; branch names and short SHAs are rejected
  with `400`. Get the default branch head from the repository metadata.
- **CORS**: responses carry `Access-Control-Allow-Origin: *`, so cross-origin
  pages can read them.
- **No consent**: public repository data is world-readable on the network, so
  no prompt is shown and no grant is needed.
- When Radicle is disabled for the profile, every request is `403`.

## Routes

The routes mirror the per-repository part of radicle-httpd's API
(`/api/v1/repos/<rid>/…`). Node-level endpoints (repository listing, node
info, sessions) are deliberately not reachable.

| Route | Returns |
| ----- | ------- |
| `rad:<rid>` | Repository metadata (shape below) |
| `rad:<rid>/tree/<sha>` | The root tree at a commit |
| `rad:<rid>/tree/<sha>/<path>` | A directory at a commit |
| `rad:<rid>/blob/<sha>/<path>` | A file at a commit |
| `rad:<rid>/readme/<sha>` | The README at a commit (`404 no readme` if there is none) |
| `rad:<rid>/commits/<sha>` | One commit |
| `rad:<rid>/commits?parent=<sha>&page=&perPage=` | Commit history from `parent` |
| `rad:<rid>/stats/tree/<sha>` | Repository statistics at a commit |
| `rad:<rid>/remotes` | The repository's remotes |
| `rad:<rid>/issues?status=&page=&perPage=` | Issues |
| `rad:<rid>/issues/<id>` | One issue |
| `rad:<rid>/patches?status=&page=&perPage=` | Patches |
| `rad:<rid>/patches/<id>` | One patch |

Path segments may be URL-encoded. Empty, `.` and `..` segments, encoded
slashes and control characters are rejected (`400`), so a request cannot
leave the repository's scope.

### Repository metadata

```javascript
{
  rid: 'rad:z…',
  payloads: {
    'xyz.radicle.project': {
      data: { name, description, defaultBranch },
      meta: { head, issues: { open }, patches: { open } }
    }
  },
  delegates: [ … ],
  threshold: number,
  visibility: { type: 'public' },
  seeding: number          // number of seeders known to the node
}
```

`meta.head` is the default branch's commit SHA; use it as `<sha>` for the
tree, blob, readme and commit routes.

### Pagination and filters

| Parameter | Routes | Rule |
| --------- | ------ | ---- |
| `page` | `commits`, `issues`, `patches` | 0-based, default `0` |
| `perPage` | `commits`, `issues`, `patches` | 1 to 100, default `30` |
| `parent` | `commits` | Required for the history route; a full SHA |
| `status` | `issues`, `patches` | Keeps items whose `state.status` equals the value, for example `open` |

Out-of-range values are clamped rather than rejected.

## Errors

| Status | Body | When |
| ------ | ---- | ---- |
| `400` | `{ code, message: 'invalid rad reference' }` | Malformed id or unsafe path |
| `400` | `{ error }` | A route is missing its revision or path, or the SHA is not 40 hex characters |
| `403` | `{ code, message }` | Radicle is disabled for this profile |
| `403` | `{ error: 'repository is not public' }` | The repository is private |
| `404` | `{ error }` | Unknown route (`unsupported endpoint: …`), or the repository, object or README was not found |
| `405` | `{ code, message: 'method not allowed' }` | Not `GET` or `HEAD` |
| `500` | `{ error }` | Any other node error |

Errors raised before the request reaches the repository (the first `400`,
the profile `403` and `405`) use `{ code, message }`; errors from the
repository routes use `{ error }`. Check `response.ok` before parsing.
