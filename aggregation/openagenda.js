/**
 * Module for fetching OpenAgenda events
 * @module openagenda
 * @see https://developers.openagenda.com
 */

import https from "https";
import event, { Event, EventsFetch } from "./event.js";

/**
 * Get the events from OpenAgenda
 * @param {string} key
 * @param {boolean} [official=false]
 * @param {EventsFetch} [emitter=new EventsFetch()]
 * @param {number[]} [after=[]]
 * @returns {EventsFetch}
 */
function fetchAll(key, official = false, emitter=new EventsFetch(), after = []) {
    https.request(`https://api.openagenda.com/v2/agendas?key=${key}&size=100&sort=createdAt.desc&official=${official ? 1 : 0}&` + after.map(v => "after[]=" + v).join("&"))
        .on("response", res => {
            emitter.emit("progress", { fetchingAgendas: true });
            var data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                data = JSON.parse(data);
                if (data.success) {
                    emitter.emit("progress", { agendas: data.agendas.length });
                    var agendas = data.agendas.length;
                    var agendasEventsFetched = 0;
                    var end = 0;
                    var events = [];
                    for (let agenda of data.agendas) {
                        fetchAgendaEvents(key, agenda.uid)
                            .on("events", e => emitter.emit("events", e) && events.push(...e))
                            .on("progress", progress => emitter.emit("progress", progress))
                            .on("error", err => emitter.emit("error", err))
                            .on("end", e => ++agendasEventsFetched == agendas && ++end == 2 && emitter.emit("end", events));
                    }
                    if (data.after != null) {
                        fetchAll(key, official, undefined, data.after)
                            .on("events", e => emitter.emit("events", e) && events.push(...e))
                            .on("progress", progress => emitter.emit("progress", progress))
                            .on("error", err => emitter.emit("error", err))
                            .on("end", e => ++end == 2 && emitter.emit("end", events));
                    } else {
                        emitter.emit("progress", { fetchingAgendas: false });
                        if (++end == 2) emitter.emit("end", events);
                    }
                } else {
                    emitter.emit("error", data);
                    setTimeout(() => fetchAll(key, official, emitter, after), 1000);
                }
            });
        })
        .on("error", err => {
            emitter.emit("error", err);
            setTimeout(() => fetchAll(key, official, emitter, after), 1000);
        })
        .end();
    return emitter;
}

/**
 * Get the events from an OpenAgenda agenda
 * @param {string} key
 * @param {number} agendaId
 * @param {number[]} [after=[]]
 * @returns {EventsFetch}
 */
function fetchAgendaEvents(key, agendaId, emitter = new EventsFetch(), after = []) {
    var events = [];
    https.request(`https://api.openagenda.com/v2/agendas/${agendaId}/events?key=${key}&size=300&detailed=1&` + after.map(v => "after[]=" + v).join("&"))
        .on("response", res => {
            var data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                data = JSON.parse(data);
                if (data.success) {
                    var results = data.events.map(parseEvent);
                    var ignored = results.filter(e => e == null).length;
                    results = results.filter(e => e != null);
                    emitter.emit("progress", { events: results.length, ignored });
                    emitter.emit("events", results);
                    events.push(...results);
                    if (data.after != null) {
                        fetchAgendaEvents(key, agendaId, emitter, data.after);
                    } else {
                        emitter.emit("end", events);
                    }
                } else {
                    emitter.emit("error", data);
                    setTimeout(() => fetchAgendaEvents(key, agendaId, emitter, after), 1000);
                }
            });
        })
        .on("error", err => {
            emitter.emit("error", err);
            setTimeout(() => fetchAgendaEvents(key, agendaId, emitter, after), 1000);
        })
        .end();
    return emitter;
}

/**
 * Parse an OpenAgenda event to an Event
 * @param {Object} openagendaEvent 
 * @returns {Event?}
 */
function parseEvent(oaEvent) {
    if (oaEvent.nextTiming == null) // event has no future timing
        return null;
    var event = {
        id: "OA" + oaEvent.originAgenda.uid + "-" + oaEvent.uid,
        title: oaEvent.title.fr ?? oaEvent.title.en ?? "",
        author: "OpenAgenda", // TODO: find a way to get the author
        description: oaEvent.longDescription?.fr ?? oaEvent.longDescription?.en ?? oaEvent.description.fr ?? oaEvent.description.en ?? "",
        start: formatDate(oaEvent.nextTiming.begin),
        end: formatDate(oaEvent.nextTiming.end),
        lng: oaEvent.location?.longitude ?? 0,
        lat: oaEvent.location?.latitude ?? 0,
        placename: oaEvent.location?.address ?? "",
        categories: oaEvent.keywords?.fr ?? oaEvent.keywords?.en ?? [], // TODO
        images: oaEvent.image ? [oaEvent.image.base + oaEvent.image.filename] : [],
        imagesCredits: oaEvent.imageCredits ? [oaEvent.imageCredits] : [],
        status: oaEvent.status,
        contact: [],
        registration: oaEvent.registration?.map(r => r.value) ?? [],
        public: true,
        createdAt: formatDate(oaEvent.createdAt),
        updatedAt: formatDate(oaEvent.updatedAt),
        source: "openagenda",
        sourceUrl: `https://openagenda.com/agendas/${oaEvent.originAgenda.uid}/events/${oaEvent.uid}`
    };
    return event;
}

function formatDate(datetime) {
    return new Date(datetime).toISOString().replace("T", " ").replace("Z", "");
}

export default { fetchAll };
