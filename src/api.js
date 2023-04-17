const EventsApi = {
    getEvents: function(parameters = {}) {
        return sendApiRequest("events/get.php", parameters, "Getting events");
    },
    getEvent: function(id) {
        return sendApiRequest("events/get.php", { id }, "Getting event " + id)
    },
    createEvent: function(event) {
        return sendApiRequest("events/create.php", event, "Creating event " + event.name);
    },
    getCategories: function() {
        return ["party", "arts", "theater", "music", "online", "children", "shopping", "cinema", "food", "wellbeing", "show", "sport", "literature", "drink", "gardening", "cause", "craft"];
        //return sendApiRequest("/categories/get.php", {}, "Getting categories");
    },
    login: function(username, password) {
        return sendApiRequest("users/login.php", { username, password }, "Logging in as " + username);
    },
    getSelfUser: function() {
        return sendApiRequest("users/get.php", { this: true }, "Getting self user");
    },
    logout: function() {
        return sendApiRequest("users/logout.php", {}, "Logging out");
    },
    getUser: function(username) {
        return sendApiRequest("users/get.php", { username }, "Getting user " + username);
    },
    getLocation: function() {
        return sendApiRequest("tools/location.php", {}, "Getting location");
    }
};

function sendApiRequest(endpoint, parameters, message) {
    return new (Promise || ES6Promise)(function(resolve, reject) {
        console.info("[Events] " + message);
        var urlParameters = Object.entries(parameters).map(([k, v]) =>
            v instanceof Array ? v.map(i => k + "[]=" + encodeURIComponent(i)).join("&") : k + "=" + encodeURIComponent(v)
        ).join("&");
        fetch("api/" + endpoint + "?" + urlParameters)
            .then(res => res.json())
            .then(function(response) {
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