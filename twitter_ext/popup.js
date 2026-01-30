let ptrOverMediaPreview=false;
let imagePreview;
let defaultHeight=150;
let defaultWidth=300;

chrome.runtime.sendMessage({type: "getData"}, response => {
    console.log("Popup got:", response);
    const jsonObj= JSON.parse(response);
    if(!jsonObj){
        console.error("wrong json:\n",jsonObj);
        return;
    }
    if(!jsonObj.data){
        console.error("wrong json data:\n",jsonObj);
        return;
    }
    const instructions = jsonObj.data.threaded_conversation_with_injections_v2.instructions;
    let entities = [];
    instructions.forEach(i => {
        const entries=i.entries;
        if(entries){
            entries.forEach(e => entities.push(e));
        }
    });
    let urls=[];
    entities.forEach(e =>{
        const content=e.content;
        console.log("entities:\n",e);
        if(content){
            const itemContent=content.itemContent;
            console.log("content:\n",content);
            if(itemContent){
                const tweet_results=itemContent.tweet_results;
                console.log("tweet_results:\n",tweet_results);
                if(tweet_results){
                    const result=tweet_results.result;
                    console.log("result:\n",result);
                    if(result){
                        const legacy=result.legacy ? result.legacy : result.tweet.legacy;
                        console.log("legacy:\n",legacy);
                        if(legacy){
                            const entities1=legacy.entities;
                            console.log("entities1:\n",entities1);
                            if(entities1){
                                const media=entities1.media;
                                console.log("media:\n",media);
                                if(media.length>0){
                                    media.forEach(m =>{
                                        let media_url_https=m.media_url_https;
                                        let expanded_url=m.expanded_url;
                                        const type=m.type;
                                        if(type==="video") {
                                            const videoInfo = m.video_info;
                                            if (videoInfo) {
                                                const variants = videoInfo.variants;
                                                let maxBitrate = 0;
                                                let finalUrl = null;
                                                variants.forEach(variant => {
                                                    try {
                                                        const bit = parseInt(variant.bitrate);
                                                        const type = variant.content_type;
                                                        const url = variant.url;
                                                        if (type.includes('video/') && maxBitrate < bit) {
                                                            finalUrl = url;
                                                        }
                                                    } catch (e) {
                                                    }
                                                });
                                                if (finalUrl) {
                                                    media_url_https = finalUrl;
                                                }
                                            }
                                        }
                                        if(media_url_https && expanded_url){
                                            const url={
                                                "expanded_url":expanded_url,
                                                "media_url_https":media_url_https,
                                                "type":type
                                            };
                                            urls.push(url);
                                        }
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    console.log('urls:');
    console.log(urls);
    const linksList=document.getElementById("links_list");
    const childs=linksList.childNodes;
    childs.forEach(c => c.remove());
    let iterator=1;
    if(urls.length>0){
        const first=urls[0];
      //  console.log("first:\n",first);
        if(first){
            const expanded=first.expanded_url;
          //  console.log("expanded:\n",expanded)
            if(expanded){
                const tweetLink=document.getElementById("tweet_link");
                if(tweetLink) {
                    tweetLink.href = expanded.replace(/\/photo\/\d+/, "");
                    tweetLink.innerText=expanded.replace(/\/photo\/\d+/, "").replace(/\/video\/\d+/, "").replace("https://x.com/","");
                }
            }
        }
    }
    urls.forEach(u =>{
        if(linksList){
            console.log(u);
            const div=document.createElement('div');
            div.className='link-container';
            linksList.appendChild(div);
            const link=document.createElement('a');
            link.id="link_"+iterator;
            link.href=u.media_url_https + (u.type==='photo' ?
                ('?'+new URLSearchParams({format:'jpg',name:'large'})) :
                '');
            link.innerText=(u.type==="video" ? 'Video' : 'Image ')+iterator;
                /*(u.expanded_url.toString().includes('photo') ?
                u.expanded_url.toString().substring(u.expanded_url.toString().indexOf('photo')) :
                u.expanded_url
            );*/
            link.setAttribute('target','_blank');
            link.setAttribute('rel','noopener noreferrer');
            link.dataset.type=u.type;
            const button=document.createElement('button');
            button.id="button_download_"+iterator;
            button.innerText="Скачать";
            button.addEventListener('click',()=>{
                downloadFromLink(link.href);
            });
            div.appendChild(link);
            div.appendChild(button);
            link.addEventListener("mouseenter", (event)=>{
                showMediaPreviewContainer(event.currentTarget);
            });
            link.addEventListener("mouseleave", hideMediaPreviewContainer);
            iterator++;
        }
    });
});

function addMediaToPreview(el){
    console.log(el,el instanceof Element);
    if(el instanceof Element) {
        removeMediaFromPreview();
        const rect = el.getBoundingClientRect();
        imagePreview.style.top = rect.bottom + window.scrollY + 'px';
        imagePreview.style.left = rect.left + window.scrollX + 'px';
        const container = imagePreview.querySelector(el.dataset.type === "photo" ? "img" : "video");
        container.src = el.href
        container.style.display = '';
        document.body.style.height = '500px';
    }
}

function hideMediaPreviewContainer(){
    ptrOverMediaPreview=false;
    setTimeout(() =>{
        if(!ptrOverMediaPreview) {
            imagePreview.style.display = 'none';
            removeMediaFromPreview();
            document.body.style.height = defaultHeight + 'px';
        }
    },70);
}

function showMediaPreviewContainer(content=null){
    imagePreview.style.display='flex';
    ptrOverMediaPreview=true;
    if(content) {
        addMediaToPreview(content);
    }
}

function removeMediaFromPreview(){
    const containers=imagePreview.querySelectorAll("[class^='media-preview']");
    containers.forEach(c => {
        c.src = '';
        c.style.display='none';
    });
    imagePreview.querySelectorAll("video").forEach(v => v.pause());
}

function getAllLinks(){
    const aElements= document.querySelectorAll('a[href]');
    const links=[];
    aElements.forEach(a => {
        if(a.href.includes('twimg.com')) {
            links.push(a.href)
        }
    });
    return links;
}

function openAllLinks(){
    getAllLinks().forEach(url => {
        console.log(url);
        chrome.tabs.create({ url });
    });
}

function downloadFromAllLinks(){
    chrome.runtime.sendMessage({
        type:"downloadAll",
        urls: getAllLinks()
    },res => {
        console.log("download result: ",res);
    });
}

function downloadFromLink(url){
    chrome.runtime.sendMessage({
        type:"download",
        url: url
    },res => {
        console.log("download result: ",res);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('button_open_all').addEventListener('click', () => {
        openAllLinks();
    });
    document.getElementById("button_download_all").addEventListener('click',()=>{
        downloadFromAllLinks();
    });
    imagePreview=document.getElementById('media_preview');
    imagePreview.addEventListener('mouseenter',showMediaPreviewContainer);
    imagePreview.addEventListener('mouseleave',hideMediaPreviewContainer);
});

