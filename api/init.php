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
	$request = '';
	$var = false;
	foreach ($requestFrags as $frag) {
	    $request .= ($var ? str_replace(array('\\', '\''), array('\\\\', '\\\''), $frag) : $frag);
		$var = !$var;
	}
	global $mysqli;
	if (!$result = $mysqli->query($request)) {
		echo 'Erreur de requête côté serveur, veuillez réessayer plus tard';
		exit;
	}
	return $result;
}

function exitError($error) {
    echo json_encode(array('success' => false, 'error' => $error));
    exit;
}

function exitSuccess($data) {
    echo json_encode(array('success' => true, 'data' => $data));
    exit;
}

?>