document.addEventListener('DOMContentLoaded', function() {
  // Get the configuration from storage.
  chrome.storage.sync.get(["passkey", "username", "websites"], function(config) {
    // Determine the current domain.
    const currentDomain = new URL(window.location.href).hostname;
    let shouldBlur = false;
    
    if (config.websites && Array.isArray(config.websites)) {
      for (let storedDomain of config.websites) {
        if (currentDomain === storedDomain) {
          shouldBlur = true;
          break;
        }
      }
    }
    
    // If the current domain should NOT be blurred, exit without doing anything.
    if (!shouldBlur) {
      return;
    }
    
    // Apply blur to the page.
    document.body.style.filter = 'blur(50px)';
    document.body.style.pointerEvents = 'none';
    document.body.style.userSelect = 'none';
    document.body.style.overflow = 'hidden';  //prevent the page from scrolling
    
    // Create the overlay element.
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

    // Overlay inner HTML.
    overlay.innerHTML = `
      <div style="background: white; color: black; padding: 20px; border-radius: 8px; text-align: center;">
        <h2 id="overlayHeader" style="margin-bottom: 10px;">Enter Passkey</h2>
        <input type="password" id="passkeyInput" placeholder="Passkey" style="background-color: white; color: black; padding: 10px; width: 200px; margin-bottom: 10px; border-radius: 7px"/>
        <br/>
        <button id="passkeySubmit" style="background-color: black; color: white; padding: 10px 20px;">Submit</button>
        <div id="errorMessage" style="color: red; margin-top: 10px;"></div>
      </div>
    `;
    
    // Insert the overlay into the page.
    document.documentElement.appendChild(overlay);
    
    // Focus the input field automatically.
    const inputField = document.getElementById('passkeyInput');
    if (inputField) {
      inputField.focus();
    }
    
    // If a username is provided, update the overlay header.
    if (config.username) {
      document.getElementById('overlayHeader').innerText = `Enter Passkey if you're ${config.username}`;
    }
    
    // Function to remove the blur and overlay.
    function removeBlur() {
      document.body.style.filter = '';
      document.body.style.pointerEvents = '';
      document.body.style.userSelect = '';
      document.body.style.overflow = '';
      overlay.remove();
    }
    
    // Function to check the passkey.
    function submitPasskey() {
      const userPasskey = document.getElementById('passkeyInput').value;
      chrome.runtime.sendMessage({ action: 'checkPasskey', passkey: userPasskey }, function(response) {
        if (response.success) {
          removeBlur();
        } else {
          document.getElementById('errorMessage').innerText = 'Incorrect Passkey!';
          document.getElementById('passkeyInput').value = '';
          document.getElementById('passkeyInput').focus();
        }
      });
    }
    
    // Attach event listeners for submitting the passkey.
    document.getElementById('passkeySubmit').addEventListener('click', function() {
      submitPasskey();
    });
    
    document.getElementById('passkeyInput').addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        submitPasskey();
      }
    });
  });
});
