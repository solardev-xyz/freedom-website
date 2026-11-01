---
title: Freedom 0.8.8: an agent that builds the decentralized web
description: Freedom 0.8.8 adds Freedom Agent, which steers the browser and builds, publishes and names decentralized sites from one prompt.
image: images/freedom-0.8.8-og.jpg
---

# Freedom 0.8.8: an agent that builds the decentralized web

*1 November 2026*

<figure>
  <img src="images/freedom-0.8.8-screenshot.webp" width="1121" height="1280" alt="Freedom Agent reporting that the site it built is live at bzz://littlecorner.gwei, with its domain registered and connected">
  <figcaption>Freedom Agent built, published and named this site from one prompt</figcaption>
</figure>

Freedom 0.8.8 brings an agent into the browser.

Freedom Agent researches, reads pages and steers the browser for you. It also builds complete sites on the decentralized web: from one prompt and a few confirmations, it writes the site, publishes it to Swarm and registers a domain name for it.

## Freedom Agent

- **It operates the browser:** pages, tabs, uploads and downloads, and the tools sites offer to agents.
- **It builds:** it writes and runs code in a sandbox and publishes the result to Swarm.
- **It names what it builds:** it registers and renews `.eth`, `.wei` and `.gwei` names.
- **It runs the nodes:** it starts and stops Swarm, IPFS, Radicle, Tor and Myotis as a task needs them.
- **It pays:** it sends funds from your wallet.

Anything that spends money or publishes waits for your approval. You can also dictate to it, on your own machine if you like.

You pick the model: a local one through Ollama, or NEAR AI, Venice, OpenRouter, OpenAI, Anthropic, xAI, Meta and others. Requests go straight to your provider, never through a Freedom server, and each chat lists where its requests went. The agent is off by default; turn it on under Settings > AI.

## An agent in the browser, not beside it

Most AI tools for the web take one of two shapes. Browser extensions send the page you are on to a model their maker picked. Hosted AI app studios build your site and keep it on their servers, under your account with them. Either way, a company sits between you and what you made.

Freedom Agent lives in a browser that already runs the nodes, holds the wallet and carries your identity. What it builds is published from your own Swarm node, paid from your own wallet and named with a domain you own. No builder account, no studio hosting. The site stays up as long as its storage is paid for, not as long as a company keeps your account open.

That is the idea: an AI that helps you publish on the decentralized web instead of keeping you on a platform. Go full yolo if you like, but read the confirmation prompts. They keep the keys yours.

## Everything else

More than 130 merged pull requests went into 0.8.8, most of them stability, bug and security fixes. Among them:

- **Open without gateway:** pages behind eth.limo, eth.link and bzz.link can open straight from Swarm and IPFS, one click from the address bar or by default.
- **Everyday browsing:** a History menu with recently closed pages, `Cmd+1` to `Cmd+9` to switch tabs (`Ctrl` on Windows and Linux), and a full screen without toolbars.
- **Fixes:** Tor connects on Windows, Ethereum transactions no longer get stuck, and the Swarm node no longer eats gigabytes of memory.
- **Security:** websites no longer see Freedom's name and version, a site in a background tab can't act as the one you are looking at, and the Swarm and IPFS nodes hold up against malicious peers.
- **Under the hood:** Chromium 156 and updated Swarm, IPFS and Myotis nodes.

The [changelog](https://github.com/solardev-xyz/freedom-browser/blob/release/0.8.8/CHANGELOG.md) has the rest.

## Try it

Download 0.8.8 for macOS, Linux and Windows from [freedom.baby](https://freedom.baby); the code is on [GitHub](https://github.com/solardev-xyz/freedom-browser). Have fun building, and share what you make at [t.me/freedom_browser](https://t.me/freedom_browser).
