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

    $text = isset($_REQUEST['text']) ? $_REQUEST['text'] : "";
    $date = isset($_REQUEST['date']) ? $_REQUEST['date'] : "alldate"; // alldate, today, tomorrow, week, nextweek, month
    $time = isset($_REQUEST['time']) ? $_REQUEST['time'] : "alltime"; // alltime, morning(06h-12h), afternoon(12h-18), evening(18h-00h), night(00h-06h), now(-3h-+3h)
    $categories = isset($_REQUEST['cats']) && is_array($_REQUEST['cats']) ? $_REQUEST['cats'] : array();
    $limit = isset($_REQUEST['limit']) && is_numeric($_REQUEST['limit']) ? max(1, min(intval($_REQUEST['limit']), $min ? 10000 : 100)) : ($min ? 5000 : 50);
    $offset = isset($_REQUEST['offset']) && is_numeric($_REQUEST['offset']) ? max(0, intval($_REQUEST['offset'])) : 0;

    date_default_timezone_set("Etc/GMT");
    $timezoneOffset = (isset($_REQUEST['timezoneoffset'])) ? intval($_REQUEST['timezoneoffset']) : 0; // en minutes
    
    if ($date == "today") {
        $dateInf = date("Y-m-d", strtotime("now +".$timezoneOffset." minute"));
        $dateSup = date("Y-m-d", strtotime("now +1 day +".$timezoneOffset." minute"));
    } else if ($date == "tomorrow") {
        $dateInf = date("Y-m-d", strtotime("now +1 day +".$timezoneOffset." minute"));
        $dateSup = date("Y-m-d", strtotime("now +2 day +".$timezoneOffset." minute"));
    } else if ($date == "week") {
        $dateInf = date("Y-m-d", strtotime(date("Y-m-d", strtotime("now +".$timezoneOffset." minute"))." this week"));
        $dateSup = date("Y-m-d", strtotime(date("Y-m-d", strtotime("now +".$timezoneOffset." minute"))." next week"));
    } else if ($date == "nextweek") {
        $dateInf = date("Y-m-d", strtotime(date("Y-m-d", strtotime("now +".$timezoneOffset." minute"))." next week"));
        $dateSup = date("Y-m-d", strtotime(date("Y-m-d", strtotime("now +".$timezoneOffset." minute"))." next week +1 week"));
    } else if ($date == "month") {
        $dateInf = date("Y-m-01", strtotime("now +".$timezoneOffset." minute"));
        $dateSup = date("Y-m-01", strtotime("now +".$timezoneOffset." minute +1 month"));
    } else {
        $dateInf = date("Y-m-d");
    }
    
    if (in_array($time, array("morning", "afternoon", "evening", "night"))) {
        $timeInf = date("H:i:s", strtotime("today ".($time=="morning"?"+6 hour":($time=="afternoon"?"+12 hour":($time=="evening"?"+18 hour":"")))." +".$timezoneOffset." minute"));
        $timeSup = date("H:i:s", strtotime("today ".($time=="morning"?"+12 hour":($time=="afternoon"?"+18 hour":($time=="evening"?"":"+6 hour")))." +".$timezoneOffset." minute"));
    } else if ($time == "now") {
        $timeInf = date("H:i:s", strtotime("now -3 hour"));
        $timeSup = date("H:i:s", strtotime("now +3 hour"));
    }
    
    $request = "SELECT * FROM `events` WHERE public = '1' AND '$dateInf' <= CAST(start AS date)";
    if (isset($dateSup)) $request .= " AND CAST(start AS date) < '$dateSup'";
    foreach ($categories as $cat)
        $request .= " AND categories LIKE '%".str_replace(array('\\', '\''), array('\\\\', '\\\''), $cat)."%'";
    foreach (explode(" ", $text) as $word) {
        if (strlen($word) < 3) continue;
        $word = str_replace(array('\\', '\''), array('\\\\', '\\\''), $word);
        $request .= " AND (title LIKE '%$word%' OR description LIKE '%$word%')";
    }
    // TODO : si event dure plus de 24h, on ignore le time
    if (isset($timeInf, $timeSup)) {
        if (strtotime($timeInf) < strtotime($timeSup))
            $request .= " AND ((CAST(start AS time) < CAST(end AS time) AND '$timeInf' <= CAST(end AS time) AND CAST(start AS time) <= '$timeSup') OR (CAST(end AS time) < CAST(start AS time) AND ('$timeInf' <= CAST(end AS time) OR CAST(start AS time) <= '$timeSup')))";
        else
            $request .= " AND (CAST(end AS time) < CAST(start AS time) OR (CAST(start AS time) < CAST(end AS time) AND ('$timeInf' <= CAST(end AS time) OR CAST(start AS time) <= '$timeSup')))";
    }
    if (isset($_REQUEST['minlat']) && is_numeric($_REQUEST['minlat']))
        $request .= " AND lat >= '".floatval($_REQUEST['minlat'])."'";
    if (isset($_REQUEST['maxlat']) && is_numeric($_REQUEST['maxlat']))
        $request .= " AND lat <= '".floatval($_REQUEST['maxlat'])."'";
    
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
    $request .= " ORDER BY start ASC";
    $request .= " LIMIT $limit OFFSET $offset;";
    
    $result = queryDatabase($request);
}

$events = [];
while (($event = $result->fetch_assoc()) != null) {
    if (!$min) {
        $event['lng'] = floatval($event['lng']);
        $event['lat'] = floatval($event['lat']);
        $event['categories'] = $event['categories']=="" ? [] : explode(",", $event['categories']);
        $event['images'] = $event['images']!="" ? explode(",", $event['images']) : [];
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
