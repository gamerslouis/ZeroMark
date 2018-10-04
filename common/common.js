import Configs from './Configs.js';

const configs = new Configs(
    {
        //Sidebar
        sidebarSlideTime: 250,
        sidebarHideAfterFocusLeave: false,

        //TabManager
        tabManagerCloseSidebarAfterSwitchTab: true,
        tabManagerKeepSearchStrAfterSwitchTab: true,
        tabManagerKeepSelectAfterSwitchTab: true,
        tabManagerShowFavicon: true,
        tabManagerShowCloseButton: true,

        //Browser
        BrowserShowTabCounts: true,
        BrowserTabCountsColor: '#0000FF',
        BrowserTabCountsShowFullWithThousandTabs: false,
        BrowserShowAllWindowsTabCounts: true,

        //WebBackUp
        //FocusBackUpImages: false,

        //Global
        //font:14

        //Log
        useConsoleLog: true,
        LogTime: true,
        showModuleName: true

    },
    ((...args) => { log('common/Configs', ...args); })
);
configs.tryLoad();

function log(module, ...args) {
    if (configs) {
        let logContent = (configs.LogTime ? (`[${(new Date()).toString()}] `) : '')
            + (configs.showModuleName ? `${module}:` : args.shift());
        while (args.length > 0)
        {
            let arg = args.shift();
            logContent += '\n';
            logContent += JSON.stringify(arg);
        }
        
        if (configs.useConsoleLog) console.log(logContent);
    }
}

export { configs, log };