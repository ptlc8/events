<?php

include('../init.php');

initDatabase();

if (!isset($_REQUEST['id'])) exitError('need id');

$user = getLoggedUser();
if (!$user) exitError("not logged");

$event = queryDatabase("SELECT id FROM events WHERE id = '".$_REQUEST['id']."'")->fetch_assoc();

if (!$event) exitError("event not found");

queryDatabase("INSERT IGNORE INTO favorites (user, event) VALUES ('".$user['id']."', '".$event['id']."')");

exitSuccess();

?>