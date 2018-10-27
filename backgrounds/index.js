import configs from '/common/realConfigs.js';
import tabManagerBackGround from './tabManagerBackGround.js';
import browserAction from './browserAction.js';

window.onload = () => {
    configs.tryLoad();
    
    browserAction.init();
    tabManagerBackGround.init();

    configs.onConfigChange.addListener((e) => {
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id,{
                    command: 'onConfigChange',
                    config: e
                });
            });
        });
        
    });
};

//Public Event Handler
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        if (request.command) {
            switch (request.command) {
                case 'getConfigs':
                    {
                        if (!configs.loaded) {
                            sendResponse(false);
                        }
                        else {
                            sendResponse(configs.appliedValues);
                        }
                        break;
                    }
                case 'setConfig':
                    {
                        configs.setValue(request.config.key, request.config.value);
                        break;
                    }
                case 'resetConfigs':
                    {
                        configs.reset();
                        break;
                    }
            }
        }
    }
);