

// https://publicwww.com/websites/
// ".ics\"" site:fr
// "webcal:" site:fr

// fetch('https://publicwww.com/websites/%22.ics%5C%22%22+site%3Afr/?export=urls');


import fs from 'fs';

let urls = fs.readFileSync('providers/urls.txt').toString().split('\n');

for (let url of urls) {
    console.log(url);
    let res = await fetch(url);
    let text = await res.text();
    // find .ics links
    let ics = text.match(/[^"]+\.ics/g);
    console.log(ics);
}
