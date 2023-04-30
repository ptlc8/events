const https = require("https");
const unzip = require("unzipper");
const mysql = require("mysql2");
const crypto = require("crypto");
const credentials = require("./credentials.json");

loadDatatourismeZip(require("fs").createReadStream("flux-15996-202304191806.zip"));
//loadDatatourismeZipFromUrl(credentials.DATATOURISME_GET_URL);

function loadDatatourismeZipFromUrl(url) {
    console.log("Downloading...");
    https.request(url)
        .on("response", function (response) {
            loadDatatourismeZip(response);
        })
        .on("finish", () => console.log("Downloading done"))
        .end();
}

function loadDatatourismeZip(stream) {
    var events = new Map();
    var index = null;
    var count = 0;
    process.stdout.write("Unzipping and parsing events...\r");
    stream.pipe(unzip.Parse())
        .on("entry", function (entry) {
            count++;
            process.stdout.write("Unzipping and parsing events... (" + count + " files)\r");
            if (entry.path == "index.json") {
                parseJSONFromStream(entry).then(obj => index = obj);
            } else if (entry.path.endsWith(".json")) {
                parseJSONFromStream(entry).then(obj => events.set(entry.path, parseEvent(obj)));
            } else {
                entry.autodrain();
            }
        })
        .on("finish", () => {
            console.log("Unzipping and parsing events done (" + events.size + " events)");
            if (index) console.log("index.json found");
            updateDatabase(index, events);
        })
        .on("error", console.error);
}

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

function parseEvent(datatourismeEvent) {
    var id = datatourismeEvent["dc:identifier"];
    if (id.length > 32)
        id = crypto.createHash('md5').update(id).digest('hex');
    var address = datatourismeEvent.isLocatedAt[0]["schema:address"][0];
    var title = datatourismeEvent["rdfs:label"].fr[0];
    var description = (datatourismeEvent.hasDescription?.[0]?.["dc:description"] || datatourismeEvent["rdfs:comment"])?.fr?.[0] ?? "";
    var takesPlaceAt = datatourismeEvent.takesPlaceAt.filter(t => new Date(t.endDate||t.startDate) >= new Date()).sort((a,b)=>new Date(a)-new Date(b))[0];
    if (!takesPlaceAt) takesPlaceAt = datatourismeEvent.takesPlaceAt.sort((a,b)=>new Date(b)-new Date(a))[0];
    return {
        id: "DT" + id,
        title,
        author: datatourismeEvent.hasBeenCreatedBy["schema:legalName"],
        description,
        start: takesPlaceAt.startDate + " " + (takesPlaceAt.startTime || ""),
        end: (takesPlaceAt.endDate || takesPlaceAt.startDate) + " " + (takesPlaceAt.endTime || ""),
        placename: [address["schema:addressLocality"], address["schema:postalCode"], address["schema:streetAddress"]].join(", "),
        categories: findCategories(datatourismeEvent["@type"].concat(datatourismeEvent.hasTheme?.map(theme => theme["@id"]) ?? []), title, description),
        public: 1,
        lng: datatourismeEvent.isLocatedAt[0]["schema:geo"]["schema:longitude"],
        lat: datatourismeEvent.isLocatedAt[0]["schema:geo"]["schema:latitude"],
        images: (datatourismeEvent.hasMainRepresentation || []).concat(datatourismeEvent.hasRepresentation || []).reduce((acc, rep) => {
            return acc.concat(rep?.["ebucore:hasRelatedResource"]?.reduce((acc, res) => {
                return acc.concat(res?.["ebucore:locator"] ?? []);
            }, []) ?? []);
        }, []) ?? []
    };
}

function updateDatabase(index, events) {
    console.log("Index contains " + index.length + " events")
    console.log("Connecting to database...");
    var connection = mysql.createConnection({
        host: credentials.EVENTS_DB_HOSTNAME,
        user: credentials.EVENTS_DB_USER,
        password: credentials.EVENTS_DB_PASSWORD,
        database: credentials.EVENTS_DB_NAME
    });
    connection.connect();
    process.stdout.write("Updating database...\r");
    var count = 0, insertedCount = 0, tryInsertCount = 0;
    var ids = {};
    for (let i of index) {
        if (new Date(i.lastUpdateDatatourisme) > new Date("2003-03-17")) {
            count++;
            let event = events.get("objects/" + i.file);
            ids[event.id] = ids[event.id] ? ids[event.id] + 1 : 0;
            connection.query(
                "INSERT INTO `events` (`id`, `title`, `author`, `description`, `start`, `end`, `lng`, `lat`, `placename`, `categories`, `images`, `public`)"
                + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                + " ON DUPLICATE KEY UPDATE title = ?, author = ?, description = ?, start = ?, end = ?, lng = ?, lat = ?, placename = ?, categories = ?, images = ?, public = ?;",
                [event.id, event.title, -807/*event.author*/, event.description, event.start, event.end, event.lng, event.lat, event.placename, event.categories.join(","), event.images.join(","), event.public,
                event.title, -807/*event.author*/, event.description, event.start, event.end, event.lng, event.lat, event.placename, event.categories.join(","), event.images.join(","), event.public],
            )
                .on("error", console.error)
                .on("result", result => {
                    insertedCount += result.affectedRows;
                })
                .on("end", () => {
                    tryInsertCount++;
                    process.stdout.write("Updating database... (" + insertedCount + " events)\r");
                    if (tryInsertCount == count) {
                        console.log("Updating database done (" + insertedCount + " / " + count + " events)");
                        console.log(count - Object.keys(ids).size + " dupplicate event ids", Object.keys(ids).filter(id => ids[id] > 1));
                        console.log("Deleting old events...");
                        connection.query("DELETE FROM `events` WHERE `id` LIKE 'DT%' AND `id` NOT IN (?)", [Object.keys(ids)])
                            .on("error", console.error)
                            .on("result", result => {
                                console.log("Deleting old events done (" + result.affectedRows + " events)");
                                connection.end();
                            });
                    }
                });
        }
    }
    if (count == 0) console.log("Updating database done (0 events)");
}

// https://gitlab.adullact.net/adntourisme/datatourisme/ontology/-/blob/master/thesaurus/thesaurus.ttl
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