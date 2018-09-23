function sendToTab(tab, msg) {
    chrome.tabs.sendMessage(tab.id, msg);
}

function sendToAllTabs(msg) {
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            sendToTab(tab, msg);
        });
    });
}

function sendToCurrent(msg) {
    chrome.tab.query({ currentWindow: true, active: true }, (tabs) => {
        tabs.forEach(tab => {
            sendToTab(tab, msg);
        });
    });
}

function sendToActive(msg) {
    chrome.tabs.query({ active: true }, (tabs) => {
        tabs.forEach(tab => {
            sendToTab(tab, msg);
        });
    });
}

function sendToWindowActive(windowId,msg) {
    chrome.tabs.query({ active: true, windowId: windowId }, (tabs) => {
        tabs.forEach(tab => {
            sendToTab(tab, msg);
        });
    });
}

export { sendToActive, sendToAllTabs, sendToCurrent, sendToWindowActive };
    