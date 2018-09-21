//找路用代碼
console.log('X');
'use strict';

var sidebar = new (class {
    constructor() {
        this.slideSpeed = 250; //設定開關時滑動時間
        this.onDisplayChange = new Listener(); //DisplayChangeEventHandler
        this.SIDEBAR_CLASS_NAME = 'zeromark_sidebar';
    }

    Init() {
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

        this._dom = div;
    }

    /**檢測Sidebar是否處於顯示狀態*/
    isOpened() {
        return this._dom.style.display != 'none';
    }

    /**添加元素至Sidebar
     * @param {HTMLElement}content 元素的HTMLElement
     * @return 元素的HTMLElement
     */
    append(content) {
        this._dom.appendChild(content);
        return content;
    }

    /**顯示Sidebar視窗*/
    show() {
        $(this._dom).show('slide', {
            direction: 'right'
        }, this.slideSpeed);
        this._dom.focus();
        this.onDisplayChange.fire(this, {
            'type': 'show'
        });
    }

    /**關閉Sidebar視窗*/
    hide() {
        $(this._dom).hide('slide', {
            direction: 'right'
        }, this.slideSpeed);
        this.onDisplayChange.fire(this, {
            'type': 'hide'
        });
    }

    
    /**開關Sidebar視窗
     * @param  {bool} open true:開啟視窗 false:關閉視窗 null:反轉當前顯示狀態
     */
    changeDisplay(open) {
        if (open == null) this.isOpened() ? this.hide(): this.show();
        else if (open) this.show();
        else this.hide();
    }
})();



window.onload = () => {
    sidebar.Init();
    tabManager.Init();

    chrome.runtime.onMessage.addListener(
        function (request/*, sender, sendResponse*/) {
            switch (request.command) {
                case 'key_openSidebar': //熱鍵觸發
                    {
                        sidebar.changeDisplay(null);
                        break;
                    }

                default:
                    break;
            }
        }
    );
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
