<?php

include('../init.php');

initDatabase();

if (!isset($_REQUEST['token']))
    exitError('need token');

// valider le token
$user = getUser($_REQUEST['token']);
if ($user == null) exitError('invalid token');

setLoggedUser($_REQUEST['token']);
exitSuccess($user);

?>