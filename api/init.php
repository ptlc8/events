<?php

include('credentials.php');

if ($_SERVER['SERVER_NAME'] == 'localhost') {
	ini_set('display_errors', '1');
}

// initialisation session + BDD
function initDatabase() {
	global $mysqli;
	$mysqli = new mysqli(EVENTS_DB_HOSTNAME, EVENTS_DB_USER, EVENTS_DB_PASSWORD, EVENTS_DB_NAME);
	if ($mysqli->connect_errno) {
		echo 'Erreur de connexion côté serveur, veuillez réessayer plus tard';
		exit;
	}
}

// fonction de requête BDD
function queryDatabase(...$requestFrags) {
	global $mysqli;
	$request = '';
	$var = false;
	foreach ($requestFrags as $frag) {
	    $request .= ($var ? $mysqli->real_escape_string($frag) : $frag);
		$var = !$var;
	}
	if (!$result = $mysqli->query($request)) {
		echo 'Erreur de requête côté serveur, veuillez réessayer plus tard';
		if ($_SERVER['SERVER_NAME'] == 'localhost')
			echo " : $request";
		exit;
	}
	return $result;
}

function parseDatabaseArray($stringArray) {
	if ($stringArray == "")
		return [];
	$array = [""];
	$i = 0;
	$ignoreNext = false;
	foreach (str_split($stringArray) as $char) {
		if (!$ignoreNext) {
			if ($char == '\\') {
				$ignoreNext = true;
				continue;
			}
			if ($char == ',') {
				$i++;
				$array[$i] = "";
				continue;
			}
		}
		$ignoreNext = false;
		$array[$i] .= $char;
	}
	return $array;
}

function escapeDatabaseValue($value) {
	global $mysqli;
	return $mysqli->real_escape_string($value);
}

// récupérer les infos externes d'un utilisateur avec un token
function getUser($token) {
	if (!isset($token)) return null;
    $response = file_get_contents(EVENTS_TESTUSER_URL.$token);
    if ($response === false) return null;
    return json_decode($response, true);
}

// récupérer les infos externes de l'utilisateur connecté
function getLoggedUser() {
	session_start();
    if (!isset($_SESSION['events_token'])) return null;
	$user = getUser($_SESSION['events_token']);
	return $user;
}

function setLoggedUser($token) {
	session_start();
	$_SESSION['events_token'] = $token;
} 

function getLocation() { // TODO: put result in session
	$ip = $_SERVER['REMOTE_ADDR'];
	$ipInfo = json_decode(file_get_contents("http://ipinfo.io/{$ip}/json"));
	$ipLoc = isset($ipInfo->bogon) && $ipInfo->bogon ? "48.86,2.35" : $ipInfo->loc;
	return array_reverse(array_map("floatval", explode(",", $ipLoc)));
}

function parseDate($date, $default=false) {
	$timestamp = strtotime($date);
	if ($timestamp === false)
		return $default;
	return date("Y-m-d", $timestamp);
}

function parseTime($time, $default=false) {
	$timestamp = strtotime($time);
	if ($timestamp === false)
		return $default;
	return date("H:i:s", $timestamp);
}

function fixLongitude($lon) {
    return fmod(fmod($lon, 360) + 540, 360) - 180;
}

function exitError($error) {
    echo json_encode(array('success' => false, 'error' => $error));
    exit;
}

function exitSuccess($data = NULL) {
    echo json_encode($data === NULL ? array('success' => true) : array('success' => true, 'data' => $data));
    exit;
}

?>