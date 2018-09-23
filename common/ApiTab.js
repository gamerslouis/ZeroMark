export function makeTabFromApiTab(apiTab, args = {}) {
    apiTab.managerSelect = args.managerSelect || false;
    apiTab.matchSearch = args.matchSearch || true;
    return apiTab;
}
