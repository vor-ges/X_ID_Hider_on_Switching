# X_ID_Hider

A Chromium browser extension that masks account names and IDs on X.

## Features

- **Account switcher masking** — Always masks display names and `@handles` in supported account-switching interface elements.
- **Sidebar account masking** — Masks the account name and ID displayed in the sidebar account-switcher button.
- **Logout text replacement** — Replaces the `@handle` in the logout button text with a localized word for "account".
- **Timeline masking** — Masks post authors' display names and IDs. This feature can be turned on or off from the extension popup.
- **Dynamic interface support** — Detects supported elements added after the page has loaded.
- **Multilingual logout replacement** — Chooses the replacement word based on X's page language.

## Requirements

- A Chromium-based browser with Manifest V3 support
- Access to `x.com` or `twitter.com`

## Installation

1. Download and extract this repository.
2. Open `chrome://extensions/` in your browser.
3. Enable **Developer mode**.
4. Select **Load unpacked**.
5. Choose the extracted `X_ID_Hider` folder.

## Usage

1. Open X.
2. The account-switching interface is masked automatically.
3. To control timeline masking, select the X_ID_Hider extension icon and toggle **Hide author names and IDs on the timeline**.

Timeline masking is enabled by default. The setting is saved locally using the browser's extension storage.

## Notes and limitations

- This extension changes text displayed in the browser only. It does not change account names, handles, or account settings on X.
- Account-switcher masking is always enabled; only timeline masking has an ON/OFF setting.
- Masking is limited to the interface elements targeted by the extension. It does not hide account IDs everywhere on X.
- The extension relies on X's DOM structure and `data-testid` attributes. Changes to X's interface may affect compatibility.
- The logout replacement word follows the language configured on X. Unsupported languages fall back to `Account`.

## Development

The extension combines the account-switcher masking implementation with the optional timeline author-masking feature.

## Author

vor_ges

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
