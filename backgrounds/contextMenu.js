function CreateContextMenu(type, id, title) { }
chrome.contextMenus.create({
    'type': 'normal',
    'id': 'item1-1',
    'title': '使用者選擇了\'%s\'',
    'contexts': ['all'],
    'onclick': function (info, tab) { },
  //  "parentId": "item1",
});