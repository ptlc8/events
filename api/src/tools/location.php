<?php

$ip = substr($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'], 0, 39);

include('../init.php');

initDatabase();

// Check if the location is already in the database
$results = queryDatabase("SELECT lat, lng, name FROM ipLocations WHERE ip = ", $ip, " AND lastUpdate > NOW() - INTERVAL 5 DAY");
if ($results->num_rows != 0) {
    $location = $results->fetch_object();
} else {
    // Get the location from ipinfo.io, limited to 1000 requests per day
    $data = json_decode(file_get_contents("http://ipinfo.io/{$ip}/json"));
    $pos = explode(",", $data->loc ?? '');
    $location = new stdClass();
    $location->lat = count($pos) == 2 ? $pos[0] : NULL;
    $location->lng = count($pos) == 2 ? $pos[1] : NULL;
    $location->name = ($data->city ?? '').', '.($data->region ?? '');

    // Save the location in the database for future requests
    queryDatabase("REPLACE INTO ipLocations (`ip`, `lat`, `lng`, `name`) VALUES (", $ip, ", ", $location->lat, ", ", $location->lng, ", ", $location->name, ")");
}

if ($location->lat == NULL || $location->lng == NULL) {
    exitError('Bogon IP');
}
exitSuccess($location);

?>