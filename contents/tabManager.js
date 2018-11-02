'use strict';

var tabManager = new (class {
    constructor() {
        this.searchBar = new Object();
        this.tabList = new Object();
        this._tabManager = new Object;
        this.listItemIdMap = {};
        this.contextmenu = new Object();
        this.markBox = new MarkBox();

        this.unLoaded = true;
        this.flagUpdating = false;

        this.searchInputCount = 0;
        this.maxSearchWait = 400; //Delay Between UserInput and Search

        this.thisWindowId;
        this.thisTabId;

        this.lastSelectoId = -1; //For Shift Select

        this.classNames = {
            searchBar: 'zeromark_tabManager_tabSearchBar',
            tabList: 'zeromark_tabManager_tabList',
            listItem: 'zeromark_tabManager_listItem',
            listItem_selected: 'zeromark_tabManager_listItem_selected',
            listItem_ivisible: 'zeromark_tabManager_invisible',
            favicon: 'zeromark_tabManager_favicon',
            title: 'zeromark_tabManager_tabtitle',
            closeButton: 'zeromark_tabManager_closeButton',
            innerSpan: 'zeromark_tabManager_innerSpan'
        };
    }

    Init() {
        //導入TabManager主體
        let div = document.createElement('div');
        div.className = 'zeromark_tabManager_minePage';
        /*div.style = 'height: 100%;width: 300px; box-shadow:0px 0px 3px rgba(20%,20%,40%,0.5) inset;background-color:White';*/
        this._tabManager = div;
        fetch(chrome.extension.getURL('/contents/tabManager.html')).then((res) => {
            return res.text();
        }).then((content) => {
            div.innerHTML = content;
            sidebar.append(div);
            this.searchBar = div.getElementsByClassName('zeromark_tabManager_tabSearchBar')[0];
            this.tabList = div.getElementsByClassName('zeromark_tabManager_tabList')[0];

            let css = document.createElement('link');
            css.setAttribute('rel', 'stylesheet');
            css.setAttribute('type', 'text/css');
            css.setAttribute('href', chrome.extension.getURL('contents/tabManager.css'));
            document.getElementsByTagName('head')[0].appendChild(css);

            document.getElementsByClassName('zeromark_tabManager_tabSearchIcon')[0].src = chrome.extension.getURL('imgs/searchIcon.png');

            //監聽滑鼠點擊事件
            this.tabList.addEventListener('click', ((e) => {
                //關閉分頁
                if (e.ctrlKey || e.shiftKey || e.altKey) return false;
                if (e.target.classList.contains(this.classNames.closeButton)) {
                    this.closeTab(this.getListItemByChild(e.target));
                    e.stopPropagation();
                }
                //分頁切換控制
                else if (e.eventPhase == 3)//bubbling,trigger is listItem
                {
                    chrome.runtime.sendMessage({
                        'command': 'ChangeCurentTab',
                        'tabId': this.getListItemByChild(e.target).tab.id,
                        'windowId': this.thisWindowId
                    }); //呼叫後台切換分頁
                }
            }).bind(this));//觸發於bubbling階段，若triger為closeButton則中斷事件傳遞

            //監聽全域按鍵事件
            document.onkeydown = ((e) => {
                if (sidebar.isOpened() && this.searchBar != document.activeElement) {
                    let stopEvent = (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    };
                    if (e.which == 27) {
                        this.cancelSelctAll();
                        stopEvent(e);
                    } else if (e.which == 46) {
                        this.closeTabSelect();
                        stopEvent(e);
                    } else if (e.which == 65 && e.ctrlKey) {
                        this.SelectAll();
                        stopEvent(e);
                    }
                }
            }).bind(this);

            //偵測tabList滾動位置，用於跨分頁同步滾輪位置
            this.tabList.addEventListener('scroll', function () {
                chrome.runtime.sendMessage({ 'command': 'changeScrollPostion', 'scrollPosition': this.tabList.scrollTop });
            }.bind(this));

            this.searchBar.addEventListener('input', ((e) => {
                this.searchInputCount++;
                let locolCount = this.searchInputCount;
                setTimeout(() => {
                    if (locolCount != this.searchInputCount) return;
                    chrome.runtime.sendMessage({
                        command: 'changeSearchStr',
                        str: e.target.value
                    }, () => {
                        this.refreshTabManager(false);
                    });
                }, this.maxSearchWait);
            }).bind(this));

            this.searchBar.addEventListener(('click'), (() => {
                this.searchBar.select();
            }).bind(this));

            this.unLoaded = false;
            this.refreshTabManager();
        });
    }

    //選取所有分頁
    SelectAll() {
        chrome.runtime.sendMessage({
            command: 'selectAll'
        });
        for (let d of this.tabList.getElementsByClassName(this.classNames.listItem)) {
            if (!d.classList.contains(this.classNames.listItem_ivisible)) {
                d.classList.add(this.classNames.listItem_selected);
            }
        }
    }

    //取消所有分頁選取
    cancelSelctAll() {
        chrome.runtime.sendMessage({
            command: 'cancelSelectAll'
        });
        for (let d of this.tabList.getElementsByClassName(this.classNames.listItem)) {
            d.classList.remove(this.classNames.listItem_selected);
        }
    }

    //清除分頁列表元素
    cleanManagerList() {
        while (this.tabList.firstChild) {
            this.removeListItem(this.tabList.firstChild);
        }
        this.listItemIdMap = {};
    }

    //生成分頁物件
    makeListItem(tab) {
        let div = document.getElementsByClassName('zeromark_tabManager_listItem_template')[0].cloneNode(true);
        div.classList.remove('zeromark_tabManager_listItem_template');
        div.classList.add('zeromark_tabManager_listItem');

        if (tab.managerSelect) div.classList.add(this.classNames.listItem_selected);
        if (!tab.matchSearch) div.classList.add(this.classNames.listItem_ivisible);
        div.style.backgroundColor = tab.labelColor;

        if (configs.tabManagerShowFavicon && tab.favIconUrl != null) {
            div.getElementsByClassName(this.classNames.favicon)[0].src = tab.favIconUrl;
        }

        div.getElementsByClassName(this.classNames.title)[0].innerText = htmlEncode(tab.taged ? tab.tagName : tab.title);

        if (configs.tabManagerShowCloseButton) {
            div.getElementsByClassName(this.classNames.closeButton)[0].src = chrome.extension.getURL('imgs/closeButton.png');
        }


        div.tab = tab;
        this.listItemIdMap[tab.id] = div;

        div.addEventListener('mousedown', this.onListItemClick.bind(this));
        div.addEventListener('mouseover', this.onListItemMouseOver.bind(this));
        div.addEventListener('mouseout', this.onListItemMouseOut.bind(this));

        return div;
    }

    //添加分頁物件至列表
    //tab:chrome.tabs.Tab 物件
    addListItem(listItem) {
        this.tabList.appendChild(listItem);
    }

    removeListItem(listItem, useAnimation = false) {
        if (useAnimation) {
            JQ(listItem).slideUp(
                150, () => {
                    tabManager.tabList.removeChild(listItem);
                });
        }
        else {
            this.tabList.removeChild(listItem);
        }
    }

    //依據分頁index 插入分頁物件至列表中
    insertListItem(tab) {
        if (tab.index != this.tabList.childElementCount) {
            this.tabList.insertBefore(this.makeListItem(tab), this.tabList.children[tab.index]);
        } else {
            this.tabList.appendChild(this.makeListItem(tab));
        }
    }

    //取得 List Item
    getListItemByChild(element) {
        while (!element.classList.contains(this.classNames.listItem)) {
            if (!element.parentNode) return null;
            element = element.parentNode;
        }
        return element;
    }

    //關閉分頁並移除列表元素
    closeTab(listItem) {
        chrome.runtime.sendMessage({
            'command': 'closeTabs',
            'tabIds': listItem.tab.id
        }); //呼叫後台關閉分頁
        //由onTabRemove事件處理後續內容
    }

    //關閉選取分頁
    closeTabSelect() {
        let tabIds = [];
        let listItems = this.tabList.getElementsByClassName(this.classNames.listItem_selected);
        for (let i = listItems.length - 1; i >= 0; i--) {
            tabIds.push(listItems[i].tab.id);
            delete this.listItemIdMap[listItems[i].tab.id];
            this.removeListItem(listItems[i], true);
        }
        chrome.runtime.sendMessage({
            'command': 'closeTabs',
            'tabIds': tabIds
        }); //呼叫後台關閉分頁
    }

    //刷新分頁列表
    refreshTabManager(withSearchStr = true) {
        if (this.flagUpdating || this.unLoaded) return;
        else this.flagUpdating = true;
        this.cleanManagerList();

        chrome.runtime.sendMessage({
            command: 'getManagerInfo'
        }, (res) => { //取得當前分頁列表  
            this.thisWindowId = res.thisWindowId;
            this.thisTabId = res.thisTabId;

            if (withSearchStr) {
                this.searchBar.value = res.searchStr;
            }
            res.list.sort((a, b) => {
                if (a.index < b.index) return -1;
                else if (a.index > b.index) return 1;
                return 0;
            });

            res.list.forEach(tab => {
                let listItem = this.makeListItem(tab);
                if (this.thisTabId == tab.id) {
                    listItem.classList.add('zeromark_tabmanager_current_tab'); //標記當前分頁
                }
                this.node = this.addListItem(listItem);
            });

            this.tabList.scrollTo(0, res.scrollPosition);
            this.flagUpdating = false;
        });
    }

    //監聽listItem層級滑鼠事件
    onListItemClick(e) {
        switch (e.which) {
            case 1:
                {
                    if (e.ctrlKey || e.shiftKey) {
                        let changeSelect = (listItem) => {
                            if (listItem.classList.contains(this.classNames.listItem_selected)) {
                                listItem.classList.remove(this.classNames.listItem_selected);
                                chrome.runtime.sendMessage({
                                    'command': 'changeTabInfo',
                                    'windowId': this.thisWindowId,
                                    'tabId': listItem.tab.id,
                                    tabInfo: {
                                        'managerSelect': false
                                    }
                                });
                            }
                            else {
                                listItem.classList.add(this.classNames.listItem_selected);
                                chrome.runtime.sendMessage({
                                    'command': 'changeTabInfo',
                                    'windowId': this.thisWindowId,
                                    'tabId': listItem.tab.id,
                                    tabInfo: {
                                        'managerSelect': true
                                    }
                                });
                            }
                        };

                        let changeSelectRange = (listItemFrom, listItemTo, select) => {
                            while (listItemFrom != listItemTo) {
                                if (select != listItemFrom.classList.contains(this.classNames.listItem_selected)) {
                                    changeSelect(listItemFrom);
                                }
                                listItemFrom = listItemFrom.nextSibling;
                            }
                            if (select != listItemFrom.classList.contains(this.classNames.listItem_selected)) {
                                changeSelect(listItemFrom);
                            }
                        };

                        let lastIndex = null, thisIndex = null, haslast = true;
                        if (this.lastSelectId == -1 || (this.listItemIdMap[this.lastSelectId] == undefined)) {
                            lastIndex = 0; haslast = false;
                        }
                        for (let i = 0; i < this.tabList.children.length; i++) {
                            if (e.currentTarget.tab.id == this.tabList.children[i].tab.id) {
                                thisIndex = i;
                            }
                            if ((this.listItemIdMap[this.lastSelectId] != undefined)
                                && this.tabList.children[i].tab.id == this.lastSelectId) {
                                lastIndex = i;
                            }
                        }

                        if (!e.ctrlKey) {
                            this.cancelSelctAll();
                        }
                        else {
                            this.lastSelectId = e.currentTarget.tab.id;
                        }

                        if (e.shiftKey) {
                            let select = !e.ctrlKey || !haslast || this.tabList.children[lastIndex].classList.contains(this.classNames.listItem_selected);
                            if (lastIndex <= thisIndex) {
                                changeSelectRange(
                                    this.tabList.children[lastIndex],
                                    this.tabList.children[thisIndex],
                                    select
                                );
                            }
                            else {
                                changeSelectRange(
                                    this.tabList.children[thisIndex],
                                    this.tabList.children[lastIndex],
                                    select
                                );
                            }

                        }
                        else {
                            changeSelect(e.currentTarget);
                        }
                    }
                    break;
                }
            //滑鼠中鍵
            case 2:
                {
                    this.closeTab(e.currentTarget);
                    break;
                }
            //滑鼠右鍵
            case 3:
                {
                    this.markBox.show(e.currentTarget.tab, e.clientX - 270, e.clientY, (change) => {
                        let changes = {};
                        switch (change.type) {
                            case 'title':
                                {
                                    this.listItemIdMap[change.tabId].tab.tagName = change.value;
                                    this.listItemIdMap[change.tabId].tab.taged = true;
                                    changes.tagName = change.value;
                                    changes.taged = true;
                                    break;
                                }
                            case 'labelColor':
                                {
                                    this.listItemIdMap[change.tabId].tab.labelColor = change.value;
                                    changes.labelColor = change.value;
                                    break;
                                }
                        }
                        this.listItemIdMap[change.tabId].replaceWith(this.makeListItem(this.listItemIdMap[change.tabId].tab));
                        chrome.runtime.sendMessage({
                            'command': 'changeTabInfo',
                            'windowId': this.thisWindowId,
                            'tabId': change.tabId,
                            'tabInfo': changes
                        });
                    });
                    e.stopPropagation();
                    break;
                }
        }
        e.preventDefault();
        return false;
    }

    onListItemMouseOver(e) {
        e.currentTarget.classList.add('zeromark_tabManager_listItem_mouseover');
    }

    onListItemMouseOut(e) {
        e.currentTarget.classList.remove('zeromark_tabManager_listItem_mouseover');
    }

})();

