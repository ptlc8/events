<?php

// si le fichier credentials.php existe, on l'inclut
@include 'credentials.php';

// en-têtes CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT, PATCH');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// obtenir une variable de configuration
function get_config($name) {
	if (defined($name) && !empty(constant($name)))
		return constant($name);
	return getenv($name) ?? NULL;
}

// initialisation BDD
function initDatabase() {
	global $mysqli;
	$mysqli = new mysqli(get_config('DB_HOST'), get_config('DB_USER'), get_config('DB_PASS'), get_config('DB_NAME'));
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
	    $request .= ($var ? escapeDatabaseValue($frag) : $frag);
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
	if ($value === NULL)
		return 'NULL';
	return "'".$mysqli->real_escape_string($value)."'";
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

function parseDate($date, $default=false) {
	$timestamp = strtotime($date);
	if ($timestamp === false)
		return $default;
	return date("Y-m-d H:i:s", $timestamp);
}

function parseTime($time, $default=false) {
	$timestamp = strtotime($time);
	if ($timestamp === false)
		return $default;
	return date("H:i:s", $timestamp);
}

function formatDateTimeISO($datetime) {
	$dt = new DateTime($datetime, new DateTimeZone('Etc/GMT'));
	return $dt->format('Y-m-d\TH:i:s\Z');
}

function fixLongitude($lng) {
    return fmod(fmod($lng, 360) + 540, 360) - 180;
}

function exitError($error) {
	header('Content-Type: application/json');
    echo json_encode(array('success' => false, 'error' => $error));
    exit;
}

function exitSuccess($data = NULL) {
	header('Content-Type: application/json');
    echo json_encode($data === NULL ? array('success' => true) : array('success' => true, 'data' => $data));
    exit;
}

?>
