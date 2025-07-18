// Popup script for COROS Activity Calendar extension

document.addEventListener('DOMContentLoaded', function () {
    const statusElement = document.getElementById('status');
    const refreshBtn = document.getElementById('refreshBtn');

    // Check if we're on a COROS domain
    function checkCurrentPage() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            const url = currentTab.url;

            if (url && (url.includes('coros.com') || url.includes('t.coros.com'))) {
                statusElement.textContent = 'Extension active on COROS website';
                statusElement.className = 'status active';
            } else {
                statusElement.textContent = 'Please visit COROS website to use extension';
                statusElement.className = 'status inactive';
            }
        });
    }

    // Refresh extension on current tab
    refreshBtn.addEventListener('click', function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];

            if (currentTab.url && (currentTab.url.includes('coros.com') || currentTab.url.includes('t.coros.com'))) {
                // Inject content scripts
                chrome.scripting.executeScript({
                    target: { tabId: currentTab.id },
                    files: ['storage.js', 'api.js', 'calendar.js', 'statistics.js', 'content.js']
                }).then(() => {
                    statusElement.textContent = 'Extension refreshed successfully';
                    statusElement.className = 'status active';
                }).catch((error) => {
                    console.error('Failed to refresh extension:', error);
                    statusElement.textContent = 'Failed to refresh extension';
                    statusElement.className = 'status inactive';
                });
            } else {
                statusElement.textContent = 'Please navigate to COROS website first';
                statusElement.className = 'status inactive';
            }
        });
    });

    // Check current page on popup open
    checkCurrentPage();
});