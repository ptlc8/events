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
        return ["party", "arts", "theater", "music", "online", "children", "shopping", "cinema", "food", "wellbeing", "show", "sport", "literature", "drink", "gardening", "cause", "craft", "exhibition", "dance", "festival", "videogame", "market", "outdoor", "museum", "tour", "workshop", "garden", "holiday", "free", "parade", "fair", "religion", "science", "seminar", "boardgame"];
        //return sendApiRequest("/categories/get.php", {}, "Getting categories");
    },
    login: function (username, password) {
        return sendApiRequest("users/login.php", { username, password }, "Logging in as " + username);
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
    }
};

function sendApiRequest(endpoint, parameters, message) {
    return new Promise(function (resolve, reject) {
        console.info("[Events] " + message);
        var urlParameters = Object.entries(parameters)
            .filter(([_, v]) => v !== null && v !== undefined)
            .map(([k, v]) =>
                v instanceof Array ? v.map(i => k + "[]=" + encodeURIComponent(i)).join("&") : k + "=" + encodeURIComponent(v)
            ).join("&");
        fetch(import.meta.env.VITE_BASE_URL + "/api/" + endpoint + "?" + urlParameters)
            .then(res => res.json())
            .then(function (response) {
                if (!response.success) {
                    console.error("[Events] " + response.error);
                    reject(response.error);
                } else {
                    resolve(response.data);
                }
            })
            .catch(reject);
    });
}

export default EventsApi;