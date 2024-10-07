document.addEventListener('DOMContentLoaded', function() {
    const chessboard = document.getElementById('chessboard');
    const statusDisplay = document.getElementById('status');
    const restartBtn = document.getElementById('restart-btn');
    const copyHistoryBtn = document.getElementById('copy-history-btn');
    const gameArchive = document.getElementById('game-archive');
    const evaluationFill = document.getElementById('evaluation-fill');
    const moveHistoryTable = document.getElementById('move-history-table').getElementsByTagName('tbody')[0];
    const toggleOpponentBtn = document.getElementById('toggle-opponent-btn');
    const takeBackBtn = document.getElementById('take-back-btn');

    let game = new Chess();
    let selectedSquare = null;
    let playerColor = 'w';
    let isAIOpponent = true;
    let pendingPromotion = null;

    function createBoard() {
        chessboard.innerHTML = '';
        const isFlipped = playerColor === 'b';
        for (let i = 0; i < 64; i++) {
            const row = isFlipped ? Math.floor(i / 8) : 7 - Math.floor(i / 8);
            const col = isFlipped ? 7 - (i % 8) : i % 8;
            const square = document.createElement('div');
            square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
            square.dataset.square = String.fromCharCode(97 + col) + (row + 1);
            const piece = game.get(square.dataset.square);
            if (piece) {
                square.textContent = getPieceSymbol(piece);
            }
            square.addEventListener('click', handleSquareClick);
            chessboard.appendChild(square);
        }
    }

    function getPieceSymbol(piece) {
        const symbols = {
            'p': '♙', 'n': '♘', 'b': '♗', 'r': '♖', 'q': '♕', 'k': '♔',
            'P': '♟', 'N': '♞', 'B': '♝', 'R': '♜', 'Q': '♛', 'K': '♚'
        };
        return symbols[piece.color === 'w' ? piece.type : piece.type.toUpperCase()];
    }

    function handleSquareClick(event) {
        const square = event.target.dataset.square;
        if (isAIOpponent && game.turn() !== playerColor) return;

        if (selectedSquare === null) {
            const piece = game.get(square);
            if (piece && piece.color === game.turn()) {
                selectedSquare = square;
                event.target.classList.add('selected');
                highlightValidMoves(square);
            }
        } else {
            if (square === selectedSquare) {
                clearHighlights();
                selectedSquare = null;
            } else {
                const move = {
                    from: selectedSquare,
                    to: square,
                };

                const piece = game.get(selectedSquare);
                if (piece && piece.type === 'p' && (square[1] === '8' || square[1] === '1')) {
                    pendingPromotion = move;
                    showPromotionModal();
                } else {
                    makeMove(move);
                }
            }
        }
    }

    function showPromotionModal() {
        const modal = document.getElementById('promotion-modal');
        const choices = document.getElementById('promotion-choices');
        choices.innerHTML = '';
        
        const pieces = ['q', 'r', 'n', 'b'];
        const pieceSymbols = { 'q': '♛', 'r': '♜', 'n': '♞', 'b': '♝' };
        
        pieces.forEach(piece => {
            const pieceElement = document.createElement('span');
            pieceElement.className = 'promotion-piece';
            pieceElement.textContent = pieceSymbols[piece];
            pieceElement.addEventListener('click', () => {
                pendingPromotion.promotion = piece;
                makeMove(pendingPromotion);
                modal.style.display = 'none';
            });
            choices.appendChild(pieceElement);
        });
        
        modal.style.display = 'block';
    }

    function makeMove(move) {
        const result = game.move(move);
        if (result) {
            clearHighlights();
            createBoard();
            updateStatus();
            updateEvaluationBar();
            updateGameArchive(result);
            selectedSquare = null;
            if (isAIOpponent && !game.game_over()) {
                chessboard.style.pointerEvents = 'none';
                setTimeout(() => {
                    makeAIMove();
                    chessboard.style.pointerEvents = 'auto';
                }, 250);
            }
            saveGame();
        }
    }

    function highlightValidMoves(square) {
        const moves = game.moves({ square: square, verbose: true });
        moves.forEach(move => {
            const targetSquare = document.querySelector(`[data-square="${move.to}"]`);
            if (targetSquare) targetSquare.classList.add('valid-move');
        });
    }

    function clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move');
        });
    }

    function makeAIMove() {
        const moves = game.moves({ verbose: true });
        if (moves.length > 0) {
            const depth = Math.floor(Math.random() * 2) + 3; // Random depth between 3 and 4
            const move = getBestMove(game, depth);
            game.move(move);
            createBoard();
            updateStatus();
            updateEvaluationBar();
            updateGameArchive(move);
        }
    }

    function updateStatus() {
        let status = '';
        let moveColor = game.turn() === 'b' ? 'Black' : 'White';

        if (game.in_checkmate()) {
            status = `Game over, ${moveColor} is in checkmate.`;
            saveGame(); // Automatically save the game when it's over
        } else if (game.in_draw()) {
            status = 'Game over, drawn position';
            saveGame(); // Automatically save the game when it's over
        } else {
            status = `${moveColor} to move`;
            if (game.in_check()) {
                status += `, ${moveColor} is in check`;
            }
        }

        statusDisplay.textContent = status;
        updateEvaluationBar();
    }

    function updateEvaluationBar() {
        const evaluation = evaluateBoard(game.board());
        const percentage = (20 - evaluation) / 40 * 100;
        evaluationFill.style.height = `${Math.max(5, Math.min(95, percentage))}%`;
    }

    function updateGameArchive(move) {
        const row = moveHistoryTable.insertRow();
        const moveNumber = Math.ceil(game.history().length / 2);
        const color = move.color === 'w' ? 'White' : 'Black';
        
        row.insertCell(0).textContent = `${moveNumber}. ${color}`;
        row.insertCell(1).textContent = getReadableMove(move);
        
        gameArchive.scrollTop = gameArchive.scrollHeight;
    }

    function getReadableMove(move) {
        if (!move || typeof move !== 'object') {
            return 'Invalid move';
        }

        const pieceNames = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };
        let description = `${pieceNames[move.piece] || 'Piece'} to ${move.to || 'unknown square'}`;
        
        if (move.captured && pieceNames[move.captured]) {
            description += ` (captures ${pieceNames[move.captured]})`;
        }
        if (move.promotion && pieceNames[move.promotion]) {
            description += ` (promotes to ${pieceNames[move.promotion]})`;
        }
        if (move.san && typeof move.san === 'string') {
            if (move.san.includes('+')) {
                description += ' (check)';
            }
            if (move.san.includes('#')) {
                description += ' (checkmate)';
            }
        }
        return description;
    }

    function restartGame() {
        game = new Chess();
        selectedSquare = null;
        playerColor = isAIOpponent ? (Math.random() < 0.5 ? 'w' : 'b') : 'w';
        moveHistoryTable.innerHTML = '';
        createBoard();
        updateStatus();
        updateEvaluationBar();
        if (isAIOpponent && playerColor === 'b') {
            setTimeout(makeAIMove, 250);
        }
        takeBackBtn.style.display = 'inline-block';
    }

    function toggleOpponent() {
        isAIOpponent = !isAIOpponent;
        toggleOpponentBtn.textContent = isAIOpponent ? "Switch to Human Opponent" : "Switch to AI Opponent";
        restartGame();
    }

    function takeBack() {
        if (game.history().length === 0) return;

        game.undo();
        if (isAIOpponent) {
            game.undo();
        }
        
        selectedSquare = null;
        createBoard();
        updateStatus();
        updateEvaluationBar();
        
        const rowsToRemove = isAIOpponent ? 2 : 1;
        for (let i = 0; i < rowsToRemove; i++) {
            if (moveHistoryTable.rows.length > 0) {
                moveHistoryTable.deleteRow(moveHistoryTable.rows.length - 1);
            }
        }

        takeBackBtn.style.display = 'inline-block';
    }

    function saveGame() {
        if (game.game_over()) {
            const moves = game.history().join(' ');
            const result = game.in_checkmate() ? (game.turn() === 'w' ? 'Black wins' : 'White wins') : 'Draw';
            const gameName = `Game ${new Date().toLocaleString()}`;

            fetch('save_game.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `game_name=${encodeURIComponent(gameName)}&moves=${encodeURIComponent(moves)}&result=${encodeURIComponent(result)}`,
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === "success") {
                    console.log(data.message);
                    loadSavedGames(); // Refresh the saved games list
                } else {
                    console.error("Error: " + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
    }

    restartBtn.addEventListener('click', restartGame);
    copyHistoryBtn.addEventListener('click', () => {
        const history = game.history().join(' ');
        navigator.clipboard.writeText(history).then(() => {
            alert('Move history copied to clipboard!');
        });
    });
    toggleOpponentBtn.addEventListener('click', toggleOpponent);
    takeBackBtn.addEventListener('click', takeBack);

    restartGame();
    toggleOpponentBtn.textContent = "Switch to Human Opponent";
});