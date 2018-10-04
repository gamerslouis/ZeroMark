import { log as _log, configs } from '/common/common.js';
let logger = ((...args) => _log('browserAction', args));

let browserAction = new (class {
    constructor() {

    }

    init() {
        logger('init');

        chrome.browserAction.onClicked.addListener(() => {

        });

        if (configs.BrowserShowTabCounts) this.enableBadge();

    }

    enableBadge() {
        chrome.tabs.onCreated.addListener(this.UpdateBadgeText);
        chrome.tabs.onRemoved.addListener(this.UpdateBadgeText);
        chrome.browserAction.setBadgeBackgroundColor({ color: configs.BrowserTabCountsColor });
        this.UpdateBadgeText();
    }

    disableBadge() {
        chrome.tabs.onCreated.removeListener(this.UpdateBadgeText);
        chrome.tabs.onRemoved.removeListener(this.UpdateBadgeText);
    }

    UpdateBadgeText() {
        if (configs.BrowserShowAllWindowsTabCounts) {
            chrome.tabs.query({}, tabs => {
                let text = (tabs.length > 999 && configs.BrowserTabCountsShowFullWithThousandTabs)
                    ? 'Full' : tabs.length.toString();
                chrome.browserAction.setBadgeText({ 'text': text });
            });
        }
        else {
            chrome.tabs.query({ active: true }, toTabs => {
                toTabs.forEach(toTab => {
                    chrome.tabs.query({ windowId: toTab.windowId }, tabs => {
                        let text = (tabs.length > 999 && configs.BrowserTabCountsShowFullWithThousandTabs)
                            ? 'Full' : tabs.length.toString();
                        chrome.browserAction.setBadgeText({ 'text': text, tabId: toTab.id });
                    });
                });
            });
        }
    }

    onConfigChange(args) {
        switch (args.key) {
            case 'BrowserShowTabCounts':
                {
                    if (args.value) { this.enableBadge(); }
                    else { this.disableBadge(); }
                    break;
                }
            case 'BrowserTabCountsColor':
                {
                    chrome.browserAction.setBadgeBackgroundColor({ color: configs.BrowserTabCountsColor });
                    break;
                }
            case 'BrowserShowAllWindowsTabCounts':
            case 'BrowserTabCountsShowFullWithThousandTabs':
                {
                    if (configs.BrowserShowTabCounts) this.UpdateBadgeText();
                    break;
                }
            default:
                break;
        }
    }
})();

export default browserAction;
