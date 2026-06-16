#!/usr/bin/env node
/**
 * Build the freedom.baby site into ./dist (everything in dist/ is generated).
 *
 * Flow:
 *   src/pages/*.html      → copied verbatim    → dist/*.html
 *   src/images/**         → copied verbatim    → dist/images/**
 *   src/content/*.md      → rendered with a    → dist/*.html
 *     + src/templates/      template
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

// Markdown posts to render. Each entry maps a content file + template to a
// generated page in dist/.
const POSTS = [
  {
    content: 'introducing-freedom.md',
    template: 'blog-template.html',
    output: 'introducing-freedom.html',
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
  const dateHtml = date ? `<p class="date">${date}</p>` : '';
  const imageHtml = image
    ? `<meta property="og:image" content="${image}">\n  <meta name="twitter:image" content="${image}">`
    : '';

  const escapedTitle = title.replace(/"/g, '&quot;');
  const escapedDesc = description.replace(/"/g, '&quot;');

  const output = template
    .replace(/\{\{title\}\}/g, escapedTitle)
    .replace(/\{\{description\}\}/g, escapedDesc)
    .replace(/\{\{date\}\}/g, dateHtml)
    .replace(/\{\{content\}\}/g, html)
    .replace(/\{\{image\}\}/g, imageHtml);

  fs.writeFileSync(path.join(DIST, post.output), output);
  console.log(`  rendered  src/content/${post.content} → dist/${post.output}`);
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
  copyDirInto(IMAGES_DIR, path.join(DIST, 'images'), 'src/images');
  for (const post of POSTS) renderPost(post);
  console.log('✓ Build complete');
}

main();
