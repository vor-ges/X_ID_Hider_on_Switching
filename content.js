// X_ID_Hider
// 1) Account-switching interface: always masks account names and IDs.
// 2) Timeline: masks author names and IDs, with an ON/OFF setting in the popup.

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

  function hasLetterOrDigit(text) {
    return /[\p{L}\p{N}]/u.test(text);
  }

  // ============================================================
  // 1) Account-switching interface (always enabled)
  // ============================================================

  const MASK_TESTIDS = [
    'UserCell',
    'SideNav_AccountSwitcher_Button',
    'AccountSwitcher_Switch_Button'
  ];
  const LOGOUT_TESTID = 'AccountSwitcher_Logout_Button';

  const MASK_SELECTOR = MASK_TESTIDS
    .map((id) => `[data-testid="${id}"]`)
    .join(',');
  const LOGOUT_SELECTOR = `[data-testid="${LOGOUT_TESTID}"]`;

  const ACCOUNT_WORD_BY_LANG = {
    ja: 'アカウント', en: 'account', de: 'Account', fr: 'compte',
    es: 'cuenta', it: 'account', pt: 'conta', ko: '계정',
    zh: '账号', ru: 'аккаунт', nl: 'account', tr: 'hesap',
    ar: 'الحساب', id: 'akun', th: 'บัญชี', vi: 'tài khoản',
    pl: 'konto'
  };

  function getAccountWord() {
    const lang = (document.documentElement.lang || 'en')
      .toLowerCase()
      .split('-')[0];
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
  // 2) Timeline author names and IDs (toggleable)
  // ============================================================

  const TIMELINE_NAME_SELECTOR =
    '[data-testid="tweet"] [data-testid="User-Name"]';

  let timelineMaskEnabled = true;

  function maskTimelineSpan(span) {
    if (span.dataset.xhideTlMasked === '1') return;
    if (span.children.length > 0) return;

    const original = span.textContent;
    if (!original) return;

    const trimmed = original.trim();
    // Ignore separators and punctuation such as "·".
    if (!trimmed || !hasLetterOrDigit(trimmed)) return;

    span.dataset.xhideTlOriginal = original;
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
    (root || document)
      .querySelectorAll(TIMELINE_NAME_SELECTOR)
      .forEach(processTimelineContainer);
  }

  function unmaskAllTimeline() {
    document
      .querySelectorAll('span[data-xhide-tl-masked="1"]')
      .forEach(unmaskTimelineSpan);
  }

  function applyTimelineSetting(enabled) {
    timelineMaskEnabled = enabled;
    if (enabled) {
      scanTimeline(document);
    } else {
      unmaskAllTimeline();
    }
  }

  // Load the saved setting and react to changes made in the popup.
  if (typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local) {
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
  // 3) Initial scan and dynamic page updates
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
          if (node.matches(TIMELINE_NAME_SELECTOR)) {
            processTimelineContainer(node);
          }
        }

        if (node.querySelectorAll) {
          node.querySelectorAll(MASK_SELECTOR)
            .forEach(processSwitcherContainer);
          node.querySelectorAll(LOGOUT_SELECTOR)
            .forEach(processLogoutContainer);
          node.querySelectorAll(TIMELINE_NAME_SELECTOR)
            .forEach(processTimelineContainer);
        }
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
