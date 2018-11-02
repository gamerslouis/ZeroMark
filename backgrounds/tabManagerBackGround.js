import TabContainer from '/common/TabContainer.js';
import configs from '/common/realConfigs.js';
import { log as _log } from '/common/common.js';
let logger = ((...args) => _log('tabManagerBackground', args));
import { makeTabFromApiTab } from '/common/ApiTab.js';
import { sendToActive, sendToWindowActive } from '/common/ContentMessage.js';

let tabManagerBackground = new (class {
    init() {
        logger('init');
        dataRefresh();
        loaded = true;
    }
    loaded() {
        return loaded;
    }
})();
let tabContainer = new TabContainer();
let searchStrs = {};
let scrollPosition = {};
let loaded = false;

function dataRefresh() {
    logger('tabManager data refreshing.');
    searchStrs = {};
    scrollPosition = {};
    chrome.tabs.query({}, apiTabs => {
        apiTabs.forEach(apiTab => {
            apiTab = makeTabFromApiTab(apiTab);
        });
        tabContainer.applyTablist(apiTabs);
    });
}

function selectAllInWindow(windowId) {
    tabContainer.getWindowTabArray(windowId).forEach(tab => {
        if (tab.matchSearch) {
            tab.managerSelect = true;
        }
    });
}

function cancelSelectAllInWindow(windowId) {
    tabContainer.getWindowTabArray(windowId).forEach(tab => {
        tab.managerSelect = false;
    });
}

function isMatchSearch(tab, searchStr) {
    if (searchStr == '') return true;
    let reg = RegExp(searchStr, 'i');
    let b = reg.test(tab.title) || reg.test(tab.url) || reg.test(tab.tagName);
    return b;
}

function searchWithSearchStrInWindow(windowId) {
    tabContainer.getWindowTabArray(windowId).forEach(tab => {
        tab.matchSearch = isMatchSearch(tab, searchStrs[windowId]);
    });
}

function onCreated(apiTab) {
    logger('OnTabCreated:', apiTab);
    apiTab.title = 'Loading...';

    tabContainer.addTab(makeTabFromApiTab(apiTab, {
        matchSearch: searchStrs[apiTab.windowId] ?
            isMatchSearch(apiTab, searchStrs[apiTab.windowId]) : true
    }));
    sendToWindowActive(apiTab.windowId, { 'command': 'onTabAdd', 'tab': apiTab });

}

function onUpdated(tabId, changeInfo, apiTab) {
    logger('onTabUpdataed:', apiTab);
    if (changeInfo.status != 'loading') {
        let oldTab = tabContainer.getTab(apiTab.windowId, tabId);
        let tab = makeTabFromApiTab(apiTab, oldTab);

        tabContainer.setTab(tab.windowId, tab.id, tab);

        sendToWindowActive(apiTab.windowId, { 'command': 'onTabChange', 'tab': apiTab });
    }
}

function onRemove(tabId, removeInfo) {
    if (tabContainer.isWindowExist(removeInfo.windowId)) {
        if (removeInfo.isWindowClosing) { tabContainer.removeWindow(removeInfo.windowId); return; }
        tabContainer.removeTab(removeInfo.windowId, tabId);
        sendToWindowActive(removeInfo.windowId, { 'command': 'onTabRemove', 'tabId': tabId });
    }
}

function onActivated(activeInfo) {
    if (!configs.tabManagerKeepSearchStrAfterSwitchTab) {
        searchStrs[request.windowId] = '';
        searchWithSearchStrInWindow(request.windowId);
    }
    if (!configs.tabManagerKeepSelectAfterSwitchTab) {
        cancelSelectAllInWindow(request.windowId);
    }
    chrome.tabs.sendMessage(activeInfo.tabId, { command: 'refreshManager',onActivated:true });
}

