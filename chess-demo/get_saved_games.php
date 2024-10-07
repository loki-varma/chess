<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$db = new mysqli('localhost', 'root', '', 'chess_games');

if ($db->connect_error) {
    die("Connection failed: " . $db->connect_error);
}

$result = $db->query("SELECT id, game_name, start_time FROM chess_games ORDER BY start_time DESC");
$games = [];

while ($row = $result->fetch_assoc()) {
    $games[] = $row;
}

echo json_encode($games);

$db->close();
?>
