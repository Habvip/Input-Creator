document.getElementById('toggleWidget').addEventListener('click', async () => {
  const status = document.getElementById('status');
  const button = document.getElementById('toggleWidget');
  
  try {
    status.textContent = 'Toggling...';
    button.disabled = true;

    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    // Send message to content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "toggleWidget"
    });
    
    // Check if response exists and has the expected property
    if (response && response.isVisible !== undefined) {
      status.textContent = response.isVisible ? 'Shown' : 'Hidden';
    } else {
      // If no proper response, assume widget was toggled but we can't get statusF
      status.textContent = 'Toggled (status unknown)';
    }
    
  } catch (error) {
    console.error('Error:', error);
    
    // More specific error handling
    if (error.message.includes('Could not establish connection')) {
      status.textContent = 'Content script not loaded';
    } else {
      status.textContent = 'Refresh page';
    }
  } finally {
    button.disabled = false;
    setTimeout(() => status.textContent = 'Ready', 2000);
  }
});

// Add initialization check when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    
    // Try to get current status
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "getStatus"
    }).catch(() => null);
    
    const status = document.getElementById('status');
    if (response && response.isVisible !== undefined) {
      status.textContent = response.isVisible ? 'Currently: Shown' : 'Currently: Hidden';
    } else {
      status.textContent = 'Click to toggle';
    }
  } catch (error) {
    document.getElementById('status').textContent = 'Load on page';
  }
});