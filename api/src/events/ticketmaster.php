<?php

include('../init.php');

# See: https://developer.ticketmaster.com

$eventsApiUrl = "http://app.ticketmaster.com/discovery/v2/events.json?geoPoint=u093&radius=500&size=200&apikey=".TICKETMASTER_API_KEY;
$ticketmasterEvents = json_decode(file_get_contents($eventsApiUrl));

$events = array();
foreach($ticketmasterEvents->_embedded->events as $event) {
    $events[] = array(
        "id" => $event->id,
        "title" => $event->name,
        "author" => 0,
        "description" => "",
        "datetime" => $event->dates->start->dateTime,
        "placename" => $event->_embedded->venues[0]->name,
        "categories" => array(),
        "public" => 1,
        "lng" => $event->_embedded->venues[0]->location->longitude,
        "lat" => $event->_embedded->venues[0]->location->latitude,
        "image" => $event->images[0]->url
    );
}

echo json_encode(array(
    "success" => true,
    "data" => $events
));

?>