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
 * src/data/release-digests.json holds GitHub asset SHA-256 digests for the
 * current version (refresh with `npm run digests`).
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
    version: '0.8.8',
    summary: 'Freedom Agent: an assistant in the browser that builds, publishes and names decentralized sites from one prompt.',
  },
  {
    content: 'freedom-0-8-5-daily-driver.md',
    template: 'post-template.html',
    output: 'freedom-0-8-5-daily-driver.html',
    version: '0.8.5',
    summary: 'The first release you can use as your only browser, now with Ethereum and Tor nodes.',
  },
  {
    content: 'introducing-freedom.md',
    template: 'post-template.html',
    output: 'introducing-freedom.html',
    summary: 'The first public preview: a minimalist browser that loads Swarm and IPFS content straight from peers.',
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

/** robots.txt + sitemap.xml for the public pages (absolute URLs from site.json). */
function writeSitemap() {
  const pages = ['', 'news.html', ...POSTS.map((p) => p.output), 'developer/', 'logo.html', 'imprint.html', 'privacy.html'];
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
  const digests = loadReleaseDigests();
  copyDirInto(PAGES_DIR, DIST, 'src/pages');
  fillPages(DIST);
  injectVerifyBlock(digests);
  writeChecksumArtifacts(digests);
  copyDirInto(ASSETS_DIR, path.join(DIST, 'assets'), 'src/assets');
  copyDirInto(IMAGES_DIR, path.join(DIST, 'images'), 'src/images');
  renderNews(POSTS.map(renderPost));
  writeSitemap();
  console.log('✓ Build complete');
}

main();
