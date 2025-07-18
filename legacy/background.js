// Background service worker for COROS Activity Calendar extension

// Extension installation and update handling
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('COROS Activity Calendar extension installed');
    } else if (details.reason === 'update') {
        console.log('COROS Activity Calendar extension updated');
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Check if we're on a COROS domain
    if (tab.url && (tab.url.includes('coros.com'))) {
        // Inject the content script if not already injected
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['storage.js', 'api.js', 'calendar.js', 'statistics.js', 'content.js']
        }).catch((error) => {
            console.warn('Content script already injected or failed to inject:', error);
        });
    } else {
        // Show notification that extension only works on COROS website
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgNkgzOUMxMC42NTY5IDYgNDIgNy4zNDMxNSA0MiA5VjM5QzQyIDQwLjY1NjkgNDAuNjU2OSA0MiAzOSA0Mkg5QzcuMzQzMTUgNDIgNiA0MC42NTY5IDYgMzlWOUM2IDcuMzQzMTUgNy4zNDMxNSA2IDkgNloiIHN0cm9rZT0iIzAwN0FGRiIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJub25lIi8+CjxwYXRoIGQ9Ik0xNSAxOEgyNCIgc3Ryb2tlPSIjMDA3QUZGIiBzdHJva2Utd2lkdGg9IjQiLz4KPHA+dGggZD0iTTE1IDI3SDMzIiBzdHJva2U9IiMwMDdBRkYiIHN0cm9rZS13aWR0aD0iNCIvPgo8cGF0aCBkPSJNMTUgMzZIMjciIHN0cm9rZT0iIzAwN0FGRiIgc3Ryb2tlLXdpZHRoPSI0Ii8+Cjwvc3ZnPg==',
            title: 'COROS Activity Calendar',
            message: 'This extension only works on COROS website. Please visit coros.com to use the calendar features.'
        });
    }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAuthToken') {
        // Handle authentication token requests
        // This would typically involve OAuth flow or existing session extraction
        sendResponse({ success: true, token: null });
    } else if (request.action === 'logError') {
        // Log errors from content scripts
        console.error('Content script error:', request.error);
        sendResponse({ success: true });
    }

    return true; // Keep message channel open for async responses
});

// Monitor tab updates to re-inject scripts if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' &&
        tab.url &&
        (tab.url.includes('coros.com'))) {
        // Page fully loaded on COROS domain, ensure our scripts are ready
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                // Check if our extension is already initialized
                if (!window.corosCalendarExtension) {
                    // Re-inject content scripts
                    return false;
                }
                return true;
            }
        }).then((results) => {
            if (results && results[0] && !results[0].result) {
                // Extension not initialized, inject scripts
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    files: ['storage.js', 'api.js', 'calendar.js', 'statistics.js', 'content.js']
                }).catch(console.warn);
            }
        }).catch(console.warn);
    }
});

// Clean up storage periodically (remove old cached data)
// chrome.alarms.create('cleanupStorage', {
//     delayInMinutes: 60,
//     periodInMinutes: 60 * 24 // Daily cleanup
// });

// chrome.alarms.onAlarm.addListener((alarm) => {
//     if (alarm.name === 'cleanupStorage') {
//         chrome.storage.local.get(null, (items) => {
//             const cutoffDate = new Date();
//             cutoffDate.setMonth(cutoffDate.getMonth() - 6); // Keep 6 months of data

//             const keysToRemove = [];
//             for (const key in items) {
//                 if (key.startsWith('coros_activities_')) {
//                     const dateStr = key.replace('coros_activities_', '');
//                     const itemDate = new Date(dateStr);
//                     if (itemDate < cutoffDate) {
//                         keysToRemove.push(key);
//                     }
//                 }
//             }

//             if (keysToRemove.length > 0) {
//                 chrome.storage.local.remove(keysToRemove);
//                 console.log(`Cleaned up ${keysToRemove.length} old activity cache entries`);
//             }
//         });
//     }
// });