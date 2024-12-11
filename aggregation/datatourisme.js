/**
 * Module for fetching Datatourisme events
 * @module datatourisme
 * @see https://www.datatourisme.fr
 */

import unzip from "unzipper";
import crypto from "crypto";
import fs from "fs";
import stream from "stream";
import axios from "axios";
import { Event, Status, EventsFetch } from "./event.js";
import { findCategories } from "./categories.js";

/**
 * Get the index and events from a Datatourisme zip from url
 * @param {string} url
 * @returns {EventsFetch}
 */
function loadZipFromUrl(url) {
    var emitter = new EventsFetch();
    axios.get(url, { responseType: "stream" })
        .then(response => {
            emitter.emit("progress", { downloading: true })
            loadZip(response.data, emitter);
            response.data
                .on("finish", () => {
                    emitter.emit("progress", { downloading: false });
                });
        });
    return emitter;
}

/**
 * Get the index and events from a Datatourisme zip from file
 * @param {string} file
 * @returns {EventsFetch}
 */
function loadZipFromFile(file) {
    return loadZip(fs.createReadStream(file));
}

/**
 * Get the index and events from a Datatourisme zip in stream
 * @param {stream.Readable} stream
 * @param {EventsFetch} [emitter=new EventsFetch()]
 * @returns {EventsFetch}
 */
function loadZip(stream, emitter = new EventsFetch()) {
    var events = [];
    var index = null;
    emitter.emit("progress", { unzipping: true });
    stream.pipe(unzip.Parse())
        .on("entry", function (entry) {
            emitter.emit("progress", { unzipped: 1 });
            if (entry.path == "index.json") {
                parseJSONFromStream(entry).then(obj => index = obj);
                emitter.emit("progress", { index: 1 })
            } else if (entry.path.endsWith(".json")) {
                parseJSONFromStream(entry).then(obj => {
                    let event = parseEvent(obj);
                    events.push(event);
                    emitter.emit("events", [event]);
                    emitter.emit("progress", { events: 1 });
                });
            } else {
                entry.autodrain();
            }
        })
        .on("finish", () => {
            emitter.emit("progress", { unzipping: false });
            emitter.emit("end", events);
        })
        .on("error", error => emitter.emit("error", error));
    return emitter;
}


/**
 * Parse a JSON from a stream
 * @param {stream.Readable} stream
 * @returns {Promise<Object>}
 */
async function parseJSONFromStream(stream) {
    return new Promise((resolve, reject) => {
        var chunks = [];
        stream.on("data", chunk => chunks.push(chunk));
        stream.on("end", () => {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        });
        stream.on("error", reject);
    });
}

/**
 * Parse a Datatourisme event to an Event
 * @param {Object} dtEvent
 * @returns {Event}
 */
function parseEvent(dtEvent) {
    var id = dtEvent["dc:identifier"];
    if (id.length > 32)
        id = crypto.createHash('md5').update(id).digest('hex');
    var address = dtEvent.isLocatedAt[0]["schema:address"][0];
    var title = dtEvent["rdfs:label"].fr[0];
    var description = (dtEvent.hasDescription?.[0]?.["dc:description"] || dtEvent["rdfs:comment"])?.fr?.[0] ?? "";
    var takesPlaceAt = dtEvent.takesPlaceAt ? dtEvent.takesPlaceAt.filter(t => new Date(t.endDate || t.startDate) >= new Date()).sort((a, b) => new Date(a) - new Date(b))[0] : {}; // TODO: fix that
    if (!takesPlaceAt) takesPlaceAt = dtEvent.takesPlaceAt.sort((a, b) => new Date(b) - new Date(a))[0];
    var dtCategories = dtEvent["@type"].concat(dtEvent.hasTheme?.map(theme => theme["@id"]) ?? [])
    return {
        id: "DT" + id,
        title,
        author: dtEvent.hasBeenCreatedBy["schema:legalName"],
        description,
        start: formatDate(takesPlaceAt.startDate + " " + (takesPlaceAt.startTime || "")),
        end: formatDate((takesPlaceAt.endDate || takesPlaceAt.startDate) + " " + (takesPlaceAt.endTime || "")),
        lng: dtEvent.isLocatedAt[0]["schema:geo"]["schema:longitude"],
        lat: dtEvent.isLocatedAt[0]["schema:geo"]["schema:latitude"],
        placename: [address["schema:addressLocality"], address["schema:postalCode"], address["schema:streetAddress"]].join(", "),
        categories: findCategories(...dtCategories, title, description),
        images: (dtEvent.hasMainRepresentation || []).concat(dtEvent.hasRepresentation || []).map(rep =>
            rep["ebucore:hasRelatedResource"]?.map(res =>
                res["ebucore:locator"] ?? []
            )?.flat() ?? []
        ).flat(),
        imagesCredits: (dtEvent.hasMainRepresentation || []).concat(dtEvent.hasRepresentation || []).map(rep =>
            rep["ebucore:hasAnnotation"]?.map(ann =>
                ann.credits ?? ann["ebucore:isCoveredBy"] ?? []
            )?.flat() ?? []
        ).flat(),
        status: Status.programmed,
        contact: dtEvent.hasContact.map(c => [c["schema:email"] ?? [], c["schema:telephone"] ?? [], c["foaf:homepage"] ?? []].flat()).flat(),
        registration: dtEvent.hasBookingContact ? dtEvent.hasBookingContact.map(c => [c["schema:email"] ?? [], c["schema:telephone"] ?? [], c["foaf:homepage"] ?? []].flat()).flat() : [],
        public: true,
        createdAt: formatDate(dtEvent.creationDate),
        updatedAt: formatDate(dtEvent.lastUpdateDatatourisme),
        source: "datatourisme",
        sourceUrl: dtEvent["@id"]
    };
}

/**
 * Fetch all events from Datatourisme
 * @param {string} datatourismeUrl Datatourisme stream link
 * @returns {EventsFetch}
 */
function fetchAll(datatourismeUrl) {
    return loadZipFromUrl(datatourismeUrl);
}

/**
 * Fetch all events from Datatourisme and only return the last updated
 * @param {string} datatourismeUrl
 * @returns {EventsFetch}
 */
function fetchLastUpdated(datatourismeUrl, date = Date.now()) {
    var emitter = new EventsFetch();
    loadZipFromUrl(datatourismeUrl)
        .on("events", events => emitter.emit("events", events.filter(e => new Date(e.updatedAt) > date)))
        .on("progress", progress => emitter.emit("progress", progress))
        .on("error", error => emitter.emit("error", error))
        .on("end", events => emitter.emit("end", events.filter(e => new Date(e.updatedAt) > date)));
    return emitter;
}

function formatDate(datetime) {
    return new Date(datetime || 0).toISOString().replace("T", " ").replace("Z", "");
}

export default { fetchAll, fetchLastUpdated, loadZipFromFile, loadZipFromUrl, loadZip };
