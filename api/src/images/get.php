<?php

include('../init.php');

if (!isset($_REQUEST['query'])) exitError('need query');

$query = substr($_REQUEST['query'], 0, 64);

initDatabase();

$imageUrl = null;

// Check if the image is already in the database
$results = queryDatabase("SELECT url FROM images WHERE query = ", $query, " AND lastUpdate > NOW() - INTERVAL 1 DAY");
if ($results->num_rows != 0) {
    $image = $results->fetch_assoc();
    $imageUrl = $image['url'];
} else {
    // Get an image from Unsplash
    $url = 'https://unsplash.com/napi/search/photos?page=1&per_page=20&plus=none&query=' . urlencode($query) . '&xp=search-region-awareness%3Acontrol';
    $context = stream_context_create([
        'http' => [
            'header' => "accept: */*\r\nuser-agent: curl/7.81.0\r\n"
        ]
    ]);
    $res = file_get_contents($url, false, $context);
    $res = json_decode($res, false);
    $imageUrl = $res->results[0]->urls->small;

    // Save the image in the database for future requests
    queryDatabase("REPLACE INTO images (`query`, `url`) VALUES (", $query, ", ", $imageUrl, ")");
}

// Redirect to the image with 24 hours cache
header("Cache-Control: max-age=86400");
header('Location: ' . $imageUrl, true, 301);

?>