import Configs from './Configs.js';
import { log as _log } from '/common/common.js';
let logger = ((...args) => _log('Configs', args));

const configs = new Configs(
    {
        //Sidebar
        sidebarSlideTime: 200,
        sidebarHideAfterFocusLeave: false,

        //TabManager
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
    logger
);

export default configs;