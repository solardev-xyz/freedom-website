#!/usr/bin/env node
/**
 * Build the freedom.baby site into ./dist (everything in dist/ is generated).
 *
 * Flow:
 *   src/pages/**          → rendered (partials + {{…}} values) → dist/**
 *   src/static/**         → copied verbatim    → dist/  (favicon.ico, apple-touch-icon.png, …)
 *   src/assets/**         → copied verbatim    → dist/assets/**
 *   src/images/**         → copied verbatim    → dist/images/**
 *   src/content/*.md      → rendered with      → dist/*.html
 *     + src/templates/post-template.html
 *   POSTS                 → news list with     → dist/news.html
 *     + src/templates/news-template.html
 *   src/content/faq.md    → FAQ section on the home page + its FAQPage JSON-LD
 *   POSTS                 → dist/feed.xml (RSS), dist/releases.html + releases.xml,
 *                          dist/sitemap.xml, dist/robots.txt
 *
 * Templating, kept deliberately small:
 *   {{> name}}   inserts src/partials/name.html (head, nav, footer, scripts)
 *   {{key}}      inserts a value, HTML-escaped. Values come from src/site.json,
 *                the page's front matter and what the build computes
 *                (canonical, imageUrl, root, …). Keys ending in "Html" are
 *                inserted as-is. An unknown key fails the build.
 *
 * A page in src/pages starts with front matter in an HTML comment:
 *   <!--
 *   title: Imprint — Freedom Browser
 *   description: Legal information about Freedom GmbH.
 *   -->
 * Optional keys: ogTitle, ogType, image, imageAlt, robots (e.g. "noindex"),
 * sitemap ("no" to leave it out), root (prefix for site-relative links;
 * defaults to "../" per directory level, "/" for pages served at any path).
 *
 *   src/developer/*.md    → rendered with      → dist/developer/*.html
 *     + src/templates/docs-template.html
 *     (tabs, left nav and "On this page" are generated; see DOCS below;
 *     open-issues.md pulls in src/developer/open-issues.json)
 *                         → twin (YAML kept,   → dist/developer/*.html.md
 *                           placeholders filled, doc links → twins)
 *   src/llms.txt          → copied             → dist/llms.txt
 *   src/developer/llms.txt→ copied             → dist/developer/llms.txt
 *   src/talks.json        → talks list with    → dist/talks.html
 *     + src/templates/talks-template.html
 *   src/developer/open-issues.json → copied    → dist/developer/open-issues.json
 *
 * src/site.json holds the values that change between releases (version,
 * download stats, site url).
 * src/data/release-digests.json holds GitHub asset SHA-256 digests for the
 * current version (refresh with `npm run digests`).
 *
 * Run with `npm run build`. `dist/` is git-ignored and reproducible from src/
 * (dates come from the posts and from git, never from the clock).
 * FAQ_DRAFTS=1 npm run build also renders FAQ entries still marked TODO.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { marked, Marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const PAGES_DIR = path.join(SRC, 'pages');
const STATIC_DIR = path.join(SRC, 'static');
const IMAGES_DIR = path.join(SRC, 'images');
const CONTENT_DIR = path.join(SRC, 'content');
const TEMPLATES_DIR = path.join(SRC, 'templates');
const PARTIALS_DIR = path.join(SRC, 'partials');
const ASSETS_DIR = path.join(SRC, 'assets');
const DEVELOPER_DIR = path.join(SRC, 'developer');
const SITE = JSON.parse(fs.readFileSync(path.join(SRC, 'site.json'), 'utf-8'));

const BRAND = 'Freedom Browser';
const DEFAULT_IMAGE = 'images/freedom-og.jpg';
const DEFAULT_IMAGE_ALT = 'Freedom Browser: the browser for a user-owned internet';
const LATEST_POSTS_ON_HOME = 3;

// Developer docs (markdown under src/developer/, rendered with docs-template).
// Tabs across the top; each page belongs to one tab and one left-nav group.
// Title, description, kick and dek come from each page's front matter.
const DOC_TABS = [
  { id: 'overview', label: 'Overview', href: './' },
  { id: 'swarm', label: 'Swarm', href: 'swarm-hub.html' },
  { id: 'radicle', label: 'Radicle', href: 'radicle-hub.html' },
  { id: 'demos', label: 'Demos', href: 'demos.html' },
  { id: 'contribute', label: 'Contribute', href: 'contributing.html' },
];

// Entries with `link` instead of `content` are left-nav shortcuts only (no page
// is rendered); "Related demos" uses them to point at the Demos tab.
const DOCS = [
  { content: 'index.md', output: 'developer/index.html', tab: 'overview', group: 'Get started', nav: 'Overview' },
  { content: 'guide-permissions.md', output: 'developer/guide-permissions.html', tab: 'overview', group: 'Shared guides', nav: 'Permissions and identity' },
  { content: 'guide-errors.md', output: 'developer/guide-errors.html', tab: 'overview', group: 'Shared guides', nav: 'Errors and node readiness' },

  { content: 'swarm-hub.md', output: 'developer/swarm-hub.html', tab: 'swarm', group: 'Get started', nav: 'Overview' },
  { content: 'quickstart.md', output: 'developer/quickstart.html', tab: 'swarm', group: 'Get started', nav: 'Quickstart' },
  { content: 'guide-feeds.md', output: 'developer/guide-feeds.html', tab: 'swarm', group: 'Guides', nav: 'Feeds and mutable content' },
  { content: 'guide-messaging.md', output: 'developer/guide-messaging.html', tab: 'swarm', group: 'Guides', nav: 'Live messaging' },
  { content: 'guide-swarm-kit.md', output: 'developer/guide-swarm-kit.html', tab: 'swarm', group: 'Guides', nav: 'swarm-kit' },
  { content: 'swarm.md', output: 'developer/swarm.html', tab: 'swarm', group: 'API reference', nav: 'window.swarm' },
  { link: 'demos.html#swarmit', tab: 'swarm', group: 'Related demos', nav: 'Swarmit' },
  { link: 'demos.html#freedom-community', tab: 'swarm', group: 'Related demos', nav: 'Freedom Community' },
  { link: 'demos.html#swarm-kit-examples', tab: 'swarm', group: 'Related demos', nav: 'swarm-kit examples' },

  { content: 'radicle-hub.md', output: 'developer/radicle-hub.html', tab: 'radicle', group: 'Get started', nav: 'Overview' },
  { content: 'guide-radicle.md', output: 'developer/guide-radicle.html', tab: 'radicle', group: 'Guides', nav: 'Radicle repos and issues' },
  { content: 'radicle.md', output: 'developer/radicle.html', tab: 'radicle', group: 'API reference', nav: 'window.radicle' },
  { content: 'rad-urls.md', output: 'developer/rad-urls.html', tab: 'radicle', group: 'API reference', nav: 'rad: URLs' },
  { link: 'demos.html#canopy', tab: 'radicle', group: 'Related demos', nav: 'Canopy' },

  { content: 'demos.md', output: 'developer/demos.html', tab: 'demos', group: 'Demos', nav: 'Apps and examples' },

  { content: 'contributing.md', output: 'developer/contributing.html', tab: 'contribute', group: 'Get started', nav: 'Setup' },
  { content: 'architecture.md', output: 'developer/architecture.html', tab: 'contribute', group: 'Get started', nav: 'Architecture' },
  { content: 'repositories.md', output: 'developer/repositories.html', tab: 'contribute', group: 'Get started', nav: 'Repositories' },
  { content: 'workflow.md', output: 'developer/workflow.html', tab: 'contribute', group: 'Get started', nav: 'Workflow and pull requests' },
  { content: 'open-issues.md', output: 'developer/open-issues.html', tab: 'contribute', group: 'Help wanted', nav: 'Open for contribution' },
  { content: 'community.md', output: 'developer/community.html', tab: 'contribute', group: 'Help wanted', nav: 'Community and mentorship' },
];
const DOC_PAGES = DOCS.filter((d) => d.content);

// Markdown posts to render. Each entry maps a content file + template to a
// generated page in dist/.
// Newest first; the order is also the order of the news list and the feed.
// kind: 'release' + version → listed on dist/releases.html (and releases.xml).
// Optional here (they win over the post's front matter): description, imageAlt.
const POSTS = [
  {
    content: 'freedom-0-8-8-agent.md',
    template: 'post-template.html',
    output: 'freedom-0-8-8-agent.html',
    kind: 'release',
    version: '0.8.8',
    summary: 'Freedom Agent: an assistant in the browser that builds, publishes and names decentralized sites from one prompt.',
    imageAlt: 'Freedom 0.8.8 with Freedom Agent registering littlecorner.gwei and publishing the site to Swarm',
  },
  {
    content: 'freedom-0-8-7.md',
    template: 'post-template.html',
    output: 'freedom-0-8-7.html',
    kind: 'release',
    version: '0.8.7',
    summary: 'Swarm browsing credit, a pop-up blocker, simpler publishing payments and a large round of fixes.',
  },
  {
    content: 'freedom-0-8-6.md',
    template: 'post-template.html',
    output: 'freedom-0-8-6.html',
    kind: 'release',
    version: '0.8.6',
    summary: 'External IPFS nodes, ENSv2 readiness, settings search and Arch packages.',
  },
  {
    content: 'freedom-0-8-5-daily-driver.md',
    template: 'post-template.html',
    output: 'freedom-0-8-5-daily-driver.html',
    kind: 'release',
    version: '0.8.5',
    summary: 'The first release you can use as your only browser, now with Ethereum and Tor nodes.',
    description: 'Freedom 0.8.5 is the first release you can use as your only browser, with ad and tracker blocking on by default, private windows, and Ethereum and Tor nodes.',
    imageAlt: 'Freedom 0.8.5 showing its start page with the node status panel open',
  },
  {
    content: 'freedom-0-8-0.md',
    template: 'post-template.html',
    output: 'freedom-0-8-0.html',
    kind: 'release',
    version: '0.8.0',
    summary: 'In-house Ant and freedom-ipfs nodes replace Bee and Kubo, plus multiple profiles.',
  },
  {
    content: 'freedom-0-7-4.md',
    template: 'post-template.html',
    output: 'freedom-0-7-4.html',
    kind: 'release',
    version: '0.7.4',
    summary: 'Native x402 payments from the wallet and Swarm publisher identities.',
  },
  {
    content: 'freedom-0-7-3.md',
    template: 'post-template.html',
    output: 'freedom-0-7-3.html',
    kind: 'release',
    version: '0.7.3',
    summary: 'Bee 2.8.0, a breaking peer-to-peer upgrade for the Swarm node.',
  },
  {
    content: 'freedom-0-7-2.md',
    template: 'post-template.html',
    output: 'freedom-0-7-2.html',
    kind: 'release',
    version: '0.7.2',
    summary: 'Cryptographic ENS verification via Colibri and a unified network registry.',
  },
  {
    content: 'freedom-0-7-1.md',
    template: 'post-template.html',
    output: 'freedom-0-7-1.html',
    kind: 'release',
    version: '0.7.1',
    summary: 'ENS verified across public RPCs, and native bzz://, ipfs:// and ipns:// schemes.',
  },
  {
    content: 'freedom-0-7-0.md',
    template: 'post-template.html',
    output: 'freedom-0-7-0.html',
    kind: 'release',
    version: '0.7.0',
    summary: 'Experimental wallet and identity, dApp connections and Swarm publishing.',
  },
  {
    content: 'freedom-0-6-2.md',
    template: 'post-template.html',
    output: 'freedom-0-6-2.html',
    kind: 'release',
    version: '0.6.2',
    summary: 'Experimental Radicle on macOS and Linux, plus Swarm encrypted references.',
  },
  {
    content: 'freedom-0-6-1.md',
    template: 'post-template.html',
    output: 'freedom-0-6-1.html',
    kind: 'release',
    version: '0.6.1',
    summary: 'First public open-source release, with shortcuts, DoH and security hardening.',
  },
  {
    content: 'introducing-freedom.md',
    template: 'post-template.html',
    output: 'introducing-freedom.html',
    kind: 'release',
    version: '0.6.0',
    summary: 'The first public preview: a minimalist browser that loads Swarm and IPFS content straight from peers.',
    imageAlt: 'Freedom showing its start page with the Swarm and IPFS node status panel open',
  },
];

// The homepage "What's new" link follows SITE.version: the release post when
// one is tagged with that version, otherwise the changelog pinned to the
// release branch. Derived here (not stored in site.json) so a version bump can
// never leave the link pointing at the previous release.
const releasePost = POSTS.find((p) => p.version === SITE.version);
SITE.whats_new_href = releasePost
  ? releasePost.output
  : `https://github.com/solardev-xyz/freedom-browser/blob/release/${SITE.version}/CHANGELOG.md`;
SITE.whats_new_label = `What's new in ${SITE.version}`;

// --- small helpers -------------------------------------------------------------

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeXml(s) {
  return escapeHtml(s).replace(/'/g, '&apos;');
}

const abs = (p) => new URL(p, SITE.url).href;

/** Last commit date (YYYY-MM-DD) touching any of the files, or null outside git. */
function gitDate(...files) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', ...files], {
      cwd: ROOT, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

