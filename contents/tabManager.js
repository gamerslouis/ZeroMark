//找路用代碼
console.log('X');
'use strict';

var tabManager = new(class {
    constructor() {
        this.jq; //jq tabmanager dom 對象

        this.flagUpdating = false;

        this.searchInputCount = 0;
        this.maxSearchWait = 400; //Delay Between UserInput and Search

        this.thisWindowId;

        this.lastSelectoId = -1; //For Shift Select
    }

    DOMInit() {
        //導入TabManager主體
        $.get(chrome.extension.getURL('/contents/tabManagerDesign.html'), content => {
            this.jq = sidebar.append(content);
        }).then((response) => {
            sidebar.onDisplayChange.addListener((sender, args) => {
                if (args.type == 'show') {
                    this.updateTabManager();
                }
            });

            /*使用者交互層級事件監聽*/
            //分頁切換控制
            this.jq.on('click', '.tabobj', (function(event) {
                if (!event.ctrlKey && !event.shiftKey) {
                    //changeManagerDisplay(false);  //關閉管理器分頁視窗

                    let id = this.getTabIdByObj($(event.target)); //取得分頁id
                    chrome.runtime.sendMessage({
                        'command': 'ChangeCurentTab',
                        'tabId': id
                    }); //呼叫後台切換分頁

                }
            }).bind(this));

            //關閉分頁
            this.jq.on('click', '.closeButton', ((event) => { //監聽關閉按鈕按下事件
                this.closeTab(this.getListItemByChild($(event.target)));
            }).bind(this));

            //監聽listItem層級滑鼠事件
            this.jq.on('mousedown', '.listItem', (function(e) {
                switch (e.which) {
                    case 1:
                        {
                            if (e.ctrlKey || e.shiftKey) {
                                let changeSelect = (targetOjb) => {
                                    chrome.runtime.sendMessage({
                                        'command': 'changeTabSelect',
                                        'tabId': this.getTabIdByObj(targetOjb.closest('.listItem'))
                                    });
                                    if (this.getListItemByChild(targetOjb).first().hasClass('listItem_selected')) {
                                        this.getListItemByChild(targetOjb).first().removeClass('listItem_selected');
                                    } else this.getListItemByChild(targetOjb).first().addClass('listItem_selected');
                                };
                                if (e.shiftKey && this.lastSelectoId != -1) {
                                    let tabItems = this.jq.find('.listItem');
                                    let lastIndex = -1,
                                        thisIndex = -1;
                                    tabItems.each((i, _e) => {
                                        let obj = $(_e);
                                        if (this.getTabIdByObj(obj) == this.lastSelectoId) lastIndex = i;
                                        if (this.getTabIdByObj(obj) == this.getTabIdByObj($(e.target))) thisIndex = i;
                                    });
                                    if (lastIndex == -1) this.lastSelectoId = -1;
                                    else {
                                        let lastSelectType = this.getListItemById(this.lastSelectoId).first().hasClass(('listItem_selected'));
                                        if (lastIndex < thisIndex) {
                                            for (let i = lastIndex + 1; i <= thisIndex; i++) {
                                                if (this.getListItemByChild($(tabItems[i])).first().hasClass('listItem_selected') != lastSelectType) {
                                                    changeSelect($(tabItems[i]));
                                                }

                                            }
                                        } else if (lastIndex > thisIndex) {
                                            for (let i = lastIndex - 1; i >= thisIndex; i--) {
                                                if (this.getListItemByChild($(tabItems[i])).first().hasClass('listItem_selected') != lastSelectType) {
                                                    changeSelect($(tabItems[i]));
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    changeSelect($(e.target));
                                }
                                this.lastSelectoId = this.getTabIdByObj($(e.target));
                            }
                            break;
                        }
                        //滑鼠中鍵
                    case 2:
                        {
                            this.closeTab(this.getListItemByChild($(e.target)));
                            break;
                        }
                        //滑鼠右鍵
                    case 3:
                        {
                            break;
                        }
                }
                return false;
            }).bind(this));

            //監聽全域按鍵事件
            document.onkeydown = ((e) => {
                if (sidebar.isOpened() && !this.jq.find('.tabSearchBar').is(':focus')) {
                    console.log('h');
                    if (e.which == 27) {
                        chrome.runtime.sendMessage({
                            command: 'cancelSelect'
                        });
                        this.jq.find('.listItem').removeClass('listItem_selected');
                    } else if (e.which == 46 && document.activeElement.id != 'sBar' && !this.jq.find('.searchBar').is(':focus')) {
                        this.closeTabSelect();
                    } else if (e.which == 65 && e.ctrlKey && !this.jq.find('.searchBar').is(':focus')) {
                        chrome.runtime.sendMessage({
                            command: 'selectAll'
                        });
                        this.jq.find('.listItem').addClass('listItem_selected');
                        return false;
                    }
                    if (e.ctrlKey)
                    {
                        return false;
                    }    
                }
                return true;
            }).bind(this);

            this.jq.find('.list').scroll(function() {
                chrome.runtime.sendMessage({ 'command': 'changeScrollPostion', 'scrollPosition': this.jq.find('.list').scrollTop() });
                console.log(this.jq.find('.list').scrollTop());
            }.bind(this));

            this.jq.find('.tabSearchBar').on('input propertychange', (async(e) => {

                this.searchInputCount++;
                let locolCount = this.searchInputCount;
                setTimeout(() => {
                    if (locolCount != this.searchInputCount) return;
                    chrome.runtime.sendMessage({
                        command: 'changeSearchStr',
                        str: $(e.target).val()
                    }, () => {
                        this.updateTabManager(false);
                    });
                }, this.maxSearchWait);
            }).bind(this));

            //Select all text when user focus on the input
            this.jq.find('.tabSearchBar').on('click', (() => {
                this.jq.find('.tabSearchBar').select();
            }).bind(this));
        });
    }

    //清除分頁列表元素
    cleanManagerList() {
        this.jq.find('div.list').empty();
    }


    makeManagerStr(tab) {
        return `<div class='listItem${tab.managerSelect ? ' listItem_selected' : ''} ${tab.matchSearch ? '' : ' invisible'}' id='${tab.id}'>
                <span class='tabobj'>
                    <img class='favicon' src='${((tab.favIconUrl != null) ? tab.favIconUrl : chrome.extension.getURL('imgs/difaultFavicon.png'))}'>
                    <span class='tabtitle'>${htmlEncode(tab.title)}</span>
                </span>
                <img src='${chrome.extension.getURL('imgs/closeButton.png')}' class='closeButton' height='20' width='20'/>
            </div>`;
    }

    //添加分頁列表元素
    //tab:chrome.tabs.Tab 物件
    addManagerTab(tab) {
        this.jq.find('.list').append(this.makeManagerStr(tab));
    }

    //取得 Tab Id
    getTabIdByObj(jqobj) {
        let a = jqobj.closest('.listItem').attr('id');
        return a;
    }

    //取得 List Item
    getListItemByChild(jqobj) {
        return jqobj.closest('.listItem');
    }

    getListItemById(tabId) {
        let returnObj = null;
        this.jq.find('.listItem').each((i, e) => {
            let obj = $(e);
            if (this.getTabIdByObj(obj) == tabId) {
                returnObj = obj;
                return false;
            }
        });
        return returnObj;
    }

    //取得選取分頁狀態
    IsTabSelect(listItem) {
        return listItem.hasClass('listItem_selected');
    }

    //關閉分頁並移除列表元素
    closeTab(listItem) {
        chrome.runtime.sendMessage({
            'command': 'closeTabs',
            'tabIds': Number(this.getTabIdByObj(listItem))
        }); //呼叫後台關閉分頁
        listItem.remove();
    }

    //關閉選取分頁
    closeTabSelect() {
        let tabIds = [];
        this.jq.find('.listItem_selected').each((i, e) => {
            tabIds.push(Number(this.getTabIdByObj($(e))));
            e.remove();
        });
        chrome.runtime.sendMessage({
            'command': 'closeTabs',
            'tabIds': tabIds
        }); //呼叫後台關閉分頁
    }

    //刷新分頁列表
    updateTabManager(withSearchStr = true) {
        if (this.flagUpdating) return;
        else this.flagUpdating = true;
        console.log('updating');
        this.cleanManagerList();

        chrome.runtime.sendMessage({
            command: 'getManagerInfo'
        }, (res) => { //取得當前分頁列表(內容腳本無權限，需調用後台腳本)    
            if (withSearchStr && this.jq.find('.tabSearchBar').val() != res.searchStr) this.jq.find('.tabSearchBar').val(res.searchStr);

            res.list.sort((a, b) => {
                if (a.index < b.index) return -1;
                else if (a.index > b.index) return 1;
                return 0;
            });

            res.list.forEach(tab => {
                this.node = this.addManagerTab(tab);
                this.thisWindowId = tab.windowId;
            });

            this.jq.find('.list').scrollTop(res.scrollPosition);
            this.flagUpdating = false;
        });
    }
})();

//將js字串轉成html安全字串
function htmlEncode(value) {
    //create a in-memory div, set it's inner text(which jQuery automatically encodes)
    //then grab the encoded contents back out.  The div never exists on the page.
    return $('<div/>').text(value).html();
}

chrome.runtime.onMessage.addListener(
    (function(request /*, sender, sendResponse*/ ) {
        switch (request.command) {
            case 'updateManager':
                {
                    tabManager.updateTabManager();
                    break;
                }

            case 'onTabAdd':
                {
                    if (request.tab.windowId != tabManager.thisWindowId) tabManager.updateTabManager();
                    console.log(tabManager.makeManagerStr(request.tab));
                    if (request.tab.index != 0) {
                        $(tabManager.jq.find('.listItem')[request.tab.index - 1]).after(tabManager.makeManagerStr(request.tab));
                    } else {
                        $(tabManager.jq.find('.listItem')[0]).before(tabManager.makeManagerStr(request.tab));
                    }
                    break;
                }

            case 'onTabRemove':
                {
                    tabManager.jq.find('#' + request.tabId).remove();
                    break;
                }

            case 'onTabChange':
                {
                    if (tabManager.jq.find('#' + request.tab.id).length == 0) {
                        tabManager.jq.find('.list').append(tabManager.makeManagerStr(request.tab));
                    } else {
                        tabManager.jq.find('#' + request.tab.id)
                            .replaceWith(tabManager.makeManagerStr(request.tab));
                    }
                    break;
                }

            default:
                break;
        }
    }));