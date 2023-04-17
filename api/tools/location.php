<?php

include('../init.php');

$ip = $_SERVER['REMOTE_ADDR'];
$ipInfo = json_decode(file_get_contents("http://ipinfo.io/{$ip}/json"));
$ipLoc = $ipInfo->bogon ? "48.86,2.35" : $ipInfo->loc;

exitSuccess(array_reverse(array_map("floatval", explode(",", $ipLoc))));

?>