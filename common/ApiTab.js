export function makeTabFromApiTab(apiTab, args = {}) {
    apiTab.managerSelect = (args.managerSelect != undefined) ? args.managerSelect : false;
    apiTab.matchSearch = (args.matchSearch != undefined) ? args.matchSearch : true;
    apiTab.labelColor = (args.labelColor != undefined) ? args.labelColor : 'rgb(249, 255, 254)';
    apiTab.StaticTitle = (args.StaticTitle != undefined) ? args.StaticTitle : null;
    apiTab.tagName = (args.tagName != undefined) ? args.tagName : 'tes';
    apiTab.taged = (args.taged != undefined) ? args.taged : false;

    return apiTab;
}
