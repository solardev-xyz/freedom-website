# freedom-website

Source and build tooling for the Freedom website. Running the
build assembles a static site into `dist/`.

## Live deployments

The built site is published to two places:

- **[https://freedom.baby](https://freedom.baby)** — served from a static
  file host.
- **`bzz://freedombrowser.eth/`** — a Swarm-deployed dweb site, reachable
  via a gateway at
  **[https://freedombrowser.eth.limo](https://freedombrowser.eth.limo/)**.

Both are published from the same `dist/`, which is what keeps them
identical. Only the site goes to Swarm — the installers stay on
freedom.baby and the pages link to them absolutely, so the Swarm payload is
a few MB rather than the tens of GB of binaries.

### Publishing to Swarm

```bash
npm run build
npm run deploy:swarm -- --dry-run   # packs, checks the batch, uploads nothing
npm run deploy:swarm                # uploads and points the feed at it
```

Run it **on the fra1 host**: it posts to the antd node at `127.0.0.1:1633`,
which holds the postage batch (`SWARM_API` overrides the target). The script
checks the batch is usable before uploading and reads the result back to
confirm the manifest serves the built index, then points the site's feed at
the new reference. That is the whole publish step.

**ENS points at a feed, not at a release.** The content hash of
`freedombrowser.eth` is the feed manifest
`bzz://eaf9d3a18b0820c6b0c656a8c247dc131130a1d4cfab41b769de68788f04c5af`
(owner `ea20b62e…279d`, topic `freedombrowser.eth`), which always resolves
to the latest update, so deploys need no ENS transaction. `eth.limo` caches
for about five minutes, so give it a moment before checking.

The feed is signed with the key in
`~/.config/freedom-website/swarm-feed.key` on fra1 (`SWARM_FEED_KEY`
overrides the path). It holds no funds but **keep a backup**: without it the
feed can't be updated, and a new key means a new manifest and a new ENS
content hash.

**The postage batch** is `16112b8a…da14` — 1 GiB, mutable, bought
2026-09-22 for roughly a year (18.15 xBZZ). It expires around **2027-09-22**
and the ENS site stops resolving if it lapses; `antctl postage status` shows
the remaining room and TTL, `antctl postage top-up` extends it. One upload of
this site costs about 2% of its capacity, and re-uploading identical content
is free because the same chunk addresses land in the same bucket slots.

**`deploy/` holds a weekly re-push timer.** Re-pushing is the only repair
available: antd's automatic heal covers job-based uploads, not the gateway
path this script uses ([ant#87](https://github.com/freedom-hq/ant/issues/87)).
It runs with `--expect-feed`: the content, the feed manifest and the latest
feed update are all re-pushed, and if `dist/` no longer matches what the
feed points at, the unit fails loudly instead of publishing it. The unit
needs no change after a deploy.

## Structure

The layout separates the three kinds of files so the build flow is obvious:

```text
.
├── src/                        ← EDIT THIS (hand-authored source)
│   ├── pages/
│   │   └── index.html          ← static page, copied verbatim
│   ├── content/                ← blog post sources (Markdown)
│   │   ├── introducing-freedom.md
│   │   └── freedom-0-8-5-daily-driver.md
│   ├── templates/
│   │   ├── post-template.html  ← HTML shell for rendered posts
│   │   └── news-template.html  ← HTML shell for the news list
│   ├── images/                 ← logos + screenshots (copied verbatim)
│   └── assets/
│       └── freedom_icon.svg    ← master for index.html's inline favicon
├── scripts/
│   └── build.js                ← the build
└── dist/                       ← GENERATED, git-ignored — never edit by hand
    ├── index.html
    ├── introducing-freedom.html
    ├── freedom-0-8-5-daily-driver.html
    └── images/
```

## Build flow

```text
src/pages/**        ──copy + fill──▶  dist/**           (home, imprint, privacy, developer)
src/assets/**       ──copy──▶         dist/assets/**    (site.css, content.css, scripts, fonts, logos)
src/images/**       ──copy──▶         dist/images/**
src/content/*.md    ──render──▶       dist/<post>.html  (via src/templates/post-template.html + marked)
POSTS (build.js)    ──render──▶       dist/news.html    (via src/templates/news-template.html)
                    ──write──▶        dist/sitemap.xml, dist/robots.txt (absolute URLs from site.json `url`)
```

### Release values: `src/site.json`

The version and the headline numbers live in one place. Any `{{key}}` in a
page or template is replaced at build time:

```json
{ "version": "0.8.6", "downloads": "10k", "countries": "145", "contributors": "10", "url": "https://freedom.baby/" }
```

Bumping `version` updates every download link, the changelog and source
links, and the `freedom-version` meta tag that `deploy:swarm` reads. Refresh
the numbers from freedom.baby/stats and the GitHub contributor count (people,
not bots) before each deploy.

```bash
npm install
npm run build        # assembles dist/ from src/
npm run preview      # build, then serve dist/ locally
```

`dist/` is fully reproducible from `src/` on every build, so it's
git-ignored.

### Adding another blog post

1. Add `src/content/<post>.md` (optional `--- title/description/image ---`
   front-matter).
2. Register it in the `POSTS` array in `scripts/build.js` (newest first),
   with a one-line `summary` for the news list.
3. `npm run build`.

### Blog post conventions

**Files.** One Markdown file per post in `src/content/`, named with a
date-less lowercase slug (`freedom-0-8-5-daily-driver.md`); the slug becomes
the page name in `dist/`. Front-matter values are read verbatim, so don't
quote them:

```markdown
---
title: Freedom 0.8.5: the daily-driver release
description: One sentence for previews and social cards.
image: images/<screenshot>.png
---

# Freedom 0.8.5: the daily-driver release

*1 January 2026*
```

The build takes the publication date from the italic line directly after
the H1 and strips it from the body, so nothing else may sit in that
position.

**Drafts.** A post that is not yet registered in `POSTS` is a draft: it
lives in `src/content/` but is never rendered or deployed. Keep working
notes in an HTML comment (`<!-- -->`), which `marked` passes through
invisibly, and mark screenshot slots as `[img: …]` so they are obvious in
the source. Registering the post in `POSTS` is the publish step; add the
date line and remove the working comment in the same commit.

**Voice and style.**

- Sentence case for every heading, the title included; capitalise only
  proper nouns and product names. Matches the changelog and the
  fundraising documents.
- Spell out acronyms a reader outside the ecosystem wouldn't know on first
  use ("Ethereum Foundation", not "EF").
- State what the thing does, not how good it is. Mechanism belongs in the
  changelog and the code.

**Claims are cited.** Every number or event traces to
`freedom-org/research/crops-pitch/sources.md` with its confidence tag; the
do-not-cite list in `freedom-org/AGENTS.md` applies. Verify and log a new
source there before using it in a post. Release posts are checked against
the release branch's `CHANGELOG.md` in `freedom-browser`, not against
memory.

**Images** go in `src/images/` and are referenced as `images/<file>`
(copied verbatim to `dist/images/`).

**Release posts** pair with the short/long announcement copy in
`freedom-org/releases/announcements/` and the version's section in the
product repo's `CHANGELOG.md`: the changelog carries the full change list,
the post carries the story. Link the changelog pinned to the release branch
(`blob/release/<version>/CHANGELOG.md`), not `main`.

## Notes

- The site is self-contained at runtime: fonts (Inter, OFL), scripts and
  logos ship in `src/assets/`, nothing is loaded from third parties, and
  there are no build-time dependencies beyond `marked`. Pages use relative
  links only, so the same `dist/` works on freedom.baby and on Swarm.
- `src/assets/dither.js` draws the grain on the teal and copper sections at
  runtime; `src/assets/os.js` plus a small inline script point the download
  buttons at the visitor's platform.
- The output in `dist/` is a plain static site — serve it with any static
  file host.
- Agent-readable files: `llms.txt`, `developer/llms.txt` and a Markdown twin
  of every docs page (`developer/<page>.html.md`, placeholders filled and
  doc links pointing at other twins). The host must serve `.md` as
  `text/markdown; charset=utf-8` and `.txt` as `text/plain; charset=utf-8`,
  not `application/octet-stream`. Bee takes the type from the extension (Go's
  `mime` table plus `/etc/mime.types`, which lists `md`); `deploy:swarm`
  prints the type it reads back for both and flags anything that is not
  `text/*`. freedom.baby runs nginx, whose stock `mime.types` has no `md`
  entry: include `deploy/nginx-markdown.conf` inside the server's
  `location / { }` block (a nested regex location, so it keeps that block's
  root and headers; a scoped `types` so the other extensions keep their
  types), then check with
  `curl -sI https://freedom.baby/developer/index.html.md`.
- Links in both `llms.txt` files are relative, like the pages, so an agent
  that reads the map from a Swarm gateway stays on Swarm. The build fails if
  one points at freedom.baby or at a file missing from `dist/`. Each file
  still names its canonical URL (`https://freedom.baby/llms.txt`,
  `https://freedom.baby/developer/llms.txt`) in prose as the base for an
  agent that has the text without its source URL; the build checks that too.