const maxDate = (...ds) => ds.filter(Boolean).sort().pop() || null;

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
  'september', 'october', 'november', 'december'];

/** "1 November 2026" → "2026-11-01" (no time zone games). */
function isoDate(human) {
  const m = human && human.match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase()) + 1;
  if (!month) return null;
  return `${m[3]}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/** "2026-11-01" → RFC 822 date for RSS. */
function rfc822(iso) {
  return new Date(`${iso}T00:00:00Z`).toUTCString().replace('GMT', '+0000');
}

/** Pixel size of a JPEG, PNG or WebP file, for og:image:width/height. */
function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  }
  throw new Error(`can't read the size of ${file}`);
}

// --- front matter ----------------------------------------------------------------

function parseKeyValues(block) {
  const meta = {};
  block.split('\n').forEach((line) => {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) meta[match[1]] = match[2].trim();
  });
  return meta;
}

/** Markdown: leading "---" block. */
function parseFrontmatter(md) {
  if (md.startsWith('---\n')) {
    const endIndex = md.indexOf('\n---\n', 4);
    if (endIndex !== -1) {
      return {
        meta: parseKeyValues(md.substring(4, endIndex)),
        content: md.substring(endIndex + 5).replace(/^\n+/, ''),
      };
    }
  }
  return { meta: {}, content: md };
}

/** HTML pages: leading "<!-- … -->" block. */
function parsePageFrontmatter(html) {
  const m = html.match(/^<!--\n([\s\S]*?)\n-->\n/);
  if (!m) return { meta: {}, content: html };
  return { meta: parseKeyValues(m[1]), content: html.slice(m[0].length) };
}

