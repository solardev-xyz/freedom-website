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
 *   POSTS                 → dist/feed.xml (RSS), dist/sitemap.xml, dist/robots.txt
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
 * src/site.json holds the values that change between releases (version,
 * download stats, site url).
 *
 * Run with `npm run build`. `dist/` is git-ignored and reproducible from src/
 * (dates come from the posts and from git, never from the clock).
 * FAQ_DRAFTS=1 npm run build also renders FAQ entries still marked TODO.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { marked } = require('marked');

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
const SITE = JSON.parse(fs.readFileSync(path.join(SRC, 'site.json'), 'utf-8'));

const BRAND = 'Freedom Browser';
const DEFAULT_IMAGE = 'images/freedom-og.jpg';
const DEFAULT_IMAGE_ALT = 'Freedom Browser: the browser for a user-owned internet';
const LATEST_POSTS_ON_HOME = 3;

// Markdown posts to render. Each entry maps a content file + template to a
// generated page in dist/.
// Newest first; the order is also the order of the news list and the feed.
// Optional here (they win over the post's front matter): description, imageAlt.
const POSTS = [
  {
    content: 'freedom-0-8-8-agent.md',
    template: 'post-template.html',
    output: 'freedom-0-8-8-agent.html',
    summary: 'Freedom Agent: an assistant in the browser that builds, publishes and names decentralized sites from one prompt.',
    imageAlt: 'Freedom 0.8.8 with Freedom Agent registering littlecorner.gwei and publishing the site to Swarm',
  },
  {
    content: 'freedom-0-8-5-daily-driver.md',
    template: 'post-template.html',
    output: 'freedom-0-8-5-daily-driver.html',
    summary: 'The first release you can use as your only browser, now with Ethereum and Tor nodes.',
    description: 'Freedom 0.8.5 is the first release you can use as your only browser, with ad and tracker blocking on by default, private windows, and Ethereum and Tor nodes.',
    imageAlt: 'Freedom 0.8.5 showing its start page with the node status panel open',
  },
  {
    content: 'introducing-freedom.md',
    template: 'post-template.html',
    output: 'introducing-freedom.html',
    summary: 'The first public preview: a minimalist browser that loads Swarm and IPFS content straight from peers.',
    imageAlt: 'Freedom showing its start page with the Swarm and IPFS node status panel open',
  },
];

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
    articleMetaHtml: '',
    jsonLdHtml: '',
    root,
    homeHref: root || './',
    homeAnchor: pagePath === '' ? '' : root || './',
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
    'https://app.radicle.xyz/nodes/seed.radicle.garden/rad:z3QXuMvMmSeEX3ZgoUidZC1v5MkKE',
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
    'https://app.radicle.xyz/nodes/seed.radicle.garden/rad:z3QXuMvMmSeEX3ZgoUidZC1v5MkKE',
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

/** robots.txt + sitemap.xml for the public pages (absolute URLs from site.json). */
function writeSitemap(pageEntries, posts) {
  const order = (loc) => (loc === '' ? 0 : loc === 'news.html' ? 1 : 2);
  const entries = [
    ...pageEntries,
    { loc: 'news.html', lastmod: maxDate(posts[0].modified, gitDate('src/templates/news-template.html')) },
    ...posts.map((p) => ({ loc: p.output, lastmod: p.modified })),
  ].sort((a, b) => order(a.loc) - order(b.loc));
  const urls = entries
    .map((e) => `  <url><loc>${SITE.url}${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`)
    .join('\n');
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}sitemap.xml\n`);
  console.log('  wrote     robots.txt, sitemap.xml');
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
  copyDirInto(ASSETS_DIR, path.join(DIST, 'assets'), 'src/assets');
  copyDirInto(IMAGES_DIR, path.join(DIST, 'images'), 'src/images');
  const posts = POSTS.map(loadPost);
  const faq = loadFaq();
  const pageEntries = renderPages({ posts, faq });
  posts.forEach(renderPost);
  renderNews(posts);
  writeFeed(posts);
  writeSitemap(pageEntries, posts);
  console.log('✓ Build complete');
}

main();
