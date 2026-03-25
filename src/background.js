chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  .catch(console.error);

const injected = new Set();

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'scroll') {
    chrome.tabs.query({ active: true, currentWindow: true }).then(async ([tab]) => {
      if (!tab?.id) return;

      // Inject content script on first scroll to this tab
      if (!injected.has(tab.id)) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js'],
          });
        } catch {}
        injected.add(tab.id);
      }

      chrome.tabs.sendMessage(tab.id, message).catch(() => {});
    });
  }
});

chrome.tabs.onRemoved.addListener((tabId) => injected.delete(tabId));