function extractTitle(md) {
  const match = md.match(/^# (.+)$/m);
  return match ? match[1] : 'Blog Post';
}

function extractDate(md) {
  const match = md.match(/^# .+\n\n\*([^*]+)\*$/m);
  return match ? match[1] : null;
}

function extractDescription(md) {
  let content = md.replace(/^# .+\n/, '').replace(/^\n\*[^*]+\*\n/, '');
  const match = content.match(/^\n*([^\n#]+)/);
  if (match) {
    let desc = match[1]
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();
    if (desc.length > 160) desc = desc.substring(0, 157) + '...';
    return desc;
  }
  return 'A blog post from Freedom Browser';
}

/** Page title with the brand once: "Introducing Freedom" stays, "Imprint" → "Imprint — Freedom Browser". */
function brandTitle(title) {
  return /\bFreedom\b/.test(title) ? title : `${title} — ${BRAND}`;
}

// --- templating ---------------------------------------------------------------------

function expandPartials(text, depth = 0) {
  if (depth > 5) throw new Error('partials nested too deeply');
  return text.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (m, name) =>
    expandPartials(fs.readFileSync(path.join(PARTIALS_DIR, `${name}.html`), 'utf-8'), depth + 1));
}

/** Fill {{key}} with site.json values in plain text (the Markdown twins); unknown keys stay. */
function fillSite(text) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in SITE ? String(SITE[key]) : m));
}

function render(template, vars, label) {
  return expandPartials(template).replace(/\{\{(\w+)\}\}/g, (m, key) => {
    if (!(key in vars) || vars[key] === undefined || vars[key] === null) {
      throw new Error(`${label}: no value for {{${key}}}`);
    }
    return key.endsWith('Html') ? String(vars[key]) : escapeHtml(vars[key]);
  });
}

function jsonLdScript(data) {
  if (!data) return '';
  // "</" can't appear inside a <script> element
  return `  <script type="application/ld+json">${JSON.stringify(data).replace(/<\//g, '<\\/')}</script>\n`;
}

/** Shared head/nav values for a page served at `pagePath` (e.g. "", "news.html", "developer/"). */
function pageVars(pagePath, meta) {
  const depth = pagePath.split('/').length - 1;
  const root = meta.root !== undefined ? meta.root : '../'.repeat(depth);
  const image = meta.image || DEFAULT_IMAGE;
  const size = imageSize(path.join(SRC, image));
  const noindex = /noindex/.test(meta.robots || '');
  return {
    ...SITE,
    title: meta.title,
    ogTitle: meta.ogTitle || meta.title,
    description: meta.description,
    ogType: meta.ogType || 'website',
    canonical: SITE.url + pagePath,
    imageUrl: abs(image),
    imageWidth: size.width,
    imageHeight: size.height,
    imageAlt: meta.imageAlt || DEFAULT_IMAGE_ALT,
    robotsHtml: meta.robots ? `  <meta name="robots" content="${escapeHtml(meta.robots)}">\n` : '',
    // A noindex page (404) has no URL of its own worth pointing crawlers at.
    canonicalHtml: noindex ? '' : `  <link rel="canonical" href="${escapeHtml(SITE.url + pagePath)}">\n`,
    ogUrlHtml: noindex ? '' : `  <meta property="og:url" content="${escapeHtml(SITE.url + pagePath)}">\n`,
    articleMetaHtml: '',
    jsonLdHtml: '',
    root,
    homeHref: root || './',
    homeAnchor: pagePath === '' ? '' : root || './',
    // Top-nav current-page cue; every developer/ page sits under "Developers".
    navNewsCurrentHtml: pagePath === 'news.html' ? ' aria-current="page"' : '',
    navTalksCurrentHtml: pagePath === 'talks.html' ? ' aria-current="page"' : '',
    navDevelopersCurrentHtml: pagePath.startsWith('developer/') ? ' aria-current="page"' : '',
  };
}

// --- structured data -----------------------------------------------------------------

const ORG_ID = `${SITE.url}#organization`;
const SITE_ID = `${SITE.url}#website`;
const APP_ID = `${SITE.url}#software`;

const organization = () => ({
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Freedom GmbH',
  url: SITE.url,
  logo: { '@type': 'ImageObject', url: abs('images/logo/freedom-icon-rounded-dark.png'), width: 1024, height: 1024 },
  email: 'info@freedom.baby',
  sameAs: [
    'https://github.com/solardev-xyz/freedom-browser',
    'https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE',
    'https://bsky.app/profile/freedombrowser.bsky.social',
    'https://t.me/freedom_browser',
  ],
});

const website = () => ({
  '@type': 'WebSite',
  '@id': SITE_ID,
  name: BRAND,
  alternateName: 'Freedom',
  url: SITE.url,
  inLanguage: 'en',
  publisher: { '@id': ORG_ID },
});

const softwareApplication = () => ({
  '@type': 'SoftwareApplication',
  '@id': APP_ID,
  name: BRAND,
  alternateName: 'Freedom',
  description: 'A free, open-source browser with built-in Swarm and IPFS nodes, ENS names, a wallet and an AI agent.',
  applicationCategory: 'BrowserApplication',
  operatingSystem: 'macOS, Windows, Linux',
  softwareVersion: SITE.version,
  releaseNotes: `https://github.com/solardev-xyz/freedom-browser/blob/release/${SITE.version}/CHANGELOG.md`,
  downloadUrl: `${SITE.url}#download`,
  url: SITE.url,
  image: abs(DEFAULT_IMAGE),
  screenshot: abs('images/freedom-0.8.8-hero.webp'),
  license: 'https://www.mozilla.org/en-US/MPL/2.0/',
  codeRepository: [
    'https://github.com/solardev-xyz/freedom-browser',
    'https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE',
  ],
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
  publisher: { '@id': ORG_ID },
});

const breadcrumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: url })),
});

const graph = (...nodes) => ({ '@context': 'https://schema.org', '@graph': nodes });

// --- FAQ --------------------------------------------------------------------------------

/**
 * src/content/faq.md: one "## Question" heading per entry, the answer below it
 * in Markdown. An entry containing a line that starts with "TODO" is a draft:
 * it is left out of the site (and the JSON-LD) unless FAQ_DRAFTS=1.
 * HTML comments are notes for editors and never reach the page.
 */
function loadFaq() {
  const file = path.join(CONTENT_DIR, 'faq.md');
  if (!fs.existsSync(file)) return [];
  const { content } = parseFrontmatter(fs.readFileSync(file, 'utf-8'));
  const drafts = process.env.FAQ_DRAFTS === '1';
  const entries = [];
  for (const chunk of content.replace(/<!--[\s\S]*?-->/g, '').split(/^## /m).slice(1)) {
    const nl = chunk.indexOf('\n');
    const question = chunk.slice(0, nl).trim();
    const answer = chunk.slice(nl + 1).trim();
    const draft = /^TODO/m.test(answer) || !answer;
    if (draft && !drafts) {
      console.log(`  skipped   FAQ draft: ${question}`);
      continue;
    }
    entries.push({ question, answerHtml: marked(answer).trim(), draft });
  }
  return entries;
}

function renderFaqHtml(entries) {
  return entries
    .map((e) => `      <details class="qa"${e.draft ? ' data-draft' : ''}>\n        <summary><h3>${escapeHtml(e.question)}</h3></summary>\n        <div class="answer">${e.answerHtml}</div>\n      </details>`)
    .join('\n');
}

const faqPage = (entries) => ({
  '@type': 'FAQPage',
  '@id': `${SITE.url}#faq`,
  mainEntity: entries.map((e) => ({
    '@type': 'Question',
    name: e.question,
    acceptedAnswer: { '@type': 'Answer', text: e.answerHtml },
  })),
});

// --- posts --------------------------------------------------------------------------------

function loadPost(post) {
  const rawMarkdown = fs.readFileSync(path.join(CONTENT_DIR, post.content), 'utf-8');
  const { meta, content: markdown } = parseFrontmatter(rawMarkdown);
  const title = meta.title || extractTitle(markdown);
  const date = extractDate(markdown);
  const iso = isoDate(date);
  if (!iso) throw new Error(`${post.content}: the date line under the title must read like "1 November 2026"`);
  let content = markdown.replace(/^# .+\n/, '');
  if (date) content = content.replace(/^\n\*[^*]+\*\n/, '');
  return {
    ...post,
    title,
    date,
    iso,
    modified: maxDate(iso, gitDate(path.join('src', 'content', post.content))),
    description: post.description || meta.description || extractDescription(markdown),
    image: meta.image || DEFAULT_IMAGE,
    imageAlt: post.imageAlt || meta.imageAlt || title,
    html: marked(content),
    summary: post.summary || meta.description,
  };
}

function renderPost(post) {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, post.template), 'utf-8');
  const vars = pageVars(post.output, {
    title: brandTitle(post.title),
    ogTitle: post.title,
    description: post.description,
    ogType: 'article',
    image: post.image,
    imageAlt: post.imageAlt,
  });
  vars.articleMetaHtml =
    `  <meta property="article:published_time" content="${post.iso}">\n` +
    `  <meta property="article:modified_time" content="${post.modified}">\n`;
  vars.jsonLdHtml = jsonLdScript(graph(
    {
      '@type': 'BlogPosting',
      '@id': `${vars.canonical}#article`,
      headline: post.title,
      description: post.description,
      image: { '@type': 'ImageObject', url: vars.imageUrl, width: vars.imageWidth, height: vars.imageHeight },
      datePublished: post.iso,
      dateModified: post.modified,
      inLanguage: 'en',
      url: vars.canonical,
      mainEntityOfPage: vars.canonical,
      author: { '@id': ORG_ID },
      publisher: { '@id': ORG_ID },
      isPartOf: { '@id': SITE_ID },
      about: { '@id': APP_ID },
    },
    organization(),
    breadcrumbs([['Home', SITE.url], ['News', abs('news.html')], [post.title, vars.canonical]]),
  ));
  Object.assign(vars, { postTitle: post.title, date: post.date, dateIso: post.iso, contentHtml: post.html });
  fs.writeFileSync(path.join(DIST, post.output), render(template, vars, post.template));
  console.log(`  rendered  src/content/${post.content} → dist/${post.output}`);
}

