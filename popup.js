const checkbox = document.getElementById('toggle-timeline');

chrome.storage.local.get({ maskTimeline: true }, (items) => {
  checkbox.checked = items.maskTimeline;
});

checkbox.addEventListener('change', () => {
  chrome.storage.local.set({ maskTimeline: checkbox.checked });
});
