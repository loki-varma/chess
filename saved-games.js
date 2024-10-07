document.addEventListener('DOMContentLoaded', function() {
    const savedGamesList = document.getElementById('saved-games-list');
    const pastGameContainer = document.getElementById('past-game-container');
    const pastGameBoard = document.getElementById('past-game-board');
    const moveFirstBtn = document.getElementById('move-first');
    const movePrevBtn = document.getElementById('move-prev');
    const moveNextBtn = document.getElementById('move-next');
    const moveLastBtn = document.getElementById('move-last');
    const currentMoveDisplay = document.getElementById('current-move');
    const closePastGameBtn = document.getElementById('close-past-game');

    let pastGame = null;
    let currentMoveIndex = 0;
    let moves = [];

    function loadSavedGames() {
        fetch('get_saved_games.php')
            .then(response => response.json())
            .then(games => {
                savedGamesList.innerHTML = '';
                games.forEach(game => {
                    const gameItem = document.createElement('div');
                    gameItem.className = 'saved-game-item';
                    gameItem.textContent = `${game.game_name} (${game.result})`;
                    gameItem.addEventListener('click', () => loadGame(game.id));
                    savedGamesList.appendChild(gameItem);
                });
            })
            .catch(error => console.error('Error loading saved games:', error));
    }

    function loadGame(gameId) {
        fetch(`get_game.php?id=${gameId}`)
            .then(response => response.json())
            .then(game => {
                pastGame = new Chess();
                moves = game.moves.split(' ');
                pastGameContainer.style.display = 'block';
                currentMoveIndex = 0;
                updatePastGameBoard();
            });
    }

    function updatePastGameBoard() {
        pastGameBoard.innerHTML = '';
        const board = pastGame.board();
        for (let i = 0; i < 8; i++) {
            for (let j = 0; j < 8; j++) {
                const square = document.createElement('div');
                square.className = `square ${(i + j) % 2 === 0 ? 'white' : 'black'}`;
                const piece = board[i][j];
                if (piece) {
                    square.textContent = getPieceSymbol(piece);
                }
                pastGameBoard.appendChild(square);
            }
        }
        currentMoveDisplay.textContent = `Move: ${currentMoveIndex} / ${moves.length}`;
    }

    function getPieceSymbol(piece) {
        const symbols = {
            'p': '♙', 'n': '♘', 'b': '♗', 'r': '♖', 'q': '♕', 'k': '♔',
            'P': '♟', 'N': '♞', 'B': '♝', 'R': '♜', 'Q': '♛', 'K': '♚'
        };
        return symbols[piece.color === 'w' ? piece.type.toLowerCase() : piece.type.toUpperCase()];
    }

    moveFirstBtn.addEventListener('click', () => {
        pastGame.reset();
        currentMoveIndex = 0;
        updatePastGameBoard();
    });

    movePrevBtn.addEventListener('click', () => {
        if (currentMoveIndex > 0) {
            pastGame.undo();
            currentMoveIndex--;
            updatePastGameBoard();
        }
    });

    moveNextBtn.addEventListener('click', () => {
        if (currentMoveIndex < moves.length) {
            pastGame.move(moves[currentMoveIndex]);
            currentMoveIndex++;
            updatePastGameBoard();
        }
    });

    moveLastBtn.addEventListener('click', () => {
        while (currentMoveIndex < moves.length) {
            pastGame.move(moves[currentMoveIndex]);
            currentMoveIndex++;
        }
        updatePastGameBoard();
    });

    closePastGameBtn.addEventListener('click', () => {
        pastGameContainer.style.display = 'none';
    });

    loadSavedGames();
});
