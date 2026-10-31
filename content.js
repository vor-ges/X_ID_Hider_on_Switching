// Content script for X (Twitter) that masks:
//   1) Names/IDs in the account switcher menu (always on, no toggle)
//   2) Author names/IDs in the timeline (can be toggled on/off)
//
// Approach:
//   X's class names (css-xxxx, r-xxxx) change between builds, so we never
//   rely on them. Instead we use only structural features:
//     - data-testid attributes (relatively stable)
//     - "leaf spans" (spans without child elements) inside div[dir="ltr"]

(function () {
  'use strict';

  // ============================================================
  // Shared utilities
  // ============================================================

  function maskText(original) {
    const trimmed = original.trim();
    if (trimmed.startsWith('@')) {
      return '@' + '•'.repeat(8);
    }
    return '•'.repeat(Math.min(Math.max(trimmed.length, 4), 8));
  }

  // Avoids masking symbol-only text (separators such as "·").
  // Text is only a target if it contains at least one letter or digit.
  function hasLetterOrDigit(text) {
    return /[\p{L}\p{N}]/u.test(text);
  }

  // ============================================================
  // 1) Account switcher menu (always masked)
  // ============================================================

  const MASK_TESTIDS = [
    'UserCell',                        // each row in the account switcher menu
    'SideNav_AccountSwitcher_Button',  // current account button in the left sidebar
    'AccountSwitcher_Switch_Button'    // buttons for the other accounts
  ];
  const LOGOUT_TESTID = 'AccountSwitcher_Logout_Button';

  const MASK_SELECTOR = MASK_TESTIDS.map((id) => `[data-testid="${id}"]`).join(',');
  const LOGOUT_SELECTOR = `[data-testid="${LOGOUT_TESTID}"]`;

  // Word used in place of "@handle" inside the logout label, per UI language
  // (detected from <html lang="...">; unknown languages fall back to "Account").
  const ACCOUNT_WORD_BY_LANG = {
    ja: 'アカウント', en: 'account', de: 'Account', fr: 'compte', es: 'cuenta',
    it: 'account', pt: 'conta', ko: '계정', zh: '账号', ru: 'аккаунт',
    nl: 'account', tr: 'hesap', ar: 'الحساب', id: 'akun', th: 'บัญชี',
    vi: 'tài khoản', pl: 'konto'
  };

  function getAccountWord() {
    const lang = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
    return ACCOUNT_WORD_BY_LANG[lang] || 'Account';
  }

  function maskSwitcherSpan(span) {
    if (span.dataset.xhideMasked === '1') return;
    if (span.children.length > 0) return;
    const original = span.textContent;
    if (!original || !original.trim()) return;
    if (!span.closest('div[dir="ltr"]')) return;

    span.textContent = maskText(original);
    span.dataset.xhideMasked = '1';
  }

  // The logout button embeds the ID inside a sentence (e.g. "@handle abmelden"
  // or "Log out @handle"), so only the "@handle" part is replaced rather than
  // the whole text.
  function maskLogoutSpan(span) {
    if (span.dataset.xhideMasked === '1') return;
    if (span.children.length > 0) return;
    const original = span.textContent;
    if (!original) return;

    const handlePattern = /@\w+/;
    if (!handlePattern.test(original)) return;

    span.textContent = original.replace(handlePattern, getAccountWord());
    span.dataset.xhideMasked = '1';
  }

  // UserCell is a shared component also used in search suggestions, "who to
  // follow" widgets, etc. Rows inside the account switcher menu (both the
  // current account and the other accounts) have a role="group" ancestor,
  // which the other places do not, so we use that to target only the menu.
  function isAccountSwitcherUserCell(container) {
    if (container.getAttribute('data-testid') !== 'UserCell') return true;
    return !!container.closest('[role="group"]');
  }

  function processSwitcherContainer(container) {
    if (!isAccountSwitcherUserCell(container)) return;
    container.querySelectorAll('span').forEach(maskSwitcherSpan);
  }

  function processLogoutContainer(container) {
    container.querySelectorAll('span').forEach(maskLogoutSpan);
  }

  function scanSwitcher(root) {
    const base = root || document;
    base.querySelectorAll(MASK_SELECTOR).forEach(processSwitcherContainer);
    base.querySelectorAll(LOGOUT_SELECTOR).forEach(processLogoutContainer);
  }

  // ============================================================
  // 2) Author names/IDs in the timeline (toggleable)
  // ============================================================

  const TIMELINE_NAME_SELECTOR = '[data-testid="tweet"] [data-testid="User-Name"]';

  let timelineMaskEnabled = true; // default until storage has been read

  function maskTimelineSpan(span) {
    if (span.dataset.xhideTlMasked === '1') return;
    if (span.children.length > 0) return;
    const original = span.textContent;
    if (!original) return;
    const trimmed = original.trim();
    if (!trimmed || !hasLetterOrDigit(trimmed)) return; // skip separators like "·"

    span.dataset.xhideTlOriginal = original; // kept so the toggle can restore it
    span.textContent = maskText(original);
    span.dataset.xhideTlMasked = '1';
  }

  function unmaskTimelineSpan(span) {
    if (span.dataset.xhideTlMasked !== '1') return;
    if (span.dataset.xhideTlOriginal !== undefined) {
      span.textContent = span.dataset.xhideTlOriginal;
    }
    delete span.dataset.xhideTlMasked;
    delete span.dataset.xhideTlOriginal;
  }

  function processTimelineContainer(container) {
    container.querySelectorAll('span').forEach((span) => {
      if (timelineMaskEnabled) {
        maskTimelineSpan(span);
      } else {
        unmaskTimelineSpan(span);
      }
    });
  }

  function scanTimeline(root) {
    (root || document).querySelectorAll(TIMELINE_NAME_SELECTOR).forEach(processTimelineContainer);
  }

  function unmaskAllTimeline() {
    document.querySelectorAll('span[data-xhide-tl-masked="1"]').forEach(unmaskTimelineSpan);
  }

  // ============================================================
  // Settings (timeline toggle)
  // ============================================================

  function applyTimelineSetting(enabled) {
    timelineMaskEnabled = enabled;
    if (enabled) {
      scanTimeline(document);
    } else {
      unmaskAllTimeline();
    }
  }

  if (chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({ maskTimeline: true }, (items) => {
      timelineMaskEnabled = items.maskTimeline;
      scanTimeline(document);
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes.maskTimeline) return;
      applyTimelineSetting(changes.maskTimeline.newValue);
    });
  }

  // ============================================================
  // Run
  // ============================================================

  function scanAll(root) {
    scanSwitcher(root);
    scanTimeline(root);
  }

  scanAll();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        if (node.matches) {
          if (node.matches(MASK_SELECTOR)) processSwitcherContainer(node);
          if (node.matches(LOGOUT_SELECTOR)) processLogoutContainer(node);
          if (node.matches(TIMELINE_NAME_SELECTOR)) processTimelineContainer(node);
        }
        if (node.querySelectorAll) {
          node.querySelectorAll(MASK_SELECTOR).forEach(processSwitcherContainer);
          node.querySelectorAll(LOGOUT_SELECTOR).forEach(processLogoutContainer);
          node.querySelectorAll(TIMELINE_NAME_SELECTOR).forEach(processTimelineContainer);
        }
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
