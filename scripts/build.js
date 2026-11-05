#!/usr/bin/env node
/**
 * Build the freedom.baby site into ./dist (everything in dist/ is generated).
 *
 * Flow:
 *   src/pages/**          → copied (with {{…}} values from src/site.json) → dist/**
 *   src/assets/**         → copied verbatim    → dist/assets/**
 *   src/images/**         → copied verbatim    → dist/images/**
 *   src/content/*.md      → rendered with      → dist/*.html
 *     + src/templates/post-template.html
 *   POSTS                 → news list with     → dist/news.html
 *     + src/templates/news-template.html
 *   src/developer/*.md    → rendered with      → dist/developer/*.html
 *     + src/templates/docs-template.html
 *     (tabs, left nav and "On this page" are generated; see DOCS below;
 *     open-issues.md pulls in src/developer/open-issues.json)
 *
 * src/site.json holds the values that change between releases (version,
 * download stats); any {{key}} in a page or template is replaced with it.
 *
 * Run with `npm run build`. `dist/` is git-ignored and reproducible from src/.
 */
const fs = require('fs');
const path = require('path');
const { marked, Marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const PAGES_DIR = path.join(SRC, 'pages');
const IMAGES_DIR = path.join(SRC, 'images');
const CONTENT_DIR = path.join(SRC, 'content');
const TEMPLATES_DIR = path.join(SRC, 'templates');
const ASSETS_DIR = path.join(SRC, 'assets');
const DEVELOPER_DIR = path.join(SRC, 'developer');
const SITE = JSON.parse(fs.readFileSync(path.join(SRC, 'site.json'), 'utf-8'));

/** Replace {{key}} with values from src/site.json. */
function fillSite(text) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in SITE ? SITE[key] : m));
}

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
// generated page in dist/. Newest first; the order is also the news list order.
const POSTS = [
  {
    content: 'freedom-0-8-8-agent.md',
    template: 'post-template.html',
    output: 'freedom-0-8-8-agent.html',
    summary: 'Freedom Agent: an assistant in the browser that builds, publishes and names decentralized sites from one prompt.',
  },
  {
    content: 'freedom-0-8-5-daily-driver.md',
    template: 'post-template.html',
    output: 'freedom-0-8-5-daily-driver.html',
    summary: 'The first release you can use as your only browser, now with Ethereum and Tor nodes.',
  },
  {
    content: 'introducing-freedom.md',
    template: 'post-template.html',
    output: 'introducing-freedom.html',
    summary: 'The first public preview: a minimalist browser that loads Swarm and IPFS content straight from peers.',
  },
];

// --- markdown front-matter + metadata helpers ---------------------------------

