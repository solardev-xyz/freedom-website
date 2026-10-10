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
    content: 'who-decides-where-a-name-takes-you.md',
    template: 'post-template.html',
    output: 'who-decides-where-a-name-takes-you.html',
    summary: 'What a single RPC provider can do to a name lookup, and how Freedom checks the answer instead.',
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
  const imageHtml = image || 'images/freedom-0.8.5-og.jpg';

  const escapedTitle = title.replace(/"/g, '&quot;');
  const escapedDesc = description.replace(/"/g, '&quot;');

  const output = template
    .replace(/\{\{title\}\}/g, escapedTitle)
    .replace(/\{\{description\}\}/g, escapedDesc)
    .replace(/\{\{date\}\}/g, dateHtml)
    .replace(/\{\{content\}\}/g, html)
    .replace(/\{\{image\}\}/g, imageHtml);

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

/** robots.txt + sitemap.xml for the public pages (absolute URLs from site.json). */
function writeSitemap() {
  const pages = ['', 'news.html', ...POSTS.map((p) => p.output), 'developer/', 'imprint.html', 'privacy.html'];
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
  writeSitemap();
  console.log('✓ Build complete');
}

main();
