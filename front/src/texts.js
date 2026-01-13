import { baseUrl } from "./config";


var availableLangs = [];
var texts = [];
var lang;
var shortLang;

export async function init(langs) {
    if (!langs || !langs.length) throw new Error("No languages provided to init()");
    availableLangs = langs;
    await setLang(getSavedLang(), false);
}

export function get(id, ...args) {
    let text = texts[shortLang]?.[id] ?? "[" + id + "]";
    for (let i = 0; i < args.length; i++) {
        if (text.map)
            text = text.map(s => s.replace("{" + i + "}", args[i]));
        else
            text = text.replace("{" + i + "}", args[i]);
    }
    return text;
}

function getLang() {
    return lang;
}

function getShortLang() {
    return shortLang;
}

async function setLang(newLang, save = false) {
    if (save) {
        window.localStorage.setItem("lang", newLang);
    }
    if (!newLang) {
        newLang = getNavigatorLang();
    }
    if (!availableLangs.includes(newLang)) {
        console.error("[Texts] " + newLang + " is not an available language");
        newLang = availableLangs[0];
    }
    lang = newLang;
    shortLang = newLang.match("[^\-]*")[0];
    if (!texts[shortLang]) {
        texts[shortLang] = {};
        console.debug("[Texts] Fetching lang: " + shortLang);
        return fetch(baseUrl + "langs/" + shortLang + ".json")
            .then(res => res.text())
            .then(res => {
                texts[shortLang] = JSON.parse(res);
                texts[shortLang][undefined] = "";
                console.info("[Texts] Lang loaded: " + shortLang)
            })
            .catch(err => {
                console.error("[Texts] " + err);
            });
    }
}

export function getAvailableLangs() {
    return availableLangs;
}

export function getSavedLang() {
    return window.localStorage.getItem("lang");
}

function getNavigatorLang() {
    return navigator.language ?? navigator.userLanguage ?? "";
}

// Retourne la date sous forme de texte et dans le fuseau local
function getDisplayDate(datetime) {
    if (!datetime) return "";
    var date = new Date(datetime + "Z");
    date.setHours(0, 0, 0, 0);
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date.getTime() == today.getTime() - 86400000) return get("yesterday");
    if (date.getTime() < today.getTime()) return get("past");
    if (date.getTime() == today.getTime()) return get("today");
    if (date.getTime() == today.getTime() + 86400000) return get("tomorrow");
    if (date.getTime() < today.getTime() + 6 * 86400000) return date.toLocaleString(getLang(), { weekday: "long" }) + get("next");
    return get("the_date") + date.getDate() + " " + date.toLocaleString(getLang(), { month: "long" }) + (date.getYear() == today.getYear() ? "" : " " + date.getYear())
}

// Retourne l'heure sous forme de texte et dans le fuseau local
function getDisplayTime(datetime) {
    if (!datetime) return "";
    var time = new Date(datetime + "Z");
    return time.getHours() + ":" + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes();
}

// Retourne la date et l'heure sous forme de texte
function getDisplayDateTime(datetime) {
    if (!datetime) return "";
    return getDisplayDate(datetime) + " " + get("at") + " " + getDisplayTime(datetime);
}

function getDisplayMonth(datetime) {
    if (!datetime) return "";
    var date = new Date(datetime + "Z");
    return date.toLocaleString(getLang(), { month: "short" });
}

function getDisplayDay(datetime) {
    if (!datetime) return "";
    var date = new Date(datetime + "Z");
    return (date.getDate() < 10 ? "0" : "") + date.getDate();
}

export const values = new Proxy(get, {
    get: function(_, name) {
        return get(name);
    }
});

export default {
    init,
    get,
    getLang,
    getShortLang,
    setLang,
    getAvailableLangs,
    getSavedLang,
    getNavigatorLang,
    getDisplayDate,
    getDisplayTime,
    getDisplayMonth,
    getDisplayDay,
    getDisplayDateTime,
    values
};