/**
 * An event state
 * @readonly
 * @enum {number}
 */
export const Status = {
    unknown: 0, // Inconnu
    programmed: 1, // Programmé : L'événement est programmé aux horaires indiqués
    rescheduled: 2, // Reprogrammé : Les horaires ont changé
    movedOnline: 3, // Déplacé en ligne : L'événement qui se déroulait à un lieu physique n'est désormais accessible qu'en ligne
    postponed: 4, // Reporté : L'événement ne se déroule plus aux horaires indiqués, les nouveaux horaires ne sont pas encore disponibles
    full: 5, // Complet : L'événement n'est plus accessible aux nouveaux participants
    cancelled: 6 // Annulé
};

/**
 * An event
 * @typedef {Record<string, ?>} Event
 * @property {string} id Unique identifier
 * @property {string} title Title
 * @property {string} author Author identifier
 * @property {string} description Description
 * @property {string} start Start datetime
 * @property {string} end End datetime
 * @property {number} lng Longitude
 * @property {number} lat Latitude
 * @property {string} placename Place name
 * @property {Array<string>} categories Categories
 * @property {Array<string>} images Images
 * @property {Array<string>} imagesCredits Images credits
 * @property {Status} status État
 * @property {Array<string>} contact Moyens de contact (téléphone, email ou lien hypertexte)
 * @property {Array<string>} registration Moyens d'inscription (téléphone, email ou lien hypertexte)
 * @property {boolean} public Public or not
 * @property {string} createdAt Creation datetime
 * @property {string?} updatedAt Last update datetime
 * @property {string} source Source
 * @property {string} sourceUrl Source URL
 */
export const Event = Object;


import EventEmitter from "events";

/**
 * @typedef {{
 *   events: (Event|null)[],
 *   progress: {[key: string]: number|boolean},
 *   end: (Event|null)[],
 *   error: Error
 * }} EventsFetchEventMap
 */

/**
 * An event fetcher,
 * emitting events during the fetch with "events" events, emitting all events with "end" event, emitting errors with "error" events, and emitting progress with "progress" events
 */
export class EventsFetch extends EventEmitter {
    /**
     * @template {keyof EventsFetchEventMap | string} K
     * @param {K} event
     * @param {(payload: K extends keyof EventsFetchEventMap ? EventsFetchEventMap[K] : ?) => void} listener
     * @returns {this}
     */
    on(event, listener) {
        return super.on(event, listener);
    }

    /**
     * @template {keyof EventsFetchEventMap | string} K
     * @param {K} event
     * @param {K extends keyof EventsFetchEventMap ? EventsFetchEventMap[K] : ?} payload
     * @returns {boolean}
     */
    emit(event, payload) {
        return super.emit(event, payload);
    }

}

export default { Status, Event, EventsFetch };
