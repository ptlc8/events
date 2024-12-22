/**
 * Module for updating the events database
 * @module database
 */

import mysql from "mysql2";
import EventEmitter from "events";

const eventsColumns = ["title", "author", "description", "start", "end", "lng", "lat", "placename", "categories", "images", "imagesCredits", "status", "contact", "registration", "public", "createdAt", "updatedAt", "source", "sourceUrl"];

/**
 * Class for updating the events database
 * @class
 */
export default class Database extends EventEmitter {

    /**
     * @param {mysql.ConnectionOptions} connectionConfig
     */
    constructor(connectionConfig) {
        super();
        /** @type {mysql.Pool} */
        this.pool = mysql.createPool({ ...connectionConfig, flags: [connectionConfig.flags, "-FOUND_ROWS"].join(",") });
        /** @type {Map<string, Array<function>>} */
        this.listeners = {};
        /** @type {Map<string, number>} */
        this.keys = {};
    }

    /**
     * Update the database with the given events
     * @param {Array<Event>} events
     * @param {string} shortId short identifier for the provider
     * @param {string} source name of the provider
     * @returns {Promise<null>}
     */
    update(events, shortId, source) {
        return new Promise(resolve => {
            for (let event of events) {
                event.id = shortId + event.id;
                event.source = source;
                if (!this.keys[event.id]) this.keys[event.id] = 0;
                else this.emit("progress", { dupplicate: 1 });
                this.keys[event.id]++;
                var values = Object.keys(event)
                    .filter(k => eventsColumns.includes(k))
                    .reduce((obj, k) => {
                        obj[k] = event[k] instanceof Array ? event[k].filter(v => v).map(v => v.replace("\\", "\\\\").replace(",", "\\,")).join(",") : event[k];
                        return obj;
                    }, {});
                this.pool.query(
                    "INSERT INTO `events` (`id`, " + Object.keys(values).map(k => "`" + k + "`").join(", ") + ")"
                    + " VALUES (?, ?)"
                    + " ON DUPLICATE KEY UPDATE ?;",
                    [event.id].concat([Object.values(values)]).concat(values)
                )
                    .on("error", error => this.emit("error", error))
                    .on("result", result => {
                        this.emit("progress", { updated: result.affectedRows == 2 ? 1 : 0, inserted: result.affectedRows == 1 ? 1 : 0 });
                    })
                    .on("end", () => resolve);
            }
        });
    }

    /**
     * Clean unknown events from the database
     * @param {Array<Event>} events
     * @param {string} prefix for example : DT, OA, ...
     * @returns {Promise<null>}
     */
    clean(events, prefix) {
        return new Promise(resolve => {
            var ids = events.map(event => event.id);
            this.pool.query("DELETE FROM `events` WHERE `id` LIKE '" + prefix + "%' AND `id` NOT IN (?)", [ids])
                .on("error", error => this.emit("error", error))
                .on("result", result => {
                    this.emit("progress", { deleted: result.affectedRows });
                })
                .on("end", resolve);
        });
    }

    /**
     * End the connection to the database
     */
    end() {
        this.pool.end();
    }
}