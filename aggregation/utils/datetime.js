import { DateTime } from "luxon";
import z from "zod";

/**
 * Format a datetime to SQL format
 * @param {string|undefined?} datetime ISO datetime string 
 * @param {import("luxon").DateTimeOptions} opts
 * @returns {string?} SQL formatted datetime
 */
export function formatDateTime(datetime, opts = { zone: "UTC" }) {
    return (!datetime
        ? DateTime.fromSeconds(0)
        : DateTime.fromISO(datetime, opts)
    ).toUTC().toSQL({ includeOffset: false });
}

export const IsoDateTimeSchema = z.string().refine(s => {
    return DateTime.fromISO(s).isValid;
}, {
    message: "Invalid ISO datetime string"
});