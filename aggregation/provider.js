import { Readable } from "stream";

export default class Provider {

    /**
     * @param {string} name name of the provider
     * @param {string} shortId short identifier
     * @param {Array<string>} envVars environment variables required by the provider
     */
    constructor(name, shortId, envVars = []) {
        this.name = name;
        this.shortId = shortId;
        this.envVars = envVars;
    }

    /**
     * Fetch all events from the provider
     * @abstract
     * @returns {Readable}
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
