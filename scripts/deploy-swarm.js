#!/usr/bin/env node
/**
 * Upload ./dist to Swarm as a website collection and print the bzz reference
 * that `freedombrowser.eth`'s content hash should point at.
 *
 *   npm run build && npm run deploy:swarm
 *   npm run deploy:swarm -- --dry-run     # pack and check, upload nothing
 *   npm run deploy:swarm -- --expect <ref>  # fail if the result differs
 *
 * `--expect` is for the scheduled re-push: re-uploading identical content is
 * free (same addresses, same bucket slots on a mutable batch) and re-pushes
 * every chunk, but if dist/ has moved on since the content hash was published,
 * the reference changes — and that should be an alarm, not a silent publish.
 *
 * Only the site goes to Swarm. The installers stay on freedom.baby and the
 * pages link to them absolutely, so this payload is a few MB rather than the
 * 14 GB of binaries sitting in that docroot.
 *
 * Environment:
 *   SWARM_API    node API base       (default http://127.0.0.1:1633)
 *   SWARM_BATCH  postage batch id    (default: the site's 1 GiB batch)
 *
 * Dependency-free, same as the build: it shells out to `tar` and uses fetch.
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const API = (process.env.SWARM_API || 'http://127.0.0.1:1633').replace(/\/$/, '');
const BATCH =
  process.env.SWARM_BATCH ||
  '16112b8a948a4fb88598c235a606f211d8cfeb75aa1f4f7dd4e1e89e23b9da14';
const DRY = process.argv.includes('--dry-run');
const EXPECT = (() => {
  const i = process.argv.indexOf('--expect');
  return i === -1 ? null : (process.argv[i + 1] || '').replace(/^bzz:\/\//, '').trim();
})();

const die = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(1);
};

async function api(path, init) {
  const res = await fetch(`${API}${path}`, { signal: AbortSignal.timeout(300000), ...init });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

/** The version the built pages advertise — used to verify what Swarm serves. */
function builtVersion() {
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  return html.match(/Alpha release \(([\d.]+)\)/)?.[1] ?? null;
}

async function main() {
  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    die('dist/index.html is missing — run `npm run build` first.');
  }
  const version = builtVersion();
  const files = execFileSync('find', [DIST, '-type', 'f'], { encoding: 'utf8' })
    .trim()
    .split('\n');
  // COPYFILE_DISABLE keeps macOS tar from smuggling ._ AppleDouble entries
  // into the manifest, which would show up as files on the published site.
  const tar = execFileSync('tar', ['cf', '-', '-C', DIST, '.'], {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
    maxBuffer: 256 * 1024 * 1024,
  });

  console.log(`site     ${files.length} files, ${(tar.length / 1e6).toFixed(2)} MB packed`);
  console.log(`version  ${version ?? 'not found in index.html'}`);
  console.log(`batch    ${BATCH}`);

  const stamps = await api('/stamps');
  if (!stamps.ok) die(`${API}/stamps returned ${stamps.status} — is the node running?`);
  const batch = JSON.parse(stamps.text).stamps.find((s) => s.batchID === BATCH);
  if (!batch) die(`the node has no batch ${BATCH} — check SWARM_BATCH and the node's config.`);
  if (!batch.usable) die('the batch is not usable yet (still settling on-chain?).');
  const days = Math.floor(batch.batchTTL / 86400);
  console.log(`stamp    depth ${batch.depth}, ${batch.utilization} used, ${days} days left`);
  if (days < 30) console.log('⚠ under 30 days left — `antctl postage top-up` before this expires.');

  if (DRY) {
    console.log('\ndry run: nothing uploaded.');
    for (const f of files) console.log(`  ${path.relative(DIST, f)}`);
    return;
  }

  console.log('\nuploading…');
  const up = await api('/bzz', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-tar',
      'swarm-collection': 'true',
      'swarm-index-document': 'index.html',
      'swarm-postage-batch-id': BATCH,
    },
    body: tar,
  });
  if (!up.ok) die(`upload failed (${up.status}): ${up.text.slice(0, 300)}`);
  const ref = JSON.parse(up.text).reference;
  if (!ref) die(`no reference in the response: ${up.text.slice(0, 200)}`);

  // Fetch it back through the node before claiming success: a manifest that
  // does not serve its own index is the failure worth catching here.
  const check = await api(`/bzz/${ref}/`);
  const served = check.ok && version ? check.text.includes(`Alpha release (${version})`) : check.ok;
  console.log(`\nreference  ${ref}`);
  console.log(`readback   ${check.status}${served ? ' — serves the built index' : ' — could not confirm the index'}`);
  if (!served) process.exitCode = 1;

  if (EXPECT && ref !== EXPECT) {
    die(`reference changed: expected ${EXPECT}, got ${ref}.
dist/ no longer matches what the content hash points at. Either this is an
intended update — publish the new reference to ENS — or dist/ drifted and
should be rebuilt from the published commit.`);
  }
  if (EXPECT) console.log('expected   matches — the published content hash still resolves to this');

  console.log(`
next: set the content hash on freedombrowser.eth to

    bzz://${ref}

at https://app.ens.domains/freedombrowser.eth (note the old hash first), then
check https://freedombrowser.eth.limo and the bzz:// URL inside Freedom.`);
}

main().catch((e) => die(e.message));
