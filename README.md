
# X ID Hider

A browser extension for masking display names and account IDs on X.

## Concept

X ID Hider was created to help keep account names and IDs out of view while using X.

The extension provides two masking functions: one for the account-switching interface and another for author information displayed on the timeline.

Account-switching elements are always masked, while timeline masking can be enabled or disabled through the extension popup.

## Overview

- **Platform:** Chromium-based browsers supporting Manifest V3
- **Version:** 1.1.0
- **Supported Websites:** `x.com`, `twitter.com`

## Features

- **Account Switching Menu Masking** — Automatically masks display names and IDs in account-switching menu entries.
- **Sidebar Account Masking** — Masks the account name and ID displayed in the sidebar account-switcher button.
- **Timeline Author Masking** — Masks display names and IDs shown in timeline posts.
- **Masking Toggle** — Enables or disables timeline author masking through the extension popup.
- **Persistent Settings** — Saves the timeline masking preference using Chrome's local storage.
- **Dynamic Interface Support** — Uses a MutationObserver to process elements dynamically added to the page.
- **Multilingual Support** — Uses localized masking text for supported languages when replacing account IDs in the targeted interface.

## Requirements

- A Chromium-based browser with support for Manifest V3
- Access to `x.com` or `twitter.com`

## How to use

1. Install the extension in your browser.
2. Open X and sign in to your account.
3. The account-switching interface is automatically masked.
4. To control timeline masking, click the extension icon in your browser toolbar.
5. Use the checkbox to enable or disable `Hide timeline author names and IDs`.

Timeline masking is enabled by default.

## Important notes

- Account-switching interface masking is always enabled and cannot be toggled through the popup.
- Timeline masking can be independently enabled or disabled.
- The extension changes text displayed in the browser. It does not modify account names, handles, or account settings on X.
- Masking is limited to the targeted interface elements. It does not hide every occurrence of account names or IDs throughout the website.
- The extension relies on X's `data-testid` attributes and DOM structure. Changes to X's interface may affect compatibility.
- The extension uses local storage to retain the timeline masking preference.

## Development

This project was created to make using X more comfortable when account names and IDs should remain out of view.

## Author

vor_ges

## Licence

This project is licensed under the MIT License. See the LICENSE file for details.

[MIT License](https://opensource.org/license/mit)
