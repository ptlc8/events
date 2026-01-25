import axios from "axios";
import crypto from "crypto";
import fs from "fs";
import { formatDateTime, IsoDateTimeSchema } from "../utils/datetime.js";
import stream from "stream";
import unzip from "unzipper";
import z from "zod";
import { findCategories } from "../utils/categories.js";
import { Event, Status, EventsFetch } from "../event.js";
import Provider from "../provider.js";

const LangSchema = z.enum(["fr", "en", "de", "es", "it", "nl", "ru", "zh"]);
const ContactSchema = z.object({
    "schema:email": z.array(z.string()).optional(),
    "schema:telephone": z.array(z.string()).optional(),
    "foaf:homepage": z.array(z.url()).optional()
});
const RepresentationSchema = z.object({
    "ebucore:hasRelatedResource": z.array(z.object({
        "ebucore:locator": z.array(z.string())
    })).optional(),
    "ebucore:hasAnnotation": z.array(z.object({
        credits: z.array(z.string()).optional(),
        "ebucore:isCoveredBy": z.string().optional()
    })).optional()
});

/**
 * @typedef {z.infer<typeof DatatourismeEventSchema>} DatatourismeEvent
 */
const DatatourismeEventSchema = z.object({
    "@id": z.string(),
    "@type": z.array(z.string()),
    creationDate: IsoDateTimeSchema,
    "dc:identifier": z.string(),
    hasBeenCreatedBy: z.object({
        "schema:legalName": z.string()
    }),
    hasBookingContact: z.array(ContactSchema).optional(),
    hasContact: z.array(ContactSchema),
    hasDescription: z.array(z.object({
        "dc:description": z.partialRecord(LangSchema, z.array(z.string()).optional()).optional()
    })).optional(),
    hasMainRepresentation: z.array(RepresentationSchema).optional(),
    hasRepresentation: z.array(RepresentationSchema).optional(),
    hasTheme: z.array(z.object({
        "@id": z.string()
    })).optional(),
    isLocatedAt: z.array(z.object({
        "schema:address": z.array(z.object({
            "schema:addressLocality": z.string(),
            "schema:postalCode": z.string(),
            "schema:streetAddress": z.array(z.string()).optional()
        })),
        "schema:geo": z.object({
            "schema:longitude": z.coerce.number(),
            "schema:latitude": z.coerce.number()
        })
    })),
    lastUpdateDatatourisme: IsoDateTimeSchema,
    "rdfs:label": z.partialRecord(LangSchema, z.array(z.string()).optional()),
    "rdfs:comment": z.partialRecord(LangSchema, z.array(z.string())).optional(),
    takesPlaceAt: z.array(z.object({
        startDate: IsoDateTimeSchema,
        endDate: IsoDateTimeSchema.optional(),
        startTime: IsoDateTimeSchema.optional(),
        endTime: IsoDateTimeSchema.optional()
    }))
});



/**
 * Get the index and events from a Datatourisme zip from url
 * @param {string} url
 * @returns {EventsFetch}
 */
function loadZipFromUrl(url) {
    var emitter = new EventsFetch();
    axios.get(url, { responseType: "stream" })
        .then(response => {
            emitter.emit("progress", { downloading: true });
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
function _loadZipFromFile(file) {
    return loadZip(fs.createReadStream(file));
}

/**
 * Get the index and events from a Datatourisme zip in stream
 * @param {stream.Readable} stream
 * @param {EventsFetch} emitter
 * @returns {EventsFetch}
 */
function loadZip(stream, emitter = new EventsFetch()) {
    /** @type {Event[]} */
    var events = [];
    emitter.emit("progress", { unzipping: true });
    stream.pipe(unzip.Parse())
        .on("entry", function (entry) {
            emitter.emit("progress", { unzipped: 1 });
            if (entry.path == "index.json") {
                parseJSONFromStream(entry).then(obj => void obj);
                emitter.emit("progress", { index: 1 });
            } else if (entry.path.endsWith(".json")) {
                parseJSONFromStream(entry).then(obj => {
                    const dtEvent = DatatourismeEventSchema.parse(obj);
                    const event = parseEvent(dtEvent);
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
 * @returns {Promise<?>}
 */
async function parseJSONFromStream(stream) {
    return new Promise((resolve, reject) => {
        /** @type {Uint8Array<?>[]} */
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
 * @param {DatatourismeEvent} dtEvent
 * @returns {Event}
 */
function parseEvent(dtEvent) {
    var id = dtEvent["dc:identifier"];
    if (id.length > 32)
        id = crypto.createHash('md5').update(id).digest('hex');
    var address = dtEvent.isLocatedAt[0]["schema:address"][0];
    var title = dtEvent["rdfs:label"]?.fr?.[0];
    var description = (dtEvent.hasDescription?.[0]?.["dc:description"] || dtEvent["rdfs:comment"])?.fr?.[0] ?? "";
    var takesPlaceAt = dtEvent.takesPlaceAt.filter(t => new Date(t.endDate || t.startDate) >= new Date()).sort((a, b) => new Date(a.endDate || a.startDate).getTime() - new Date(b.endDate || b.startDate).getTime())[0];
    if (!takesPlaceAt) takesPlaceAt = dtEvent.takesPlaceAt.sort((a, b) => new Date(b.endDate || b.startDate).getTime() - new Date(a.endDate || a.startDate).getTime())[0];
    var dtCategories = dtEvent["@type"].concat(dtEvent.hasTheme?.map(theme => theme["@id"]) ?? []);
    return {
        id,
        title,
        author: dtEvent.hasBeenCreatedBy["schema:legalName"],
        description,
        start: formatDateTime(takesPlaceAt.startDate + (takesPlaceAt.startTime ? "T" + takesPlaceAt.startTime : "")),
        end: formatDateTime((takesPlaceAt.endDate || takesPlaceAt.startDate) + (takesPlaceAt.endTime ? "T" + takesPlaceAt.endTime : "")),
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
        contact: dtEvent.hasContact.map(c => (c["schema:email"] ?? []).concat(c["schema:telephone"] ?? []).concat(c["foaf:homepage"] ?? [])).flat(),
        registration: dtEvent.hasBookingContact ? dtEvent.hasBookingContact.map(c => (c["schema:email"] ?? []).concat(c["schema:telephone"] ?? []).concat(c["foaf:homepage"] ?? [])).flat() : [],
        public: true,
        createdAt: formatDateTime(dtEvent.creationDate),
        updatedAt: formatDateTime(dtEvent.lastUpdateDatatourisme),
        sourceUrl: dtEvent["@id"]
    };
}

/**
 * Datatourisme events provider
 * @see https://www.datatourisme.fr
 */
export default class DatatourismeProvider extends Provider {

    constructor() {
        super("datatourisme", "DT", ["DATATOURISME_GET_URL"]);
    }

    /**
     * Fetch all events from Datatourisme
     * @param {string} datatourismeUrl Datatourisme stream link
     * @returns {EventsFetch}
     */
    fetchAll(datatourismeUrl = super.getEnvVar("DATATOURISME_GET_URL")) {
        return loadZipFromUrl(datatourismeUrl);
    }

}
