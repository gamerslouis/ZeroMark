chrome.browserAction.onClicked.addListener(()=>{
    dataRefresh();
    sendMessageToActive('updateManager');
});

//var SaveTabsQick = function(tab)
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.command)
        {
            switch(request.command)
            {
                 //for popup page
                 case 'SendTabsToQuike':
                 {
                     chrome.tabs.query({currentWindow:true},function(tabs){
                         for(let i = 0;i<tabs.length;i++)
                         {
                             console.log(tabs[i].title +'\t' + tabs[i].url);
                         }
                     });
                     break;
                 }
            }
        }
    }
);

chrome.tabs.onCreated.addListener(UpdateBadgeText);
chrome.tabs.onRemoved.addListener(UpdateBadgeText);

function UpdateBadgeText() {
    chrome.tabs.query({}, tabs => {
        chrome.browserAction.setBadgeText({ text: tabs.length.toString() });
    });    
}


chrome.browserAction.setBadgeBackgroundColor({ color: '#0000FF' });
UpdateBadgeText();