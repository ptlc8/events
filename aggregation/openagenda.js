/**
 * Module for fetching OpenAgenda events
 * @module openagenda
 */

import https from "https";
import EventEmitter from "events";
import "./event.js";

/**
 * Get the events from OpenAgenda
 * @param {string} key
 * @param {Boolean} official
 * @param {Boolean} [log=true]
 * @param {number[]} [after=[]]
 * @returns {Promise<Event[]>}
 */
function fetchAll(key, official = false, after = []) {
    var emitter = new EventEmitter();
    https.request(`https://api.openagenda.com/v2/agendas?key=${key}&size=100&sort=createdAt.desc&official=${official ? 1 : 0}&` + after.map(v => "after[]=" + v).join("&"))
        .on("response", res => {
            var data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                data = JSON.parse(data);
                if (data.success) {
                    for (let agenda of data.agendas) {
                        fetchAgendaEvents(key, agenda.uid, emitter);
                        emitter.emit("progress", { agendas: 1 });
                    }
                    if (data.after != null) {
                        fetchAll(key, official, data.after)
                            .on("events", events => emitter.emit("events", events))
                            .on("progress", progress => emitter.emit("progress", progress))
                            .on("error", err => emitter.emit("error", err));
                    }
                } else {
                    console.error(data);
                    setTimeout(() => fetchAll(key, official, after), 1000);
                }
            });
        })
        .on("error", err => {
            emitter.emit("error", err);
            setTimeout(() => fetchAll(key, official, after), 1000);
        })
        .end();
    return emitter;
}

/**
 * Get the events from an OpenAgenda agenda
 * @param {string} key
 * @param {number} agendaId
 * @param {number[]} [after=[]]
 * @returns {Promise<Event[]>}
 */
function fetchAgendaEvents(key, agendaId, emitter = new EventEmitter(), after = []) {
    https.request(`https://api.openagenda.com/v2/agendas/${agendaId}/events?key=${key}&size=300&` + after.map(v => "after[]=" + v).join("&"))
        .on("response", res => {
            var data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => {
                data = JSON.parse(data);
                if (data.success) {
                    var events = data.events.map(e => parseEvent(e, agendaId));
                    var ignored = events.filter(e => e == null).length;
                    events = events.filter(e => e != null);
                    emitter.emit("progress", { events: events.length, ignored });
                    emitter.emit("events", events);
                    if (data.after != null)
                        fetchAgendaEvents(key, agendaId, emitter, data.after);
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
function parseEvent(oaEvent, agendaId) {
    if (oaEvent.nextTiming == null) // event has no future timing
        return null;
    var event = {
        id: "OA" + agendaId + oaEvent.uid,
        title: oaEvent.title.fr ?? oaEvent.title.en ?? "",
        author: "OpenAgenda",
        description: oaEvent.description.fr ?? oaEvent.description.en ?? "",
        start: oaEvent.nextTiming.begin.replace("Z", "+00:00"),
        end: oaEvent.nextTiming.end.replace("Z", "+00:00"),
        placename: oaEvent.location?.address ?? "",
        categories: oaEvent.keywords?.en ?? [],
        public: true,
        lng: oaEvent.location?.longitude ?? 0,
        lat: oaEvent.location?.latitude ?? 0,
        images: [oaEvent?.image?.base + oaEvent?.image?.filename]
    };
    return event;
}


export default { fetchAll };