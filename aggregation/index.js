import Database from "./database.js";
import Provider from "./provider.js";
import Providers from "./providers/index.js";

import "dotenv/config.js";

// Check if the script is running in interactive mode
const args = process.argv.slice(2);
const isInteractive = args.includes("-i");

// Get the list of providers to fetch or all of them if none are specified
const wantedProviders = args.filter(a => !a.startsWith("-"));

// Load providers
/**
 * @type {Array<Provider>}
 */
const providers = [];
for (let provider of Providers) {
    if (!wantedProviders.includes(provider.name))
        continue;
    console.info("Loaded provider", provider.name);
    var missingVars = provider.envVars.filter(v => !process.env[v]);
    if (missingVars.length != 0) {
        console.error(`Provider ${provider.name} is missing environment variables: ${missingVars.join(", ")}`);
        continue;
    }
    providers.push(provider);
}

/**
 * Progress tracking
 * @type {Record<string, number|boolean>}
 */
var progress = {};

/**
 * @param {Record<string, number|boolean>} p 
 * @param {string} prefix 
 */
function updateProgress(p, prefix = "") {
    for (let k in p) {
        if (typeof p[k] == "number")
            progress[prefix + k] = Number(progress[prefix + k] || 0) + p[k];
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

/**
 * @param {Error} error 
 * @param {string} prefix 
 */
function onWarn(error, prefix = "") {
    if (isInteractive)
        console.info();
    console.error(error);
    updateProgress({ errors: 1 }, prefix);
}

process.on("SIGINT", () => {
    if (isInteractive)
        console.info();
    console.info("Process interrupted");
    console.info(JSON.stringify(progress, null, 2));
    db.end();
    process.exit(130);
});

// Connect to the database
const db = new Database({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Fetch events from providers
await Promise.all(providers.map(provider =>
    new Promise(resolve => {
        let eventsFetcher = provider.fetchAll()
            .on("data", events => updateProgress({ events: events.length }, provider.shortId + "."))
            .on("progress", progress => updateProgress(progress, provider.shortId + "."))
            .on("warn", warn => onWarn(warn, provider.shortId + "."));
        let dbWritable = db.getWritableStream(provider.shortId, provider.name)
            .on("progress", progress => updateProgress(progress, "db."))
            .on("warn", warn => onWarn(warn, "db."))
            .on("finish", () => resolve(true));
        eventsFetcher.pipe(dbWritable);
    })
));

if (isInteractive)
    console.info();
console.info(JSON.stringify(progress, null, 2));
db.end();