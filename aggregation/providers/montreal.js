/**
 * Module for fetching Montreal.ca events
 * @module montreal
 * @see https://www.montreal.ca/calendrier
 * @see https://donnees.montreal.ca/dataset/evenements-publics
 */

import { default as CsvParser } from "csv-parser";
import { DateTime } from "luxon";
import { parse as parseHTML } from "node-html-parser";
import sanitizeHtml from "sanitize-html";
import { Readable, Transform } from "stream";
import { findCategories } from "../categories.js";
import { Event, Status, EventsFetch } from "../event.js";

export const shortId = "MTL";
export const envVars = ["MONTREAL_CSV_URL"];

function nanToNull(str) {
    return (str == "nan" ? null : str);
}

/**
 * Parse a Montreal.ca event to an Event
 * @param {Object} mtlEvent
 * @returns {Promise<Event?>}
 */
async function parseEvent(mtlEvent) {
    if (!mtlEvent.long || !mtlEvent.lat)
        return null;
    if (DateTime.fromISO(mtlEvent.date_fin ?? mtlEvent.date_debut) <= DateTime.now())
        return null;
    const moreData = await fetchMoreData(mtlEvent.url_fiche);
    let placename = moreData.placename ?? nanToNull(mtlEvent.titre_adresse) ?? "";
    let address = moreData.address ?? [nanToNull(mtlEvent.adresse_principale), nanToNull(mtlEvent.adresse_secondaire), nanToNull(mtlEvent.code_postal)].filter(Boolean);
    return {
        id: mtlEvent.url_fiche.split("-").pop(),
        title: mtlEvent.titre,
        author: mtlEvent.arrondissement,
        description: moreData.description ?? mtlEvent.description,
        start: moreData.start ?? formatDate(mtlEvent.date_debut),
        end: moreData.end ?? formatDate(mtlEvent.date_fin),
        lng: mtlEvent.long,
        lat: mtlEvent.lat,
        placename: !address.length ? placename : `${placename} (${address.join(", ")})`,
        categories: findCategories(mtlEvent.type_evenement, mtlEvent.public_cible, mtlEvent.emplacement, mtlEvent.inscription, mtlEvent.cout, mtlEvent.titre, mtlEvent.description),
        images: moreData.images ?? [],
        imagesCredits: moreData.imagesCredits ?? [],
        status: moreData.cancelled ? Status.cancelled : Status.programmed,
        contact: [mtlEvent.url_fiche],
        registration: [].concat(moreData.websites || []).concat(moreData.phones || []).concat(moreData.emails || []),
        public: true,
        createdAt: null,
        updatedAt: formatDate(),
        sourceUrl: mtlEvent.url_fiche,
    };
}

async function fetchMoreData(url_fiche) {
    const res = await fetch(url_fiche);
    const html = await res.text();
    const root = parseHTML(html);
    let shortDescription = root.querySelector("main .lead")?.textContent ?? "";
    let longDescription = sanitizeHtml(root.querySelector("main .content-modules .content-module-stacked")?.innerHTML ?? "");
    let description = [shortDescription, longDescription].filter(Boolean).join("\n\n");
    let images = [
        root.querySelector(".document-heading-image-container .document-heading-background")?.getAttribute("style")
            ?.match(/background-image:url\(([^\)]+)\)/)[1]
    ];
    let imagesCredits = [root.querySelector(".document-heading-image-container .badge-copyright .badge-label")?.textContent?.trim()];
    images.push(...root.querySelectorAll("figure .image-wrapper img").map(img => img.getAttribute("src")));
    imagesCredits.push(...root.querySelectorAll("figure .image-wrapper .badge-copyright .badge-label").map(span => span.textContent.trim()));
    let [start, end] = root.querySelectorAll("header time").map(time => formatDate(time.getAttribute("datetime")));
    if (!end && start)
        end = DateTime.fromSQL(start).plus({ hours: 1 }).toSQL({ includeOffset: false });
    let placename = root.querySelector("aside .list-item-icon:has(.icon-location) :is(.link-icon-label, .list-item-icon-label)")?.textContent?.trim();
    let address = root.querySelector("aside .list-item-icon:has(.icon-location) .list-item-icon-content :is(div:first-child:not(.list-item-icon-label), .list-item-icon-label + div div)")?.textContent?.split("\n")
    let websites = root.querySelectorAll("a.link-has-icon[href^='http']").map(a => a.getAttribute("href"));
    let phones = root.querySelectorAll(".icon-phone + * .list-item-icon-label").map(span => span.textContent.trim());
    let emails = root.querySelectorAll("a[href^='mailto:']").map(a => a.getAttribute("href").match(/mailto:([^?]+)/)[1]); // doesnt work because of email protection
    let cancelled = root.querySelector(".content-header .badge-danger")?.textContent == "Annulé";
    return { description, images, imagesCredits, start, end, placename, address, websites, phones, emails, cancelled };
}

/**
 * Fetch all events from Montreal.ca
 * @param {string} csvUrl Montreal CSV URL
 * @returns {EventsFetch}
 */
export function fetchAll(csvUrl = process.env.MONTREAL_CSV_URL) {
    var events = [];
    const emitter = new EventsFetch();
    const csvParser = CsvParser()
        .on("data", () => emitter.emit("progress", { downloaded: 1 }))
        .on("error", error => emitter.emit("error", error));
    const eventParser = new Transform({
        objectMode: true,
        async transform(mtlEvent, _encoding, callback) {
            const event = await parseEvent(mtlEvent);
            emitter.emit("progress", { parsed: 1 });
            if (event == null) {
                emitter.emit("progress", { ignored: 1 });
                callback();
                return;
            }
            events.push(event);
            emitter.emit("events", [event]);
            emitter.emit("progress", { events: 1 });
            callback(null, event);
        }
    })
    eventParser.on("end", () => emitter.emit("end", events));
    eventParser.on("error", error => emitter.emit("error", error));
    fetch(csvUrl)
        .then(res => Readable.fromWeb(res.body).pipe(csvParser).pipe(eventParser).resume())
        .catch(error => emitter.emit("error", error));
    return emitter;
}

function formatDate(datetime) {
    return (!datetime
        ? DateTime.fromSeconds(0)
        : DateTime.fromISO(datetime, { zone: "America/Toronto" })
    ).toUTC().toSQL({ includeOffset: false });
}

export default { fetchAll };
