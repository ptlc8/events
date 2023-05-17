<?php

include('../init.php');

initDatabase();

// Minified version of the request, less details but more events
$min = isset($_REQUEST['min']);
if ($min) {
    $request = "SELECT id, lng, lat, title";
} else {
    $request = "SELECT events.*";
}

// Geolocation for distance filter and/or pertinence or distance sort
$lon = isset($_REQUEST['lon']) && is_numeric($_REQUEST['lon']) ? floatval($_REQUEST['lon']) : null;
$lat = isset($_REQUEST['lat']) && is_numeric($_REQUEST['lat']) ? floatval($_REQUEST['lat']) : null;
if (!isset($lon, $lat)) {
    $location = getLocation();
    $lon = $location[0];
    $lat = $location[1];
}

// Sort (part 1)
$sort = isset($_REQUEST['sort']) && in_array($_REQUEST['sort'], ['datetime', 'relevance', 'popularity', 'distance']) ? $_REQUEST['sort'] : 'datetime';
if ($sort == 'popularity') {
    $request .= ", (SELECT COUNT(*) FROM favorites WHERE event = events.id) AS pop";
} else if ($sort == 'relevance') {
    $request .= ", SQRT(POW(lng - $lon, 2) + POW(lat - $lat, 2)) * 100 + ABS(start - NOW()) / 100000 AS relevance";
} else if ($sort == 'distance') {
    $request .= ", 6371 * 2 * ASIN(SQRT(POW(SIN((RADIANS(lat) - RADIANS($lat)) / 2), 2) + COS(RADIANS(lat)) * COS(RADIANS($lat)) * POW(SIN((RADIANS(lng) - RADIANS($lon)) / 2), 2))) AS distance";
}

// Add fav if logged
$user = getLoggedUser();
if (!$user) {
    $request .= " FROM `events` WHERE 1 = 1";
} else {
    $request .= ", T.fav FROM `events` LEFT JOIN (SELECT *, TRUE AS fav FROM favorites WHERE user = '".$user['id']."') AS T ON event = events.id WHERE 1 = 1";
}

