document.addEventListener('DOMContentLoaded', function() {
  // Immediately apply blur to the page.
  document.body.style.filter = 'blur(10px)';
  document.body.style.pointerEvents = 'none';
  document.body.style.userSelect = 'none';

  // Create and insert a full-page overlay with the passkey form.
  const overlay = document.createElement('div');
  overlay.id = 'passkeyOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.zIndex = '9999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // semi-transparent dark overlay
  
  // Overlay HTML.
  overlay.innerHTML = `
    <div style="background: white;color: black; padding: 20px; border-radius: 8px; text-align: center;">
      <h2 id="overlayHeader" style="margin-bottom: 10px;">Enter Passkey</h2>
      <input type="password" id="passkeyInput" placeholder="Passkey" style="background-color: white ;padding: 10px; width: 200px; margin-bottom: 10px; border-radius: 7px"/>
      <br/>
      <button id="passkeySubmit" style="background-color:black; color:white; padding: 10px 20px;">Submit</button>
      <div id="errorMessage" style="color: red; margin-top: 10px;"></div>
    </div>
  `;
  document.documentElement.appendChild(overlay);

  // Focus the input field automatically.
  const inputField = document.getElementById('passkeyInput');
  inputField.focus();

  chrome.storage.sync.get(["passkey", "username", "websites"], function(config) {
    let shouldBlur = false;
    if (config.websites && Array.isArray(config.websites)) {
      for (let site of config.websites) {
        if (window.location.href.indexOf(site) !== -1) {
          shouldBlur = true;
          break;
        }
      }
    }
    
    // If the current URL is not in the list, remove blur and overlay immediately.
    if (!shouldBlur) {
      document.body.style.filter = '';
      document.body.style.pointerEvents = '';
      document.body.style.userSelect = '';
      overlay.remove();
      return;
    }
    
    // Update overlay header if a username is provided.
    if (config.username) {
      document.getElementById('overlayHeader').innerText = `Enter Passkey if you're ${config.username}`;
    }
    
    // Function to remove the blur and the overlay.
    function removeBlur() {
      document.body.style.filter = '';
      document.body.style.pointerEvents = '';
      document.body.style.userSelect = '';
      overlay.remove();
    }
    
    // Function to check the passkey.
    function submitPasskey() {
      const userPasskey = document.getElementById('passkeyInput').value;
      chrome.runtime.sendMessage({ action: 'checkPasskey', passkey: userPasskey }, function(response) {
        if (response.success) {
          removeBlur();
        } else {
          // Display error, clear the input, and refocus.
          document.getElementById('errorMessage').innerText = 'Incorrect Passkey!';
          document.getElementById('passkeyInput').value = '';
          document.getElementById('passkeyInput').focus();
        }
      });
    }
    
    // Attach click listener to the submit button.
    document.getElementById('passkeySubmit').addEventListener('click', function() {
      submitPasskey();
    });
    
    // Also support Enter key press on the input field.
    document.getElementById('passkeyInput').addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitPasskey();
      }
    });
  });
});
