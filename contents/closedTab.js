var closedTab = new (class {
    constructor() {
        this.closedTabList = new Object();
        this.classnames = {
            list: 'zeromark_tabManager_closedTabList',
            template: 'zeromark_tabManager_closedTab_template',
            listItem: 'zeromark_tabManager_closedTab',
            favIcon: 'zeromark_tabManager_favicon',
            title: 'zeromark_tabManager_tabtitle',
        };
        
        this.flagUpdating = false;
        this.unloaded = true;
    }

    Init() {
        this.closedTabList = document.getElementsByClassName(this.classnames.list)[0];
        this.refreshClosedTabList();
        
    }

    refreshClosedTabList() {
        if (this.flagUpdating) return;
        this.flagUpdating = true;

        this.cleanClosedTabList();
        chrome.runtime.sendMessage({
            command: 'getClosedTabList'
        }, (res) => {
            if (res.closedTabs.length > 0) {
                res.closedTabs.forEach(closedTab => {
                    let div = makeFromTemplate(this.classnames.template, this.classnames.listItem);
                    if (closedTab.window == undefined) {
                        div.getElementsByClassName(this.classnames.title)[0].innerText = closedTab.tab.title;
                        div.getElementsByClassName(this.classnames.favIcon)[0].src = closedTab.tab.favIconUrl;
                    }
                    else div.getElementsByClassName(this.classnames.title)[0].innerText = `${closedTab.window.tabs.length} 個分頁`;

                    div.addEventListener('click', this.onClosedTabClicked.bind(this));
                    div.closedTab = closedTab;
                    this.closedTabList.append(div);
                });
            }
            this.unloaded = false;
            this.flagUpdating = false;
        });
    }

    removeListItem(listItem, useAnimation = false) {
        if (useAnimation) {
            JQ(listItem).slideUp(
                150, () => {
                    this.closedTabList.removeChild(listItem);
                });
        }
        else {
            this.closedTabList.removeChild(listItem);
        }
    }

    cleanClosedTabList() {
        while (this.closedTabList.firstChild) {
            this.closedTabList.removeChild(this.closedTabList.firstChild);
        }
    }

    onClosedTabClicked(e) {
        this.removeListItem(e.currentTarget);
        chrome.runtime.sendMessage({
            command: 'openClosedTab',
            sessionId: (e.currentTarget.closedTab.window ? e.currentTarget.closedTab.window.sessionId : e.currentTarget.closedTab.tab.sessionId)
        });
    }
})();

chrome.runtime.onMessage.addListener(
    (function (request /*, sender, sendResponse*/) {
        if (closedTab.unLoaded) return;
        switch (request.command) {
            case 'refreshClosedTabList':
                closedTab.refreshClosedTabList();
                break;
        }
    })
);

