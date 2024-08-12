var prevUrls = {};

async function initializePrevUrls() {
    const tabs = await browser.tabs.query({});
    tabs.forEach((tab) => {
        prevUrls[tab.id] = tab.url;
    });
}
initializePrevUrls();

browser.tabs.onUpdated.addListener(
    async (tabId, changeInfo, tab) => {
        const url = changeInfo.url;
        const videoRegex = /.*youtube\.com\/watch\?v=.*/;
        if (videoRegex.test(url)) {
            var prev = "";
            if (prevUrls[tabId] != null) {
                if (prevUrls[tabId] != tab.url && videoRegex.test(url)) {
                    prev = prevUrls[tabId];
                }
            } else if (tab.openerTabId != null && videoRegex.test(url)) {
                const openerTab = await browser.tabs.get(tab.openerTabId);
                prev = openerTab.url;
            } else if (videoRegex.test(tab.url)) {
                prev = changeInfo.url;
            }
            setTimeout(async () => {
                var newTab = await browser.tabs.get(tabId);
                const title = newTab.title;
                handleVideo(prev, url, title);
            }, 3000);
        }
        prevUrls[tabId] = url;
    },
    { properties: ["url"] }
)

async function handleVideo(prevUrl, videoUrl, title) {
    const videoId = videoUrl.replaceAll(/.*youtube.com\/watch\?v=|&.*/g, "");
    const videos = await browser.storage.local.get();
    if (videos[videoId] != null) {
        return;
    }
    const categories = [
        {
            regex: /.*youtube\.com\/watch\?v=.*/,
            name: "Video",
        },
        {
            regex: /.*youtube\.com\/?$/,
            name: "Home",
        },
        {
            regex: /.*youtube\.com\/results\?search_query=.*/,
            name: "Search",
        },
        {
            regex: /.*youtube\.com\/feed\/subscriptions/,
            name: "Subscriptions",
        },
        {
            regex: /.*youtube\.com\/playlist\?list=.*/,
            name: "Playlist",
        },
        {
            regex: /.*youtube\.com\/channel\/.*|.*youtube.com\/@.*/,
            name: "Channel",
        }
    ];
    var accessMethod = "Link";
    categories.forEach((category) => {
        if (category.regex.test(prevUrl)) {
            accessMethod = category.name;
        }
    })

    storeVideo(videoId, title, accessMethod, prevUrl);
}

function storeVideo(id, title, accessMethod, prevUrl) {
    let obj = {[id]: {
        id: id,
        title: title,
        accessMethod: accessMethod,
        prevUrl: prevUrl,
    }}
    browser.storage.local.set(obj);
}
