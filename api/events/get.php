<?php

include('../init.php');

initDatabase();

if (isset($_REQUEST['id'])) {
    
    $result = queryDatabase("SELECT * FROM `events` WHERE id = '", $_REQUEST['id'],"'");
    $min = false;
    
} else if (isset($_REQUEST['favorite']) || isset($_REQUEST['mine'])) {
    
    session_start();
    // connecté à un compte ? // TODO : sessionToken ?
    if (!isset($_SESSION['username'], $_SESSION['password'])) exitError("not logged");
	$userRequest = queryDatabase("SELECT * FROM USERS WHERE `name` = '", $_SESSION['username'], "' and `password` = '", $_SESSION['password'], "'");
	if ($userRequest->num_rows === 0) {
        exitError("not logged");
	}
	$user = $userRequest->fetch_assoc();
    
    $result = queryDatabase("SELECT * FROM events".(isset($_REQUEST['favorite']) ? " JOIN favorites ON event = events.id WHERE user = '".$user['id']."'" : "").(isset($_REQUEST['mine']) ? " WHERE author = '".$user['id']."'" : ""));
    $min = false;
    
} else {
    // Minified version of the request, less details but more events
    $min = isset($_REQUEST['min']);
    
    // Timezone offset in minutes, TODO: use to convert dates from UTC to local time
    date_default_timezone_set("Etc/GMT");
    $timezoneOffset = (isset($_REQUEST['timezoneoffset'])) ? intval($_REQUEST['timezoneoffset']) : 0; // en minutes
    
    $request = "SELECT * FROM `events` WHERE public = '1'";
    
    // Date filter
    $dateInf = isset($_REQUEST['datemin']) ? parseDate($_REQUEST['datemin']) : date("Y-m-d");
    $dateSup = isset($_REQUEST['datemax']) ? parseDate($_REQUEST['datemax']) : null;
    if ($dateInf) $request .= " AND '$dateInf' <= CAST(start AS date)";
    if ($dateSup) $request .= " AND CAST(start AS date) < '$dateSup'";
    
    // Categories filter
    $categories = isset($_REQUEST['cats']) && is_array($_REQUEST['cats']) ? $_REQUEST['cats'] : array();
    foreach ($categories as $cat)
    $request .= " AND categories LIKE '%".str_replace(array('\\', '\''), array('\\\\', '\\\''), $cat)."%'";
    
    // Text filter
    $text = isset($_REQUEST['text']) ? $_REQUEST['text'] : "";
    foreach (explode(" ", $text) as $word) {
        if (strlen($word) < 3) continue;
        $word = str_replace(array('\\', '\''), array('\\\\', '\\\''), $word);
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
    $request .= " AND lat >= '".floatval($_REQUEST['minlat'])."'";
    if (isset($_REQUEST['maxlat']) && is_numeric($_REQUEST['maxlat']))
    $request .= " AND lat <= '".floatval($_REQUEST['maxlat'])."'";
    
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
    
    // Sort by start datetime, limit and offset
    $limit = isset($_REQUEST['limit']) && is_numeric($_REQUEST['limit']) ? max(1, min(intval($_REQUEST['limit']), $min ? 10000 : 100)) : ($min ? 5000 : 50);
    $offset = isset($_REQUEST['offset']) && is_numeric($_REQUEST['offset']) ? max(0, intval($_REQUEST['offset'])) : 0;
    $request .= " ORDER BY start ASC";
    $request .= " LIMIT $limit OFFSET $offset;";
    
    $result = queryDatabase($request);
}
    
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

function fixLongitude($lon) {
    return fmod(fmod($lon, 360) + 540, 360) - 180;
}

?>