function onAttached(tabId, attachInfo) {
    chrome.tabs.get(tabId, apiTab => {
        tabContainer.addTab(makeTabFromApiTab(apiTab, {
            matchSearch: searchStrs[apiTab.windowId] ?
                isMatchSearch(apiTab, searchStrs[apiTab.windowId]) : true
        }));
        sendToWindowActive(attachInfo.newWindowId, { 'command': 'refreshManager' });
    });
}

function onDetached(tabId, detachInfo) {
    tabContainer.removeTab(detachInfo.oldWindowId, tabId);
    sendToWindowActive(detachInfo.oldWindowId, { 'command': 'onTabRemove', 'tabId': tabId });
}

function onMoved(tabId, moveInfo) {
    tabContainer.moveTab(moveInfo.windowId, tabId, moveInfo.fromIndex, moveInfo.toIndex);
    sendToWindowActive(moveInfo.windowId, { 'command': 'refreshManager' });
}

//監聽內容腳本操作任務要求
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.command) {
            switch (request.command) {
                case 'RefreshManager':
                    {
                        dataRefresh();
                        sendToActive('refreshManager');
                        break;
                    }

                //切換分頁
                case 'ChangeCurentTab':
                    {
                        chrome.tabs.update(Number(request.tabId), { active: true }); //切換分頁
                        break;
                    }

                //取得分頁列表
                case 'getManagerInfo':
                    {
                        sendResponse({
                            'list': tabContainer.getWindowTabArray(sender.tab.windowId),
                            'searchStr':
                                (typeof (searchStrs[sender.tab.windowId]) != 'undefined') ?
                                    searchStrs[sender.tab.windowId] : searchStrs[sender.tab.windowId] = '',
                            'scrollPosition': scrollPosition[sender.tab.windowId] || 0,
                            'thisWindowId': sender.tab.windowId,
                            'thisTabId':sender.tab.id
                        });

                        return true; //for asyc response,without cause sendresponse not work
                    }

                //關閉分頁
                case 'closeTabs':
                    {
                        chrome.tabs.remove(request.tabIds);
                        break;
                    }

                case 'selectAll':
                    {
                        selectAllInWindow(sender.tab.windowId);
                        break;
                    }

                case 'cancelSelectAll':
                    {
                        cancelSelectAllInWindow(sender.tab.windowId);
                        break;
                    }

                case 'changeSearchStr':
                    {
                        searchStrs[sender.tab.windowId] = request.str;
                        searchWithSearchStrInWindow(sender.tab.windowId);

                        sendResponse();
                        return true; //for asyc response,without cause sendresponse not work

                    }

                case 'changeScrollPostion':
                    {
                        scrollPosition[sender.tab.windowId] = request.scrollPosition;
                        break;
                    }

                case 'changeTabInfo':
                    {
                        let tab = tabContainer.getTab(request.windowId, request.tabId);
                        for (let [key, value] of Object.entries(request.tabInfo))
                        {
                            tab[key] = value;
                        }
                        chrome.tabs.executeScript(request.tabId, { code: `document.title = '${tab.title}'` });
                    }
            }
        }
    }
);

//監聽鍵盤熱屆
chrome.commands.onCommand.addListener(command => {
    switch (command) {
        case 'key_openSidebar':
            {
                chrome.tabs.query({ currentWindow: true, active: true }, (apiTabs) => {
                    chrome.tabs.sendMessage(apiTabs[0].id, { command: 'key_openSidebar' }); //控制內容腳本開關分頁
                });
            }
    }
});

chrome.tabs.onCreated.addListener(onCreated);
chrome.tabs.onUpdated.addListener(onUpdated);
chrome.tabs.onRemoved.addListener(onRemove);
chrome.tabs.onActivated.addListener(onActivated);
chrome.tabs.onAttached.addListener(onAttached);
chrome.tabs.onDetached.addListener(onDetached);
chrome.tabs.onMoved.addListener(onMoved);

export default tabManagerBackground;
