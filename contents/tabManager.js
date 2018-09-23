'use strict';

var tabManager = new (class {
    constructor() {
        this.searchBar = new Object();
        this.tabList = new Object();
        this._tabManager = new Object;
        this.listItemIdMap = {};

        this.unLoaded = true;
        this.flagUpdating = false;

        this.searchInputCount = 0;
        this.maxSearchWait = 400; //Delay Between UserInput and Search

        this.thisWindowId;

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
        div.className = 'zeromark_tabManager';
        div.style = 'height: 95%;width: 300px;';
        this._tabManager = div;
        $.get(chrome.extension.getURL('/contents/tabManagerDesign.html'), content => {
            div.innerHTML = content;
        }).then(() => {
            sidebar.append(div);
            this.searchBar = div.getElementsByClassName('zeromark_tabManager_tabSearchBar')[0];
            this.tabList = div.getElementsByClassName('zeromark_tabManager_tabList')[0];

            /*使用者交互層級事件監聽*/
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
                    if (configs.tabManagerCloseSidebarAfterSwitchTab) sidebar.hide();
                    chrome.runtime.sendMessage({
                        'command': 'ChangeCurentTab',
                        'tabId': this.getListItemByChild(e.target).tab.id,
                        'windowId': this.windowId
                    }); //呼叫後台切換分頁
                }
            }).bind(this));//觸發於bubbling階段，若triger為closeButton則中斷事件傳遞

            //監聽listItem層級滑鼠事件


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

            //偵測tabList滾動位置
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
        });

        this.unLoaded = false;
        this.refreshTabManager();
    }

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
            this.tabList.removeChild(this.tabList.firstChild);
        }
        this.listItemIdMap = {};
    }


    makeListItem(tab) {
        let div = document.createElement('div');
        div.className = `${this.classNames.listItem} ${tab.managerSelect ? this.classNames.listItem_selected : ''} ${tab.matchSearch ? '' : this.classNames.listItem_ivisible}`;
        div.innerHTML = `<span class='${this.classNames.innerSpan}'>`+
                            (configs.tabManagerShowFavicon ? `<img class='${this.classNames.favicon}' src='${((tab.favIconUrl != null) ? tab.favIconUrl : chrome.extension.getURL('imgs/difaultFavicon.png'))}'>`:'')+
                            `<span class='${this.classNames.title}'>${htmlEncode(tab.title)}</span>
                        </span>`+
                        (configs.tabManagerShowCloseButton?`<img src='${chrome.extension.getURL('imgs/closeButton.png')}' class='${this.classNames.closeButton}' height='20' width='20'/>`:'');
        div.tab = tab;
        this.listItemIdMap[tab.id] = div;

        div.addEventListener('mousedown', this.onListItemClick.bind(this));

        return div;
    }

    //添加分頁列表元素
    //tab:chrome.tabs.Tab 物件
    addListItem(tab) {
        this.tabList.appendChild(this.makeListItem(tab));
    }

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
        for (let i = listItems.length-1; i >=0 ; i--) {
            tabIds.push(listItems[i].tab.id);
            delete this.listItemIdMap[listItems[i].tab.id];
            this.tabList.removeChild(listItems[i]);
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
            if (withSearchStr) {
                this.searchBar.value = res.searchStr;
            }
            res.list.sort((a, b) => {
                if (a.index < b.index) return -1;
                else if (a.index > b.index) return 1;
                return 0;
            });

            res.list.forEach(tab => {
                this.node = this.addListItem(tab);
                this.thisWindowId = tab.windowId;
            });

            this.tabList.scrollTo(0, res.scrollPosition);
            this.flagUpdating = false;
        });
    }

    onListItemClick(e) {
        switch (e.which) {
            case 1:
                {
                    if (e.ctrlKey || e.shiftKey) {
                        let changeSelect = (listItem) => {
                            chrome.runtime.sendMessage({
                                'command': 'changeTabSelect',
                                'tabId': listItem.tab.id
                            });
                            if (listItem.classList.contains(this.classNames.listItem_selected)) {
                                listItem.classList.remove(this.classNames.listItem_selected);
                            }
                            else listItem.classList.add(this.classNames.listItem_selected);
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
                        e.stopPropagation();
                        e.preventDefault();
                    }
                    break;
                }
            //滑鼠中鍵
            case 2:
                {
                    this.closeTab(e.currentTarget);
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                }
            //滑鼠右鍵
            case 3:
                {
                    e.stopPropagation();
                    e.preventDefault();
                    break;
                }
        }
        //return false;
    }

})();

//將js字串轉成html安全字串
function htmlEncode(value) {
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
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
                    tabManager.tabList.removeChild(div);
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

            default:
                break;
        }
    })
);