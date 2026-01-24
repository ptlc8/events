import fs from "fs";
import Database from "./database.js";

import "dotenv/config.js";

// Check if the script is running in interactive mode
const args = process.argv.slice(2);
const isInteractive = args.includes("-i");

// Get the list of providers to fetch or all of them if none are specified
const wantedProviders = args.filter(a => !a.startsWith("-"));

// Load providers
const providers = [];
for (let file of fs.readdirSync(import.meta.dirname + "/providers")) {
    if(!file.endsWith(".js"))
        continue;
    let name = file.slice(0, -3);
    if (wantedProviders.length != 0 && !wantedProviders.includes(name))
        continue;
    var module = await import("./providers/" + file);
    console.log("Loaded provider", name, `(${file})`);
    var missingVars = module.envVars.filter(v => !process.env[v]);
    if (missingVars.length != 0) {
        console.error(`Provider ${name} is missing environment variables: ${missingVars.join(", ")}`);
        continue;
    }
    providers.push({
        name,
        shortId: module.shortId,
        fetchAll: module.fetchAll
    });
}

// Progress tracking
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
    if (isInteractive)
        console.log();
    console.error(error);
    updateProgress({ errors: 1 }, prefix);
}

// Connect to the database
const db = new Database({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});
db.on("progress", p => updateProgress(p, "db."));
db.on("error", error => onError(error, "db."));

// Fetch events from providers
await Promise.all(providers.map(provider =>
    new Promise(resolve => {
        provider.fetchAll()
            .on("events", events => db.update(events, provider.shortId, provider.name))
            .on("progress", progress => updateProgress(progress, provider.shortId + "."))
            .on("error", error => onError(error, provider.shortId + "."))
            .on("end", events => db.clean(events, provider.shortId).then(resolve));
    })
));

console.log(JSON.stringify(progress, null, 2));
db.end();