/**
 * Module for fetching Datatourisme events
 * @module datatourisme
 */

import unzip from "unzipper";
import crypto from "crypto";
import fs from "fs";
import stream from "stream";
import EventEmitter from "events";
import axios from "axios";

/**
 * Get the index and events from a Datatourisme zip from url
 * @param {String} url
 * @param {EventEmitter} [emitter=new EventEmitter()]
 * @returns {EventEmitter}
 */
function loadZipFromUrl(url, emitter = new EventEmitter()) {
    axios.get(url, { responseType: "stream" })
        .then(response => {
            emitter.emit("progress", { downloading: true })
            loadZip(response.data, emitter);
            response.data
                .on("finish", () => {
                    emitter.emit("progress", { downloading: false });
                });
        });
    return emitter;
}

/**
 * Get the index and events from a Datatourisme zip from file
 * @param {String} file
 * @param {EventEmitter} [emitter=new EventEmitter()]
 * @returns {EventEmitter}
 */
function loadZipFromFile(file, emitter = new EventEmitter()) {
    return loadZip(fs.createReadStream(file), emitter);
}

/**
 * Get the index and events from a Datatourisme zip in stream
 * @param {stream.Readable} stream
 * @param {EventEmitter} [emitter=new EventEmitter()]
 * @returns {EventEmitter}
 */
function loadZip(stream, emitter = new EventEmitter()) {
    var events = [];
    var index = null;
    emitter.emit("progress", { unzipping: true });
    stream.pipe(unzip.Parse())
        .on("entry", function (entry) {
            emitter.emit("progress", { unzipped: 1 });
            if (entry.path == "index.json") {
                parseJSONFromStream(entry).then(obj => index = obj);
                emitter.emit("progress", { index: 1 })
            } else if (entry.path.endsWith(".json")) {
                parseJSONFromStream(entry).then(obj => {
                    let event = parseEvent(obj);
                    events.push(event);
                    emitter.emit("events", [event]);
                    emitter.emit("progress", { events: 1 });
                });
            } else {
                entry.autodrain();
            }
        })
        .on("finish", () => {
            emitter.emit("progress", { unzipping: false });
            emitter.emit("end", events);
        })
        .on("error", error => emitter.emit("error", error));
    return emitter;
}


/**
 * Parse a JSON from a stream
 * @param {stream.Readable} stream
 * @returns {Promise<Object>}
 */
async function parseJSONFromStream(stream) {
    return new Promise((resolve, reject) => {
        var chunks = [];
        stream.on("data", chunk => chunks.push(chunk));
        stream.on("end", () => {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
        });
        stream.on("error", reject);
    });
}

/**
 * Parse a Datatourisme event to an Event
 * @param {Object} datatourismeEvent
 * @returns {Event}
 */
function parseEvent(datatourismeEvent) {
    var id = datatourismeEvent["dc:identifier"];
    if (id.length > 32)
        id = crypto.createHash('md5').update(id).digest('hex');
    var address = datatourismeEvent.isLocatedAt[0]["schema:address"][0];
    var title = datatourismeEvent["rdfs:label"].fr[0];
    var description = (datatourismeEvent.hasDescription?.[0]?.["dc:description"] || datatourismeEvent["rdfs:comment"])?.fr?.[0] ?? "";
    var takesPlaceAt = datatourismeEvent.takesPlaceAt.filter(t => new Date(t.endDate || t.startDate) >= new Date()).sort((a, b) => new Date(a) - new Date(b))[0];
    if (!takesPlaceAt) takesPlaceAt = datatourismeEvent.takesPlaceAt.sort((a, b) => new Date(b) - new Date(a))[0];
    return {
        id: "DT" + id,
        title,
        author: datatourismeEvent.hasBeenCreatedBy["schema:legalName"],
        description,
        start: takesPlaceAt.startDate + " " + (takesPlaceAt.startTime || ""),
        end: (takesPlaceAt.endDate || takesPlaceAt.startDate) + " " + (takesPlaceAt.endTime || ""),
        placename: [address["schema:addressLocality"], address["schema:postalCode"], address["schema:streetAddress"]].join(", "),
        categories: findCategories(datatourismeEvent["@type"].concat(datatourismeEvent.hasTheme?.map(theme => theme["@id"]) ?? []), title, description),
        public: true,
        lng: datatourismeEvent.isLocatedAt[0]["schema:geo"]["schema:longitude"],
        lat: datatourismeEvent.isLocatedAt[0]["schema:geo"]["schema:latitude"],
        images: (datatourismeEvent.hasMainRepresentation || []).concat(datatourismeEvent.hasRepresentation || []).reduce((acc, rep) => {
            return acc.concat(rep?.["ebucore:hasRelatedResource"]?.reduce((acc, res) => {
                return acc.concat(res?.["ebucore:locator"] ?? []);
            }, []) ?? []);
        }, []) ?? [],
        lastUpdate: datatourismeEvent.lastUpdateDatatourisme
    };
}

/**
 * Fetch all events from Datatourisme
 * @param {String} datatourismeUrl Datatourisme stream link
 * @returns {EventEmitter}
 */
function fetchAll(datatourismeUrl) {
    return loadZipFromUrl(datatourismeUrl);
}