if (isset($_REQUEST['id'])) {
    
    // Event details by id
    $request .= " AND id = '".escapeDatabaseValue($_REQUEST['id'])."'";
    
} else if (isset($_REQUEST['favorite'])) {
    
    // Events favorited by the logged user
    if (!$user) exitError('not logged');
    $request = "SELECT *, TRUE AS fav FROM events JOIN favorites ON event = events.id WHERE user = '".$user['id']."'";

} else if (isset($_REQUEST['mine'])) {

    // Events created by the logged user
    if (!$user) exitError('not logged');
    $request .= " AND author = '".$user['id']."'";

} else {

    // Timezone offset in minutes, TODO: use to convert dates from UTC to local time
    date_default_timezone_set('Etc/GMT');
    $timezoneOffset = (isset($_REQUEST['timezoneoffset'])) ? intval($_REQUEST['timezoneoffset']) : 0; // en minutes
    
    $request .= " AND public = '1'";
    
    // Date filter
    $dateInf = isset($_REQUEST['datemin']) ? parseDate($_REQUEST['datemin']) : null;
    $dateSup = isset($_REQUEST['datemax']) ? parseDate($_REQUEST['datemax']) : null;
    if ($dateInf) $request .= " AND '$dateInf' <= CAST(start AS date)";
    if ($dateSup) $request .= " AND CAST(start AS date) < '$dateSup'";
    
    // Categories filter
    $categories = isset($_REQUEST['cats']) && is_array($_REQUEST['cats']) ? $_REQUEST['cats'] : array();
    foreach ($categories as $cat)
        $request .= " AND categories LIKE '%".escapeDatabaseValue($cat)."%'";
    
    // Text filter
    $text = isset($_REQUEST['text']) ? $_REQUEST['text'] : '';
    foreach (explode(' ', $text) as $word) {
        if (strlen($word) < 3) continue;
        $word = escapeDatabaseValue($word);
        $request .= " AND (title LIKE '%$word%' OR description LIKE '%$word%')";
    }
    
    // Time filter
    $timeInf = isset($_REQUEST['timemin']) ? parseTime($_REQUEST['timemin']) : null;
    $timeSup = isset($_REQUEST['timemax']) ? parseTime($_REQUEST['timemax']) : null;
    $request .= " AND (end > DATE_ADD(start, INTERVAL 1 DAY) OR "; // ignore time filters if event lasts more than 24h
    if (isset($timeInf, $timeSup)) {
        if (strtotime($timeInf) < strtotime($timeSup))
            $request .= "((CAST(start AS time) < CAST(end AS time) AND '$timeInf' <= CAST(end AS time) AND CAST(start AS time) <= '$timeSup') OR (CAST(end AS time) < CAST(start AS time) AND ('$timeInf' <= CAST(end AS time) OR CAST(start AS time) <= '$timeSup')))";
        else
            $request .= "(CAST(end AS time) < CAST(start AS time) OR (CAST(start AS time) < CAST(end AS time) AND ('$timeInf' <= CAST(end AS time) OR CAST(start AS time) <= '$timeSup')))";
    } else if (isset($timeInf)) {
        $request .= "'$timeInf' < CAST(end AS time) OR '$timeInf' <= CAST(start AS time) OR CAST(end AS time) < CAST(start AS time)";
    } else if (isset($timeSup)) {
        $request .= "CAST(start AS time) < '$timeSup' OR CAST(end AS time) <= '$timeSup' OR CAST(end AS time) < CAST(start AS time)";
    } else {
        $request .= "1 = 1";
    }
    $request .= ")";
    
    // Latitude filter
    if (isset($_REQUEST['minlat']) && is_numeric($_REQUEST['minlat']))
        $request .= " AND lat >= ".floatval($_REQUEST['minlat']);
    if (isset($_REQUEST['maxlat']) && is_numeric($_REQUEST['maxlat']))
        $request .= " AND lat <= ".floatval($_REQUEST['maxlat']);
    
    // Longitude filter
    $minlng = isset($_REQUEST['minlng']) && is_numeric($_REQUEST['minlng']) ? floatval($_REQUEST['minlng']) : -180;
    $maxlng = isset($_REQUEST['maxlng']) && is_numeric($_REQUEST['maxlng']) ? floatval($_REQUEST['maxlng']) : 180;
    if ($maxlng - $minlng < 360) {
        $minlng = fixLongitude($minlng);
        $maxlng = fixLongitude($maxlng);
        if ($minlng > $maxlng) {
            $request .= " AND (lng >= '$minlng' OR lng <= '$maxlng')";
        } else {
            $request .= " AND lng >= '$minlng' AND lng <= '$maxlng'";
        }
    }

    // Distance filter
    if (isset($_REQUEST['distance']) && is_numeric($_REQUEST['distance']))
        $request .= " AND ".floatval($_REQUEST['distance'])." >= 6371 * 2 * ASIN(SQRT(POW(SIN((RADIANS(lat) - RADIANS($lat)) / 2), 2) + COS(RADIANS(lat)) * COS(RADIANS($lat)) * POW(SIN((RADIANS(lng) - RADIANS($lon)) / 2), 2)))";

}

// Sort (part 2)
if ($sort == 'datetime') {
    $request .= " ORDER BY start ASC";
} else if ($sort == 'relevance') {
    $request .= " ORDER BY relevance ASC";
} else if ($sort == 'popularity') {
    $request .= " ORDER BY pop DESC";
} else if ($sort == 'distance') {
    $request .= " ORDER BY distance ASC";
}

// Limit and offset
$limit = isset($_REQUEST['limit']) && is_numeric($_REQUEST['limit']) ? max(1, min(intval($_REQUEST['limit']), $min ? 10000 : 100)) : ($min ? 5000 : 50);
$offset = isset($_REQUEST['offset']) && is_numeric($_REQUEST['offset']) ? max(0, intval($_REQUEST['offset'])) : 0;
$request .= " LIMIT $limit OFFSET $offset;";

$result = queryDatabase($request);
    
$events = [];
while (($event = $result->fetch_assoc()) != null) {
    if (!$min) {
        $event['lng'] = floatval($event['lng']);
        $event['lat'] = floatval($event['lat']);
        $event['categories'] = parseDatabaseArray($event['categories']);
        $event['images'] = parseDatabaseArray($event['images']);
        $event['imagesCredits'] = parseDatabaseArray($event['imagesCredits']);
        $event['contact'] = parseDatabaseArray($event['contact']);
        $event['registration'] = parseDatabaseArray($event['registration']);
        $event['public'] = boolval($event['public']);
        unset($event['source']);
        unset($event['sourceUrl']);
        array_push($events, $event);
    } else {
        array_push($events, array($event['id'], floatval($event['lng']), floatval($event['lat']), $event['title']));
    }
}

exitSuccess($events);

?>