function postListHtml(posts, heading) {
  return posts
    .map((p) => `  <a class="post" href="${p.output}"><time datetime="${p.iso}">${escapeHtml(p.date)}</time><div><${heading} class="post-title">${escapeHtml(p.title)}</${heading}><span>${escapeHtml(p.summary)}</span></div></a>`)
    .join('\n');
}


// --- developer docs -----------------------------------------------------------

function stripTags(html) {
  return String(html).replace(/<[^>]+>/g, '');
}

function slugify(text) {
  return stripTags(text)
    .replace(/&[a-z]+;|&#\d+;/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section';
}

const BADGE_RE = /\s*<(a|span) class="badge[^"]*"[^>]*>[\s\S]*?<\/\1>/g;

/**
 * Render a doc's markdown with id'd headings. An explicit trailing `{#id}`
 * wins; a heading that starts with a `swarm_*` / `radicle_*` method name uses
 * that name; otherwise the text is slugified. h2/h3 are collected for the
 * "On this page" table of contents.
 */
function renderDocMarkdown(md) {
  const toc = [];
  const used = new Set();
  const md2 = new Marked();
  md2.use({
    renderer: {
      heading({ tokens, depth, text }) {
        let inner = this.parser.parseInline(tokens);
        let id;
        const explicit = inner.match(/\s*\{#([A-Za-z0-9_-]+)\}\s*$/);
        if (explicit) {
          id = explicit[1];
          inner = inner.slice(0, explicit.index);
        } else {
          const method = String(text).match(/^`((?:swarm|radicle)_\w+)`/);
          id = method ? method[1] : slugify(inner.replace(BADGE_RE, ''));
        }
        let unique = id;
        for (let n = 2; used.has(unique); n++) unique = `${id}-${n}`;
        used.add(unique);
        if (depth === 2 || depth === 3) {
          toc.push({ depth, id: unique, label: inner.replace(BADGE_RE, '').replace(/<a [^>]*>|<\/a>/g, '').trim() });
        }
        return `<h${depth} id="${unique}">${inner}<a class="h-anchor" href="#${unique}" aria-label="Link to this section">#</a></h${depth}>\n`;
      },
    },
  });
  return { html: md2.parse(md), toc };
}

function renderToc(toc) {
  if (toc.length < 2) return '';
  return toc
    .map((t) => `<li class="toc-h${t.depth}"><a href="#${t.id}">${t.label}</a></li>`)
    .join('\n');
}

function docHref(output) {
  const base = path.basename(output);
  return base === 'index.html' ? './' : base;
}

function renderTabs(current) {
  return DOC_TABS.map((t) =>
    `<a href="${t.href}"${t.id === current.tab ? ' aria-current="page"' : ''}>${escapeHtml(t.label)}</a>`
  ).join('\n        ');
}

function renderSideNav(current) {
  const pages = DOCS.filter((d) => d.tab === current.tab);
  const groups = [];
  for (const d of pages) {
    let g = groups.find((x) => x.label === d.group);
    if (!g) groups.push((g = { label: d.group, pages: [] }));
    g.pages.push(d);
  }
  return groups.map((g) =>
    `<p class="docs-nav-label">${escapeHtml(g.label)}</p>\n` +
    g.pages.map((d) =>
      `<a href="${d.link || docHref(d.output)}"${d === current ? ' aria-current="page"' : ''}>${escapeHtml(d.nav)}</a>`
    ).join('\n')
  ).join('\n');
}

const OPEN_ISSUES_PATH = path.join(DEVELOPER_DIR, 'open-issues.json');
const KIND_LABEL = { bug: 'Bug', dx: 'Developer experience', 'feature-request': 'Feature request' };

function formatDate(iso) {
  const d = new Date(iso + 'T12:00:00Z');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

function renderIssueCard(i) {
  const badges = [`<span class="badge kind-${i.kind}">${KIND_LABEL[i.kind] || i.kind}</span>`];
  if (i.source === 'community') badges.push('<span class="badge community">Community</span>');
  if (i.committed === false) badges.push('<span class="badge proposal">Proposal · not on the roadmap</span>');
  if (i.difficulty) badges.push(`<span class="badge difficulty">${escapeHtml(i.difficulty === 'starter' ? 'Good first issue' : i.difficulty)}</span>`);
  return `<li class="issue-card">
  <div class="issue-head"><a class="issue-title" href="${escapeHtml(i.url)}"><span class="issue-num">#${i.number}</span> ${escapeHtml(i.title)}</a></div>
  <div class="issue-badges">${badges.join(' ')}</div>
  <p>${escapeHtml(i.summary)}</p>
  <p class="issue-meta">Opened by ${escapeHtml(i.author)} · checked ${formatDate(i.last_checked)}</p>
</li>`;
}

/** Load and validate src/developer/open-issues.json (authored by hand; no API calls at build time). */
function loadOpenIssues() {
  const data = JSON.parse(fs.readFileSync(OPEN_ISSUES_PATH, 'utf-8'));
  const kinds = new Set(Object.keys(KIND_LABEL));
  for (const i of data.issues) {
    for (const f of ['number', 'title', 'url', 'area', 'kind', 'summary', 'last_checked']) {
      if (i[f] === undefined || i[f] === '') throw new Error(`open-issues.json: #${i.number} is missing ${f}`);
    }
    if (!kinds.has(i.kind)) throw new Error(`open-issues.json: #${i.number} has unknown kind ${i.kind}`);
    if (!data.areas.some((a) => a.id === i.area)) throw new Error(`open-issues.json: #${i.number} has unknown area ${i.area}`);
  }
  const isProposal = (i) => i.source === 'community' && i.kind === 'feature-request';
  const order = { bug: 0, dx: 1, 'feature-request': 2 };
  const sort = (a, b) => (order[a.kind] - order[b.kind]) || (b.number - a.number);
  const areas = data.areas
    .map((area) => ({ ...area, issues: data.issues.filter((i) => i.area === area.id && !isProposal(i)).sort(sort) }))
    .filter((a) => a.issues.length);
  const proposals = data.issues.filter(isProposal).sort((a, b) => b.number - a.number);
  return { areas, proposals, updated: formatDate(data.last_updated), count: data.issues.length };
}

const PROPOSALS_INTRO = 'Feature ideas from developers outside the core team. They are open for discussion, design and prototypes, but a proposal is not a commitment: items marked %BADGE% are not on the roadmap. Comment on the issue before you start building.';

/** Open issues as HTML cards for the docs page. */
function renderOpenIssues() {
  const { areas, proposals, updated, count } = loadOpenIssues();
  let html = '';
  for (const area of areas) {
    html += `<h2 id="${area.id}">${escapeHtml(area.label)}<a class="h-anchor" href="#${area.id}" aria-label="Link to this section">#</a></h2>\n<ul class="issue-list">\n${area.issues.map(renderIssueCard).join('\n')}\n</ul>\n`;
  }
  if (proposals.length) {
    html += `<h2 id="community-proposals">Community proposals<a class="h-anchor" href="#community-proposals" aria-label="Link to this section">#</a></h2>
<p>${PROPOSALS_INTRO.replace('%BADGE%', '<span class="badge proposal">Proposal · not on the roadmap</span>')}</p>
<ul class="issue-list">\n${proposals.map(renderIssueCard).join('\n')}\n</ul>\n`;
  }
  const toc = areas.map((a) => ({ depth: 2, id: a.id, label: escapeHtml(a.label) }));
  if (proposals.length) toc.push({ depth: 2, id: 'community-proposals', label: 'Community proposals' });
  return { html, toc, updated, count };
}

// Inline Markdown helpers for values from open-issues.json: keep each value on
// its own line of the list item, and stop `[`/`]`/`(`/`)` from closing a link.
const mdLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
// A summary that starts like a block (`- `, `# `, `> `, `1. `) would nest.
const mdParagraph = (s) => mdLine(s).replace(/^[-+*#>]/, '\\$&').replace(/^(\d+)([.)])/, '$1\\$2');
const mdLinkText = (s) => mdLine(s).replace(/[\\[\]]/g, '\\$&');
const mdLinkUrl = (s) => mdLine(s).replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');

/** Open issues as a Markdown list for the page's .html.md twin. */
function renderOpenIssuesMarkdown() {
  const { areas, proposals, updated, count } = loadOpenIssues();
  const item = (i) => {
    const tags = [KIND_LABEL[i.kind] || i.kind];
    if (i.source === 'community') tags.push('Community');
    if (i.committed === false) tags.push('Proposal, not on the roadmap');
    if (i.difficulty) tags.push(i.difficulty === 'starter' ? 'Good first issue' : i.difficulty);
    return `- [#${i.number} ${mdLinkText(i.title)}](${mdLinkUrl(i.url)}) (${tags.join(', ')})\n  ${mdParagraph(i.summary)}\n  Opened by ${mdLine(i.author)} · checked ${formatDate(i.last_checked)}`;
  };
  let md = areas.map((a) => `## ${a.label}\n\n${a.issues.map(item).join('\n')}`).join('\n\n');
  if (proposals.length) {
    md += `\n\n## Community proposals\n\n${PROPOSALS_INTRO.replace('%BADGE%', '**Proposal · not on the roadmap**')}\n\n${proposals.map(item).join('\n')}`;
  }
  return { md, updated, count };
}

// Doc pages by HTML file name, for pointing twin links at other twins.
const DOC_BASENAMES = new Set(DOC_PAGES.map((d) => path.basename(d.output)));

/**
 * Build the .html.md twin: the source markdown (YAML front matter kept) with
 * build-time placeholders filled, and relative links to other doc pages
 * pointed at their twins (`swarm.html#x` → `swarm.html.md#x`, `./` →
 * `index.html.md`). Fenced code is left alone.
 */
function renderDocTwin(rawMarkdown) {
  let md = rawMarkdown;
  if (md.includes('{{open_issues}}')) {
    const issues = renderOpenIssuesMarkdown();
    md = md
      .replace(/^\{\{open_issues\}\}$/m, () => issues.md)
      .replace(/\{\{open_issues_updated\}\}/g, issues.updated)
      .replace(/\{\{open_issues_count\}\}/g, String(issues.count));
  }
  const twin = (target) => {
    const m = target.match(/^(\.\/|[\w.-]+\.html)(#[\w-]*)?$/);
    if (!m) return null;
    const file = m[1] === './' ? 'index.html' : m[1];
    return DOC_BASENAMES.has(file) ? `${file}.md${m[2] || ''}` : null;
  };
  md = md
    .split(/(^```[\s\S]*?^```)/m)
    .map((part, n) => (n % 2 ? part : part
      .replace(/\]\(([^)\s]+)\)/g, (all, t) => (twin(t) ? `](${twin(t)})` : all))
      .replace(/href="([^"]+)"/g, (all, t) => (twin(t) ? `href="${twin(t)}"` : all))))
    .join('');
  return fillSite(md);
}

function renderDoc(doc) {
  const contentPath = path.join(DEVELOPER_DIR, doc.content);
  const templatePath = path.join(TEMPLATES_DIR, 'docs-template.html');
  const template = fs.readFileSync(templatePath, 'utf-8');
  const rawMarkdown = fs.readFileSync(contentPath, 'utf-8');
  const { meta, content: markdown } = parseFrontmatter(rawMarkdown);

  const title = meta.title || extractTitle(markdown);
  const description = meta.description || extractDescription(markdown);
  const kick = meta.kick || DOC_TABS.find((t) => t.id === doc.tab).label;
  const dek = meta.dek || '';

  // Drop the leading H1 — the page header already shows the title.
  const body = markdown.replace(/^# .+\n+/, '');
  let { html, toc } = renderDocMarkdown(body);

  if (html.includes('{{open_issues}}')) {
    const issues = renderOpenIssues();
    html = html
      .replace(/<p>\{\{open_issues\}\}<\/p>/, issues.html)
      .replace(/\{\{open_issues_updated\}\}/g, issues.updated)
      .replace(/\{\{open_issues_count\}\}/g, String(issues.count));
    toc = toc.concat(issues.toc);
  }

  const source = meta.source
    ? `<a class="docs-source" href="${escapeHtml(meta.source)}">Source on GitHub</a>`
    : '';
  const tocHtml = renderToc(toc);

  const pagePath = doc.output === 'developer/index.html' ? 'developer/' : doc.output;
  const vars = pageVars(pagePath, { title: brandTitle(title), ogTitle: title, description });
  vars.jsonLdHtml = jsonLdScript(graph(
    organization(),
    breadcrumbs([['Home', SITE.url], ['Developers', abs('developer/')], ...(pagePath === 'developer/' ? [] : [[title, vars.canonical]])]),
  ));
  Object.assign(vars, {
    docTitle: title,
    kick,
    dekHtml: dek ? `<p class="docs-dek">${escapeHtml(dek)}</p>` : '',
    tabsHtml: renderTabs(doc),
    sidenavHtml: renderSideNav(doc),
    tocHtml,
    toc_class: tocHtml ? '' : ' no-toc',
    sourceHtml: source,
    contentHtml: html,
  });

  // Markdown twin beside the HTML page (llmstxt.org: page.html.md).
  // Keep YAML front matter from the source; agents fetch this instead of HTML.
  vars.md_href = path.basename(doc.output) + '.md'; // same directory as the HTML page

  indexDoc(doc, title, kick, description, html);

  const outPath = path.join(DIST, doc.output);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, render(template, vars, 'docs-template.html'));
  fs.writeFileSync(path.join(DIST, doc.output + '.md'), renderDocTwin(rawMarkdown));
  console.log(`  rendered  src/developer/${doc.content} → dist/${doc.output}`);
  console.log(`  twin      src/developer/${doc.content} → dist/${doc.output}.md`);
}

// --- docs search index -------------------------------------------------------

// One entry per page section (intro + every h2/h3), built from the rendered
// HTML so the index matches exactly what readers see. Served as a static JSON
// file and searched client-side by assets/docs-search.js (no external service).
const SEARCH_INDEX = [];

function htmlToText(html) {
  return stripTags(html.replace(/<a class="h-anchor"[^>]*>#<\/a>/g, '').replace(/<(\/p|br|li|\/h\d|\/pre|\/td|\/th)[^>]*>/g, ' $&'))
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ').trim();
}

function indexDoc(doc, title, kick, description, html) {
  const href = docHref(doc.output);
  const parts = html.split(/(?=<h[23] id=")/);
  parts.forEach((part, i) => {
    const m = part.match(/^<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/);
    const heading = m ? htmlToText(m[3].replace(BADGE_RE, '')) : '';
    const text = htmlToText(m ? part.slice(m[0].length) : part);
    if (!m && !text && i > 0) return;
    SEARCH_INDEX.push({
      p: title, k: kick, u: m ? `${href}#${m[2]}` : href,
      h: heading, t: (m ? text : `${description} ${text}`.trim()).slice(0, 4000),
    });
  });
}

function writeSearchIndex() {
  fs.writeFileSync(path.join(DIST, 'developer', 'search-index.json'), JSON.stringify(SEARCH_INDEX));
  console.log(`  wrote     developer/search-index.json (${SEARCH_INDEX.length} sections)`);
}

function renderNews(posts) {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'news-template.html'), 'utf-8');
  const vars = pageVars('news.html', {
    title: 'News — Freedom Browser',
    ogTitle: 'Freedom Browser news',
    description: 'Releases and updates from the Freedom team: what is new in Freedom Browser, the decentralized web browser with Swarm, IPFS, ENS and a wallet built in.',
  });
  vars.jsonLdHtml = jsonLdScript(graph(
    {
      '@type': 'Blog',
      '@id': `${vars.canonical}#blog`,
      name: 'Freedom Browser news',
      url: vars.canonical,
      publisher: { '@id': ORG_ID },
      blogPost: posts.map((p) => ({ '@type': 'BlogPosting', headline: p.title, url: abs(p.output), datePublished: p.iso })),
    },
    organization(),
    breadcrumbs([['Home', SITE.url], ['News', vars.canonical]]),
  ));
  vars.postsHtml = postListHtml(posts, 'h2');
  fs.writeFileSync(path.join(DIST, 'news.html'), render(template, vars, 'news-template.html'));
  console.log('  rendered  news list → dist/news.html');
}

function releaseListHtml(posts) {
  return posts
    .map((p) => '  <a class="post" href="' + p.output + '"><time datetime="' + p.iso + '">' + escapeHtml(p.date) + '</time><div><span class="post-ver">' + escapeHtml(p.version) + '</span><h2 class="post-title">' + escapeHtml(p.title) + '</h2><span>' + escapeHtml(p.summary) + '</span></div></a>')
    .join('\n');
}

function renderReleases(posts) {
  const releases = posts.filter((p) => p.kind === 'release' && p.version);
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'releases-template.html'), 'utf-8');
  const vars = pageVars('releases.html', {
    title: 'Releases — Freedom Browser',
    ogTitle: 'Freedom Browser releases',
    description: 'Release notes for every stable Freedom Browser version, newest first.',
  });
  vars.jsonLdHtml = jsonLdScript(graph(
    {
      '@type': 'CollectionPage',
      '@id': `${vars.canonical}#releases`,
      name: 'Freedom Browser releases',
      url: vars.canonical,
      isPartOf: { '@id': SITE_ID },
      hasPart: releases.map((p) => ({
        '@type': 'SoftwareApplication',
        name: `Freedom ${p.version}`,
        softwareVersion: p.version,
        applicationCategory: 'BrowserApplication',
        operatingSystem: 'macOS, Windows, Linux',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
        isVariantOf: { '@id': APP_ID },
        datePublished: p.iso,
        url: abs(p.output),
        releaseNotes: abs(p.output),
      })),
    },
    organization(),
    breadcrumbs([['Home', SITE.url], ['Releases', vars.canonical]]),
  ));
  vars.postsHtml = releaseListHtml(releases);
  fs.writeFileSync(path.join(DIST, 'releases.html'), render(template, vars, 'releases-template.html'));
  console.log('  rendered  releases list → dist/releases.html');
  return releases;
}

/** RSS 2.0 with the full post in content:encoded (links made absolute for readers). */
function writeFeed(posts) {
  const absolutize = (html) => html.replace(/\s(src|href)="(?![a-z][a-z0-9+.-]*:|#|\/\/)([^"]+)"/gi, (m, attr, url) => ` ${attr}="${abs(url)}"`);
  const items = posts.map((p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${abs(p.output)}</link>
      <guid isPermaLink="true">${abs(p.output)}</guid>
      <pubDate>${rfc822(p.iso)}</pubDate>
      <description>${escapeXml(p.summary)}</description>
      <content:encoded><![CDATA[${absolutize(p.html).replace(/]]>/g, ']]]]><![CDATA[>')}]]></content:encoded>
    </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Freedom Browser news</title>
    <link>${abs('news.html')}</link>
    <atom:link href="${abs('feed.xml')}" rel="self" type="application/rss+xml"/>
    <description>Releases and updates from the Freedom team.</description>
    <language>en</language>
    <image><url>${abs('apple-touch-icon.png')}</url><title>Freedom Browser news</title><link>${abs('news.html')}</link></image>
    <lastBuildDate>${rfc822(posts[0].iso)}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(DIST, 'feed.xml'), xml);
  console.log('  wrote     feed.xml');
}

/** Release-only RSS (same shape as feed.xml). */
function writeReleasesFeed(releases) {
  if (!releases.length) return;
  const absolutize = (html) => html.replace(/\s(src|href)="(?![a-z][a-z0-9+.-]*:|#|\/\/)([^"]+)"/gi, (m, attr, url) => ` ${attr}="${abs(url)}"`);
  const items = releases.map((p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${abs(p.output)}</link>
      <guid isPermaLink="true">${abs(p.output)}</guid>
      <pubDate>${rfc822(p.iso)}</pubDate>
      <description>${escapeXml(p.summary)}</description>
      <content:encoded><![CDATA[${absolutize(p.html).replace(/]]>/g, ']]]]><![CDATA[>')}]]></content:encoded>
    </item>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Freedom Browser releases</title>
    <link>${abs('releases.html')}</link>
    <atom:link href="${abs('releases.xml')}" rel="self" type="application/rss+xml"/>
    <description>Stable Freedom Browser release notes.</description>
    <language>en</language>
    <image><url>${abs('apple-touch-icon.png')}</url><title>Freedom Browser releases</title><link>${abs('releases.html')}</link></image>
    <lastBuildDate>${rfc822(releases[0].iso)}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(DIST, 'releases.xml'), xml);
  console.log('  wrote     releases.xml');
}

// --- static pages -----------------------------------------------------------------------

/** Render every HTML page from src/pages; returns sitemap entries. */
function renderPages(ctx) {
  const entries = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      const rel = path.relative(PAGES_DIR, full).split(path.sep).join('/');
      if (entry.isDirectory()) { walk(full); continue; }
      const out = path.join(DIST, rel);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      if (!entry.name.endsWith('.html')) { fs.copyFileSync(full, out); continue; }

      const { meta, content } = parsePageFrontmatter(fs.readFileSync(full, 'utf-8'));
      if (!meta.title || !meta.description) throw new Error(`src/pages/${rel}: front matter needs title and description`);
      const pagePath = rel === 'index.html' ? '' : rel.replace(/(^|\/)index\.html$/, '$1');
      const vars = pageVars(pagePath, meta);
      const crumbs = breadcrumbs([['Home', SITE.url], [meta.ogTitle || meta.title.replace(/ — Freedom Browser$/, ''), vars.canonical]]);
      if (pagePath === '') {
        const nodes = [organization(), website(), softwareApplication()];
        if (ctx.faq.length) nodes.push(faqPage(ctx.faq));
        vars.jsonLdHtml = jsonLdScript(graph(...nodes));
      } else if (!meta.robots) {
        vars.jsonLdHtml = jsonLdScript(graph(crumbs));
      }
      vars.faqHtml = renderFaqHtml(ctx.faq);
      vars.latestPostsHtml = postListHtml(ctx.posts.slice(0, LATEST_POSTS_ON_HOME), 'h3');
      fs.writeFileSync(out, render(content, vars, `src/pages/${rel}`));
      console.log(`  rendered  src/pages/${rel} → dist/${rel}`);

      if (meta.sitemap !== 'no' && !/noindex/.test(meta.robots || '')) {
        const sources = [path.join('src', 'pages', rel)];
        if (pagePath === '') sources.push('src/content/faq.md', 'src/site.json');
        entries.push({ loc: pagePath, lastmod: gitDate(...sources) });
      }
    }
  };
  walk(PAGES_DIR);
  return entries;
}

function formatTalkDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${d} ${months[m - 1]} ${y}`;
}

function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function durationIso8601(seconds) {
  const s = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  let out = 'PT';
  if (h) out += `${h}H`;
  if (m || h) out += `${m}M`;
  out += `${r}S`;
  return out;
}

function talkMetaLine(t) {
  const parts = [];
  if (t.event) parts.push(t.event);
  if (t.speaker) parts.push(t.speaker);
  if (t.date) parts.push(formatTalkDate(t.date));
  if (t.duration) parts.push(formatDuration(t.duration));
  return parts.join(' · ');
}

function talkThumb(t) {
  return t.thumbnail || `images/talks/${t.id}.webp`;
}

function renderTalks() {
  const talksPath = path.join(SRC, 'talks.json');
  const talks = JSON.parse(fs.readFileSync(talksPath, 'utf-8'))
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'talks-template.html'), 'utf-8');

  const featured = talks[0];
  const watch = (t) => `https://www.youtube.com/watch?v=${t.id}`;

  const featuredPlayer = [
    `      <a class="talk-facade" href="${watch(featured)}" rel="noopener noreferrer" target="_blank" aria-label="Play video: ${escapeHtml(featured.title)}">`,
    `        <img src="${escapeHtml(talkThumb(featured))}" alt="" width="1280" height="720" decoding="async">`,
    `        <span class="talk-play" aria-hidden="true"></span>`,
    `      </a>`,
  ].join('\n');

  const featuredDetails = [
    `      <h2 class="talk-title" id="talk-heading">${escapeHtml(featured.title)}</h2>`,
    `      <p class="talk-meta">${escapeHtml(talkMetaLine(featured))}</p>`,
    featured.description ? `      <p class="talk-desc">${escapeHtml(featured.description)}</p>` : '',
  ].filter(Boolean).join('\n');

  const railItems = talks.map((t, i) => {
    const curClass = i === 0 ? ' is-current' : '';
    const curAria = i === 0 ? ' aria-current="true"' : '';
    const curHidden = i === 0 ? ' hidden' : '';
    return [
      `      <a class="talk-rail-item${curClass}" href="${watch(t)}" data-slug="${escapeHtml(t.slug)}"${curAria}${curHidden} rel="noopener noreferrer" target="_blank">`,
      `        <span class="talk-rail-thumb"><img src="${escapeHtml(talkThumb(t))}" alt="" width="320" height="180" loading="eager" decoding="async"><span class="talk-play" aria-hidden="true"></span></span>`,
      `        <span class="talk-rail-body">`,
      `          <b>${escapeHtml(t.title)}</b>`,
      `          <span>${escapeHtml(t.event || t.channel || '')}</span>`,
      `        </span>`,
      `      </a>`,
    ].join('\n');
  }).join('\n');

  const clientData = talks.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    event: t.event || t.channel || '',
    speaker: t.speaker || '',
    date: t.date,
    duration: t.duration,
    thumbnail: talkThumb(t),
    description: t.description || '',
    meta: talkMetaLine(t),
  }));
  const dataHtml = `<script type="application/json" id="talks-data">\n${JSON.stringify(clientData).replace(/</g, '\\u003c')}\n</script>`;

  const talksHtml = [
    `<div class="talks-page" id="talks-app" data-active-slug="${escapeHtml(featured.slug)}">`,
    `  <div class="talks-stage">`,
    `    <div class="talk-player" id="talk-player" data-video-id="${escapeHtml(featured.id)}" data-slug="${escapeHtml(featured.slug)}">`,
    featuredPlayer,
    `    </div>`,
    `    <div class="talk-details" id="talk-details">`,
    featuredDetails,
    `    </div>`,
    `  </div>`,
    `  <aside class="talks-rail-wrap">`,
    `    <h2 class="talks-rail-heading">More talks</h2>`,
    `    <div class="talks-rail" id="talks-rail">`,
    railItems,
    `    </div>`,
    `  </aside>`,
    `</div>`,
    dataHtml,
  ].join('\n');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': talks.map((t) => {
      const obj = {
        '@type': 'VideoObject',
        name: t.title,
        description: t.description,
        thumbnailUrl: new URL(talkThumb(t), SITE.url).href,
        uploadDate: t.date,
        duration: durationIso8601(t.duration),
        embedUrl: `https://www.youtube-nocookie.com/embed/${t.id}`,
        contentUrl: watch(t),
      };
      if (t.speaker) obj.author = { '@type': 'Person', name: t.speaker };
      return obj;
    }),
  };
  const jsonLdHtml = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2).replace(/</g, '\\u003c')}\n</script>`;

  const vars = pageVars('talks.html', {
    title: 'Talks — Freedom Browser',
    ogTitle: 'Freedom Browser talks',
    description: 'Talks and interviews about Freedom Browser.',
  });
  vars.jsonLdHtml = `  ${jsonLdHtml}\n`;
  vars.talksHtml = talksHtml;
  fs.writeFileSync(path.join(DIST, 'talks.html'), render(template, vars, 'talks-template.html'));
  console.log(`  rendered  talks page (${talks.length}) → dist/talks.html`);
}

/** robots.txt + sitemap.xml for the public pages (absolute URLs from site.json). */
function writeSitemap(pageEntries, posts) {
  const order = (loc) => (loc === '' ? 0 : loc === 'news.html' ? 1 : loc === 'releases.html' ? 2 : 3);
  const entries = [
    ...pageEntries,
    { loc: 'news.html', lastmod: maxDate(posts[0].modified, gitDate('src/templates/news-template.html')) },
    { loc: 'talks.html', lastmod: gitDate('src/talks.json', 'src/templates/talks-template.html') },
    { loc: 'releases.html', lastmod: maxDate(...posts.filter((p) => p.kind === 'release').map((p) => p.modified), gitDate('src/templates/releases-template.html')) },
    ...posts.map((p) => ({ loc: p.output, lastmod: p.modified })),
    ...DOC_PAGES.map((d) => ({ loc: d.output === 'developer/index.html' ? 'developer/' : d.output, lastmod: gitDate(`src/developer/${d.content}`) })),
  ].sort((a, b) => order(a.loc) - order(b.loc));
  const urls = entries
    .map((e) => `  <url><loc>${SITE.url}${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`)
    .join('\n');
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  fs.writeFileSync(
    path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}sitemap.xml\n`
  );
  console.log('  wrote     robots.txt, sitemap.xml');
}

