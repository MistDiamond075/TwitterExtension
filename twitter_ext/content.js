
const script = document.createElement("script");
script.src = chrome.runtime.getURL("page.js");
script.onload = () => script.remove();

(document.documentElement || document.head || document.body).appendChild(script);

window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (!event.data) return;
    if (event.data.source !== "twitter-extension") return;

    chrome.runtime.sendMessage({
        type: event.data.type,
        payload: event.data.payload
    });
});
