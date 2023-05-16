// Objet pour retourner les textes en fonction de la langue
const Texts = function () {
    var availableLangs = [];
    var texts = [];
    var lang;
    var shortLang;
    return {
        async init(langs) {
            if (!langs || !langs.length) throw new Error("No languages provided to Texts.init()");
            availableLangs = langs;
            await this.setLang(window.localStorage.getItem("lang") ?? this.getNavigatorLang(), false);
        },
        get(id) {
            return texts[shortLang]?.[id] ?? "[" + id + "]";
        },
        getLang() {
            return lang;
        },
        async setLang(newLang, save=false) {
            if (!availableLangs.includes(newLang)) {
                console.error(newLang + " is not an available language");
                newLang = availableLangs[0];
            } else if (save) {
                window.localStorage.setItem("lang", newLang);
            }
            lang = newLang;
            shortLang = newLang.match("[^\-]*")[0];
            if (!texts[shortLang]) {
                texts[shortLang] = {};
                return fetch("langs/" + shortLang + ".json").then(res => res.text()).then(function (response) {
                    texts[shortLang] = JSON.parse(response);
                }).then(() => console.info("[Texts] Lang loaded: " + shortLang));
            }
        },
        getAvailableLangs() {
            return availableLangs;
        },
        getNavigatorLang() {
            return navigator.language ?? navigator.userLanguage ?? "";
        }
    };
}();

// Retourne la date sous forme de texte
Texts.getDisplayDate = function(datetime) {
    var date = new Date(datetime);
    date.setHours(0, 0, 0, 0);
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date.getTime() == today.getTime() - 86400000) return Texts.get("yesterday");
    if (date.getTime() < today.getTime()) return Texts.get("past");
    if (date.getTime() == today.getTime()) return Texts.get("today");
    if (date.getTime() == today.getTime() + 86400000) return Texts.get("tomorrow");
    if (date.getTime() < today.getTime() + 6 * 86400000) return date.toLocaleString(Texts.getLang(), { weekday: "long" }) + Texts.get("next");
    return Texts.get("thedate") + date.getDate() + " " + date.toLocaleString(Texts.getLang(), { month: "long" }) + (date.getYear() == today.getYear() ? "" : " " + date.getYear())
}

// Retourne l'heure sous forme de texte
Texts.getDisplayTime = function(datetime) {
    var time = new Date(datetime);
    return time.getHours() + ":" + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes();
}

// Retourne la date et l'heure sous forme de texte
Texts.getDisplayDateTime = function(datetime) {
    return Texts.getDisplayDate(datetime) + " " + Texts.get("at") + " " + Texts.getDisplayTime(datetime);
}
    
export default Texts;