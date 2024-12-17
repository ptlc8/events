
import axios from "axios";

// https://www.cdc-oleron.com/page-agenda/
var filterUrl = "https://widgets.apidae-tourisme.com/filter.js?utf8=✓&widget%5Bid%5D=4656&refresh%5B%5D=events_count&refresh%5B%5D=results_agenda&refresh%5B%5D=agenda_url";
var refreshUrl = "https://widgets.apidae-tourisme.com/refresh.js?utf8=✓&widget%5Bid%5D=4656";

let event_urls = await fetchEventUrls(refreshUrl);

console.log(event_urls.length);
console.log(event_urls[0]);


var event = await fetchEvent(event_urls[0]);

console.log(event);

// PROBLEME: ya pas de dates précises

async function fetchEventUrls(refreshUrl) {
    let res = await axios.get(refreshUrl);

    return res.data.match(/http([^\\]*com\/details[^\\]*)/g);
}

async function fetchEvent(url) {
    let res = await axios.get(url);
    return { // TODO: unescape html
        title: res.data.match(/<h2[^>]*>([^<]+)/)[1].replaceAll('\\n', '').trim()
    }
}