//將js字串轉成html安全字串
function htmlEncode(value) {
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return JQ('<div/>').text(value).html();
}

chrome.runtime.onMessage.addListener(
    (function (request /*, sender, sendResponse*/) {
        switch (request.command) {
            case 'refreshManager':
                {
                    tabManager.refreshTabManager();
                    break;
                }

            case 'onTabAdd':
                {
                    if (request.tab.windowId != tabManager.thisWindowId) tabManager.refreshTabManager();
                    else tabManager.insertListItem(request.tab);
                    break;
                }

            case 'onTabRemove':
                {
                    let div = tabManager.listItemIdMap[request.tabId];
                    tabManager.removeListItem(div, true);
                    delete tabManager.listItemIdMap[request.tabId];
                    break;
                }

            case 'onTabChange':
                {
                    if (tabManager.listItemIdMap[request.tab.id] == undefined) {
                        tabManager.insertListItem(request.tab);
                    }
                    else {
                        let old = tabManager.listItemIdMap[request.tab.id];
                        let div = tabManager.makeListItem(request.tab);
                        old.replaceWith(div);
                    }
                    break;
                }

            case 'onConfigChange':
                {
                    if (request.config.key == 'tabManagerShowFavicon' ||
                        request.config.key == 'tabManagerShowCloseButton') {
                        configs[request.config.key] = request.config.value;
                        tabManager.refreshTabManager();
                    }
                    break;
                }

            default:
                break;
        }
    })
);

