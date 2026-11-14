#!/usr/bin/env node
/**
 * Refresh src/data/release-digests.json from the GitHub Releases API.
 *
 * Source of truth: GET /repos/solardev-xyz/freedom-browser/releases/tags/v{version}
 * → assets[].digest (sha256:…), a GitHub-attested digest for each uploaded asset.
 *
 * The Freedom Browser release does not currently publish SHA256SUMS, .sig, or
 * .asc files. This script records that honestly and only copies API digests.
 *
 * Usage: node scripts/fetch-release-digests.js [version]
 * Default version comes from src/site.json.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/site.json'), 'utf-8'));
const OUT = path.join(ROOT, 'src/data/release-digests.json');
const REPO = 'solardev-xyz/freedom-browser';

const version = process.argv[2] || SITE.version;
const tag = `v${version}`;

async function main() {
  const url = `https://api.github.com/repos/${REPO}/releases/tags/${encodeURIComponent(tag)}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'freedom-website-digest-fetch',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`GitHub release ${tag} fetch failed: ${res.status} ${await res.text()}`);
  }
  const release = await res.json();

  const assetNames = (release.assets || []).map((a) => a.name);
  const isSums = (n) => /^sha256sums/i.test(n);
  const isSig = (n) => /\.(sig|asc)$/i.test(n);
  const sha256sums_published = assetNames.some(isSums);
  const signatures_published = assetNames.some(isSig);

  const assets = (release.assets || [])
    // Installers only: updater metadata, checksum lists and detached signatures
    // are not themselves downloads to verify against a digest.
    .filter((a) => !/\.(blockmap|yml)$/i.test(a.name) && !isSums(a.name) && !isSig(a.name))
    .map((a) => {
      if (!a.digest || !String(a.digest).startsWith('sha256:')) {
        throw new Error(`Asset ${a.name} has no sha256 digest from GitHub API (got ${a.digest})`);
      }
      return {
        name: a.name,
        size: a.size,
        digest: a.digest,
        sha256: String(a.digest).slice('sha256:'.length),
        url: a.browser_download_url,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!assets.length) throw new Error(`No digest-bearing installers on ${tag}`);

  const payload = {
    version,
    tag: release.tag_name,
    release_url: release.html_url,
    fetched_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
    source: 'GitHub Releases API assets[].digest (sha256)',
    signatures_published,
    sha256sums_published,
    note: signatures_published || sha256sums_published
      ? 'Release publishes checksum and/or signature files; see assets on the GitHub release page.'
      : 'No SHA256SUMS, .sig, or .asc files are attached to this release. Digests below are GitHub-attested asset digests from the Releases API.',
    assets,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${assets.length} digests for ${tag} → src/data/release-digests.json`);
  if (!sha256sums_published) {
    console.log('Note: upstream still does not publish SHA256SUMS; site surfaces GitHub API digests instead.');
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
