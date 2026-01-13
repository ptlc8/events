import { backendUrl } from "./config";

const categories = [
    [ "party", "🎉"],
    [ "arts", "🎨"],
    [ "theater", "🎭"],
    [ "music", "🎶"],
    [ "online", "💻"],
    [ "children", "👧"],
    [ "shopping", "🛍️"],
    [ "cinema", "🎬"],
    [ "food", "🍽"],
    [ "wellbeing", "😌"],
    [ "show", "🎟"],
    [ "sport", "🎾"],
    [ "literature", "📚"],
    [ "drink", "🍹"],
    [ "gardening", "🌱"],
    [ "cause", "🎗️"],
    [ "craft", "📐"],
    [ "exhibition", "🖼️"],
    [ "dance", "💃"],
    [ "festival", "🎪"],
    [ "market", "🛒"],
    [ "museum", "🏛️"],
    [ "outdoor", "🏞"],
    [ "tour", "🚶‍♀️"],
    [ "workshop", "🛠️"],
    [ "garden", "🌳"],
    [ "holiday", "🏖️"],
    [ "free", "🆓"],
    [ "parade", "🎈"],
    [ "fair", "🎇"],
    [ "religion", "🙏"],
    [ "science", "🔬"],
    [ "fashion", "👗"],
    [ "seminar", "💼"],
    [ "videogame", "🎮"],
    [ "boardgame", "🎲"]
].map(c => ({
    id: c[0],
    emoji: c[1],
    image: backendUrl + "api/images/get.php?query=" + encodeURIComponent(c)
}));

const Api = {
    getEvents: function (parameters = {}) {
        return sendApiRequest("events/get.php", parameters, "Getting events");
    },
    getEvent: async function (id) {
        let events = await sendApiRequest("events/get.php", { id }, "Getting event " + id);
        if (!events.length)
            throw new Error("Event not found: " + id);
        return events[0];
    },
    createEvent: function (event) {
        return sendApiRequest("events/create.php", event, "Creating event " + event.name);
    },
    getCategories: function () {
        return Promise.resolve(categories);
    },
    getLoginWithUrl() {
        return sendApiRequest("users/getloginwithurl.php", {}, "Getting 'login with' url");
    },
    loginWith: function (token) {
        return sendApiRequest("users/login.php", { token }, "Logging in a token");
    },
    login: function (username, password) {
        throw new Error("Not implemented");
    },
    getSelfUser: function () {
        return sendApiRequest("users/get.php", { this: true }, "Getting self user");
    },
    logout: function () {
        return sendApiRequest("users/logout.php", {}, "Logging out");
    },
    getUser: function (username) {
        return sendApiRequest("users/get.php", { username }, "Getting user " + username);
    },
    getLocation: function () {
        return sendApiRequest("tools/location.php", {}, "Getting location");
    },
    addFavorite: function (id) {
        return sendApiRequest("events/addfavorite.php", { id }, "Adding favorite " + id);
    },
    removeFavorite: function (id) {
        return sendApiRequest("events/removefavorite.php", { id }, "Removing favorite " + id);
    },
};

async function sendApiRequest(endpoint, parameters, message) {
    console.info("[API] " + message);
    var urlParameters = Object.entries(parameters)
        .filter(([_, v]) => v !== null && v !== undefined)
        .map(([k, v]) =>
            v instanceof Array ? v.map(i => k + "[]=" + encodeURIComponent(i)).join("&") : k + "=" + encodeURIComponent(v)
        ).join("&");
    console.debug("[API] Fetching " + backendUrl + "api/" + endpoint + "?" + urlParameters);
    return fetch(backendUrl + "api/" + endpoint + "?" + urlParameters)
        .then(res => res.json())
        .then(function (response) {
            if (!response.success) {
                console.error("[API] " + response.error);
                throw new Error(response.error);
            } else {
                return response.data;
            }
        });
}

export default Api;