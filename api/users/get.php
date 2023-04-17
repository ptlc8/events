<?php

include('../init.php');

if (!isset($_REQUEST['this']) && !isset($_REQUEST['username']))
    exitError('need username or this');

if (isset($_REQUEST['this'])) {
    session_start();
    if (!isset($_SESSION['username']))
        exitSuccess(NULL);
    $username = $_SESSION['username'];
} else {
    $username = $_REQUEST['username'];
}

$user = array('username' => $username);

exitSuccess($user);

?>