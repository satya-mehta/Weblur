document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.sync.get(["passkey", "username", "websites"], function(config) {
    if (!config.passkey || !config.username || !config.websites) {
      // No configuration found: show initial setup.
      document.getElementById('initialSetupSection').style.display = 'block';
      document.getElementById('settingsSection').style.display = 'none';
    } else {
      // Configuration exists: show the settings section.
      document.getElementById('initialSetupSection').style.display = 'none';
      document.getElementById('settingsSection').style.display = 'block';
      // Prepopulate fields.
      document.getElementById('editUsername').value = config.username;
      document.getElementById('editWebsites').value = config.websites.join('\n');
    }
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
