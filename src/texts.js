// Objet pour retourner les textes en fonction de la langue
const Texts = function () {
    var availableLangs = ["fr", "en"];
    var texts = [];
    var lang;
    return {
        async init() {
            await this.setLang(window.localStorage.getItem("lang") ?? this.getNavigatorLang(), false);
        },
        get(id) {
            return texts[lang]?.[id] ?? "[" + id + "]";
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
            if (!texts[lang]) {
                texts[lang] = {};
                return fetch("langs/" + lang + ".json").then(res => res.text()).then(function (response) {
                    texts[lang] = JSON.parse(response);
                }).then(() => console.info("[Texts] Lang loaded: " + lang));
            }
        },
        getAvailableLangs() {
            return availableLangs;
        },
        getNavigatorLang() {
            return (navigator.language ?? navigator.userLanguage ?? "").match("[^\-]*")[0]
        }
    };
}();

// Retourne la date sous forme de texte
Texts.getDisplayDate = function(datetime) {
    var datetime = new Date(datetime);
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

Texts.getDisplayDateTime = function(datetime) {
    // TODO
    var time = new Date(datetime);
    return Texts.getDisplayDate(datetime) + " à " + time.getHours() + ":" + (time.getMinutes() < 10 ? "0" : "") + time.getMinutes();
}
    
export default Texts;