function makeTabFromApiTab(apiTab, searchStr) {
    apiTab.managerSelect = false;
    apiTab.matchSearch = isMatchSearch(apiTab, searchStr);
    return apiTab;
}

function makeTabFromApiTabWithInfo(apiTab, managerSelect, matchSearch) {
    apiTab.managerSelect = managerSelect;
    apiTab.matchSearch = matchSearch;
    return apiTab;
}


class TabContainer {
    constructor(tabList) {
        this.container = {};
        this.refresh(tabList);
    }

    refresh(tabList) {
        tabList.forEach(tab => {
            if (!this.container[tab.windowId])
                this.container[tab.windowId] = {};
            this.container[tab.windowId][tab.id] = tab;
        });
    }

    get(windowId, tabId) {
        return this.container[windowId][tabId];
    }

    getWindow(windowId) {
        if (!this.container[windowId])
            this.container[windowId] = {};
        return convertValueMapToArray(this.container[windowId]);
    }

    add(tab) {
        if (this.container[!tab.windowId]) {
            this.container[tab.windowId] = {};
            this.container[tab.windowId][tab.id] = tab;
        }
        else {
            for (const [key, _tab] of Object.entries(this.container[tab.windowId])) {
                if (_tab.index >= tab.index)
                    _tab.index++;
            }
            this.container[tab.windowId][tab.id] = tab;
        }
    }

    move(windowId, tabId, fromIndex, toIndex) {
        if (fromIndex > toIndex) {
            for (const [key, tab] of Object.entries(this.container[windowId])) {
                if (tab.index >= toIndex && tab.index < fromIndex)
                    tab.index++;
            }
        }
        else {
            for (const [key, tab] of Object.entries(this.container[windowId])) {
                if (tab.index > fromIndex && tab.index <= toIndex)
                    tab.index--;
            }
        }
        this.container[windowId][tabId].index = toIndex;
    }

    set(windowId, tabId, tab) {
        if (!this.container[windowId])
            this.container[windowId] = {};
        this.container[windowId][tabId] = tab;
    }

    setWindow(windowId, window) {
        this.container[windowId] = {};
        window.forEach(tab => {
            this.container[windowId][tab.id] = tab;
        });
    }

    remove(windowId, tabId) {
        if (tabId) //no windowId ,only tabId defined
        {
            for (const [key, tab] of Object.entries(this.container[windowId])) {
                if (tab.index > this.container[windowId][tabId].index)
                    tab.index--;
            }
            delete this.container[windowId][tabId];
        }
        else {
            for (const [key, window] of Object.entries(this.container)) {
                for (const [key2, tab] of Object.entries(window)) {
                    if (tab.id == tabId) {
                        for ([key3, _tab] of Object.entries(window)) {
                            if (_tab.index > tab.index)
                                _tab.index--;
                        }
                        delete this.container[key][key2];
                        return;
                    }
                }
            }
        }
    }

    removeWindow(windowId) {
        delete this.container[windowId];
    }

    isWindowExist(windowId) {
        return Boolean(this.container[windowId]);
    }

    isTabExist(windowId, tabId) {
        if (tabId) {
            return Boolean(this.container[windowId][tabId]);
        }
        else {
            let b = false;
            for (const [key, window] of Object.entries(this.container)) {
                for (const [key2, tab] of Object.entries(window)) {
                    b = b || (tab.id = windowId);
                    if (b)
                        return b;
                }
                if (b)
                    return b;
            }
            return b;
        }
    }
}
