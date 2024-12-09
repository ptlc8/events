import { backendUrl } from "./config";

const categories = ["party", "arts", "theater", "music", "online", "children", "shopping", "cinema", "food", "wellbeing", "show", "sport", "literature", "drink", "gardening", "cause", "craft", "exhibition", "dance", "festival", "videogame", "market", "outdoor", "museum", "tour", "workshop", "garden", "holiday", "free", "parade", "fair", "religion", "science", "seminar", "boardgame"];

const EventsApi = {
    getEvents: function (parameters = {}) {
        return sendApiRequest("events/get.php", parameters, "Getting events");
    },
    getEvent: function (id) {
        return sendApiRequest("events/get.php", { id }, "Getting event " + id).then(events => events[0]);
    },
    createEvent: function (event) {
        return sendApiRequest("events/create.php", event, "Creating event " + event.name);
    },
    getCategories: function () {
        return new Promise(r => r(categories.map(c => ({
            id: c,
            image: backendUrl + "api/images/get.php?query=" + encodeURIComponent(c)
        }))));
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

function sendApiRequest(endpoint, parameters, message) {
    return new Promise(function (resolve, reject) {
        console.info("[API] " + message);
        var urlParameters = Object.entries(parameters)
            .filter(([_, v]) => v !== null && v !== undefined)
            .map(([k, v]) =>
                v instanceof Array ? v.map(i => k + "[]=" + encodeURIComponent(i)).join("&") : k + "=" + encodeURIComponent(v)
            ).join("&");
        console.debug("[API] Fetching " + backendUrl + "api/" + endpoint + "?" + urlParameters);
        fetch(backendUrl + "api/" + endpoint + "?" + urlParameters)
            .then(res => res.json())
            .then(function (response) {
                if (!response.success) {
                    console.error("[API] " + response.error);
                    reject(response.error);
                } else {
                    resolve(response.data);
                }
            })
            .catch(reject);
    });
}

export default EventsApi;