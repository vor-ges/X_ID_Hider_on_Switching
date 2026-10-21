//     - data-testid 属性（比較的安定）
//     - div[dir="ltr"] の中にある「子要素を持たないspan（leaf span）」
//   という構造的な特徴だけを頼りにテキストを検出してマスクする。

(function () {
  'use strict';

  // 表示名/IDを丸ごと伏せ字にするコンテナ
  const MASK_TESTIDS = [
    'UserCell',                        // アカウント切り替えメニュー内の各行
    'SideNav_AccountSwitcher_Button',  // 左サイドバーの自分のアカウント表示
    'AccountSwitcher_Switch_Button'    // 切り替え候補アカウントのボタン
  ];
  // 文中にIDが埋め込まれるため特別扱いするコンテナ
  const LOGOUT_TESTID = 'AccountSwitcher_Logout_Button';

  const MASK_SELECTOR = MASK_TESTIDS.map((id) => `[data-testid="${id}"]`).join(',');
  const LOGOUT_SELECTOR = `[data-testid="${LOGOUT_TESTID}"]`;

  // ログアウト文言内で "@handle" の代わりに表示する、言語ごとの単語
  // (X の <html lang="..."> を見て判定。未対応言語は "Account" にフォールバック)
  const ACCOUNT_WORD_BY_LANG = {
    ja: 'アカウント',
    en: 'account',
    de: 'Account',
    fr: 'compte',
    es: 'cuenta',
    it: 'account',
    pt: 'conta',
    ko: '계정',
    zh: '账号',
    ru: 'аккаунт',
    nl: 'account',
    tr: 'hesap',
    ar: 'الحساب',
    id: 'akun',
    th: 'บัญชี',
    vi: 'tài khoản',
    pl: 'konto'
  };

  function getAccountWord() {
    const lang = (document.documentElement.lang || 'en').toLowerCase().split('-')[0];
    return ACCOUNT_WORD_BY_LANG[lang] || 'Account';
  }

  // --- 通常のマスク（表示名・IDを丸ごと伏せ字に） ---

  function maskText(original) {
    const trimmed = original.trim();
    if (trimmed.startsWith('@')) {
      return '@' + '•'.repeat(8);
    }
    return '•'.repeat(Math.min(Math.max(trimmed.length, 4), 8));
  }

  function maskSpan(span) {
    if (span.dataset.xhideMasked === '1') return;   // 処理済みならスキップ
    if (span.children.length > 0) return;             // leaf spanのみ対象
    const original = span.textContent;
    if (!original || !original.trim()) return;
    if (!span.closest('div[dir="ltr"]')) return;      // 名前/IDの行は dir="ltr"

    span.textContent = maskText(original);
    span.dataset.xhideMasked = '1';
  }

  // --- ログアウトボタン専用：文中の "@handle" だけを単語に置換 ---

  function maskLogoutSpan(span) {
    if (span.dataset.xhideMasked === '1') return;
    if (span.children.length > 0) return;
    const original = span.textContent;
    if (!original) return;

    const handlePattern = /@\w+/;
    if (!handlePattern.test(original)) return;         // ID が含まれない文言は無視

    span.textContent = original.replace(handlePattern, getAccountWord());
    span.dataset.xhideMasked = '1';
  }

  // --- 実行部 ---

  // UserCell は検索サジェストや「おすすめユーザー」ウィジェットなど、
  // 切り替えメニュー以外の場所でも使い回されているコンポーネント。
  // 切り替えメニュー内の行（現在のアカウント/切り替え候補いずれも）は
  // 祖先に role="group" を持つが、検索サジェストや他のウィジェットには
  // 出てこないため、これを目印に「切り替えメニュー内のUserCellだけ」を
  // 対象にする（role が listitem か button かは行によって変わるため使わない）。
  function isAccountSwitcherUserCell(container) {
    if (container.getAttribute('data-testid') !== 'UserCell') return true; // UserCell以外は無条件で対象
    return !!container.closest('[role="group"]');
  }

  function processMaskContainer(container) {
    if (!isAccountSwitcherUserCell(container)) return;
    container.querySelectorAll('span').forEach(maskSpan);
  }

  function processLogoutContainer(container) {
    container.querySelectorAll('span').forEach(maskLogoutSpan);
  }

  function scan(root) {
    const base = root || document;
    base.querySelectorAll(MASK_SELECTOR).forEach(processMaskContainer);
    base.querySelectorAll(LOGOUT_SELECTOR).forEach(processLogoutContainer);
  }

  // 初回実行（既に開いているメニューなどに対応）
  scan();

  // アカウント切り替えメニューはポップアップとして後から
  // DOMに追加されるため、MutationObserverで監視して都度処理する。
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        if (node.matches) {
          if (node.matches(MASK_SELECTOR)) processMaskContainer(node);
          if (node.matches(LOGOUT_SELECTOR)) processLogoutContainer(node);
        }
        if (node.querySelectorAll) {
          node.querySelectorAll(MASK_SELECTOR).forEach(processMaskContainer);
          node.querySelectorAll(LOGOUT_SELECTOR).forEach(processLogoutContainer);
        }
      });
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
