import TabContainer from '/common/TabContainer.js';
import { log as _log, configs } from '/common/common.js';
let logger = (args => _log('tabManagerBackground', args));
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

function changeTabSelect(windowId, tabId, select) {
    if (select) tabContainer.getTabTab(windowId, tabId).managerSelect = select;
    else tabContainer.getTab(windowId, tabId).managerSelect = !tabContainer.getTab(windowId, tabId).managerSelect;
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
    let b = reg.test(tab.title) || reg.test(tab.url);
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
    //sendMessageToWindowActive(attachInfo.newWindowId,"onTabAdd",{'tab':apiTtab});
    sendToWindowActive(apiTab.windowId, { 'command': 'onTabAdd', 'tab': apiTab });

}

function onUpdated(tabId, changeInfo, apiTab) {
    logger('onTabUpdataed:', apiTab);
    if (changeInfo.status != 'loading') {
        let oldTab = tabContainer.getTab(apiTab.windowId, tabId);
        let tab = makeTabFromApiTab(apiTab, { managerSelect: oldTab.managerSelect, matchSearch: oldTab.matchSearch });

        tabContainer.setTab(tab.windowId, tab.id, tab);

        //tabContainer.setTab(apiTab.windowId,tabId,apiTab);
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
    chrome.tabs.sendMessage(activeInfo.tabId, { command: 'refreshManager' });
}

function onAttached(tabId, attachInfo) {
    chrome.tabs.get(tabId, apiTab => {
        tabContainer.addTab(makeTabFromApiTab(apiTab, {
            matchSearch: searchStrs[apiTab.windowId] ?
                isMatchSearch(apiTab, searchStrs[apiTab.windowId]) : true
        }));
        //sendMessageToWindowActive(attachInfo.newWindowId,"onTabAdd",{'tab':apiTtab});
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
                        if (!configs.tabManagerKeepSearchStrAfterSwitchTab) {
                            searchStrs[request.windowId] = '';
                            searchWithSearchStrInWindow(request.windowId);
                        }
                        if (!configs.tabManagerKeepSelectAfterSwitchTab) {
                            cancelSelectAllInWindow(request.windowId);
                        }

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
                            'scrollPosition': scrollPosition[sender.tab.windowId] || 0
                        });

                        return true; //for asyc response,without cause sendresponse not work
                    }

                case 'getConfigs':
                    {
                        sendResponse(configs.appliedValues);
                        break;
                    }

                //關閉分頁
                case 'closeTabs':
                    {
                        chrome.tabs.remove(request.tabIds);
                        break;
                    }

                case 'changeTabSelect':
                    {
                        changeTabSelect(sender.tab.windowId, request.tabId);
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
