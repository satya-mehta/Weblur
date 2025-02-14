document.addEventListener('DOMContentLoaded', function() {
  // Cache the addCurrentPage button for later use.
  const btn = document.getElementById('addCurrentPage');

  // Load initial configuration.
  chrome.storage.sync.get(["passkey", "username", "websites"], function(config) {
    if (!config.passkey || !config.username || !config.websites) {
      // No configuration found: show initial setup.
      document.getElementById('initialSetupSection').style.display = 'block';
      document.getElementById('settingsSection').style.display = 'none';
    } else {
      // Configuration exists: show the settings section.
      document.getElementById('initialSetupSection').style.display = 'none';
      document.getElementById('settingsSection').style.display = 'block';
      document.getElementById('editUsername').value = config.username;
      document.getElementById('editWebsites').value = config.websites.join('\n');
    }
  });

  // Add Current Page Button event listener.
  document.getElementById('addCurrentPage').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || !tabs[0]) {
        alert("Couldn't fetch the current tab!");
        return;
      }
      const currentUrl = tabs[0].url;
      // Extract the hostname (domain) from the URL.
      const urlObj = new URL(currentUrl);
      const domain = urlObj.hostname;

      chrome.storage.sync.get('websites', function(data) {
        // Ensure websites is an array; if not, initialize it.
        let websites = data.websites || [];

        // Check if the domain is already in the list.
        if (websites.includes(domain)) {
          alert("This website is already in your list!");
        } else {
          websites.push(domain);
          chrome.storage.sync.set({ websites: websites }, function() {
            // Refresh the textarea by re-reading the updated websites from storage.
            chrome.storage.sync.get('websites', function(updatedData) {
              document.getElementById('editWebsites').value = updatedData.websites.join('\n');
            });

            // Change the button style for interactive feedback.
            btn.style.backgroundColor = "#58B813";
            btn.style.color = "black";
            btn.style.width = "100%";
            btn.style.borderRadius = "3px";
            btn.style.padding = "5px";
            btn.style.marginBottom = "10px";
            btn.textContent = "Website Added!";
            btn.style.textAlign = "center";

            // After 2 seconds, revert the button back to its original style.
            setTimeout(() => {
              btn.style.backgroundColor = "#FFA500";
              btn.style.width = "100%";
              btn.style.borderRadius = "3px";
              btn.style.color = "#FFF";
              btn.style.padding = "5px";
              btn.style.marginBottom = "10px";
              btn.style.cursor = "pointer";
              btn.textContent = "Add Current Page";
              btn.style.textAlign = "center";
            }, 2000);
          });
        }
      });
    });
  });

  // Initial setup event.
  document.getElementById('setup')?.addEventListener('click', function() {
    const username = document.getElementById('username').value.trim();
    const newPasskey = document.getElementById('newPasskey').value;
    const confirmPasskey = document.getElementById('confirmPasskey').value;
    const websitesText = document.getElementById('websites').value;
    // Convert the websites text into an array.
    const websites = websitesText.split('\n').map(site => site.trim()).filter(site => site);

    if (!username || !newPasskey || !confirmPasskey || websites.length === 0) {
      alert('Please fill in all fields.');
      return;
    }
    if (newPasskey !== confirmPasskey) {
      alert('Passkeys do not match!');
      return;
    }
    // Save the new configuration.
    chrome.storage.sync.set({ username, passkey: newPasskey, websites }, function () {
      alert('Configuration saved successfully!');
      window.location.reload();
    });
  });

  // Verify current passkey before allowing settings changes.
  document.getElementById('verify')?.addEventListener('click', function() {
    const currentPasskey = document.getElementById('currentPasskey').value;
    chrome.runtime.sendMessage({ action: 'checkPasskey', passkey: currentPasskey }, function(response) {
      if (response.success) {
        document.getElementById('settingsForm').style.display = 'block';
      } else {
        alert('Incorrect Passkey!');
      }
    });
  });

  // Save updated settings.
  document.getElementById('saveSettings')?.addEventListener('click', function() {
    const newUsername = document.getElementById('editUsername').value.trim();
    const websitesText = document.getElementById('editWebsites').value;
    const websites = websitesText.split('\n').map(site => site.trim()).filter(site => site);
    const newPasskey = document.getElementById('newPasskey2').value;
    const confirmPasskey = document.getElementById('confirmPasskey2').value;

    let configToUpdate = { username: newUsername, websites };

    if (newPasskey || confirmPasskey) {
      if (newPasskey !== confirmPasskey) {
        alert('New passkeys do not match!');
        return;
      }
      configToUpdate.passkey = newPasskey;
    }
    chrome.storage.sync.set(configToUpdate, function() {
      alert('Settings updated successfully!');
      window.location.reload();
    });
  });
});
