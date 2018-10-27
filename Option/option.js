import { log as _log } from '/common/common.js';
let logger = ((...args) => _log('Option.js', args));

function applyConfig(key, value)
{
    let elements = document.getElementsByName(key);
    if (elements.length != 0) {
        switch (elements[0].type) {
            case 'checkbox':
                {
                    elements[0].checked = value;
                    break;
                }
            case 'radio':
                {
                    for (let i = 0; i < elements.length; i++) {
                        if (elements[i].value == value) {
                            elements[i].checked = true;
                        }
                    }
                    break;
                }
            default:
                {
                    logger('Invalid Option', key);
                    break;
                }
        }
    }
}

function onOptionChange(e) {
    if (e.target.tagName == 'INPUT')
    {
        switch (e.target.type) {
            case 'checkbox':
                {
                    chrome.runtime.sendMessage({
                        command: 'setConfig',
                        config: {
                            key: e.target.name,
                            value: e.target.checked
                        }
                    });
                    break;
                }
            case 'radio':
                {
                    let elements = document.getElementsByName(e.target.name);
                    for (let i = 0; i < elements.length; i++) {
                        if (elements[i].value == true) {
                            chrome.runtime.sendMessage({
                                command: 'setConfig',
                                config: {
                                        key: e.target.name,
                                        value: e.target.value
                                }
                            });
                        }
                    }
                    break;
                }
        }
    }
}

function init() {
    chrome.runtime.sendMessage({ command: 'getConfigs' }, (configs) => {
        if (configs == false)//configs not ready
        {
            setTimeout(init, 500);
            return;
        }
        for (let [key, value] of Object.entries(configs)) {
            applyConfig(key, value);
        }
    });

    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.command) {
                switch (request.command) {
                    case 'onConfigChange':
                        {
                            applyConfig(key, value);
                            break;
                        }
                }
            }
        }
    );

    document.addEventListener('change', onOptionChange);
}

window.onload = init;