/** Copy curated llms.txt maps (root + developer) into dist/. */
function copyLlmsTxt() {
  const rootSrc = path.join(SRC, 'llms.txt');
  const devSrc = path.join(DEVELOPER_DIR, 'llms.txt');
  if (!fs.existsSync(rootSrc) || !fs.existsSync(devSrc)) {
    throw new Error('Missing src/llms.txt or src/developer/llms.txt');
  }
  fs.copyFileSync(rootSrc, path.join(DIST, 'llms.txt'));
  fs.mkdirSync(path.join(DIST, 'developer'), { recursive: true });
  fs.copyFileSync(devSrc, path.join(DIST, 'developer', 'llms.txt'));
  console.log('  copied    llms.txt → dist/llms.txt');
  console.log('  copied    developer/llms.txt → dist/developer/llms.txt');
  // llms.txt points agents at the raw issue data beside the page.
  fs.copyFileSync(OPEN_ISSUES_PATH, path.join(DIST, 'developer', 'open-issues.json'));
  console.log('  copied    developer/open-issues.json → dist/developer/open-issues.json');
}

/**
 * llms.txt links to this site must be relative, so an agent that reads the
 * map from a Swarm gateway stays on Swarm instead of being sent to the
 * domain, and every relative target must exist in dist/. Each map must
 * still name its canonical URL in prose, so an agent holding only the text
 * (no source URL) has a base to resolve the relative links against.
 */
