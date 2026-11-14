#!/usr/bin/env node
/**
 * open-issues-prs.js — mark each tracked issue as "needs-fix" or "needs-review".
 *
 * Usage:  npm run issues:prs            (writes src/developer/open-issues.json)
 *         npm run issues:prs -- --dry   (prints the result, writes nothing)
 *
 * For every issue in src/developer/open-issues.json this asks GitHub (through
 * the authenticated `gh` CLI, `gh api graphql`) which pull requests in the same
 * repository (open-issues.json "repo", solardev-xyz/freedom-browser) link to it:
 *   - closedByPullRequestsReferences (PRs that will close the issue: "Fixes #n",
 *     or linked in the PR's Development sidebar), and
 *   - CrossReferencedEvent timeline items whose source is a PR in that repo
 *     and that will close the issue: GitHub's willCloseTarget, or a closing
 *     keyword ("Closes #n", "Fixes #n", "Resolves #n") in the PR's title or
 *     body. The second case catches stacked PRs, whose base is not the default
 *     branch, so GitHub does not link them as closing the issue.
 * A PR that only mentions the issue ("Related: #n") does not count: it is
 * context, not a fix to review. Only OPEN pull requests count. An issue with at least one becomes
 *   status: "needs-review", prs: [{ number, url, title }]
 * and every other issue becomes
 *   status: "needs-fix", prs: [].
 *
 * Run it as part of the daily open-issues refresh, after the issue list itself
 * is updated. The build never calls the API; it only reads these fields.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FILE = path.join(__dirname, '..', 'src', 'developer', 'open-issues.json');
const DRY = process.argv.includes('--dry');

function graphql(query) {
  const out = execFileSync('gh', ['api', 'graphql', '-f', `query=${query}`], { encoding: 'utf-8', maxBuffer: 32 * 1024 * 1024 });
  const res = JSON.parse(out);
  if (res.errors) throw new Error(JSON.stringify(res.errors));
  return res.data;
}

function issueFragment(alias, number) {
  return `${alias}: issue(number: ${number}) {
    number
    closedByPullRequestsReferences(includeClosedPrs: false, first: 10) { nodes { number url title state repository { nameWithOwner } } }
    timelineItems(itemTypes: [CROSS_REFERENCED_EVENT], first: 50) {
      nodes { ... on CrossReferencedEvent { willCloseTarget source { __typename ... on PullRequest { number url title body state repository { nameWithOwner } } } } }
    }
  }`;
}

const closes = (pr, n) =>
  new RegExp(`\\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\\b:?\\s+#${n}\\b`, 'i').test(`${pr.title}\n${pr.body || ''}`);

function main() {
  const data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  const [owner, name] = data.repo.split('/');
  const results = {};
  const BATCH = 20;
  for (let s = 0; s < data.issues.length; s += BATCH) {
    const batch = data.issues.slice(s, s + BATCH);
    const q = `query { repository(owner: "${owner}", name: "${name}") {
      ${batch.map((i) => issueFragment(`i${i.number}`, i.number)).join('\n')}
    } }`;
    Object.assign(results, graphql(q).repository);
  }

  const summary = { 'needs-fix': 0, 'needs-review': 0 };
  for (const issue of data.issues) {
    const r = results[`i${issue.number}`];
    if (!r) throw new Error(`#${issue.number} not found in ${data.repo}`);
    const candidates = [
      ...r.closedByPullRequestsReferences.nodes,
      ...r.timelineItems.nodes
        .filter((n) => n.source && n.source.__typename === 'PullRequest' && (n.willCloseTarget || closes(n.source, issue.number)))
        .map((n) => n.source),
    ];
    const prs = new Map();
    for (const pr of candidates) {
      if (pr.state !== 'OPEN' || pr.repository.nameWithOwner.toLowerCase() !== data.repo.toLowerCase()) continue;
      prs.set(pr.number, { number: pr.number, url: pr.url, title: pr.title });
    }
    issue.prs = [...prs.values()].sort((a, b) => a.number - b.number);
    issue.status = issue.prs.length ? 'needs-review' : 'needs-fix';
    summary[issue.status]++;
    if (issue.prs.length) console.log(`#${issue.number} needs review: ${issue.prs.map((p) => `#${p.number} ${p.title}`).join('; ')}`);
  }
  console.log(`needs-fix: ${summary['needs-fix']} · needs-review: ${summary['needs-review']}`);
  if (DRY) return;
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2) + '\n');
  console.log(`wrote ${path.relative(process.cwd(), FILE)}`);
}

main();
