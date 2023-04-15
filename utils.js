function sendRequest(method, url, body=undefined, contentType="application/x-www-form-urlencoded") {
    var promise = new (Promise||ES6Promise)(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.onreadystatechange = function() {
            if (this.readyState == XMLHttpRequest.DONE && this.status == 200) {
                resolve(this.response);
            }
        }
        xhr.send(body);
    });
    return promise;
}
function createElement(tag, properties={}, inner=[], eventListeners={}) {
    let el = document.createElement(tag);
    for (let p of Object.keys(properties)) if (p != "style") el[p] = properties[p];
    if (properties.style) for (let p of Object.keys(properties.style)) el.style[p] = properties.style[p];
    if (typeof inner == "object") for (let i of inner) el.appendChild(typeof i == "string" ? document.createTextNode(i) : i);
    else el.innerText = inner;
    for (let l of Object.keys(eventListeners)) el.addEventListener(l, eventListeners[l]);
    return el
}
var texts = [];
function text(id) {
    if (!texts[lang]) {
        sendRequest("GET", "langs/"+"fr"+".json").then(function(response) { // TODO other lang
            texts[lang] = JSON.parse(response);
        });
        return ""; // TODO : promise ?
    } else {
        return texts[lang][id];
    }
}
function getDisplayDate(datetime) {
    var datetime = new Date(datetime);
    var date = new Date(datetime);
    date.setHours(0,0,0,0);
    var now = new Date();
    var today = new Date();
    today.setHours(0,0,0,0);
    
    if (date.getTime() == today.getTime()-86400000) return text("yesterday");
    if (date.getTime() < today.getTime()) return text("past");
    if (date.getTime() == today.getTime()) return text("today");
    if (date.getTime() == today.getTime()+86400000) return text("tomorrow");
    if (date.getTime() < today.getTime()+6*86400000) return text("weekdays")[date.getDay()]+text("next");
    return text("thedate") + date.getDate() + " " + text("months")[date.getMonth()] + (date.getYear()==today.getYear()?"":" "+date.getYear())
    if (date.getTime() )
    return "TODO";
}