import axios from "axios";
import z from "zod";
import { findCategories } from "../utils/categories.js";
import { Event, EventsFetch, Status } from "../event.js";
import { isSafe } from "../utils/filter.js";
import Provider from "../provider.js";
import { formatDateTime, IsoDateTimeSchema } from "../utils/datetime.js";

/**
 * @typedef {z.infer<typeof OpenAgendaAgendaSchema>} OpenAgendaAgenda
 * @typedef {z.infer<typeof OpenAgendaEventSchema>} OpenAgendaEvent
 */
const OpenAgendaAgendaSchema = z.object({
    uid: z.number(),
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    official: z.boolean()
});
const LangSchema = z.enum(["fr", "en", "oc", "it", "es", "de", "nl", "zh", "br", "hu", "pl"]);
const OpenAgendaEventSchema = z.object({
    uid: z.number(),
    slug: z.string(),
    title: z.record(LangSchema, z.string().optional()),
    description: z.record(LangSchema, z.string().optional()),
    longDescription: z.record(LangSchema, z.string().optional()).optional(),
    nextTiming: z.object({
        begin: IsoDateTimeSchema,
        end: IsoDateTimeSchema
    }).nullable(),
    location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string()
    }).optional(),
    keywords: z.record(LangSchema, z.array(z.string()).optional()).optional(),
    image: z.object({
        base: z.string(),
        filename: z.string()
    }).nullable(),
    imageCredits: z.string().nullable().optional(),
    status: z.union(Object.values(Status).map(k => z.literal(k))),
    registration: z.array(z.object({
        type: z.string(),
        value: z.string().nullable()
    })).optional(),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema
});

/**
 * Parse an OpenAgenda event to an Event
 * @param {OpenAgendaEvent} oaEvent OpenAgenda event
 * @param {OpenAgendaAgenda} agenda OpenAgenda agenda
 * @returns {Event?}
 */
function parseEvent(oaEvent, agenda) {
    if (oaEvent.nextTiming == null) // event has no future timing
        return null;
    if (!agenda.official && !isSafe(oaEvent.title.fr, oaEvent.title.en, oaEvent.description.fr, oaEvent.description.en))
        return null;
    var url = `https://openagenda.com/agendas/${agenda.slug}/events/${oaEvent.slug}`;
    var event = {
        id: agenda.uid + "-" + oaEvent.uid,
        title: oaEvent.title.fr ?? oaEvent.title.en ?? "",
        author: agenda.title,
        description: oaEvent.longDescription?.fr ?? oaEvent.longDescription?.en ?? oaEvent.description.fr ?? oaEvent.description.en ?? "",
        start: formatDateTime(oaEvent.nextTiming.begin),
        end: formatDateTime(oaEvent.nextTiming.end),
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
        createdAt: formatDateTime(oaEvent.createdAt),
        updatedAt: formatDateTime(oaEvent.updatedAt),
        sourceUrl: url
    };
    return event;
}

/**
 * OpenAgenda events provider
 * @see https://developers.openagenda.com
 */
export default class OpenAgendaProvider extends Provider {
    
    constructor() {
        super("openagenda", "OA", ["OPENAGENDA_KEY"]);
    }

    /**
     * Get all events from OpenAgenda
     * @param {string} key
     * @param {boolean} official
     * @returns {EventsFetch}
     */
    fetchAll(key = super.getEnvVar("OPENAGENDA_KEY"), official = false) {
        var emitter = new EventsFetch();
        /** @type {Array<Event|null>} */
        var events = [];
        var agendasCount = Infinity;
        var agendasFetchedCount = 0;
        this.fetchAgendas(key, official)
            .on("agendas", agendas => {
                for (let agenda of agendas) {
                    this.fetchAgendaEvents(key, agenda)
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
     * @param {boolean} official
     * @returns {EventsFetch}
     */
    fetchAgendas(key = super.getEnvVar("OPENAGENDA_KEY"), official = false) {
        var emitter = new EventsFetch();
        (async function() {
            /** @type {string[]} */
            var after = [];
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
                let fetchedAgendas = z.array(OpenAgendaAgendaSchema).parse(data.agendas);
                fetchedAgendas = fetchedAgendas.filter(a => a.official || isSafe(a.title, a.description));
                emitter.emit("progress", { agendas: fetchedAgendas.length });
                emitter.emit("agendas", fetchedAgendas);
                agendas.push(...fetchedAgendas);
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
     * @param {OpenAgendaAgenda} agenda OpenAgenda agenda
     * @returns {EventsFetch}
     */
    fetchAgendaEvents(key = super.getEnvVar("OPENAGENDA_KEY"), agenda) {
        var emitter = new EventsFetch();
        (async function() {
            /** @type {string[]} */
            var after = [];
            var allEvents = [];
            while (after != null) {
                var url = `https://api.openagenda.com/v2/agendas/${agenda.uid}/events?key=${key}&size=300&detailed=1&` + after.map(v => "after[]=" + v).join("&");
                var response = await axios.get(url);
                var data = response.data;
                if (!data.success) {
                    emitter.emit("error", data);
                    break;
                }
                let fetchedEvents = z.array(OpenAgendaEventSchema).parse(data.events);
                let events = fetchedEvents.map(e => parseEvent(e, agenda));
                var ignored = events.filter(e => e == null).length;
                events = events.filter(e => e != null);
                emitter.emit("progress", { events: events.length, ignored });
                emitter.emit("events", events);
                allEvents.push(...events);
                after = data.after;
            }
            emitter.emit("end", allEvents);
        })().catch(err => emitter.emit("error", err));
        return emitter;
    }

}
