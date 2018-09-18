//找路用代碼
console.log('X');
'use strict';

var sidebar = new (class {
    constructor() {
        this.slideSpeed = 250; //設定開關時滑動時間
        this.onDisplayChange = new Listener(); //DisplayChangeEventHandler
        this.SIDEBAR_CLASS_NAME = 'zeromark_sidebar';

    }

    DOMInit() {
        //插入管理器根元素
        let div = document.createElement('div');
        div.classList.add(this.SIDEBAR_CLASS_NAME); //設定class屬性
        div.style.background = '#cccccc';
        div.style.height = '100%';
        div.style.width = '300px';
        div.style.position = 'fixed';
        div.style.top = '0px';
        div.style.right = '0px';
        div.style.zIndex = '90000000';
        div.style.display = 'none';
        div.style.borderStyle = 'none';
        div.frameBorder = 'none';
        div.target = '_parent';
        document.body.appendChild(div);

        this.jq = $('div.' + this.SIDEBAR_CLASS_NAME);
    }

    isOpened() {
        return this.jq.css('display') != 'none';
    }

    append(content) {
        let jqcontent = $(content);
        this.jq.append(jqcontent);
        return jqcontent;
    }

    //顯示管理器視窗
    show() {
        this.jq.show('slide', {
            direction: 'right'
        }, this.slideSpeed);
        this.jq.focus();
        this.onDisplayChange.fire(this, {
            'type': 'show'
        });
    }

    //關閉管理器視窗
    hide() {
        this.jq.hide('slide', {
            direction: 'right'
        }, this.slideSpeed);
        this.onDisplayChange.fire(this, {
            'type': 'hide'
        });
    }

    //開關管理器視窗
    changeDisplay(open) {
        if (open == null) (this.jq.css('display') == 'none') ? this.show() : this.hide();
        else if (open) this.show();
        else this.hide();
    }
})();

chrome.runtime.onMessage.addListener(
    function (request/*, sender, sendResponse*/) {
        switch (request.command) {
            case 'key_openSidebar': //監聽開關管理器熱鍵按下事件
                {
                    sidebar.changeDisplay(null);
                    break;
                }

            default:
                break;
        }
    }
);

window.onload = () => {
    sidebar.DOMInit();
    tabManager.DOMInit();
};
/*
sidebar.initAfterList = [];
sidebar.afterDOMInit = (callback) => {
    sidebar.initAfterList.push(callback);
}
*/

//鎖定右鍵
/*  sidebar.jq.bind('contextmenu',function(e){
      return false;    
  });*/

/*sidebar.initAfterList.forEach(callback => {
    callback();
});*/
