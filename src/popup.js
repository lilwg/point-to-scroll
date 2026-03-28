const speedSlider = document.getElementById('speed');
const stopBtn = document.getElementById('stop');
const statusEl = document.getElementById('status');

let currentTabId = null;

// Auto-activate on popup open
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  currentTabId = tab.id;

  chrome.runtime.sendMessage({ type: 'get-state', tabId: tab.id }, (resp) => {
    if (!resp?.active) {
      chrome.runtime.sendMessage({ type: 'activate', tabId: tab.id }, (r) => {
        if (r?.ok) setTimeout(() => window.close(), 5000);
        else statusEl.textContent = r?.error || 'Failed to start';
      });
    } else {
      setTimeout(() => window.close(), 5000);
    }
  });
});

chrome.storage.local.get({ speed: 6 }, (data) => {
  speedSlider.value = data.speed;
});

stopBtn.addEventListener('click', () => {
  if (!currentTabId) return;
  chrome.runtime.sendMessage({ type: 'deactivate', tabId: currentTabId }, () => {
    window.close();
  });
});

speedSlider.addEventListener('input', () => {
  const speed = parseInt(speedSlider.value, 10);
  chrome.storage.local.set({ speed });
  if (currentTabId) {
    chrome.tabs.sendMessage(currentTabId, { type: 'p2s-speed', speed });
  }
});
