// X (Twitter) の
//   1) アカウント切り替えメニュー（常時マスク・トグルなし）
//   2) タイムライン上の投稿者名/ID（ON/OFFトグル可能）
// を伏せ字にする content script。
//
// 方針:
//   Xはビルドごとにクラス名(css-xxxx, r-xxxx)が変わるため、
//   クラス名には依存しない。代わりに:
//     - data-testid 属性（比較的安定）
//     - div[dir="ltr"] の中にある「子要素を持たないspan（leaf span）」
//   という構造的な特徴だけを頼りにテキストを検出してマスクする。

(function () {
  'use strict';

  // ============================================================
  // 共通ユーティリティ
  // ============================================================

  function maskText(original) {
    const trimmed = original.trim();
    if (trimmed.startsWith('@')) {
      return '@' + '•'.repeat(8);
    }
    return '•'.repeat(Math.min(Math.max(trimmed.length, 4), 8));
  }

  // 記号・絵文字だけのテキスト（区切りの "・" や "·" など）を誤ってマスク
  // しないためのチェック。文字か数字が1つも含まれていなければ対象外にする。
  function hasLetterOrDigit(text) {
    return /[\p{L}\p{N}]/u.test(text);
  }

  // ============================================================
  // 1) アカウント切り替えメニュー（常時マスク）
  // ============================================================

  const MASK_TESTIDS = [
    'UserCell',                        // アカウント切り替えメニュー内の各行
    'SideNav_AccountSwitcher_Button',  // 左サイドバーの自分のアカウント表示
    'AccountSwitcher_Switch_Button'    // 切り替え候補アカウントのボタン
  ];
  const LOGOUT_TESTID = 'AccountSwitcher_Logout_Button';

  const MASK_SELECTOR = MASK_TESTIDS.map((id) => `[data-testid="${id}"]`).join(',');
  const LOGOUT_SELECTOR = `[data-testid="${LOGOUT_TESTID}"]`;

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

  // ログアウトボタンは "@handle abmelden" / "Log out @handle" のように
  // 文中にIDが埋め込まれるため、文全体ではなく "@handle" 部分だけを置換。
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

  // UserCell は検索サジェストや「おすすめユーザー」ウィジェットなど、
  // 切り替えメニュー以外の場所でも使い回されているコンポーネント。
  // 切り替えメニュー内の行（現在のアカウント/切り替え候補いずれも）は
  // 祖先に role="group" を持つが、検索サジェストや他のウィジェットには
  // 出てこないため、これを目印に「切り替えメニュー内のUserCellだけ」を
  // 対象にする。
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
  // 2) タイムライン上の投稿者名/ID（ON/OFFトグル可能）
  // ============================================================

  const TIMELINE_NAME_SELECTOR = '[data-testid="tweet"] [data-testid="User-Name"]';

  let timelineMaskEnabled = true; // storageから読み込むまでの初期値

  function maskTimelineSpan(span) {
    if (span.dataset.xhideTlMasked === '1') return;
    if (span.children.length > 0) return;
    const original = span.textContent;
    if (!original) return;
    const trimmed = original.trim();
    if (!trimmed || !hasLetterOrDigit(trimmed)) return; // "・" などの区切り記号は対象外

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
    (root || document).querySelectorAll(TIMELINE_NAME_SELECTOR).forEach(processTimelineContainer);
  }

  function unmaskAllTimeline() {
    document.querySelectorAll('span[data-xhide-tl-masked="1"]').forEach(unmaskTimelineSpan);
  }

  // ============================================================
  // 設定の読み込み・変更監視（タイムライン用トグル）
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
  // 実行部
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
