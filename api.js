const EventsApi = {
    getEvents: function (parameters = {}) {
        return sendApiRequest("/events/get.php", parameters, "Getting events");
    },
    getEvent: function (id) {
        return sendApiRequest("/events/get.php", { id }, "Getting event " + id)
    },
    createEvent: function (event) {
        return sendApiRequest("/events/create.php", event, "Creating event " + event.name);
    },
    getCategories: function () {
        return sendApiRequest("/categories/get.php", {}, "Getting categories");
    }
};

function sendApiRequest(endpoint, parameters, message) {
    return new (Promise || ES6Promise)(function (resolve, reject) {
        console.info("[Events] " + message);
        var urlParameters = Object.entries(parameters).map(([k, v]) =>
            v instanceof Array ? v.map(i => k + "[]=" + encodeURIComponent(i)).join("&") : k + "=" + encodeURIComponent(v)
        ).join("&");
        sendRequest("GET", "api/" + endpoint + "?" + urlParameters).then(function (response) {
            response = JSON.parse(response);
            if (!response.success) {
                console.error("[Events] " + response.error);
                reject(response.error);
            } else {
                resolve(response.data);
            }
        });
    });
}