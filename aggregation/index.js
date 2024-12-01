import datatourisme from "./datatourisme.js";
import openagenda from "./openagenda.js";
import Database from "./database.js";

import credentials from "./credentials.json" assert {type: "json"};


const isInteractive = process.argv.slice(2).includes("-i");

const db = new Database({
    host: credentials.DB_HOST,
    user: credentials.DB_USER,
    password: credentials.DB_PASS,
    database: credentials.DB_NAME
});

var progress = {};

function updateProgress(p, prefix = "") {
    for (let k in p) {
        if (typeof p[k] == "number")
            progress[prefix + k] = (progress[prefix + k] || 0) + p[k];
        else if (p[k] === true)
            progress[prefix + k] = true;
        else if (p[k] === false)
            delete progress[prefix + k];
        else
            progress[prefix + k] = p[k];
    }
    if (isInteractive)
        process.stdout.write(Object.keys(progress).map(k => progress[k] === true ? k : `${k}: ${progress[k]}`).join(" | ") + "\r");
}

function onError(error, prefix = "") {
    console.log();
    console.error(error);
    updateProgress({ errors: 1 }, prefix);
}

db.on("progress", p => updateProgress(p, "db."));
db.on("error", error => onError(error, "db."));

var providers = [
    { name: "DT", fetchAll: () => datatourisme.fetchAll(credentials.DATATOURISME_GET_URL) },
    { name: "OA", fetchAll: () => openagenda.fetchAll(credentials.OPENAGENDA_KEY) }
];

// Filter providers if command line arguments, e.g. node update.js OA
var args = process.argv.slice(2);
if (args.filter(a => !a.startsWith("-")).length > 0) {
    providers = providers.filter(p => args.includes(p.name))
}

await Promise.all(providers.map(provider =>
    new Promise(resolve => {
        provider.fetchAll()
            .on("events", events => db.update(events))
            .on("progress", progress => updateProgress(progress, provider.name + "."))
            .on("error", error => onError(error, provider.name + "."))
            .on("end", events => db.clean(events, provider.name).then(resolve));
    })
));

console.log("\nDone!");
console.log(JSON.stringify(progress, null, 2));
db.end();