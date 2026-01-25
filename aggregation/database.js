import { EventEmitter } from "events";
import mysql from "mysql2";
import { Writable } from "stream";
import { Event } from "./event.js";

const eventsColumns = ["title", "author", "description", "start", "end", "lng", "lat", "placename", "categories", "images", "imagesCredits", "status", "contact", "registration", "public", "createdAt", "updatedAt", "source", "sourceUrl"];

/**
 * Class for updating the events database
 */
export default class Database {

    /**
     * @param {mysql.ConnectionOptions} connectionConfig
     */
    constructor(connectionConfig) {
        /** @type {mysql.Pool} */
        this.pool = mysql.createPool({ ...connectionConfig, flags: [...(connectionConfig.flags ?? []), "-FOUND_ROWS"] });
        /** @type {Record<string, number>} */
        this.keys = {};
    }

    /**
     * @param {string} shortId 
     * @param {string} source 
     * @returns {Writable}
     */
    getWritableStream(shortId, source) {
        let db = this;
        /** @type {Array<string>} */
        let ids = [];
        return new Writable({
            objectMode: true,
            /**
             * @param {Array<Event|null>} events
             * @param {string} encoding
             * @param {function(Error=): void} callback
             */
            write(events, encoding, callback) {
                ids.push(...events.filter(event => event != null).map(event => event.id));
                db.update(this, events, shortId, source)
                    .then(() => callback())
                    .catch(callback);
            },
            final(callback) {
                db.clean(this, ids, shortId)
                    .then(() => callback())
                    .catch(callback);
            },

        });
    }

    /**
     * Update the database with the given events
     * @param {EventEmitter} emitter
     * @param {Array<Event|null>} events
     * @param {string} shortId short identifier for the provider
     * @param {string} source name of the provider
     * @returns {Promise<void>}
     */
    update(emitter, events, shortId, source) {
        return new Promise(resolve => {
            for (let event of events) {
                if (event == null)
                    continue;
                event.id = shortId + event.id;
                event.source = source;
                if (!this.keys[event.id]) this.keys[event.id] = 0;
                else emitter.emit("progress", { duplicate: 1 });
                this.keys[event.id]++;
                /** @type {Record<string, string>} */
                let values = {};
                values = Object.keys(event)
                    .filter(k => eventsColumns.includes(k))
                    .reduce((obj, k) => {
                        obj[k] = event[k] instanceof Array ? event[k].filter(v => v).map(v => v.replaceAll("\\", "\\\\").replaceAll(",", "\\,")).join(",") : event[k];
                        return obj;
                    }, values);
                this.pool.query(
                    "INSERT INTO `events` (`id`, " + Object.keys(values).map(k => "`" + k + "`").join(", ") + ")"
                    + " VALUES (?, ?)"
                    + " ON DUPLICATE KEY UPDATE ?;",
                    [event.id].concat([Object.values(values)]).concat(values)
                )
                    .on("error", error => emitter.emit("warn", error))
                    .on("result", result => {
                        emitter.emit("progress", { updated: result.affectedRows == 2 ? 1 : 0, inserted: result.affectedRows == 1 ? 1 : 0, unchanged: result.affectedRows == 0 ? 1 : 0 });
                    })
                    .on("end", () => resolve());
            }
        });
    }

    /**
     * Clean unknown events from the database
     * @param {EventEmitter} emitter
     * @param {Array<string>} ids event IDs to keep
     * @param {string} prefix for example : DT, OA, ...
     * @returns {Promise<void>}
     */
    clean(emitter, ids, prefix) {
        return new Promise(resolve => {
            this.pool.query("DELETE FROM `events` WHERE `id` LIKE '" + prefix + "%' AND `id` NOT IN (?)", [ids.concat([""])])
                .on("error", error => emitter.emit("warn", error))
                .on("result", result => {
                    emitter.emit("progress", { deleted: result.affectedRows });
                })
                .on("end", () => resolve());
        });
    }

    /**
     * End the connection to the database
     */
    end() {
        this.pool.end();
    }
}