/**
 * Fetch all events from Datatourisme and only return the last updated
 * @param {String} datatourismeUrl
 * @returns {EventEmitter}
 */
function fetchLastUpdated(datatourismeUrl, date = Date.now()) {
    var emitter = new EventEmitter();
    loadZipFromUrl(datatourismeUrl)
        .on("events", events => emitter.emit("events", events.filter(e => new Date(e.lastUpdate) > date)))
        .on("progress", progress => emitter.emit("progress", progress))
        .on("error", error => emitter.emit("error", error))
        .on("end", events => emitter.emit("end", events.filter(e => new Date(e.lastUpdate) > date)));
}

// https://gitlab.adullact.net/adntourisme/datatourisme/ontology/-/blob/master/thesaurus/thesaurus.ttl
/**
 * @type {Map<String, Array<String>>}
 */
var CATEGORIES = {
    "party": ["party", "fête"],
    "arts": [" arts", "artist", " art ", "artsandcraft", "visualart"],
    "theater": ["théâtr", "theater", "théatr", "comédien"],
    "music": ["musique", "music", "concert"],
    //"online": ["en ligne","online"],
    "children": ["enfants", "tout public", "en famille", "children", "in family", "all age", "accessible à tous"],
    "exhibition": ["exposition", "expo"],
    "shopping": ["shopping"],
    "cinema": ["cinéma", "cinema", "film"],
    "food": ["nourriture", "alimentair", "food", "restauration", "restaurant", "gastronomie", "gastronomy", "cuisine", "food", "eat", "manger", "déguster", "dégustation", "restaur"],
    "wellbeing": ["bien-être", "wellbeing", "well-being", "well being", "relaxation", "yoga", "méditation"],
    "show": ["show", "spectacle", "scène"],
    "sport": ["sport", "athléti", "athleti", "basketball", "baseball", "football", "soccer", "rugby", "tennis", "volleyball", "handball", "golf", "gym", "hockey", "judo", "karate", "karaté", "natation", "swim", "ski"],
    "literature": ["literature", "littérature", " livre", " book", "lecture", " read", "écrire", "écrivain", " bd "],
    "drink": ["boire", "boisson", "drink", "alcool", "alcohol", "bière", "beer", " vin ", " vins ", "wine", "cocktail", "aperitif", "apéritif", "buvette", "café"],
    "gardening": ["jardine", "jardino", "jardinage", "gardenning", "plant", "flower", "fleur"],
    "cause": ["cause", "bénévolat", "bénévole", "volontariat", "volontaire", "volunteer", "charité", "charity", " don", "donation", "solidarité", "solidarity", "ngo", "non-profit"],
    "craft": ["craft", "artisan", "handmade", "hand-made", "hand made", "manufacturé"],
    "dance": [" dance", "danse", "dancing", "danceevent"],
    "festival": ["festival"],
    "garden": ["jardin ", "jardins ", "parc ", "parcs ", "parks ", "garden", "park "],
    "holiday": ["holiday", "vacance", "vacation"],
    "market": ["market", "marché", "marchand"],
    "museum": ["museum", "musée"],
    "outdoor": ["outdoor", "extérieur", "exterieur", "dehors"],
    "parade": ["parade", "défilé", "defile"],
    "religion": ["religious", "religieu", "religion", "spiritual", "catholique", "catholic", "musulman", "muslim", "juif", "jewish", "chrétien", "christian", "église", "church", "mosquée", "mosque", "synagogue", "temple"],
    "science": ["science", "scientifique", "scientist", "physique", "physic", "math", "informatique", "computer", "technologie", "technology", "astronomie", "astronomy", "biologie", "biology", "chimie", "chemistry", "économie", "economy", "géologie", "geology", "médecine", "medicine", "psychologie", "psychology", "santé", "health", "sociologie", "sociology", "zoologie", "zoology"],
    "seminar": ["seminar", "séminaire", " conférence", "conference"],
    "tour": ["tour", "visite", "visite"],
    "workshop": ["workshop", "atelier", "atelier"],
    "free": ["free entrance", "gratuit"],
    "fashion": ["fashion", "la mode", "vêtement"],
    "fair": ["fair", "foire"],
    "videogame": ["gaming", "jeu vid", "jeux vid", "game", "games", "video game", "playstation", "xbox", "nintendo"],
    "boardgame": ["boardgame", "jeu de société", "jeux de société", "jeu de plateau", "jeux de plateau", "jeu de cartes", "jeux de cartes", "jeu de rôle", "tarot", "belote"],
};

/**
 * Find corresponding categories for a given Datatourisme event
 * @param {Array<String>} dtCategories 
 * @param {String} title 
 * @param {String} description 
 * @returns {Array<String>}
 */
function findCategories(dtCategories, title, description) {
    var result = [];
    for (let cat in CATEGORIES) {
        loop: for (let c of CATEGORIES[cat]) {
            if (title.toLowerCase().includes(c) || description.toLowerCase().includes(c)) {
                result.push(cat);
                break loop;
            }
            for (let dtCat of dtCategories) {
                if (dtCat.toLowerCase().includes(c)) {
                    result.push(cat);
                    break loop;
                }
            }
        }
    }
    return result;
}

export default { fetchAll, fetchLastUpdated, loadZipFromFile, loadZipFromUrl, loadZip };