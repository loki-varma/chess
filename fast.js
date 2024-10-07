function getBestMove(game, depth) {
    const openingMove = getOpeningMove(game);
    if (openingMove) {
        return openingMove;
    }
    return iterativeDeepeningSearch(game, depth);
}

function iterativeDeepeningSearch(game, maxDepth) {
    let bestMove = null;
    let bestScore = -Infinity;
    const startTime = Date.now();
    const timeLimit = 2500; // 2.5 seconds time limit

    for (let depth = 1; depth <= maxDepth; depth++) {
        const result = minimaxRoot(depth, game, true, -Infinity, Infinity, startTime, timeLimit);
        
        if (result.timeOut) {
            console.log(`Reached time limit at depth ${depth}`);
            break;
        }

        bestMove = result.move;
        bestScore = result.score;

        console.log(`Depth ${depth}: Best move ${bestMove.san}, score ${bestScore}`);
    }

    return bestMove;
}

function minimaxRoot(depth, game, isMaximizingPlayer, alpha, beta, startTime, timeLimit) {
    const newGameMoves = orderMoves(game.moves({ verbose: true }), game);
    let bestMove = null;
    let bestValue = isMaximizingPlayer ? -Infinity : Infinity;

    for (let i = 0; i < newGameMoves.length; i++) {
        const newGameMove = newGameMoves[i];
        game.move(newGameMove);
        const value = minimax(depth - 1, game, -beta, -alpha, !isMaximizingPlayer, startTime, timeLimit);
        game.undo();

        if (typeof value === 'object' && value.timeOut) {
            return { move: bestMove, score: bestValue, timeOut: true };
        }

        if (isMaximizingPlayer) {
            if (value > bestValue) {
                bestValue = value;
                bestMove = newGameMove;
            }
            alpha = Math.max(alpha, value);
        } else {
            if (value < bestValue) {
                bestValue = value;
                bestMove = newGameMove;
            }
            beta = Math.min(beta, value);
        }

        if (beta <= alpha) {
            break;
        }

        if (Date.now() - startTime > timeLimit) {
            return { move: bestMove, score: bestValue, timeOut: true };
        }
    }

    return { move: bestMove, score: bestValue, timeOut: false };
}

function minimax(depth, game, alpha, beta, isMaximizingPlayer, startTime, timeLimit) {
    if (depth === 0 || game.game_over()) {
        return evaluateBoard(game.board());
    }

    if (Date.now() - startTime > timeLimit) {
        return { timeOut: true };
    }

    const newGameMoves = orderMoves(game.moves(), game);

    if (isMaximizingPlayer) {
        let bestValue = -Infinity;
        for (let i = 0; i < newGameMoves.length; i++) {
            game.move(newGameMoves[i]);
            const value = minimax(depth - 1, game, alpha, beta, !isMaximizingPlayer, startTime, timeLimit);
            game.undo();
            if (typeof value === 'object' && value.timeOut) return value;
            bestValue = Math.max(bestValue, value);
            alpha = Math.max(alpha, bestValue);
            if (beta <= alpha) {
                break;
            }
        }
        return bestValue;
    } else {
        let bestValue = Infinity;
        for (let i = 0; i < newGameMoves.length; i++) {
            game.move(newGameMoves[i]);
            const value = minimax(depth - 1, game, alpha, beta, !isMaximizingPlayer, startTime, timeLimit);
            game.undo();
            if (typeof value === 'object' && value.timeOut) return value;
            bestValue = Math.min(bestValue, value);
            beta = Math.min(beta, bestValue);
            if (beta <= alpha) {
                break;
            }
        }
        return bestValue;
    }
}

function evaluateBoard(board) {
    let totalEvaluation = 0;
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            totalEvaluation += getPieceValue(board[i][j], i, j);
        }
    }
    return totalEvaluation;
}

function getPieceValue(piece, x, y) {
    if (piece === null) {
        return 0;
    }

    const absoluteValue = getAbsoluteValue(piece, piece.color === 'w', x, y);
    return piece.color === 'w' ? absoluteValue : -absoluteValue;
}

function getAbsoluteValue(piece, isWhite, x, y) {
    const pieceType = piece.type;
    const piecePositionBonus = isWhite ? positionBonus[pieceType][y][x] : positionBonus[pieceType][7 - y][x];

    switch (pieceType) {
        case 'p': return 100 + piecePositionBonus;
        case 'r': return 500 + piecePositionBonus;
        case 'n': return 320 + piecePositionBonus;
        case 'b': return 330 + piecePositionBonus;
        case 'q': return 900 + piecePositionBonus;
        case 'k': return 20000 + piecePositionBonus;
        default: throw "Unknown piece type: " + pieceType;
    }
}

const positionBonus = {
    'p': [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ],
    'n': [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    'b': [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    'r': [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
    ],
    'q': [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ],
    'k': [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
    ]
};

function getOpeningMove(game) {
    const openingBook = {
        '': ['e4', 'd4', 'Nf3'],
        'e4': ['e5', 'c5', 'e6', 'c6'],
        'd4': ['d5', 'Nf6', 'e6'],
        'Nf3': ['d5', 'Nf6'],
    };

    const history = game.history();
    const position = history.join(' ');

    if (openingBook[position]) {
        const moves = openingBook[position];
        const legalMoves = game.moves();
        const validOpeningMoves = moves.filter(move => legalMoves.includes(move));
        if (validOpeningMoves.length > 0) {
            return validOpeningMoves[Math.floor(Math.random() * validOpeningMoves.length)];
        }
    }

    return null;
}

function orderMoves(moves, game) {
    return moves.sort((a, b) => {
        const aScore = evaluateMove(a, game);
        const bScore = evaluateMove(b, game);
        return bScore - aScore;
    });
}

function evaluateMove(move, game) {
    let score = 0;
    if (move.captured) {
        score += getPieceValueSimple(move.captured);
    }
    if (move.promotion) {
        score += getPieceValueSimple(move.promotion) - getPieceValueSimple('p');
    }
    return score;
}

function getPieceValueSimple(piece) {
    const values = { 'p': 1, 'n': 3, 'b': 3, 'r': 5, 'q': 9, 'k': 0 };
    return values[piece.toLowerCase()] || 0;
}