function parseFrontmatter(md) {
  const meta = {};
  let content = md;

  if (md.startsWith('---\n')) {
    const endIndex = md.indexOf('\n---\n', 4);
    if (endIndex !== -1) {
      const frontmatter = md.substring(4, endIndex);
      content = md.substring(endIndex + 5).replace(/^\n+/, '');
      frontmatter.split('\n').forEach((line) => {
        const match = line.match(/^(\w+):\s*(.+)$/);
        if (match) meta[match[1]] = match[2].trim();
      });
    }
  }

  return { meta, content };
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

function renderPost(post) {
  const contentPath = path.join(CONTENT_DIR, post.content);
  const templatePath = path.join(TEMPLATES_DIR, post.template);

  const template = fs.readFileSync(templatePath, 'utf-8');
  const rawMarkdown = fs.readFileSync(contentPath, 'utf-8');
  const { meta, content: markdown } = parseFrontmatter(rawMarkdown);

  const title = meta.title || extractTitle(markdown);
  const date = extractDate(markdown);
  const description = meta.description || extractDescription(markdown);
  const image = meta.image || '';

  let content = markdown.replace(/^# .+\n/, '');
  if (date) content = content.replace(/^\n\*[^*]+\*\n/, '');

  const html = marked(content);
  const dateHtml = date || '';
  // Link previews need absolute URLs, so relative images get the site URL.
  const imageHtml = new URL(image || 'images/freedom-0.8.5-og.jpg', SITE.url).href;

  const escapedTitle = title.replace(/"/g, '&quot;');
  const escapedDesc = description.replace(/"/g, '&quot;');

  const output = template
    .replace(/\{\{title\}\}/g, escapedTitle)
    .replace(/\{\{description\}\}/g, escapedDesc)
    .replace(/\{\{date\}\}/g, dateHtml)
    .replace(/\{\{content\}\}/g, html)
    .replace(/\{\{image\}\}/g, imageHtml)
    .replace(/\{\{page\}\}/g, post.output);

  fs.writeFileSync(path.join(DIST, post.output), fillSite(output));
  console.log(`  rendered  src/content/${post.content} → dist/${post.output}`);
  return { title, date, output: post.output, summary: post.summary || description };
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

/** Render src/developer/open-issues.json (authored by hand; no API calls at build time). */
function renderOpenIssues() {
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

  let html = '';
  for (const area of data.areas) {
    const list = data.issues.filter((i) => i.area === area.id && !isProposal(i)).sort(sort);
    if (!list.length) continue;
    html += `<h2 id="${area.id}">${escapeHtml(area.label)}<a class="h-anchor" href="#${area.id}" aria-label="Link to this section">#</a></h2>\n<ul class="issue-list">\n${list.map(renderIssueCard).join('\n')}\n</ul>\n`;
  }
  const proposals = data.issues.filter(isProposal).sort((a, b) => b.number - a.number);
  if (proposals.length) {
    html += `<h2 id="community-proposals">Community proposals<a class="h-anchor" href="#community-proposals" aria-label="Link to this section">#</a></h2>
<p>Feature ideas from developers outside the core team. They are open for discussion, design and prototypes, but a proposal is not a commitment: items marked <span class="badge proposal">Proposal · not on the roadmap</span> are not on the roadmap. Comment on the issue before you start building.</p>
<ul class="issue-list">\n${proposals.map(renderIssueCard).join('\n')}\n</ul>\n`;
  }
  const toc = data.areas
    .filter((a) => data.issues.some((i) => i.area === a.id && !isProposal(i)))
    .map((a) => ({ depth: 2, id: a.id, label: escapeHtml(a.label) }));
  if (proposals.length) toc.push({ depth: 2, id: 'community-proposals', label: 'Community proposals' });
  return { html, toc, updated: formatDate(data.last_updated), count: data.issues.length };
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

  const esc = (s) => s.replace(/"/g, '&quot;');
  const output = template
    .replace(/\{\{title\}\}/g, esc(title))
    .replace(/\{\{description\}\}/g, esc(description))
    .replace(/\{\{kick\}\}/g, esc(kick))
    .replace(/\{\{dek\}\}/g, esc(dek))
    .replace(/\{\{tabs\}\}/g, renderTabs(doc))
    .replace(/\{\{sidenav\}\}/g, renderSideNav(doc))
    .replace(/\{\{toc\}\}/g, tocHtml)
    .replace(/\{\{toc_class\}\}/g, tocHtml ? '' : ' no-toc')
    .replace(/\{\{source\}\}/g, source)
    .replace(/\{\{page\}\}/g, doc.output)
    .replace(/\{\{content\}\}/g, () => html);

  indexDoc(doc, title, kick, description, html);

  const outPath = path.join(DIST, doc.output);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, fillSite(output));
  console.log(`  rendered  src/developer/${doc.content} → dist/${doc.output}`);
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
  const list = posts
    .map((p) => `  <a class="post" href="${p.output}"><time>${escapeHtml(p.date || '')}</time><div><b>${escapeHtml(p.title)}</b><span>${escapeHtml(p.summary)}</span></div></a>`)
    .join('\n');
  fs.writeFileSync(path.join(DIST, 'news.html'), fillSite(template.replace('{{posts}}', list)));
  console.log('  rendered  news list → dist/news.html');
}

/** robots.txt + sitemap.xml for the public pages (absolute URLs from site.json). */
function writeSitemap() {
  const docPaths = DOC_PAGES.map((d) => (d.output === 'developer/index.html' ? 'developer/' : d.output));
  const pages = ['', 'news.html', ...POSTS.map((p) => p.output), ...docPaths, 'logo.html', 'imprint.html', 'privacy.html'];
  const urls = pages.map((p) => `  <url><loc>${SITE.url}${p}</loc></url>`).join('\n');
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  fs.writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE.url}sitemap.xml\n`);
  console.log('  wrote     robots.txt, sitemap.xml');
}

/** Fill {{…}} site values in every copied HTML page. */
function fillPages(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) fillPages(p);
    else if (entry.name.endsWith('.html')) fs.writeFileSync(p, fillSite(fs.readFileSync(p, 'utf-8')));
  }
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
  copyDirInto(PAGES_DIR, DIST, 'src/pages');
  fillPages(DIST);
  copyDirInto(ASSETS_DIR, path.join(DIST, 'assets'), 'src/assets');
  copyDirInto(IMAGES_DIR, path.join(DIST, 'images'), 'src/images');
  renderNews(POSTS.map(renderPost));
  DOC_PAGES.forEach(renderDoc);
  writeSearchIndex();
  writeSitemap();
  console.log('✓ Build complete');
}

main();
