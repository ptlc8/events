/**
 * Module for updating the events database
 * @module database
 */

import mysql from "mysql2";
import EventEmitter from "events";

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
        this.pool = mysql.createPool(connectionConfig);
        /** @type {Map<string, Array<function>>} */
        this.listeners = {};
        /** @type {Map<string, number>} */
        this.keys = {};
    }

    /**
     * Update the database with the given events
     * @param {Array<Event>} events 
     * @returns {Promise<null>}
     */
    update(events) {
        return new Promise(resolve => {
            for (let event of events) {
                if (!this.keys[event.id]) this.keys[event.id] = 0;
                else this.emit("progress", { dupplicate: 1 });
                this.keys[event.id]++;
                this.pool.query(
                    "INSERT INTO `events` (`id`, `title`, `author`, `description`, `start`, `end`, `lng`, `lat`, `placename`, `categories`, `images`, `public`)"
                    + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                    + " ON DUPLICATE KEY UPDATE title = ?, author = ?, description = ?, start = ?, end = ?, lng = ?, lat = ?, placename = ?, categories = ?, images = ?, public = ?;",
                    [event.id, event.title, -807/*event.author*/, event.description, event.start, event.end, event.lng, event.lat, event.placename, event.categories.join(","), event.images.join(","), event.public,
                    event.title, -807/*event.author*/, event.description, event.start, event.end, event.lng, event.lat, event.placename, event.categories.join(","), event.images.join(","), event.public],
                )
                    .on("error", error => this.emit("error", error))
                    .on("result", result => {
                        this.emit("progress", { updated: result.affectedRows });
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