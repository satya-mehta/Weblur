// background.js
chrome.runtime.onInstalled.addListener(function (details) {
  // 1) Check for existing configuration settings and open config page if needed.
  chrome.storage.sync.get(["passkey", "username", "websites"], function (data) {
    if (!data.passkey || !data.username || !data.websites) {
      // Open the configuration page automatically.
      chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
    }
  });

  // 2) Creating a context menu item for adding the current site to the secure list.
  chrome.contextMenus.create({
    id: "addToSecureList",
    title: "Add to Weblur Secure List",
    contexts: ["all"]
  });
});

// Listen for context menu clicks.
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToSecureList") {
    if (tab && tab.url) {
      const domain = new URL(tab.url).hostname;
      chrome.storage.sync.get("websites", (data) => {
        let websites = data.websites || [];
        
        if (!websites.includes(domain)) {
          websites.push(domain);
          chrome.storage.sync.set({ websites }, () => {
            // Reload the current tab so the blur can take effect immediately.
            chrome.tabs.reload(tab.id, () => {
              //Alert the user or show a confirmation.
              alert(`Added ${domain} to your secure list!`);
            });
          });
        } else {
          alert(`${domain} is already in your secure list!`);
        }
      });
    }
  }
});

// Listen for passkey checks from content or popup scripts.
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'checkPasskey') {
    chrome.storage.sync.get('passkey', function (data) {
      const isValid = request.passkey === data.passkey;
      sendResponse({ success: isValid });
    });
    return true; // Keep the message channel open for async response
  }
});
