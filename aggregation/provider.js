import { EventsFetch } from "./event.js";

/**
 * @property {string} name Name of the provider
 * @property {string} shortId Short identifier of the provider
 * @property {function(): import("./event.js").EventsFetch} fetchAll Function to fetch all events from the provider
 */
export default class Provider {

    /**
     * @param {string} name
     * @param {string} shortId
     * @param {Array<string>} envVars
     */
    constructor(name, shortId, envVars = []) {
        this.name = name;
        this.shortId = shortId;
        this.envVars = envVars;
    }

    /**
     * Fetch all events from the provider
     * @abstract
     * @returns {EventsFetch}
     */
    fetchAll() {
        throw new Error("Not implemented");
    }

    /**
     * Get an environment variable as string
     * @param {string} varName
     * @returns {string}
     */
    getEnvVar(varName) {
        if (!process.env[varName])
            throw new Error(`Environment variable ${varName} is not set`);
        return process.env[varName];
    }

}
