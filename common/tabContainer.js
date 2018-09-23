export default class TabContainer {
    constructor() {
        this.container = {};
    }

    applyTablist(tabList) {
        tabList.forEach(tab => {
            if (!this.container[tab.windowId])
                this.container[tab.windowId] = {};
            this.container[tab.windowId][tab.id] = tab;
        });
    }

    getTab(windowId, tabId) {
        return this.container[windowId][tabId];
    }

    getWindowTabArray(windowId) {
        if (!this.container[windowId])
            this.container[windowId] = {};
        return Object.values(this.container[windowId]).sort((a, b) => { return a.index - b.index; });
    }

    addTab(tab) {
        if (!this.container[tab.windowId]) {
            this.container[tab.windowId] = {};
            this.container[tab.windowId][tab.id] = tab;
        }
        else {
            for (const [, _tab] of Object.entries(this.container[tab.windowId])) {
                if (_tab.index >= tab.index)
                    _tab.index++;
            }
            this.container[tab.windowId][tab.id] = tab;
        }
    }

    moveTab(windowId, tabId, fromIndex, toIndex) {
        if (fromIndex > toIndex) {
            for (const [, tab] of Object.entries(this.container[windowId])) {
                if (tab.index >= toIndex && tab.index < fromIndex)
                    tab.index++;
            }
        }
        else {
            for (const [, tab] of Object.entries(this.container[windowId])) {
                if (tab.index > fromIndex && tab.index <= toIndex)
                    tab.index--;
            }
        }
        this.container[windowId][tabId].index = toIndex;
    }

    setTab(windowId, tabId, tab) {
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

    removeTab(windowId, tabId) {
        if (tabId) //no windowId ,only tabId defined
        {
            for (const [, tab] of Object.entries(this.container[windowId])) {
                if (tab.index > this.container[windowId][tabId].index)
                    tab.index--;
            }
            delete this.container[windowId][tabId];
        }
        else {
            for (const [key, window] of Object.entries(this.container)) {
                for (const [key2, tab] of Object.entries(window)) {
                    if (tab.id == tabId) {
                        for (let [, _tab] of Object.entries(window)) {
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
            for (const [, window] of Object.entries(this.container)) {
                for (const [, tab] of Object.entries(window)) {
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