function checkLlmsLinks() {
  for (const rel of ['llms.txt', 'developer/llms.txt']) {
    const text = fs.readFileSync(path.join(DIST, rel), 'utf-8');
    const canonical = new URL(rel, SITE.url).href;
    if (!text.includes(canonical)) {
      throw new Error(`${rel}: must name its canonical URL ${canonical} as a base for the relative links`);
    }
    const dir = path.dirname(path.join(DIST, rel));
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (target.startsWith(SITE.url) || /^https?:\/\/(www\.)?freedom\.baby\b/.test(target)) {
        throw new Error(`${rel}: link ${target} must be relative to stay on the serving host`);
      }
      if (/^[a-z][\w+.-]*:/i.test(target)) continue;
      let file = path.resolve(dir, target.replace(/#.*$/, ''));
      if (target.replace(/#.*$/, '').endsWith('/') || target.startsWith('#')) file = path.join(file, 'index.html');
      if (!fs.existsSync(file)) throw new Error(`${rel}: link ${target} has no file in dist/`);
    }
  }
  console.log('  checked   llms.txt links (relative, all resolve, canonical base named)');
}


// --- release digests (GitHub API assets[].digest, committed under src/data/) --

const DIGESTS_PATH = path.join(SRC, 'data', 'release-digests.json');

/** Primary installers shown on the homepage download cards, in display order. */
const PRIMARY_ASSETS = [
  `Freedom-${SITE.version}-arm64.dmg`,
  `Freedom-Setup-${SITE.version}.exe`,
  `freedom-browser_${SITE.version}_amd64.deb`,
  `Freedom-${SITE.version}.AppImage`,
  `freedom-browser-${SITE.version}.pacman`,
  `freedom-browser_${SITE.version}_arm64.deb`,
  `Freedom-${SITE.version}-arm64.AppImage`,
  `freedom-browser-${SITE.version}-aarch64.pacman`,
];

function loadReleaseDigests() {
  if (!fs.existsSync(DIGESTS_PATH)) {
    throw new Error('Missing src/data/release-digests.json — run: node scripts/fetch-release-digests.js');
  }
  const digests = JSON.parse(fs.readFileSync(DIGESTS_PATH, 'utf-8'));
  if (digests.version !== SITE.version) {
    throw new Error(
      `release-digests.json is for ${digests.version} but site.json is ${SITE.version}. ` +
        'Run: node scripts/fetch-release-digests.js',
    );
  }
  if (!Array.isArray(digests.assets) || !digests.assets.length) {
    throw new Error('release-digests.json has no assets');
  }
  // Checksum lists and signatures are not installers; never list them as such
  // (older or hand-edited data files may still carry them).
  digests.assets = digests.assets.filter(
    (a) => !/^sha256sums/i.test(a.name) && !/\.(sig|asc)$/i.test(a.name),
  );
  for (const a of digests.assets) {
    if (!a.sha256 || !/^[a-f0-9]{64}$/i.test(a.sha256)) {
      throw new Error(`Invalid sha256 for ${a.name}`);
    }
  }
  return digests;
}

function writeChecksumArtifacts(digests) {
  const lines = digests.assets.map((a) => `${a.sha256}  ${a.name}`);
  const sums = [
    `# SHA-256 digests for Freedom Browser ${digests.tag}`,
    `# Source: ${digests.source}`,
    `# Release: ${digests.release_url}`,
    `# Fetched: ${digests.fetched_at}`,
    `# ${digests.note}`,
    ...lines,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(DIST, 'SHA256SUMS'), sums);
  fs.writeFileSync(path.join(DIST, 'checksums.json'), `${JSON.stringify(digests, null, 2)}\n`);
  console.log('  wrote     SHA256SUMS, checksums.json');
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function renderVerifyBlock(digests) {
  const byName = Object.fromEntries(digests.assets.map((a) => [a.name, a]));
  const primary = PRIMARY_ASSETS.filter((n) => byName[n]);
  const extras = digests.assets.filter((a) => !PRIMARY_ASSETS.includes(a.name));

  const row = (a) => `        <tr>
          <td><code class="fname">${escapeHtml(a.name)}</code></td>
          <td><code class="hash" data-hash="${escapeAttr(a.sha256)}">${escapeHtml(a.sha256)}</code>
            <button type="button" class="copyhash" data-hash="${escapeAttr(a.sha256)}" aria-label="Copy SHA-256 for ${escapeAttr(a.name)}">Copy</button></td>
        </tr>`;

  const primaryRows = primary.map((n) => row(byName[n])).join('\n');
  const extraRows = extras.map(row).join('\n');

  // Only claim what is actually missing from the release.
  const missing = [];
  if (!digests.signatures_published) {
    missing.push('detached signatures (<code>.sig</code> / <code>.asc</code>)');
  }
  if (!digests.sha256sums_published) missing.push('a <code>SHA256SUMS</code> file');
  const sigNote = missing.length
    ? '<p class="verify-note">This release does not publish ' +
      missing.join(' or ') +
      '. The hashes below are the <strong>GitHub Releases API</strong> <code>assets[].digest</code> values for <a href="' +
      escapeAttr(digests.release_url) +
      '" rel="noopener">tag ' +
      escapeHtml(digests.tag) +
      '</a>.</p>'
    : '';

  return `<details class="verify">
      <summary>Verify download · SHA-256</summary>
      <div class="verify-body">
        ${sigNote}
        <p class="verify-how">After downloading, check the file hash matches:</p>
        <ul class="verify-cmds">
          <li><span>macOS</span> <code>shasum -a 256 &lt;file&gt;</code></li>
          <li><span>Linux</span> <code>sha256sum &lt;file&gt;</code></li>
          <li><span>Windows PowerShell</span> <code>Get-FileHash -Algorithm SHA256 .\\&lt;file&gt;</code></li>
        </ul>
        <div class="verify-table-wrap">
          <table class="verify-table">
            <thead><tr><th>File</th><th>SHA-256</th></tr></thead>
            <tbody>
${primaryRows}
${extraRows ? '              <!-- additional release assets -->\n' + extraRows : ''}
            </tbody>
          </table>
        </div>
        <p class="verify-files"><a href="SHA256SUMS">SHA256SUMS</a><a href="checksums.json">checksums.json</a><a href="${escapeAttr(digests.release_url)}" rel="noopener">GitHub release</a></p>
      </div>
    </details>`;
}

function injectVerifyBlock(digests) {
  const indexPath = path.join(DIST, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');
  if (!html.includes('<!--VERIFY_BLOCK-->')) {
    throw new Error('dist/index.html missing <!--VERIFY_BLOCK--> marker');
  }
  html = html.replace('<!--VERIFY_BLOCK-->', renderVerifyBlock(digests));
  fs.writeFileSync(indexPath, html);
  console.log('  injected  download verify block');
}

// --- build --------------------------------------------------------------------

function copyDirInto(srcDir, destDir, label) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir)) {
    fs.cpSync(path.join(srcDir, entry), path.join(destDir, entry), { recursive: true });
    console.log(`  copied    ${label}/${entry}`);
  }
}

function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  console.log('Building site → dist/');
  copyDirInto(STATIC_DIR, DIST, 'src/static');
  const digests = loadReleaseDigests();
  copyDirInto(ASSETS_DIR, path.join(DIST, 'assets'), 'src/assets');
  copyDirInto(IMAGES_DIR, path.join(DIST, 'images'), 'src/images');
  const posts = POSTS.map(loadPost);
  const faq = loadFaq();
  const pageEntries = renderPages({ posts, faq });
  injectVerifyBlock(digests);
  writeChecksumArtifacts(digests);
  posts.forEach(renderPost);
  renderNews(posts);
  const releases = renderReleases(posts);
  writeFeed(posts);
  writeReleasesFeed(releases);
  writeSitemap(pageEntries, posts);
  DOC_PAGES.forEach(renderDoc);
  copyLlmsTxt();
  writeSearchIndex();
  renderTalks();
  checkLlmsLinks();
  console.log('✓ Build complete');
}

main();
