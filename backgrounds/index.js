import { configs, log as _log } from '/common/common.js';
import tabManagerBackGround from './tabManagerBackGround.js';
import browserAction from './browserAction.js';

window.onload = () => {
    configs.tryLoad();
    browserAction.init();
    tabManagerBackGround.init();
};