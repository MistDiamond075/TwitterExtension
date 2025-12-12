let storedData = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    //console.log("BACKGROUND GOT MESSAGE:", msg);
    if (msg.type === "data") {
        storedData = msg.payload;
        console.log("Stored in background:", storedData);
    }

    if (msg.type === "getData") {
        sendResponse(storedData);
    }

    if(msg.type === "download"){
        downloadBlob(msg.url).then(()=>{
            sendResponse({status:"done"})
        });
    }

    if(msg.type === "downloadAll"){
        Promise.all(msg.urls.map(downloadBlob)).then(()=>{
            sendResponse({status:"done"})
        });
    }

    return true;
});

async function downloadBlob(url) {
    const res = await fetch(url);
    const blob = await res.blob();

    const base64 = await blobToBase64(blob);

    const dataUrl = `data:${blob.type};base64,${base64}`;

    await chrome.downloads.download({
        url: dataUrl,
        filename: parseFilename(url),
        saveAs: false
    });
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function parseFilename(url){
    let name=url.split("/").pop().split("?")[0];
    if(!name){
        name="image.jpg";
    }
    return name;
}