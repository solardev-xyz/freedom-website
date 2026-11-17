---
title: Keys that never touch your computer: Ledger and phone accounts in Freedom
description: Freedom can sign with a Ledger over USB or with the wallet on your phone. The key stays on the device, you confirm every signature there, and Freedom checks what comes back.
---

# Keys that never touch your computer: Ledger and phone accounts in Freedom

*17 November 2026*

A browser is a busy place to keep a private key. Freedom's built-in wallet keeps its keys in an encrypted vault, which is fine for everyday amounts. For the account that holds your savings or owns your names, you may want the key somewhere else entirely.

Since 0.8.5, Freedom can use two such places: a Ledger hardware wallet, and the wallet app on your phone. In both cases the key never enters the browser. Freedom asks, the device shows you the request, and nothing is signed until you confirm it there.

## Ledger over USB

A Ledger account in Freedom is an address the Ledger derives from its seed, plus the path to it. Freedom remembers both, so it can show your balance without the device plugged in. When something needs a signature, Freedom opens the device over USB, sends the request, and waits for you to approve or reject it on the Ledger's screen.

Before each signature, Freedom checks that the Ledger in front of it still derives your account's address at the stored path. Plug in a different Ledger with a different seed and you get "This Ledger does not hold the selected account" instead of a signature from an address you never approved.

Freedom also keeps Ledger signing offline. Ledger's own libraries normally look up details about a transaction or a typed-data message on Ledger's servers, so the device can describe a contract call in readable words. That lookup sends the contents of what you are about to sign, or a fingerprint of it, to a hosted service from your IP address. Freedom switches it off. Plain ETH transfers still display normally on the device. Contract calls, ERC-20 token transfers included, show as raw data, and the Ethereum app may ask you to turn on **Blind signing** (called "Contract data" in older versions of the app). Freedom tells you when that is the reason a request failed.

## Your phone as the signer

A phone account works with the wallet you already carry. Freedom connects to it over [Open Lavatory](https://openlv.sh/), an open protocol for linking apps and wallets: Freedom shows a QR code, your phone scans it, and the two set up an end-to-end encrypted, peer-to-peer connection. A public relay helps the two find each other, but it only passes encrypted handshake messages and never sees wallet data in the clear. No account, no API key, no Freedom server.

Each signing request for a phone account shows a fresh QR code in the wallet sidebar. You scan it, read the request on your phone and confirm it there.

Transactions work the way phone wallets work: Freedom hands the transaction to your phone, and the phone's wallet picks the nonce, estimates gas and broadcasts it through its own connection. Freedom then checks on chain that the transaction it got back really came from your account.

Freedom doesn't take the phone's word for anything else either. Every signature that comes back must match the account's address; if your phone answers from a different account, the request fails instead of passing a stranger's signature on to the site.

## What these accounts can do

Ledger and phone accounts are full accounts in the wallet, not a side feature:

- **Apps.** Sites that ask for your wallet see the account like any other, and you sign their transactions and messages on the device.
- **Sends.** Sending funds from the wallet sidebar goes through the device.
- **x402 payments.** Pages that charge per request with [x402](https://freedom.baby/freedom-0-7-4.html) can be paid from a Ledger or phone account. If you turn on auto-pay for a site, Freedom skips its own dialog, but every payment still needs your confirmation on the device. Freedom says so in the payment card.
- **Locked vault.** Because the key isn't in the vault, these accounts work while the vault is locked.

They can also own a Safe, the multi-owner account on Gnosis that 0.8.5 added alongside them.

## How to try it

1. Download Freedom 0.8.5 or later from the [download section](https://freedom.baby/#download) and set up the wallet.
2. Open the wallet sidebar and open the account list at the top.
3. **For a Ledger:** choose **Connect Hardware Wallet**. Plug the Ledger in over USB, unlock it with your PIN and open the Ethereum app. Pick the derivation path you used before (**Ledger Live**, or **Legacy (MEW / MyCrypto)** for older setups), choose an account, give it a name and add it.
4. **For a phone:** choose **Connect Phone / Other Device** and scan the QR code with a wallet app that supports Open Lavatory. Choose the account your phone offers, name it and add it.
5. Switch to the new account and try something small: send yourself a tiny amount, or sign in to an app. Watch the request appear on the device and confirm it there.

If the Ledger isn't found, check that it is unlocked and that the Ethereum app is open. If a contract call is refused, enable Blind signing in the Ethereum app's settings, and only for requests you understand.

## Coming next

The next release goes further on the same idea. Adding a Ledger account will read its address on the Ledger itself, and adding a phone account will have the phone sign a short check as that account, so a confused or malicious connection can't slip in an address you don't control.

The code is on [GitHub](https://github.com/solardev-xyz/freedom-browser) and [Radicle](https://radicle.network/nodes/iris.radicle.network/rad%3Az3QXuMvMmSeEX3ZgoUidZC1v5MkKE). If you try a phone wallet with Freedom, tell us which one worked at [t.me/freedom_browser](https://t.me/freedom_browser).
