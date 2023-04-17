<?php

include('../init.php');

initDatabase();

if (!isset($_REQUEST['username'], $_REQUEST['password']))
    exitError("need more args");

$hashed_password = hash('sha512', $_REQUEST['password']);
if (queryDatabase("SELECT * FROM USERS WHERE `name` = '", $_REQUEST['username'], "' and `password` = '", $hashed_password, "'")->num_rows === 0)
    exitError("invalid");

session_start();
$_SESSION['username'] = $_REQUEST['username'];
$_SESSION['password'] = $hashed_password;
exitSuccess("logged in");

?>