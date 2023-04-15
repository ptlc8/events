const http = require("http");
const unzip = require("unzipper");
const mysql = require("mysql2");
const credentials = require("./credentials.json");

//loadDatatourismeZip(require("fs").createReadStream("flux-15996-202303180145.zip"));
loadDatatourismeZipFromUrl(credentials.DATATOURISME_GET_URL);

function loadDatatourismeZipFromUrl(url) {
    console.log("Downloading...");
    http.request(url)
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
    return {
        id: "DT" + datatourismeEvent["dc:identifier"].substring(0,22),
        title: datatourismeEvent["rdfs:label"].fr[0],
        author: datatourismeEvent.hasBeenCreatedBy["schema:legalName"],
        description: (datatourismeEvent.hasDescription?.[0]?.["dc:description"] || datatourismeEvent["rdfs:comment"])?.fr?.[0] ?? "",
        datetime: datatourismeEvent.takesPlaceAt.map(t => t.startDate + " " + (t.startTime || "")),
        endDatetime: datatourismeEvent.takesPlaceAt.map(t => (t.endDate || t.startDate) + " " + (t.endTime || "")),
        placename: "TODO",
        categories: datatourismeEvent["@type"].concat(datatourismeEvent.hasTheme?.map(theme => theme["@id"]) ?? []),
        public: 1,
        coords: [
            datatourismeEvent.isLocatedAt[0]["schema:geo"]["schema:longitude"],
            datatourismeEvent.isLocatedAt[0]["schema:geo"]["schema:latitude"]
        ],
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
    var count = 0, insertedCount = 0;
    var ids = new Set();
    for (let i of index) {
        if (new Date(i.lastUpdateDatatourisme) > new Date("2003-03-17")) {
            count++;
            let event = events.get("objects/" + i.file);
            ids.add(event.id);
            connection.query(
                "INSERT INTO `events` (`id`, `title`, `author`, `description`, `datetime`, `endDatetime`, `coor1`, `coor2`, `placename`, `categories`, `images`, `public`)"
                + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
                + " ON DUPLICATE KEY UPDATE title = ?, author = ?, description = ?, datetime = ?, endDatetime = ?, coor1 = ?, coor2 = ?, placename = ?, categories = ?, images = ?, public = ?;",
                [event.id, event.title, -807/*event.author*/, event.description, event.datetime[0], event.endDatetime[0], event.coords[0], event.coords[1], event.placename, event.categories.join(","), event.images.join(","), event.public,
                event.title, -807/*event.author*/, event.description, event.datetime[0], event.endDatetime[0], event.coords[0], event.coords[1], event.placename, event.categories.join(","), event.images.join(","), event.public],
            )
                .on("error", console.error)
                .on("end", () => {
                    insertedCount++;
                    process.stdout.write("Updating database... (" + insertedCount + " events)\r");
                    if (insertedCount == count) {
                        console.log("Updating database done (" + count + " events)");
                        console.log(count - ids.size + " dupplicate event ids");
                        console.log("Deleting old events...");
                        connection.query("DELETE FROM `events` WHERE `id` LIKE 'DT%' AND `id` NOT IN (?)", [Array.from(ids)]);
                        console.log("Deleting old events done");
                        connection.end();
                    }
                });
        }
    }
    if (count == 0) console.log("Updating database done (0 events)");
}