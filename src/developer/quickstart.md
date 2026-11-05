---
title: Quickstart
description: Build a first Freedom dapp in plain JavaScript: detect Freedom, connect, publish to Swarm, keep state in a feed, and deploy the app to Swarm and ENS.
kick: Build dapps
dek: From an empty HTML file to an app served from Swarm, using only window.swarm. No build step, no dependencies.
---

You need [Freedom Browser](../#download) and a page to work on. Any web page
gets the providers, including `http://127.0.0.1` during development, so start
a local static server in an empty folder (`npx serve` or
`python3 -m http.server`) and open it in Freedom.

Publishing spends postage, so the node needs storage first. If it has none,
Freedom opens its publish setup for the user the first time a page tries to
publish. Reads work without it.

## 1. Detect Freedom

```html
<!doctype html>
<meta charset="utf-8">
<title>Notes</title>
<button id="connect">Connect</button>
<textarea id="text"></textarea>
<button id="save">Save</button>
<pre id="out"></pre>
<script type="module" src="app.js"></script>
```

```javascript
// app.js
const out = (msg) => (document.querySelector('#out').textContent += msg + '\n');

if (!window.swarm?.isFreedomBrowser) {
  out('Open this page in Freedom Browser.');
  throw new Error('window.swarm not available');
}
const caps = await window.swarm.getCapabilities();
out(`Swarm provider ${caps.specVersion}, can publish: ${caps.canPublish}`);
```

The provider is in place before your scripts run, so there is nothing to
wait for. `swarm_getCapabilities` needs no permission and tells you what the
node can do right now; see [the reference](swarm.html#swarm_getCapabilities).

## 2. Connect

```javascript
document.querySelector('#connect').onclick = async () => {
  try {
    await window.swarm.requestAccess();   // the user sees the connect prompt once
    out('connected');
  } catch (err) {
    if (err.code === 4001) out('You declined; click Connect to try again.');
    else throw err;
  }
};
```

Call it from a user action. Grants are keyed by the address-bar origin; see
[Permissions and identity](guide-permissions.html).

## 3. Publish

```javascript
const { reference, bzzUrl } = await window.swarm.publishData({
  data: JSON.stringify({ text: 'hello' }),
  contentType: 'application/json',
});
out(bzzUrl);   // bzz://<64 hex>: immutable, content-addressed
```

The user approves each publish unless they chose "always allow". For a whole
folder (an app, a site), use [`swarm_publishFiles`](swarm.html#swarm_publishFiles).

## 4. Keep state in a feed

A reference changes whenever the content does. A feed gives you one stable
name that points at the latest version:

```javascript
await window.swarm.createFeed({ name: 'notes' });     // first call asks for the feed grant

document.querySelector('#save').onclick = async () => {
  const text = document.querySelector('#text').value;
  const { index } = await window.swarm.writeFeedEntry({ name: 'notes', data: text });
  out(`saved as entry ${index}`);
};
```

Reading the latest entry back needs no permission:

```javascript
try {
  const entry = await window.swarm.readFeedEntry({ name: 'notes' });
  out(`latest is entry ${entry.index}`);
} catch (err) {
  if (err.data?.reason !== 'feed_empty') throw err;
}
```

Before you decode entries, read the [feeds guide](guide-feeds.html): what a
read returns depends on whether you pass `index`.

## 5. Deploy

1. Open `freedom://publish` in Freedom and publish your folder (with
   `index.html` at its root). You get a `bzz://<reference>` URL.
2. Open that URL. Your app now runs from Swarm, served by every node that
   has the content.
3. Point an ENS name's contenthash at the reference and use
   `bzz://yourname.eth` (or `ens://yourname.eth`) from then on.

The ENS step matters: grants and feeds belong to the origin, and a bare
`bzz://<reference>` origin changes with every redeploy. Under an ENS name the
origin stays the same across versions.

To ask for all capabilities in one consent sheet instead of one prompt per
tier, add a [permission manifest](swarm.html#permission-manifests) to the
folder.

## Next

- [Live messaging](guide-messaging.html) for real-time features.
- [Errors and node readiness](guide-errors.html) before you ship.
- [swarm-kit](guide-swarm-kit.html) for higher-level structures.
