function messageHandler(msg, sender, response) {
    if (msg.command != undefined) {
        switch (msg.command) {
            case 'GetAllTabList':
            {
                chrome.tabs.query({},response);
                break;
            }

            case 'RemoveTabbyIds':
            {
                chrome.tabs.remove(msg.tabIds);
                break;
            }

            case 'GetTabbyId':
            {
                chrome.tabs.get(msg.tabId,response);
                break;
            }

            case 'ChangeCurentTabbyId':
            {
                chrome.tabs.update(Number(msg.tabId), {highlighted: true});　//切換分頁
                //chrome.tabs.highlight({'tabs':Number(request.tabId)});
                break;
            }
        }
    }
    return true;
}