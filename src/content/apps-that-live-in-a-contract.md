---
title: Apps that live in a contract: web3:// in Freedom
description: Freedom opens web3:// addresses, apps whose whole page is stored in an Ethereum contract. No web server, no gateway, and a shield that tells you whether the code you got was checked.
---

# Apps that live in a contract: web3:// in Freedom

*10 November 2026*

Most dapps are two things glued together. The contracts live on Ethereum, where nobody can quietly change them. The interface you click on lives on a web server, under a domain, behind a hosting company. When that server goes down, gets blocked or gets hacked, the contracts are fine and you still can't use them.

Freedom can open apps where there is no second half. Since 0.8.5, typing a `web3://` address loads an application whose entire page is stored in a contract on an Ethereum-compatible chain. The browser reads the page from the chain and renders it. There is no web server and no gateway in between.

## How it works

The format comes from a draft Ethereum standard, [ERC-8244](https://ethereum-magicians.org/t/erc-8244-contract-hosted-application-html/28407). A contract that follows it has a function called `html()` that returns the app's full HTML document as a string. Scripts, styles and images are inlined into that one document.

You open it with an address in the form `web3://<contract>:<chainId>/`. The chain ID is optional; leave it off and Freedom reads from Ethereum mainnet. Add `:100`, for example, to read from Gnosis Chain.

Freedom calls `html()` through the same chain-data sources its wallet uses, in the order your network settings set: the experimental Myotis light client when it runs, then Colibri proofs, then several RPC providers compared against each other, then a single RPC as the last resort. It decodes the answer and serves those bytes unchanged as the page. Paths, queries and fragments after the address stay available to the app for its own routing.

A load has 30 seconds to finish, and a document can be up to 8 MiB. Decoding happens off the browser's main thread, so a big onchain app doesn't freeze your other windows while it loads.

## Did you get the real code?

Reading a page from a contract only helps if you can trust the read. If Freedom asked one RPC provider and believed the answer, that provider could hand you any HTML it liked under the contract's address.

So Freedom checks. When a page loads, the shield in the address bar reports the network, the block it was read at, the contract, and a hash of the HTML you received, along with whether that read was verified.

When the code could not be verified, for example because it came from a single public RPC endpoint, the app does not run. You get a page titled "Onchain app not independently verified", with the details. From there you can try again, go back, open the RPC settings, or choose **Continue once**. Continue once approves only those exact bytes for the current browser session; if the contract returns different HTML later, Freedom warns you again. An RPC endpoint you configured yourself counts as a source you trust.

If the sources Freedom asked actually disagree about what the contract returns, there is no Continue once. The load is blocked.

## What the app is allowed to do

Contract HTML runs in a locked-down sandbox. Inline scripts and styles work, and so do images and media embedded in the document itself. Connections out to the network, external frames, workers, pop-ups and scripted redirects are blocked. When you click a real link, Freedom's own navigation takes it.

The app can still talk to your wallet, with two guards:

- **Pinned to its chain.** Reads and approvals stay on the chain in the app's address. A page can't switch your wallet to another chain.
- **Its own permissions.** Each contract-and-chain pair gets its own storage and its own wallet permission, so approving one onchain app doesn't approve another.

Private windows render onchain apps but, as on every other protocol, give them no wallet.

## How to try it

1. Download Freedom 0.8.5 or later from the [download section](https://freedom.baby/#download) and open it.
2. Type `web3://0x00000095643CFfA7D9fae407a84dfCB6406456c6` in the address bar and press Enter. This is the contract Freedom's own docs use as an example: a trading interface called zSwap whose roughly 240 KB page is stored on Ethereum mainnet.
3. Click the shield in the address bar to see the chain, block, contract and HTML hash behind the page.
4. If you land on the "not independently verified" page instead, read what it found before you choose Continue once. To get verified reads, add RPC endpoints you trust under Settings > Networks > RPC Providers.

Nothing on the page moves funds until you approve it in your wallet, and the usual care applies to any app you haven't used before.

## Build one

If you write contracts, an ERC-8244 app is a contract with an `html()` function that returns one self-contained document. Keep it under 8 MiB, inline everything, and don't count on fetching anything from the network at runtime, because the sandbox won't allow it. The [protocol notes](https://github.com/solardev-xyz/freedom-browser/blob/main/docs/protocols/onchain-apps.md) cover the origin model, the sandbox and the limits. This first version reads the contract directly; the optional registry and upgrade extensions in the draft are not built in yet.

The code is on [GitHub](https://github.com/solardev-xyz/freedom-browser) and [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE). If you build an onchain app, show it at [t.me/freedom_browser](https://t.me/freedom_browser).
