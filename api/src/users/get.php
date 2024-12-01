<?php

include('../init.php');

if (!isset($_REQUEST['this']) && !isset($_REQUEST['username']))
    exitError('need username or this');

if (isset($_REQUEST['this'])) {
    $user = getLoggedUser();
} else {
    $username = $_REQUEST['username'];
    $user = array('name' => $username);
}

exitSuccess($user);

?>