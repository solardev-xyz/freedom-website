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
 *   src/talks.json        → talks list with    → dist/talks.html
 *     + src/templates/talks-template.html
 *
 * src/site.json holds the values that change between releases (version,
 * download stats); any {{key}} in a page or template is replaced with it.
 *
 * Run with `npm run build`. `dist/` is git-ignored and reproducible from src/.
 */
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const PAGES_DIR = path.join(SRC, 'pages');
const IMAGES_DIR = path.join(SRC, 'images');
const CONTENT_DIR = path.join(SRC, 'content');
const TEMPLATES_DIR = path.join(SRC, 'templates');
const ASSETS_DIR = path.join(SRC, 'assets');
const SITE = JSON.parse(fs.readFileSync(path.join(SRC, 'site.json'), 'utf-8'));

/** Replace {{key}} with values from src/site.json. */
function fillSite(text) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in SITE ? SITE[key] : m));
}

// Markdown posts to render. Each entry maps a content file + template to a
// generated page in dist/.
// Newest first; the order is also the order of the news list.
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

function renderNews(posts) {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'news-template.html'), 'utf-8');
  const list = posts
    .map((p) => `  <a class="post" href="${p.output}"><time>${escapeHtml(p.date || '')}</time><div><b>${escapeHtml(p.title)}</b><span>${escapeHtml(p.summary)}</span></div></a>`)
    .join('\n');
  fs.writeFileSync(path.join(DIST, 'news.html'), fillSite(template.replace('{{posts}}', list)));
  console.log('  rendered  news list → dist/news.html');
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

// Shown next to the play facade so clicking play is an informed choice
// (the consent basis in privacy.html section 4 depends on it).
const TALK_CONSENT_HTML = 'Clicking play loads the video from YouTube (Google). Google then receives your IP address, may store information on your device and may transfer data to the USA. <a href="privacy.html#videos">Privacy policy</a>';

function renderTalks() {
  const talksPath = path.join(SRC, 'talks.json');
  const talks = JSON.parse(fs.readFileSync(talksPath, 'utf-8'))
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'talks-template.html'), 'utf-8');

  const featured = talks[0];
  const watch = (t) => `https://www.youtube.com/watch?v=${t.id}`;

  const featuredPlayer = [
    `      <a class="talk-facade" href="${watch(featured)}" rel="noopener noreferrer" target="_blank" aria-label="Play video: ${escapeHtml(featured.title)}" aria-describedby="talk-consent">`,
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
    `    <p class="talk-consent" id="talk-consent">${TALK_CONSENT_HTML}</p>`,
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

  const output = template
    .replace('{{talks}}', talksHtml)
    .replace('{{jsonld}}', jsonLdHtml);

  fs.writeFileSync(path.join(DIST, 'talks.html'), fillSite(output));
  console.log(`  rendered  talks page (${talks.length}) → dist/talks.html`);
}

/** robots.txt + sitemap.xml for the public pages (absolute URLs from site.json). */
function writeSitemap() {
  const pages = ['', 'news.html', 'talks.html', ...POSTS.map((p) => p.output), 'developer/', 'logo.html', 'imprint.html', 'privacy.html'];
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
  renderTalks();
  writeSitemap();
  console.log('✓ Build complete');
}

main();
