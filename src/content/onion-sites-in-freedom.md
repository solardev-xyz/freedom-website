---
title: Onion sites in Freedom, and nothing else through Tor
description: Freedom has a Tor client built in. Turn it on and .onion addresses open in a normal tab, while every other site keeps connecting directly. What it routes, what it refuses to leak, and how to try it.
---

# Onion sites in Freedom, and nothing else through Tor

*24 November 2026*

Plenty of services you might want to reach have an onion address: the Tor Project, newsrooms that take tips, privacy tools, and projects that want a way in that does not depend on a domain registrar or a hosting company. A `.onion` address is not looked up anywhere. It is derived from the service's public key, and only the Tor network knows how to reach it.

Usually that means a second browser. Since 0.8.5, Freedom can open these sites in an ordinary tab. It ships a Tor client, and when you switch it on, `.onion` addresses go through Tor and nothing else does.

## What is built in

The client is [Arti](https://gitlab.torproject.org/tpo/core/arti), the Tor Project's implementation of Tor in Rust. Freedom bundles it in its macOS, Linux and Windows downloads (Freedom 0.8.8 carries Arti 2.7.0) and runs it as a small local proxy, like the Swarm, IPFS and Radicle nodes it already runs. You don't install anything else.

It is off by default. Nothing starts and nothing connects to the Tor network until you turn it on.

## Only `.onion` goes through Tor

When Tor is running, Freedom gives the browser one rule: a host that ends in `.onion` goes through Tor's SOCKS5 proxy; everything else connects directly. Regular websites, and the decentralized protocols (`bzz://`, `ipfs://`, `ipns://`, `rad://`), are not touched.

That is a deliberate scope. Freedom isn't trying to be Tor Browser. It doesn't send all your browsing through Tor, so a regular website still sees your own connection. If you need anonymity for everything you do, Tor Browser is built for that. What Freedom adds is reach: onion services open in the browser you already use for everything else.

Some practical details:

- **Type it the short way.** Enter `something.onion` without a scheme and Freedom opens it over `http://`. Most onion sites are http-only, and the onion address already encrypts and authenticates the connection end to end.
- **Private windows too.** A private window follows the same rule as a normal one, including a private window opened while Tor is already running.
- **One Tor per profile.** Each profile keeps its own Tor state and its own local port, so separate profiles stay separate.

## The name never reaches your DNS

The easy way to get onion routing wrong is to leak the address. If an `.onion` name ever reaches your computer's normal DNS resolver, the lookup fails, and your network, or whoever runs your DNS, has just seen which onion site you tried to open.

Freedom closes off the ways that can happen:

- **SOCKS5 only.** The proxy rule has no fallback to SOCKS4, which can't resolve names remotely. With SOCKS5 the name is resolved inside Tor, not on your machine.
- **Fail closed.** If Tor stops unexpectedly, onion requests fail with a proxy error instead of quietly going direct. Only turning Tor off yourself restores direct connections.
- **After a restart.** Since 0.8.8, `.onion` addresses no longer fall back to your normal DNS after Tor restarts ([#809](https://github.com/solardev-xyz/freedom-browser/issues/809)).
- **Behind the scenes, too.** Requests Freedom makes by itself follow the same rule. Favicons of onion sites go through Tor, and Freedom refuses to dial an onion IPFS gateway at all unless the route through Tor is in place.

## Already running Tor?

If you have Tor Browser open, Freedom can use its Tor instead of starting a second one. When you turn Tor on and Freedom finds a Tor proxy on `127.0.0.1:9150`, Tor Browser's usual port, it asks whether this profile should use that node or keep its own. You can also point a profile at any SOCKS5 Tor proxy under **Settings > Nodes**, by setting Tor to **Use external node**.

## Onions in the rest of Freedom

Because the routing sits in the browser, other features can reach onion hosts while Tor runs:

- **ENS names** whose offchain data comes from an `.onion` gateway resolve over Tor (since 0.8.7).
- **An external IPFS gateway** at an `.onion` address works while Tor is running.
- **Freedom Agent** can start and stop the Tor node when a task needs it, like the other nodes.

One gap: an external Swarm node at an `.onion` address isn't supported yet, because Freedom talks to the Swarm API outside Tor ([#360](https://github.com/solardev-xyz/freedom-browser/issues/360)).

## How to try it

1. Download Freedom 0.8.8 or later from the [download section](https://freedom.baby/#download) and open it.
2. Open **Settings > Advanced** and turn on **Enable Tor (.onion access)**. It is marked Beta.
3. Open the Nodes menu in the toolbar. Tor now has its own switch there; turn it on. The status reads "Bootstrapping…" while Arti joins the network, which can take a little while the first time.
4. Type the Tor Project's own onion address, `2gzyxa5ihm7nsggfxnu52rck2vv4rvmdlkiu3zzui5du4xyclen53wid.onion`, and press Enter. It is listed on [onion.torproject.org](https://onion.torproject.org/).
5. To have Tor ready whenever Freedom opens, turn on **Start Tor when Freedom opens** under **Settings > Nodes**.

Get onion addresses from the operator's own website, not from link lists. A look-alike address connects just as well as the real one.

If something doesn't connect, the [troubleshooting notes](https://github.com/solardev-xyz/freedom-browser/blob/main/docs/troubleshooting.md) cover the common cases. The code is on [GitHub](https://github.com/solardev-xyz/freedom-browser) and [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE); report problems, including security issues, as GitHub issues. Questions and onion sites worth sharing are welcome at [t.me/freedom_browser](https://t.me/freedom_browser).
