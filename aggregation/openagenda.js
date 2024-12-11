/**
 * Module for fetching OpenAgenda events
 * @module openagenda
 * @see https://developers.openagenda.com
 */

import axios from "axios";
import { Event, EventsFetch } from "./event.js";
import { findCategories } from "./categories.js";
import { isSafe } from "./filter.js";

/**
 * Get all events from OpenAgenda
 * @param {string} key
 * @param {boolean} [official = false]
 * @returns {EventsFetch}
 */
function fetchAll(key, official = false) {
    var emitter = new EventsFetch();
    var events = [];
    var agendasCount = Infinity;
    var agendasFetchedCount = 0;
    fetchAgendas(key, official)
        .on("agendas", agendas => {
            for (let agenda of agendas) {
                fetchAgendaEvents(key, agenda)
                    .on("events", e => emitter.emit("events", e))
                    .on("progress", progress => emitter.emit("progress", progress))
                    .on("error", err => emitter.emit("error", err))
                    .on("end", e => events.push(...e))
                    .on("end", () => {
                        agendasFetchedCount++;
                        if (agendasFetchedCount == agendasCount)
                            emitter.emit("end", events);
                    });
            }
        })
        .on("progress", progress => emitter.emit("progress", progress))
        .on("error", err => emitter.emit("error", err))
        .on("end", a => agendasCount = a.length);
    return emitter;
}

/**
 * Get all agendas from OpenAgenda
 * @param {string} key
 * @param {boolean} [official = false]
 * @returns {EventsFetch}
 */
function fetchAgendas(key, official = false) {
    var emitter = new EventsFetch();
    (async function() {
        var after = []
        var agendas = [];
        emitter.emit("progress", { fetchingAgendas: true });
        while (after != null) {
            var url = `https://api.openagenda.com/v2/agendas?key=${key}&size=100&sort=createdAt.desc&official=${official ? 1 : 0}&` + after.map(v => "after[]=" + v).join("&");
            let response = await axios.get(url);
            let data = response.data;
            if (!data.success) {
                emitter.emit("error", data);
                break;
            }
            data.agendas = data.agendas.filter(a => a.official || isSafe(a.title, a.description));
            emitter.emit("progress", { agendas: data.agendas.length });
            emitter.emit("agendas", data.agendas);
            agendas.push(...data.agendas);
            after = data.after;
        }
        emitter.emit("progress", { fetchingAgendas: false });
        emitter.emit("end", agendas);
    })().catch(err => emitter.emit("error", err));
    return emitter;
}

/**
 * Get the events from an OpenAgenda agenda
 * @param {string} key
 * @param {Object} agenda OpenAgenda agenda
 * @returns {EventsFetch}
 */
function fetchAgendaEvents(key, agenda) {
    var emitter = new EventsFetch();
    (async function() {
        var after = [];
        var events = [];
        while (after != null) {
            var url = `https://api.openagenda.com/v2/agendas/${agenda.uid}/events?key=${key}&size=300&detailed=1&` + after.map(v => "after[]=" + v).join("&");
            var response = await axios.get(url);
            var data = response.data;
            if (!data.success) {
                emitter.emit("error", data);
                break;
            }
            var results = data.events.map(e => parseEvent(e, agenda));
            var ignored = results.filter(e => e == null).length;
            results = results.filter(e => e != null);
            emitter.emit("progress", { events: results.length, ignored });
            emitter.emit("events", results);
            events.push(...results);
            after = data.after;
        }
        emitter.emit("end", events);
    })().catch(err => emitter.emit("error", err));
    return emitter;
}

/**
 * Parse an OpenAgenda event to an Event
 * @param {Object} oaEvent OpenAgenda event
 * @param {Object} agenda OpenAgenda agenda
 * @returns {Event?}
 */
function parseEvent(oaEvent, agenda) {
    if (oaEvent.nextTiming == null) // event has no future timing
        return null;
    if (!agenda.official && !isSafe(oaEvent.title.fr, oaEvent.title.en, oaEvent.description.fr, oaEvent.description.en))
        return null;
    var url = `https://openagenda.com/agendas/${agenda.slug}/events/${oaEvent.slug}`;
    var event = {
        id: "OA" + agenda.uid + "-" + oaEvent.uid,
        title: oaEvent.title.fr ?? oaEvent.title.en ?? "",
        author: agenda.title,
        description: oaEvent.longDescription?.fr ?? oaEvent.longDescription?.en ?? oaEvent.description.fr ?? oaEvent.description.en ?? "",
        start: formatDate(oaEvent.nextTiming.begin),
        end: formatDate(oaEvent.nextTiming.end),
        lng: oaEvent.location?.longitude ?? 0,
        lat: oaEvent.location?.latitude ?? 0,
        placename: oaEvent.location?.address ?? "",
        categories: findCategories(oaEvent.title.fr ?? oaEvent.title.en ?? "", ...(oaEvent.keywords?.fr ?? oaEvent.keywords?.en ?? [])),
        images: oaEvent.image ? [oaEvent.image.base + oaEvent.image.filename] : [],
        imagesCredits: oaEvent.imageCredits ? [oaEvent.imageCredits] : [],
        status: oaEvent.status,
        contact: [url],
        registration: oaEvent.registration?.map(r => r.value) ?? [],
        public: true,
        createdAt: formatDate(oaEvent.createdAt),
        updatedAt: formatDate(oaEvent.updatedAt),
        source: "openagenda",
        sourceUrl: url
    };
    return event;
}

function formatDate(datetime) {
    return new Date(datetime).toISOString().replace("T", " ").replace("Z", "");
}

export default { fetchAll };
