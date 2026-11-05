---
title: Questions and answers
---
<!--
HOW TO EDIT THE FAQ
- One entry per "## " heading: the heading is the question, everything below it
  (until the next "## ") is the answer, in Markdown. Links and lists work.
- Order here = order on the home page. Add, remove or reorder freely.
- The same text also becomes the FAQPage structured data for search engines,
  so keep answers plain and factual.
- An entry whose answer has a line starting with "TODO" is a draft. Drafts are
  left out of the site until the TODO line is gone. Preview them locally with
  FAQ_DRAFTS=1 npm run build
- Comments like this one are notes for editors and never appear on the page.
-->

## How is Freedom different from Brave, and why switch?

Brave is a privacy-focused browser for today's web. Freedom is built for the decentralized web. It runs its own Swarm and IPFS nodes inside the browser, so .eth sites and other decentralized content load straight from the peer-to-peer network instead of through a company's gateway. Brave dropped its built-in IPFS support in 2024.

ENS names open natively, a wallet is built in, and you can publish a website to Swarm, give it a name and keep it online with no hosting company involved. Freedom Agent can even build, publish and name a site for you from a single prompt.

Like Brave, Freedom is built on Chromium, so everyday browsing works the same, with ad blocking and Tor built in. Freedom is fully open source, with no ads, no token and no data collection.

## Should I use Freedom as my everyday browser, or next to Brave or another browser?

Yes, you can use Freedom as your everyday browser. It is built on Chromium, so regular websites work as you'd expect, and ad blocking, Tor, video calls, tabs, bookmarks and automatic updates are all built in. Since version 0.8.5 it has been designed to be your only browser. It is still a technical preview, so if a site ever misbehaves, keeping another browser around is fine, and please [report it](https://github.com/solardev-xyz/freedom-browser/issues) so we can fix it.

## Is there a token or reward mechanism like Brave's?

Not today. Freedom has no token, no rewards and no ads, and you don't need anything beyond the browser to use it. We are exploring ways to reward the people who help Freedom grow, and we'll announce anything concrete in our [community](https://freedom.davinci.space) first.

## Is there a mobile app?

Yes. Freedom for Android and iOS is essentially ready, and we are working through the app store review process right now. You can follow along on GitHub: [Android](https://github.com/solardev-xyz/freedom-browser-android) and [iOS](https://github.com/solardev-xyz/freedom-browser-ios). Until the apps are out, Freedom is available for macOS, Windows and Linux.

## How does Freedom handle the RAM, CPU and bandwidth cost of running P2P nodes?

Freedom's built-in nodes for Swarm, IPFS, Radicle, Ethereum and Tor are all written in Rust and tuned to use little memory, CPU and bandwidth. We wrote our own Swarm and IPFS clients from scratch so they run smoothly on Android and iOS phones, and the desktop app uses the same ones. Only Swarm and IPFS start automatically. Radicle, the experimental Ethereum light client and Tor stay off until you turn them on in Settings. The Swarm node stays connected to its peers in the background, while IPFS only does real work when you open or publish IPFS content.

## How can developers contribute? Are there mentorship opportunities?

Freedom is open source under the MPL-2.0 license and developed on [GitHub](https://github.com/solardev-xyz/freedom-browser) and [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE) (`rad:z3QXuMvMmSeEX3ZgoUidZC1v5MkKE`). You can report bugs and suggest ideas as [issues](https://github.com/solardev-xyz/freedom-browser/issues) and start with the [developer docs](developer/). And yes, we offer mentorship: join our [community](https://freedom.davinci.space) and reach out to us in the [Telegram group](https://t.me/freedom_browser).
