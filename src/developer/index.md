---
title: Developers
description: Freedom Browser developer documentation — window.swarm, window.radicle, and contributing to the open-source browser.
kick: Developers
dek: Build on Swarm and Radicle with Freedom's page providers, or contribute to the browser itself.
---

# Developers

Freedom injects two page providers into ordinary web pages so decentralized apps can use the user's own nodes — with consent — instead of talking to a remote gateway.

| Provider | What it does | Docs |
| --- | --- | --- |
| [`window.swarm`](swarm.html) | Publish to Swarm, read and write chunks and feeds, sign, and send PSS/GSOC messages | [API reference](swarm.html) |
| [`window.radicle`](radicle.html) | Seed and sync repositories, disclose Radicle identity, write issues and comments | [API reference](radicle.html) |

Both providers:

- are installed in the **top frame** of every ordinary web page before the page's own scripts run;
- are **not** present in private windows, iframes, or Freedom's internal `freedom://` pages;
- expose `request({ method, params })`, convenience wrappers, and EIP-1193-style events;
- set `isFreedomBrowser: true` so a page can detect Freedom.

Public Swarm and Radicle **reads** that need no consent stay outside the providers: open `bzz://…` / `ipfs://…` / `rad:…` URLs, or `fetch` them. The providers cover everything that changes node state, spends postage, signs, or discloses identity.

Documented against **Freedom Browser v0.8.8** (the release matching this site's `version` in `src/site.json`).

## Contribute to Freedom

Want to work on the browser itself? See [Contribute](contributing.html) for prerequisites, clone and install steps, how to run a development build and tests, the project layout, how to pick issues, PR conventions, and where to ask questions.

- Source: [solardev-xyz/freedom-browser](https://github.com/solardev-xyz/freedom-browser) (MPL-2.0)
- Issues: [GitHub Issues](https://github.com/solardev-xyz/freedom-browser/issues)
- Chat: [Telegram](https://t.me/freedom_browser)
- Community: [freedom.davinci.space](https://freedom.davinci.space)

## Related tooling

[`@freedom/swarm-kit`](https://github.com/solardev-xyz/swarm-kit) is an early TypeScript helper library built on `window.swarm` (chunk helpers and higher-level structures). It is public but still marked private on npm — treat it as experimental and always prefer the provider API docs here when the two differ.
