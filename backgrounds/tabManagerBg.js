var tabContainer;
var searchStrs = {};
var scrollPosition = {};

tabManagerBgInit();

function tabManagerBgInit() {
    console.log('Init tab manager background.');
    dataRefresh();
}

function dataRefresh() {
    console.log('tabManager data refreshing.');
    searchStrs = {};
    getLatestTabList((tabList) => {
        tabContainer = new TabContainer(tabList);
    });
}

function getLatestTabList(callback) {
    chrome.tabs.query({}, apiTabs => {
        apiTabs.forEach(apiTab => {
            apiTab = makeTabFromApiTab(apiTab, searchStrs[apiTab.windowId]);
        });

        if (typeof(callback) == 'function') callback(apiTabs);
    });
}

function changeTabSelect(windowId, tabId, select) {
    if (select) tabContainer.get(windowId, tabId).managerSelect = select;
    else tabContainer.get(windowId, tabId).managerSelect = !tabContainer.get(windowId, tabId).managerSelect;
}

function selectAllInWindow(windowId) {
    tabContainer.getWindow(windowId).forEach(tab => {
        tab.managerSelect = true;
    });
}

function cancelSelectInWindow(windowId) {
    tabContainer.getWindow(windowId).forEach(tab => {
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
    tabContainer.getWindow(windowId).forEach(tab => {
        tab.matchSearch = isMatchSearch(tab, searchStrs[windowId]);
    });
}

function onCreated(apiTab) {
    console.log('oncreated');
    apiTab.title = 'Loading...';

    tabContainer.add(makeTabFromApiTab(apiTab, searchStrs[apiTab.windowId]));
    //sendMessageToWindowActive(attachInfo.newWindowId,"onTabAdd",{'tab':apiTtab});
    sendMessageToWindowActive(apiTab.windowId, 'onTabAdd', { 'tab': apiTab });

}

function onUpdated(tabId, changeInfo, apiTab) {
    console.log('onUpdataed');
    if (changeInfo.status != 'loading') {
        let oldTab = tabContainer.get(apiTab.windowId, tabId);
        let tab = makeTabFromApiTabWithInfo(apiTab, oldTab.managerSelect, oldTab.matchSearch);

        tabContainer.set(tab.windowId, tab.id, tab);

        //tabContainer.set(apiTab.windowId,tabId,apiTab);
        sendMessageToWindowActive(apiTab.windowId, 'onTabChange', { 'tab': apiTab });
    }
}

function onRemove(tabId, removeInfo) {
    if (tabContainer.isWindowExist(removeInfo.windowId)) {
        if (removeInfo.isWindowClosing) { tabContainer.removeWindow(removeInfo.windowId); return; }
        tabContainer.remove(removeInfo.windowId, tabId);
        sendMessageToWindowActive(removeInfo.windowId, 'onTabRemove', { 'tabId': tabId });
    }
}

function onActivated(activeInfo) {
    chrome.tabs.sendMessage(activeInfo.tabId, { command: 'updateManager' });
}

function onAttached(tabId, attachInfo) {
    chrome.tabs.get(tabId, apiTab => {
        tabContainer.add(makeTabFromApiTab(apiTab, searchStrs[apiTab.windowId]));
        //sendMessageToWindowActive(attachInfo.newWindowId,"onTabAdd",{'tab':apiTtab});
        sendMessageToWindowActive(attachInfo.newWindowId, 'updateManager');
    });
}

function onDetached(tabId, detachInfo) {
    tabContainer.remove(detachInfo.oldWindowId, tabId);
    sendMessageToWindowActive(detachInfo.oldWindowId, 'onTabRemove', { 'tabId': tabId });
}

function onMoved(tabId, moveInfo) {
    tabContainer.move(moveInfo.windowId, tabId, moveInfo.fromIndex, moveInfo.toIndex);
    sendMessageToWindowActive(moveInfo.windowId, 'updateManager');
}

//監聽內容腳本操作任務要求
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.command) {
            switch (request.command) {
                case 'RefreshManager':
                    {
                        tabManagerBgInit();
                        sendMessageToActive('updateManager');
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
                            'list': tabContainer.getWindow(sender.tab.windowId),
                            'searchStr':
                                (typeof(searchStrs[sender.tab.windowId]) != 'undefined') ?
                                searchStrs[sender.tab.windowId] : searchStrs[sender.tab.windowId] = '',
                            'scrollPosition': scrollPosition[sender.tab.windowId] || 0
                        });

                        return true; //for asyc response,without cause sendresponse not work
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

                case 'cancelSelect':
                    {
                        cancelSelectInWindow(sender.tab.windowId);
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
                        scrollPosition[sender.tab.windowId] = request.scrollPosition
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