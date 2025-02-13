chrome.runtime.onInstalled.addListener(function (details) {
  // Check for existing configuration settings.
  chrome.storage.sync.get(["passkey", "username", "websites"], function (data) {
    if (!data.passkey || !data.username || !data.websites) {
      // Open the configuration page automatically.
      chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
    }
  });
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'checkPasskey') {
    chrome.storage.sync.get('passkey', function (data) {
      const isValid = request.passkey === data.passkey;
      sendResponse({ success: isValid });
    });
    return true; // Keeps the message channel open for async response
  }
});
