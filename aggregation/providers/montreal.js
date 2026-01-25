import { default as CsvParser } from "csv-parser";
import { DateTime } from "luxon";
import { parse as parseHTML } from "node-html-parser";
import sanitizeHtml from "sanitize-html";
import { Readable, Transform } from "stream";
import z from "zod";
import { findCategories } from "../utils/categories.js";
import { Event, Status } from "../event.js";
import Provider from "../provider.js";
import { formatDateTime, IsoDateTimeSchema } from "../utils/datetime.js";

/**
 * @typedef {z.infer<typeof MontrealEventSchema>} MontrealEvent
 */
const MontrealEventSchema = z.object({
    titre: z.string(),
    url_fiche: z.url(),
    description: z.string(),
    date_debut: IsoDateTimeSchema,
    date_fin: IsoDateTimeSchema,
    type_evenement: z.string(),
    public_cible: z.string(),
    emplacement: z.string(),
    inscription: z.string(),
    cout: z.string(),
    arrondissement: z.string(),
    titre_adresse: z.string(),
    adresse_principale: z.string(),
    adresse_secondaire: z.string(),
    code_postal: z.string(),
    lat: z.coerce.number(),
    long: z.coerce.number(),
    X: z.coerce.number(),
    Y: z.coerce.number(),
});

const formatDateOpts = { zone: "America/Toronto" };

/**
 * @param {string} str 
 * @returns {string?} 
 */
function nanToNull(str) {
    return (str == "nan" ? null : str);
}

/**
 * Parse a Montreal.ca event to an Event
 * @param {MontrealEvent} mtlEvent
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
        start: moreData.start ?? formatDateTime(mtlEvent.date_debut, formatDateOpts),
        end: moreData.end ?? formatDateTime(mtlEvent.date_fin, formatDateOpts),
        lng: mtlEvent.long,
        lat: mtlEvent.lat,
        placename: !address.length ? placename : `${placename} (${address.join(", ")})`,
        categories: findCategories(mtlEvent.type_evenement, mtlEvent.public_cible, mtlEvent.emplacement, mtlEvent.inscription, mtlEvent.cout, mtlEvent.titre, mtlEvent.description),
        images: moreData.images ?? [],
        imagesCredits: moreData.imagesCredits ?? [],
        status: moreData.cancelled ? Status.cancelled : Status.programmed,
        contact: [mtlEvent.url_fiche],
        registration: (moreData.websites || []).concat(moreData.phones || []).concat(moreData.emails || []),
        public: true,
        createdAt: null,
        updatedAt: formatDateTime(undefined, formatDateOpts),
        sourceUrl: mtlEvent.url_fiche,
    };
}

/**
 * Fetch more data from the event page
 * @param {string} url_fiche
 * @returns {Promise<{
 *   description: string,
 *   images: (string|undefined)[],
 *   imagesCredits: (string|undefined)[],
 *   start?: string,
 *   end?: string,
 *   placename?: string,
 *   address?: string[],
 *   websites: (string|undefined)[],
 *   phones: (string|undefined)[],
 *   emails: (string|undefined)[],
 *   cancelled: boolean
 * }>}
 */
async function fetchMoreData(url_fiche) {
    const res = await fetch(url_fiche);
    const html = await res.text();
    const root = parseHTML(html);
    let shortDescription = root.querySelector("main .lead")?.textContent ?? "";
    let longDescription = sanitizeHtml(root.querySelector("main .content-modules .content-module-stacked")?.innerHTML ?? "");
    let description = [shortDescription, longDescription].filter(Boolean).join("\n\n");
    let images = [
        ...[root.querySelector(".document-heading-image-container .document-heading-background")?.getAttribute("style")
            ?.match(/background-image:url\(([^)]+)\)/)?.[1]]
    ];
    let imagesCredits = [...[root.querySelector(".document-heading-image-container .badge-copyright .badge-label")?.textContent?.trim()]];
    images.push(...root.querySelectorAll("figure .image-wrapper img").map(img => img.getAttribute("src")));
    imagesCredits.push(...root.querySelectorAll("figure .image-wrapper .badge-copyright .badge-label").map(span => span.textContent.trim()));
    let [start, end] = root.querySelectorAll("header time").map(time => formatDateTime(time.getAttribute("datetime"), formatDateOpts) ?? undefined);
    if (!end && start)
        end = DateTime.fromSQL(start).plus({ hours: 1 }).toSQL({ includeOffset: false }) ?? undefined;
    let placename = root.querySelector("aside .list-item-icon:has(.icon-location) :is(.link-icon-label, .list-item-icon-label)")?.textContent?.trim();
    let address = root.querySelector("aside .list-item-icon:has(.icon-location) .list-item-icon-content :is(div:first-child:not(.list-item-icon-label), .list-item-icon-label + div div)")?.textContent?.split("\n");
    let websites = root.querySelectorAll("a.link-has-icon[href^='http']").map(a => a.getAttribute("href"));
    let phones = root.querySelectorAll(".icon-phone + * .list-item-icon-label").map(span => span.textContent.trim());
    let emails = root.querySelectorAll("a[href^='mailto:']").map(a => a.getAttribute("href")?.match(/mailto:([^?]+)/)?.[1]); // doesnt work because of email protection
    let cancelled = root.querySelector(".content-header .badge-danger")?.textContent == "Annulé";
    return { description, images, imagesCredits, start, end, placename, address, websites, phones, emails, cancelled };
}

/**
 * Montreal.ca events provider
 * @see https://www.montreal.ca/calendrier
 * @see https://donnees.montreal.ca/dataset/evenements-publics
 */

export default class MontrealProvider extends Provider {

    constructor() {
        super("montreal", "MTL", ["MONTREAL_CSV_URL"]);
    }

    /**
     * Fetch all events from Montreal.ca
     * @param {string} csvUrl Montreal CSV URL
     * @returns {Readable}
     */
    fetchAll(csvUrl = super.getEnvVar("MONTREAL_CSV_URL")) {
        const out = new Transform({
            objectMode: true,
            async transform(obj, _encoding, callback) {
                const { success, data: mtlEvent, error} = MontrealEventSchema.safeParse(obj);
                if (!success) {
                    out.emit("warn", error);
                    callback();
                    return;
                }
                if (Math.random() < 0.2) {
                    out.emit("warn", new Error("Random test error"));
                    callback();
                    return;
                }
                const event = await parseEvent(mtlEvent);
                out.emit("progress", { parsed: 1 });
                if (event == null) {
                    out.emit("progress", { ignored: 1 });
                    callback();
                    return;
                }
                callback(null, [event]);
            }
        });
        const csvParser = CsvParser()
            .on("data", () => out.emit("progress", { downloaded: 1 }))
            .on("error", error => out.emit("warn", error));
        fetch(csvUrl).then(res => {
            if (!res.body)
                throw new Error("No response body");
            Readable.fromWeb(res.body).pipe(csvParser).pipe(out);
        }).catch(error => out.emit("warn", error));
        return out;
    }

}
