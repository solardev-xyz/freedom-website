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
│   │   └── blog-template.html  ← HTML shell for rendered posts
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
src/pages/*.html   ──copy──▶  dist/*.html
src/images/**      ──copy──▶  dist/images/**
src/content/*.md   ──render──▶ dist/*.html   (via src/templates/ + marked)
```

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
2. Register it in the `POSTS` array in `scripts/build.js`.
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

- The site is self-contained at runtime: the favicon is an inline
  data-URI SVG and there are no build-time external dependencies beyond
  `marked`. `src/assets/freedom_icon.svg` is the master the inline favicon
  was derived from; it is not copied to `dist/`.
- The output in `dist/` is a plain static site — serve it with any static
  file host.
