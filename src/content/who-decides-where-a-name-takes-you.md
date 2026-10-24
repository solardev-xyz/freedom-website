---
title: Who decides where a .eth name takes you
description: Content addressing proves you got the site you asked for. It cannot prove you asked for the right one. What a single RPC provider can do to the answer, and how Freedom checks names instead of trusting them.
---

# Who decides where a .eth name takes you

*1 October 2026*

In April 2026, someone tried to take over eth.limo. They did not attack Ethereum or ENS. They went to eth.limo's domain registrar with fraudulent account-recovery requests and tried to change where the domain pointed. eth.limo is a gateway that lets ordinary browsers open `.eth` sites, so whoever controls it controls what those visitors see. The social engineering worked; DNSSEC, a second safeguard, stopped the change from taking effect. The registrar [published a post-mortem](https://easydns.com/blog/2026/04/18/we-screwed-up-and-we-own-it-the-eth-limo-shtshow-is-on-us/).

Freedom does not need a gateway. Type `freedombrowser.eth` and it fetches this website from Swarm itself, from peers, by an address that is a fingerprint of the content. A peer cannot hand over a different page under that address.

But the browser still has to learn the address. It is stored on Ethereum, in the name's ENS record, and something has to read it. The usual way is to ask an RPC provider: a company that runs Ethereum nodes and answers remote procedure calls (RPC), questions about the chain's state, for anyone who sends them. Ask just one, and the gateway's weak spot is back in a smaller form. Whoever answers that one question decides which site you get.

## What one RPC provider can do

Content addressing proves you got what you asked for. It cannot tell you that you asked for the right thing. If the only source of the address is one provider, that provider, or anyone who compromises, coerces or misconfigures it, can:

- **Send you somewhere else.** Return a different content hash, and the browser fetches that content instead. It will check out perfectly against the hash it was given.
- **Redirect a payment.** Names also carry payment addresses. A false address record turns "send to a `.eth` name" into a send to someone else.
- **Serve the past.** A node that has fallen behind answers from an older block: an older version of a site, or a record that has since changed. Nothing in the reply says it is stale.
- **Lie to one person.** The provider knows who is asking. It can answer everyone else honestly and only you falsely, and with a single source you have nothing to compare against.
- **Stop answering.** An outage, a rate limit, a policy or a legal demand, and the name stops working for everyone who relies on that provider, all at once.
- **Watch.** Every lookup tells the provider which sites you open and which accounts you check, along with your IP address.

None of this needs a provider that is malicious all the time. It needs one wrong answer, at the wrong moment, for you.

## Checking instead of trusting

Freedom's answer is to stop taking the reply on trust and check it. It has four ways to look up a name and tries them in order, the ones that check first.

