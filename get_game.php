<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$db = new mysqli('localhost', 'root', '', 'chess_games');

if ($db->connect_error) {
    die("Connection failed: " . $db->connect_error);
}

$id = $_GET['id'];
$stmt = $db->prepare("SELECT * FROM chess_games WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();
$game = $result->fetch_assoc();

echo json_encode($game);

$db->close();
?>
