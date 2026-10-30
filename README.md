# X ID Hider on Switching

A browser extension that masks display names and account IDs in X's account-switching interface.

## Concept

X ID Hider on Switching was created to help keep account names and IDs out of view when switching between X accounts.

The extension masks display names and `@handle` values in selected account-switching interface elements. It also replaces the handle in the logout button's text with a localized word for "account".

## Overview

- **Platform:** Chromium-based browsers supporting Manifest V3
- **Version:** 1.0.0
- **Supported Websites:** `x.com`, `twitter.com`

## Features

- **Account Switching Menu Masking** — Masks display names and IDs in account-switching menu entries.
- **Sidebar Account Masking** — Masks the account name and ID shown in the sidebar account-switcher button.
- **Logout Text Replacement** — Replaces the `@handle` in the logout button's text with a localized word for "account".
- **Multilingual Support** — Supports localized replacement words for several languages, including Japanese, English, German, French, Korean, and Chinese.
- **Dynamic Interface Support** — Uses a MutationObserver to process account-switching elements added to the page after the initial load.
- **Targeted Masking** — Uses specific `data-testid` attributes and DOM structure to identify the intended interface elements.

## Requirements

- A Chromium-based browser with support for Manifest V3
- Access to `x.com` or `twitter.com`

## How to use

1. Install the extension in your browser.
2. Open X and sign in to your account.
3. Open the account-switching menu.
4. The extension automatically masks the display names and IDs in supported interface elements.

No manual activation is required.

## Important notes

- The extension changes text displayed in the page; it does not change account names, handles, or account settings on X.
- Masking is limited to the interface elements targeted by the extension. It does not hide account IDs throughout the entire website.
- The extension relies on X's DOM structure and `data-testid` attributes. Changes to X's interface may affect compatibility.
- The logout button's replacement word is selected using the page's language setting. Unsupported languages fall back to `Account`.

## Development

This project was created to make switching between X accounts more comfortable when account names and IDs should remain out of view.

## Author

vor_ges

## Licence

This project is licensed under the MIT License. See the LICENSE file for details.

[MIT License](https://opensource.org/license/mit)
