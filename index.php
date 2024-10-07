<?php
session_start();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chess Game</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
            color: #333;
        }
        #game-container {
            display: flex;
            align-items: flex-start;
            gap: 20px;
            background-color: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        #evaluation-bar {
            width: 20px;
            height: 400px;
            background-color: #f0d9b5;
            border: 1px solid #ccc;
            border-radius: 10px;
            overflow: hidden;
        }
        #evaluation-fill {
            width: 100%;
            background-color: #b58863;
            transition: height 0.3s ease-in-out;
        }
        #board-container {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        #chessboard, #past-game-board {
            width: 400px;
            height: 400px;
            border: 2px solid #333;
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .square {
            width: 50px;
            height: 50px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 30px;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }
        .white { background-color: #f0d9b5; }
        .black { background-color: #b58863; }
        .selected { background-color: #7fc97f; }
        .valid-move { background-color: #7fc9c9; }
        #controls {
            margin-top: 20px;
            display: flex;
            gap: 10px;
        }
        button {
            padding: 8px 16px;
            font-size: 14px;
            cursor: pointer;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            transition: background-color 0.3s ease;
        }
        button:hover {
            background-color: #45a049;
        }
        #status {
            margin-top: 10px;
            font-size: 18px;
            text-align: center;
        }
        #game-archive {
            width: 400px;
            max-height: 150px;
            overflow-y: auto;
            border: 1px solid #ccc;
            margin-top: 20px;
            padding: 10px;
            font-size: 14px;
            border-radius: 4px;
        }
        #move-history-table {
            width: 100%;
            border-collapse: collapse;
        }
        #move-history-table th, #move-history-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        #move-history-table th {
            background-color: #f2f2f2;
        }
        #promotion-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.4);
        }
        #promotion-content {
            background-color: #fefefe;
            margin: 15% auto;
            padding: 20px;
            border: 1px solid #888;
            width: 300px;
            text-align: center;
            border-radius: 10px;
        }
        .promotion-piece {
            font-size: 48px;
            margin: 10px;
            cursor: pointer;
        }
        #saved-games-container {
            width: 200px;
        }
        #saved-games-list {
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #ccc;
            padding: 10px;
            border-radius: 4px;
        }
        .saved-game-item {
            cursor: pointer;
            padding: 5px;
            border-bottom: 1px solid #eee;
            transition: background-color 0.3s ease;
        }
        .saved-game-item:hover {
            background-color: #f0f0f0;
        }
        #past-game-container {
            display: none;
            margin-top: 20px;
        }
        #past-game-controls {
            margin-top: 10px;
            text-align: center;
            display: flex;
            justify-content: center;
            gap: 10px;
        }
        #past-game-controls button {
            font-size: 16px;
        }
        #current-move {
            margin-top: 10px;
            text-align: center;
            font-size: 16px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <div id="evaluation-bar"><div id="evaluation-fill"></div></div>
        <div id="board-container">
            <div id="chessboard"></div>
            <div id="controls">
                <button id="restart-btn">Restart Game</button>
                <button id="copy-history-btn">Copy Move History</button>
                <button id="toggle-opponent-btn">Toggle AI/Human Opponent</button>
                <button id="take-back-btn">Take Back</button>
            </div>
            <div id="status"></div>
            <div id="game-archive">
                <table id="move-history-table">
                    <thead>
                        <tr>
                            <th>Move</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
        <div id="saved-games-container">
            <h3>Saved Games</h3>
            <div id="saved-games-list"></div>
        </div>
    </div>
    <div id="past-game-container">
        <h3>Viewing Past Game</h3>
        <button id="close-past-game">Close</button>
        <div id="past-game-board"></div>
        <div id="current-move"></div>
        <div id="past-game-controls">
            <button id="move-first">|&lt;</button>
            <button id="move-prev">&lt;</button>
            <button id="move-next">&gt;</button>
            <button id="move-last">&gt;|</button>
        </div>
    </div>
    <div id="promotion-modal">
        <div id="promotion-content">
            <h2>Choose promotion piece:</h2>
            <div id="promotion-choices"></div>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chess.js/0.10.3/chess.min.js"></script>
    <script src="chess-game.js"></script>
    <script src="fast.js"></script>
    <script src="saved-games.js"></script>
</body>
</html>