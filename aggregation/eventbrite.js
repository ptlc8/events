/**
 * Module for fetching Eventbrite events
 * @module eventbrite
 * @see https://www.eventbrite.com/platform/docs
 */

import axios from 'axios';
import { Event, Status, EventsFetch } from "./event.js";
import { findCategories } from "./categories.js";
import { isSafe } from "./filter.js";

/**
 * Fetch all events from Eventbrite
 * @param {string} token 
 * @returns EventsFetch
 */
function fetchAll(token) {
    var emitter = new EventsFetch();
    (async () => {
        var events = [];
        var page = 1;
        do {
            var results = await fetch(token, page++);
            emitter.emit("events", results);
            emitter.emit("progress", { events: results.length });
            events.push(...results);
        } while (results.length > 0);
        emitter.emit("end", events);
    })()
        .catch(err => emitter.emit("error", err));
    return emitter;
}

/**
 * Fetch events from an Eventbrite page
 * @param {string} token
 * @param {number} page
 * @returns {Promise<Array<Event>>}
 */
function fetch(token, page = 1) {
    return axios.post("https://www.eventbriteapi.com/v3/destination/search/?token=" + token, {
        event_search: { page, page_size: 50, places: [/*"85633147",*/ "85633001"] }, // Sofia, Bulgaria
        "expand.destination_event": ["primary_venue", "image", "primary_organizer"]
    })
        .then(res => res.data.events.results)
        /*.then(events => Promise.all(events.map(async event => {
            event.description = await fetchDescription(token, event.id);
            return event;
        })))*/ // TODO: commented because hitting rate limit :!
        .then(events => events.map(parseEvent).filter(e => e != null));
}

/**
 * Fetch an Eventbrite event description
 * @param {string} token
 * @param {string} id
 * @warning Too heavy on the API rate limit
 * @returns {Promise<string>}
 */
function fetchDescription(token, id) {
    return axios.get("https://www.eventbriteapi.com/v3/events/" + id + "/description?token=" + token)
        .then(res => res.data.description);
}

/**
 * Parse an Eventbrite event
 * @param {Object} event
 * @returns {Event?}
 */
function parseEvent(event) {
    if (event.is_online_event)
        return null;
    if (!event.primary_venue) // location is to be announced
        return null;
    if (!isSafe(event.name, event.summary, event.description))
        return null;
    return {
        id: "EB" + event.id,
        title: event.name ?? "",
        author: event.primary_organizer.name ?? "",
        description: event.description ?? event.summary ?? "",
        start: event.start_date + " " + event.start_time,
        end: event.end_date + " " + event.end_time,
        lng: event.primary_venue.address.longitude,
        lat: event.primary_venue.address.latitude,
        placename: event.primary_venue.name,
        categories: findCategories(event.name, event.summary, event.description),
        images: event.image ? [event.image.url] : [],
        imagesCredits: [],
        status: event.is_cancelled ? Status.programmed : Status.cancelled,
        contact: [
            event.primary_organizer.website_url ?? [],
            event.primary_organizer.facebook ? "https://facebook.com/" + event.primary_organizer.facebook : [],
            event.primary_organizer.twitter ? "https://twitter.com/" + event.primary_organizer.twitter : []
        ].flat(),
        registration: [event.tickets_url],
        public: true,
        createdAt: event.published.replace("Z", "+00:00"),
        updatedAt: event.changed ? event.changed.replace("Z", "+00:00") : event.published.replace("Z", "+00:00"),
        source: "eventbrite",
        sourceUrl: event.url
    }
}

export default { fetchAll };