#!/usr/bin/env node
/**
 * Upload ./dist to Swarm as a website collection and point the site's feed at
 * it. `freedombrowser.eth`'s content hash is the feed manifest, which always
 * resolves to the latest update, so a deploy needs no ENS transaction.
 *
 *   npm run build && npm run deploy:swarm
 *   npm run deploy:swarm -- --dry-run     # pack and check, upload nothing
 *   npm run deploy:swarm -- --expect <ref>  # fail if the result differs
 *   npm run deploy:swarm -- --expect-feed   # fail if it differs from the feed
 *
 * `--expect-feed` is for the scheduled re-push: re-uploading identical content
 * is free (same addresses, same bucket slots on a mutable batch) and re-pushes
 * every chunk, but if dist/ has moved on since the last deploy, the reference
 * changes — and that should be an alarm, not a silent publish.
 * When the feed already points at the reference, its latest update is
 * re-pushed rather than repeated, so the weekly run repairs the feed chunks
 * too without adding an index.
 *
 * Only the site goes to Swarm. The installers stay on freedom.baby and the
 * pages link to them absolutely, so this payload is a few MB rather than the
 * 14 GB of binaries sitting in that docroot.
 *
 * Environment:
 *   SWARM_API    node API base       (default http://127.0.0.1:1633)
 *   SWARM_BATCH  postage batch id    (default: the site's 1 GiB batch)
 *   SWARM_FEED_KEY  file holding the feed owner's private key
 *                   (default ~/.config/freedom-website/swarm-feed.key)
 *
 * The upload shells out to `tar` and uses fetch; bee-js signs feed updates.
 */

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Bee, PrivateKey, Topic } = require('@ethersphere/bee-js');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const API = (process.env.SWARM_API || 'http://127.0.0.1:1633').replace(/\/$/, '');
const BATCH =
  process.env.SWARM_BATCH ||
  '16112b8a948a4fb88598c235a606f211d8cfeb75aa1f4f7dd4e1e89e23b9da14';
const FEED_KEY =
  process.env.SWARM_FEED_KEY || path.join(os.homedir(), '.config/freedom-website/swarm-feed.key');
// A different key or topic is a different feed manifest, and the ENS content
// hash would have to be set again.
const FEED_TOPIC = 'freedombrowser.eth';
const DRY = process.argv.includes('--dry-run');
const EXPECT_FEED = process.argv.includes('--expect-feed');
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
  return { ok: res.ok, status: res.status, text, type: res.headers.get('content-type') || '' };
}

/** Point the site feed at `ref`; returns the feed manifest and update index. */
async function updateFeed(ref) {
  // Enforced before any write: --expect-feed must never move the feed.
  const mustMatch = EXPECT_FEED;
  if (!fs.existsSync(FEED_KEY)) {
    die(`no feed key at ${FEED_KEY}. Restore it from its backup or set SWARM_FEED_KEY;
a new key means a new feed manifest and a new ENS content hash.`);
  }
  const bee = new Bee(API);
  const signer = new PrivateKey(fs.readFileSync(FEED_KEY, 'utf8').trim());
  const topic = Topic.fromString(FEED_TOPIC);

  // Idempotent: the same owner and topic give the same manifest chunk, so
  // this also re-pushes it.
  const manifest = await bee.feed.createManifest(BATCH, topic, signer.publicKey().address());
  const writer = bee.feed.makeWriter(topic, signer);
  const latest = await writer.downloadReference().catch((e) => {
    if (e.status === 404) return null;
    throw e;
  });

  const changed = !latest || latest.reference.toHex() !== ref;
  if (changed && mustMatch) {
    die(`reference changed: the feed points at ${latest ? latest.reference.toHex() : 'nothing yet'}, dist/ is ${ref}.
dist/ drifted from what is published; rebuild it from the published commit,
or deploy without --expect-feed if this is an intended update.`);
  }
  const index = !latest ? 0n : changed ? latest.feedIndex.toBigInt() + 1n : latest.feedIndex.toBigInt();
  await writer.uploadReference(BATCH, ref, { index: Number(index) });
  return { manifest: manifest.toHex(), index, changed };
}

/** The version the built pages advertise — used to verify what Swarm serves. */
function builtVersion() {
  const html = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  return (html.match(/<meta name="freedom-version" content="([\d.]+)">/) ?? html.match(/Alpha release \(([\d.]+)\)/))?.[1] ?? null;
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
  const served = check.ok && version
    ? check.text.includes(`<meta name="freedom-version" content="${version}">`) || check.text.includes(`Alpha release (${version})`)
    : check.ok;
  console.log(`\nreference  ${ref}`);
  console.log(`readback   ${check.status}${served ? ' — serves the built index' : ' — could not confirm the index'}`);
  // Never point the feed at a manifest that does not serve its own index.
  if (!served) die('not updating the feed.');

  // Agents read llms.txt and the .html.md twins; Bee picks each file's
  // content type from its extension, so check they come back as text.
  for (const f of ['llms.txt', 'developer/index.html.md']) {
    const r = await api(`/bzz/${ref}/${f}`);
    const ok = r.ok && /^text\//.test(r.type);
    console.log(`${ok ? 'text' : '⚠ type'}     ${f} → ${r.status} ${r.type || '(no content-type)'}`);
  }

  if (EXPECT && ref !== EXPECT) {
    die(`reference changed: expected ${EXPECT}, got ${ref}.
dist/ no longer matches what the feed points at. Either this is an intended
update — deploy without --expect — or dist/ drifted and should be rebuilt
from the published commit.`);
  }
  if (EXPECT) console.log('expected   matches');

  fs.writeFileSync(path.join(ROOT, '.swarm-last-ref'), `${ref}\n`);

  const feed = await updateFeed(ref);
  // freedom.baby/ens prefills the content hash form from this.
  fs.writeFileSync(path.join(ROOT, '.swarm-feed-ref'), `${feed.manifest}\n`);
  console.log(`feed       ${feed.changed ? 'updated' : 'already current, re-pushed'} (index ${feed.index})`);
  console.log(`manifest   ${feed.manifest}`);
  console.log(`
freedombrowser.eth resolves to the feed, so this is live once eth.limo's cache
expires (a few minutes). Its content hash should be

    bzz://${feed.manifest}`);
}

main().catch((e) => die(e.message));
