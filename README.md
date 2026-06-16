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
│   ├── content/
│   │   └── introducing-freedom.md   ← blog post source (Markdown)
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

## Notes

- The site is self-contained at runtime: the favicon is an inline
  data-URI SVG and there are no build-time external dependencies beyond
  `marked`. `src/assets/freedom_icon.svg` is the master the inline favicon
  was derived from; it is not copied to `dist/`.
- The output in `dist/` is a plain static site — serve it with any static
  file host.
