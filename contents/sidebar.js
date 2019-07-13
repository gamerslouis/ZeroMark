//找路用代碼
console.log('X');
'use strict';

var sidebar = new (class {
    constructor() {
        this.onDisplayChange = new Listener(); //DisplayChangeEventHandler
        this.SIDEBAR_CLASS_NAME = 'zeromark_sidebar';
    }

    Init() {
        //插入管理器根元素
        let div = document.createElement('div');
        div.classList.add(this.SIDEBAR_CLASS_NAME); //設定class屬性      
        div.frameBorder = 'none';
        div.target = '_parent';
        document.body.appendChild(div);

        loadCSSFile(chrome.extension.getURL('contents/sidebar.css'));

        this._dom = div;

        div.addEventListener('click', (e) => {
            if (configs.sidebarHideAfterFocusLeave) {
                e.stopImmediatePropagation();
            }
        });

        document.addEventListener('click', () => {
            if (configs.sidebarHideAfterFocusLeave && this.isOpened()) {
                this.hide();
            }
        });

        div.oncontextmenu = () => { return false; };
    }

    /**檢測Sidebar是否處於顯示狀態*/
    isOpened() {
        return this._dom.style.display != 'none' && this._dom.style.display != '';
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
        JQ(this._dom).show('slide', {
            direction: 'right'
        }, Number(configs.sidebarSlideTime));
        this._dom.focus();
        this.onDisplayChange.fire({
            'type': 'show'
        });
    }

    /**關閉Sidebar視窗*/
    hide() {
        JQ(this._dom).hide('slide', {
            direction: 'right'
        }, Number(configs.sidebarSlideTime));
        this.onDisplayChange.fire({
            'type': 'hide'
        });
    }


    /**開關Sidebar視窗
     * @param  {bool} open true:開啟視窗 false:關閉視窗 null:反轉當前顯示狀態
     */
    changeDisplay(open) {
        if (open == null) this.isOpened() ? this.hide() : this.show();
        else if (open) this.show();
        else this.hide();
    }
})();

let configs = {};

window.onload = () => {
    chrome.runtime.sendMessage({ command: 'getConfigs' }, (_configs) => { configs = _configs; });

    sidebar.Init();
    tabManager.Init().then(() => {
        closedTab.Init();
    });
    

    chrome.runtime.onMessage.addListener(
        function (request/*, sender, sendResponse*/) {
            switch (request.command) {
                case 'onConfigChange':
                    {
                        if (request.config.key == 'sidebarSlideTime' ||
                            request.config.key == 'sidebarHideAfterFocusLeave'
                        ) {
                            configs[request.config.key] = request.config.value;
                        } 
                        break;
                    }

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
