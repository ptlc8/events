<?php

include('../init.php');

# See: https://platform.seatgeek.com

$eventsApiUrl = "https://api.seatgeek.com/2/events?per_page=1000&client_id=".SEATGEEK_CLIENT_ID."&client_secret=".SEATGEEK_CLIENT_SECRET;
$seatgeekEvents = json_decode(file_get_contents($eventsApiUrl));

$events = array();
foreach($seatgeekEvents->events as $event) {
    $events[] = array(
        "id" => -$event->id,
        "title" => $event->title,
        "author" => 0,
        "description" => $event->description,
        "datetime" => $event->datetime_local,
        "placename" => $event->venue->name,
        "categories" => array($event->type),
        "public" => 1,
        "lon" => $event->venue->location->lon,
        "lat" => $event->venue->location->lat,
        "image" => $event->performers[0]->image,
    );
}

echo json_encode(array(
    "success" => true,
    "data" => $events
));

?>