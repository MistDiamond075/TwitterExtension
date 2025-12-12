(() => {
    const log = (...a) => console.log("[EXT]", ...a);

    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
        this._method = method;
        this._url = url;
        return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function(body) {
        this.addEventListener("load", () => {
            try {
                if(this._url.includes("TweetDetail?variables")){
                    window.postMessage({
                        source: "twitter-extension",
                        type: "data",
                        payload: this.responseText
                    }, "*");
                    console.log("[EXT] SENT TO CONTENT:", this.responseText);
                }
               // log("XHR RESPONSE:", this._url, this.responseText);
            } catch (e) {
                log("XHR ERROR reading body:", this._url, e);
            }
        });
        return origSend.apply(this, arguments);
    };


    log("PATCHED: fetch + XHR");
})();
