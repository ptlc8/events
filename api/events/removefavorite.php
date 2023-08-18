<?php

include('../init.php');

initDatabase();

if (!isset($_REQUEST['id'])) exitError('need id');

$user = getLoggedUser();
if ($user == null) exitError("not logged");

$event = queryDatabase("SELECT id FROM events WHERE id = '".$_REQUEST['id']."'")->fetch_assoc();

if (!$event) exitError("event not found");

queryDatabase("DELETE FROM favorites WHERE user = '".$user['id']."' AND event = '".$event['id']."';");

exitSuccess();

?>