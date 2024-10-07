<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$db = new mysqli('localhost', 'root', '', 'chess_games');

if ($db->connect_error) {
    die("Connection failed: " . $db->connect_error);
}

$game_name = $_POST['game_name'];
$moves = $_POST['moves'];
$result = $_POST['result'];
$start_time = date('Y-m-d H:i:s');
$end_time = $result === 'Ongoing' ? NULL : date('Y-m-d H:i:s');

$stmt = $db->prepare("INSERT INTO chess_games (game_name, moves, result, start_time, end_time) VALUES (?, ?, ?, ?, ?)");
$stmt->bind_param("sssss", $game_name, $moves, $result, $start_time, $end_time);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Game saved successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => "Error saving game: " . $stmt->error]);
}

$db->close();
?>