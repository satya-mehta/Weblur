document.addEventListener('DOMContentLoaded', function() {
  // Load initial configuration.
  chrome.storage.sync.get(["passkey", "username", "websites"], function(config) {
    if (!config.passkey || !config.username) {
      // No configuration found: show initial setup.
      document.getElementById('initialSetupSection').style.display = 'block';
      document.getElementById('settingsSection').style.display = 'none';
      document.getElementById('addCurrentPage').style.display = 'none';
    } else {
      // Configuration exists: show the settings section.
      document.getElementById('initialSetupSection').style.display = 'none';
      document.getElementById('settingsSection').style.display = 'block';
      document.getElementById('addCurrentPage').style.display = 'block';
      document.getElementById('editUsername').value = config.username;
      document.getElementById('editWebsites').value = config.websites.join('\n');
    }
  });

  // Toggle selection effect for known sites icons.
  const knownSitesContainer = document.getElementById('knownSites');
  if (knownSitesContainer) {
    knownSitesContainer.addEventListener('click', function(event) {
      const target = event.target.closest('[data-domain]');
      if (target) {
        target.classList.toggle('selected');
      }
    });
  }

  // Setup event for initial configuration.
  document.getElementById('setup')?.addEventListener('click', function() {
    console.log('Saving settings');
    const username = document.getElementById('username').value.trim();
    const newPasskey = document.getElementById('newPasskey').value;
    const confirmPasskey = document.getElementById('confirmPasskey').value;

    // Gather selected domains from icon buttons.
    let selectedDomains = [];
    const selectedIcons = document.querySelectorAll('#knownSites [data-domain].selected');
    selectedIcons.forEach(icon => {
      const domain = icon.getAttribute('data-domain');
      if (domain) {
        selectedDomains.push(domain);
      }
    });

    if (!username || !newPasskey || !confirmPasskey) {
      alert('Please fill in all fields.');
      return;
    }
    if (newPasskey !== confirmPasskey) {
      alert('Passkeys do not match!');
      return;
    }
    // Save configuration along with selected domains.
    chrome.storage.sync.set({ username, passkey: newPasskey, websites: selectedDomains }, function() {
      alert('Configuration saved successfully!');
      window.location.reload();
    });
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
        let websites = data.websites || [];

        // Check if the domain is already in the list.
        if (websites.includes(domain)) {
          alert("This website is already in your secure list!");
        } else {
          websites.push(domain);
          chrome.storage.sync.set({ websites: websites }, function() {
            chrome.storage.sync.get('websites', function(updatedData) {
              document.getElementById('editWebsites').value = updatedData.websites.join('\n');
            });
            alert(`Added ${domain} to your secure list!`);
            window.location.reload();
          });
        }
      });
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

  // Save updated settings event.
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
