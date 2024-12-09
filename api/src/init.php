<?php

include('credentials.php');

// CORS headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// obtenir une variable de configuration
function get_config($name) {
	return defined($name) && !empty(constant($name)) ? constant($name) : null;
}

// initialisation session + BDD
function initDatabase() {
	global $mysqli;
	$mysqli = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
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

function getBaseURL() {
	return get_config('BASE_URL') ?? '';
}

// récupérer les infos externes d'un utilisateur avec un token
function getUser($token) {
	if (!isset($token)) return null;
	$portalUserURL = get_config('PORTAL_USER_URL');
	if (!$portalUserURL) return null;
    $context = null;
    if (get_config('PORTAL_OVERRIDE_HOST'))
        $context = stream_context_create([ 'http' => [ 'header' => 'Host: '.get_config('PORTAL_OVERRIDE_HOST') ] ]);
    $response = file_get_contents($portalUserURL.$token, false, $context);
    if ($response === false) return null;
    $user = json_decode($response, true);
	$user['avatar'] = getAvatar($user['id']);
	return $user;
}

// récupérer les infos externes de l'utilisateur connecté
function getLoggedUser() {
	session_start();
    if (!isset($_SESSION['events_token'])) return null;
	$user = getUser($_SESSION['events_token']);
	return $user;
}

// récupérer l'URL de l'avatar d'un utilisateur
function getAvatar($userId) {
	return get_config('PORTAL_AVATAR_URL').$userId;
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