<?php

include('../init.php');

if (isset($_REQUEST['id'])) {
    
    $result = sendRequest("SELECT * FROM `EVENTS` WHERE id = '", $_REQUEST['id'],"'");
    
} else if (isset($_REQUEST['favorite']) || isset($_REQUEST['mine'])) {
    
    session_start();
    // connecté à un compte ? // TODO : sessionToken ?
    if (!isset($_SESSION['username'], $_SESSION['password'])) exitError("not logged");
	$userRequest = sendRequest("SELECT * FROM USERS WHERE `name` = '", $_SESSION['username'], "' and `password` = '", $_SESSION['password'], "'");
	if ($userRequest->num_rows === 0) {
        exitError("not logged");
	}
	$user = $userRequest->fetch_assoc();
    
    $result = sendRequest("SELECT * FROM EVENTS".(isset($_REQUEST['favorite']) ? " JOIN UxE ON UxE.eventId = EVENTS.id WHERE UxE.userId = '".$user['id']."'" : "").(isset($_REQUEST['mine']) ? " WHERE EVENTS.author = '".$user['id']."'" : ""));
    
} else {

    $text = isset($_REQUEST['text']) ? $_REQUEST['text'] : "";
    $date = isset($_REQUEST['date']) ? $_REQUEST['date'] : "alldate"; // alldate, today, tomorrow, week, nextweek, month
    $time = isset($_REQUEST['time']) ? $_REQUEST['time'] : "alltime"; // alltime, morning(06h-12h), afternoon(12h-18), evening(18h-00h), night(00h-06h), now(-3h-+3h)
    $categories = [];
    for ($i = 0; isset($_REQUEST['cat'.$i]); $i++) {
        array_push($categories, $_REQUEST['cat'.$i]);
    }
    $limit = isset($_REQUEST['limit']) && is_numeric($_REQUEST['limit']) ? max(1, min(intval($_REQUEST['limit']), 20)) : 10;
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
    
    $request = "SELECT * FROM `EVENTS` WHERE public = '1' '$dateInf' <= CAST(datetime AS date)";
    if (isset($dateSup)) $request .= " AND CAST(datetime AS date) < '$dateSup'";
    foreach ($categories as $cat)
        $request .= " AND categories LIKE '%".str_replace(array('\\', '\''), array('\\\\', '\\\''), $cat)."%'";
    foreach (explode(" ", $text) as $word) {
        if (strlen($word) < 3) continue;
        $word = str_replace(array('\\', '\''), array('\\\\', '\\\''), $word);
        $request .= " AND (title LIKE '%$word%' OR description LIKE '%$word%')";
    }
    if (isset($timeInf, $timeSup)) {
        if (strtotime($timeInf) < strtotime($timeSup))
            $request .= " AND '$timeInf' <= CAST(datetime AS time) AND CAST(datetime AS time) <= '$timeSup'";
        else
            $request .= " AND ('$timeInf' <= CAST(datetime AS time) OR CAST(datetime AS time) <= '$timeSup')";
    }
    $request .= " LIMIT $limit OFFSET $offset";
    $result = sendRequest($request);
}

$events = [];
while (($event = $result->fetch_assoc()) != null) {
    $event['coords'] = array(floatval($event['coor1']), floatval($event['coor2']));
    $event['categories'] = explode(",", $event['categories']);
    unset($event['coor1'], $event['coor2']);
    array_push($events, $event);
}

exitSuccess($events);

?>
