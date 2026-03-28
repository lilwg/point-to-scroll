const activeTabs = new Set();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'activate') {
    const tabId = message.tabId;
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    }).then(() => {
      activeTabs.add(tabId);
      chrome.action.setBadgeText({ text: 'ON', tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#2ec4b6', tabId });
      sendResponse({ ok: true });
    }).catch((err) => {
      sendResponse({ ok: false, error: err.message });
    });
    return true;
  }

  if (message.type === 'deactivate') {
    const tabId = message.tabId;
    chrome.tabs.sendMessage(tabId, { type: 'p2s-stop' }).catch(() => {});
    activeTabs.delete(tabId);
    chrome.action.setBadgeText({ text: '', tabId });
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'get-state') {
    sendResponse({ active: activeTabs.has(message.tabId) });
    return true;
  }
});

chrome.tabs.onRemoved.addListener((tabId) => activeTabs.delete(tabId));