The first is **Myotis**, the Ethereum light client built for Freedom by [@biafra23](https://github.com/biafra23/myotis), running inside the browser. A light client does not store the chain; it follows it. Myotis tracks Ethereum's consensus over a peer-to-peer network, checking the block headers signed by the sync committee, a rotating group of validators. When you type a name, it fetches the contract state it needs from peers along with Merkle proofs, checks those proofs against a header it has verified, and runs the name lookup itself. No RPC provider is in that path. A peer can refuse to help, but a false record does not survive the check. For these lookups Myotis uses the newest head it has verified, which the sync committee has signed but which may not yet be finalized.

Myotis needs time to sync and peers to talk to. When it cannot answer, **[Colibri](https://github.com/corpus-core/colibri-stateless)**, by corpus.core, comes next. A remote prover gathers the data and builds a proof that ties the answer to a block signed by the sync committee. Freedom checks the proof locally and runs the lookup itself on the proven storage. The prover is trusted to show up, not to tell the truth: Freedom accepts only Colibri answers whose proof checks out.

Third is an **RPC quorum**. Freedom gets several RPC endpoints to agree on one recent block, asks each of them for the record at that block, and accepts an answer only when enough of them match: by default two of three, configurable in the network configuration. This is not proof. It raises the bar from one provider getting it wrong to two getting it wrong the same way, which providers that share infrastructure or a bug still could. But a single provider, lying to everyone or only to you, can no longer decide the answer on its own.

The fourth, **a single RPC endpoint**, is the setup this post started with, and for names it is off by default. If you turn it on for your own node, Freedom identifies the answer as coming from your endpoint, and still does not call it cryptographically checked.

Names ending in `.wei` and `.gwei`, from the WNS and GNS naming systems, are separate contracts on Ethereum and go through the same checks.

## You can see what you got

Every name Freedom opens carries a shield in the address bar that says what the answer rests on: "Verified by Myotis light client", with "Optimistic beacon proof (not finalized)" as the evidence, or "Verified by 2 of 3 public RPCs", with "Matching RPC responses" and each endpoint listed.

When Freedom cannot check a name, it does not quietly open it anyway. An unverified answer, for instance when only one endpoint replied, is held back while the other methods try. If none can verify it, you get a page that says so, and the site opens only if you choose to continue. If providers contradict each other, nothing opens at all. A redirect that would have been silent becomes a decision you can see. In Settings you can reorder the methods, turn them on or off, and choose to open unverified names without asking.

## Beyond the address bar

The same idea runs under the wallet. Balances, gas estimates, transactions and the calls dApps make go through the chain-data router, a separate component with the same kinds of source and defaults of its own. On Ethereum and Gnosis it tries, by default, Myotis, Colibri, an RPC quorum and then a single endpoint. If enabled and available, a later source can keep a read working when a preferred one cannot. This quorum compares answers without first agreeing on a block. Freedom's current Myotis adapter routes balances, nonces, contract calls, gas estimates and fee levels to Myotis, all at `latest`; everything else goes to the sources after it. If Myotis verifiably runs a contract call and the contract reverts, that revert is the answer. Base, the third built-in chain, starts with the quorum. Freedom includes configured remote prover endpoints for Ethereum and Gnosis, and in Settings you can reorder each chain's sources and choose its endpoints.

Sending to a name uses the name checks above, and the send screen warns when the address could not be verified. Transactions are signed before the router sees them, so wallet prompts and dApp permissions are unchanged; by default on Ethereum and Gnosis they go out through Myotis first, then a single endpoint. If Myotis attempted a broadcast but the outcome is uncertain, Freedom says so rather than sending it again elsewhere: the safe next step is to check on the original, not to sign a new one. Apps loaded from a contract through `web3://` are read through the router and get the same shield as names.

In the next release, Freedom's own Swarm node stops depending on a single fixed RPC endpoint too. Ant, the bundled node, reads Gnosis Chain for its balance, postage batches and chequebook, and at startup scans past events to find the ones it owns. [On the main branch](https://github.com/solardev-xyz/freedom-browser/pull/419), these requests go through the router, over a private local connection that web pages cannot use: in Ant's default ultra-light mode, the startup scan and the reads that mode makes; in light mode, all of its Gnosis reads and the delivery of transactions Ant has already signed. Ant still signs for itself. The current Myotis adapter passes event logs, receipts, contract code and block numbers on, so Ant gets those from Colibri, the quorum or a single endpoint, with the trust each carries.

## What this does not solve

Checking narrows trust; it does not remove it. A valid proof shows that an answer matches the block it was checked against; whether that block is finalized is a separate question. Proof checking also rests on where a verifier starts: Myotis syncs forward from a checkpoint, and Colibri has bootstrap assumptions of its own. Since 0.8.6, when Myotis's built-in checkpoint expires, Freedom accepts a replacement only if independent sources agree on it and a local proof check passes. Historical queries may go to Colibri or the RPC tiers rather than the current Myotis adapter. And spreading questions across sources changes who sees them; it does not hide them. Keeping lookups private is separate work.

## Try it

Name checking, the shield and the chain-data router are in Freedom 0.8.6, which you can download from [freedom.baby](https://freedom.baby). The Swarm node's use of the router ships in the next release. If a name opens somewhere it should not, or the shield tells you something surprising, say so at [t.me/freedom_browser](https://t.me/freedom_browser). The code is on [GitHub](https://github.com/solardev-xyz/freedom-browser).
