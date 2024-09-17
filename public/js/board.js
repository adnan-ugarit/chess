function Board(){
    var socket;
    var game = Chess();
    var chessEngine;
	var env = $("#env").data("env");
	var flag = true; // for squareToHighlight
	var adnan = []; // for redo()
	var token = $("#board").data('token');
    var side = $("#board").data('side');
	if(token)
		var isStockfishOn = false;
	else
		var isStockfishOn = true;
	var updateStatus;
	var $board = $('#board');
	var bK='e8', wK='e1';
	var squareToHighlight = null;
	var squareClass = 'square-55d63';
	var whiteSquareGrey = '#a9a9a9';
	var blackSquareGrey = '#696969';
    
	function removeGreySquares () {
		$('#board .square-55d63').css('background', '');
	}
	
	function greySquare (square) {
		var $square = $('#board .square-' + square);
		var background = whiteSquareGrey;
		if ($square.hasClass('black-3c85d')) {
			background = blackSquareGrey;
		}
		$square.css('background', background);
	}
	
	function onMouseoverSquare (square, piece) {
		// get list of possible moves for this square
		var moves = game.moves({
			square: square,
			verbose: true
		});

		// exit if there are no moves available for this square
		if (moves.length === 0) return

		// highlight the square they moused over
		greySquare(square);

		// highlight the possible squares for this piece
		for (var i = 0; i < moves.length; i++) {
			greySquare(moves[i].to);
		}
	}
	
	function onMouseoutSquare (square, piece) {
		removeGreySquares();
	}
	
	/*
     * When a piece is dragged, check if it the current player has the turn
     */
    var onDragStart = function(source, piece, position, orientation) {
		// do not pick up pieces if the game is over
		if (game.game_over()) return false;
		
		 // only pick up pieces for the side to move
        if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
		    (game.turn() === 'b' && piece.search(/^w/) !== -1) ||
	      	(game.turn() !== orientation.charAt(0))) {
			return false;
		}
	};
	
	/*
     * When a piece is dropped, check if the move is legal
    */
	var onDrop = function(source, target) {
		flag = true;
		removeGreySquares();
		
		// see if the move is legal
		var move = game.move({
			from: source,
			to: target,
			promotion: document.getElementById("promote").value
		});

		// illegal move
		if (move === null) return 'snapback';
		
		if(isStockfishOn && adnan.length != 0)
			adnan = []; // for stop redo()
		$('#pgn').html(game.pgn());
		
		if(game.get(move.to).type == 'k')
			if(game.get(move.to).color == 'b')
				bK = move.to;
			else
				wK = move.to;
		$board.find('.' + squareClass).removeClass('highlight-red');
		
		//player just end turn, CPU starts searching
		if(isStockfishOn) {
			//setTimeout(chessEngine.prepareAiMove(),500);
			chessEngine.prepareAiMove();
		}
		else {
			move.token = token;
			socket.sendMove(move);
		}
		
		if(game.in_check())
			if(isStockfishOn) {
				if(side == 'white')
					$board.find('.square-' + bK).addClass('highlight-red');
				else
					$board.find('.square-' + wK).addClass('highlight-red');
			}
			else {
				var opponentSide = side === "black" ? "white" : "black";
				socket.sendCheckTo(opponentSide, token);
			}
		updateStatus();
    };
	
	// update the board position after the piece snap
    // for castling, en passant, pawn promotion
	var onSnapEnd = function() {
		board.position(game.fen());
    };
	
	function onMoveEnd () {
		if(flag)
			$board.find('.square-' + squareToHighlight).addClass('highlight-blue');
		updateStatus();
	}
	
	var announced_game_over;
	updateStatus = function() {
		if (announced_game_over) {
            return;
        }
		if (game.game_over()) {
            announced_game_over = true;
			if(game.in_stalemate()) {
				if(isStockfishOn)
					alert("Game Over, Stalemate, Drawn");
				else {
					$('#gameResult').html('Game Over, Stalemate, Drawn');
					$('#resultGame').val(0);
					$('#userWin').val('');
					$('#gameResultPopup').modal({
						keyboard: false,
						backdrop: 'static'
					});
				}
			}
			else if(game.in_threefold_repetition()) {
				if(isStockfishOn)
					alert("Game Over, Threefold repetition, Drawn");
				else {
					$('#gameResult').html('Game Over, Threefold repetition, Drawn');
					$('#resultGame').val(0);
					$('#userWin').val('');
					$('#gameResultPopup').modal({
						keyboard: false,
						backdrop: 'static'
					});
				}
			}
			else if(game.insufficient_material()) {
				if(isStockfishOn)
					alert("Game Over, Insufficient material, Drawn");
				else {
					$('#gameResult').html('Game Over, Insufficient material, Drawn');
					$('#resultGame').val(0);
					$('#userWin').val('');
					$('#gameResultPopup').modal({
						keyboard: false,
						backdrop: 'static'
					});
				}
			}
			else if(game.in_draw()) { // fifty move rule
				if(isStockfishOn)
					alert("Game Over, Fifty move rule, Drawn");
				else {
					$('#gameResult').html('Game Over, Fifty move rule, Drawn');
					$('#resultGame').val(0);
					$('#userWin').val('');
					$('#gameResultPopup').modal({
						keyboard: false,
						backdrop: 'static'
					});
				}
			}
			else {
				if(isStockfishOn) {
					var result = "Game Over, ";
					if(game.turn() == 'b')
						result += 'White';
					else
						result += 'Black';
					result += " won";
					alert(result);
				}
				else {
					$('#resultGame').val(1);
					if(game.turn() == 'b') {
						$('#userWin').val($('#player-white').html());
						$('#gameResult').html('Game Over, White won');
					}
					else {
						$('#userWin').val($('#player-black').html());
						$('#gameResult').html('Game Over, Black won');
					}
					$('#gameResultPopup').modal({
						keyboard: false,
						backdrop: 'static'
					});
				}
			}
        }
	};
	
	/*
     * Initialize a new board
     */
	var style;
	if(!token) {
		style = document.getElementById('chessPieces').value;
		if(style == 'w')
			style = 'wikipedia';
		else if(style == 'a')
			style = 'alpha';
		else if(style == 'u')
			style = 'uscf';
	}
	style = style? style : 'wikipedia';
    var cfg = {
		pieceTheme: '/img/chesspieces/' + style + '/{piece}.png',
        showErrors: console,
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
		onSnapEnd: onSnapEnd,
		onMoveEnd: onMoveEnd,
		snapbackSpeed: env.SNAPBACK_SPEED,
		moveSpeed: env.MOVE_SPEED,
		onMouseoutSquare: onMouseoutSquare,
		onMouseoverSquare: onMouseoverSquare,
        orientation: side?side:'white'
    };
    var board = new ChessBoard('board', cfg);
	
    return {
        competingHuman:function(){
            isStockfishOn = false;
        },
        competingCpu:function(){
            isStockfishOn = true;
        },
		setSocket:function(newSocket){
            socket = newSocket;
        },
		setChessEngine:function(engine){
            chessEngine = engine;
        },
		setOrientation:function(playerColor){
            /*color = playerColor.charAt(0).toLowerCase();
            if(color=='w' || color=='b')
                board.orientation(playerColor);*/
        },
		setFenPosition:function(){
            board.position(game.fen());
		},
		setSquareToHighlight:function(value){
            squareToHighlight = value;
		},
		setBlackKing:function(bK){
            this.bK = bK;
		},
		setWhiteKing:function(wK){
            this.wK = wK;
		},
		getBlackKing:function(){
            return bK;
		},
		getWhiteKing:function(){
            return wK;
		},
		getMoveHistory:function(){
			return game.history({verbose: true});
        },
		getPgn:function(options){
			if(options)
				return game.pgn(options);
			else
				return game.pgn();
        },
		getFen:function(){
            return game.fen();
        },
		getPiece:function(square){
            return game.get(square);
        },
		getTurn:function(){
            return game.turn();
        },
		isCompetingCpu:function(){
            return isStockfishOn;
        },
		isGameOver:function(){
            return game.game_over();
        },
		isCheck:function(){
            return game.in_check();
        },
		makeMove:function(source, target, promo){
            game.move({from: source, to: target, promotion: promo}); // gameEngine.prepareAiMove();
        },
		notifyMove:function(source, target){
            $board.find('.' + squareClass).removeClass('highlight-blue');
			$board.find('.square-' + source).addClass('highlight-blue');
			$board.find('.square-' + target).addClass('highlight-blue');
        },
		setCheck:function(){
            if(side == 'white')
				$board.find('.square-' + wK).addClass('highlight-red');
			else
				$board.find('.square-' + bK).addClass('highlight-red');
		},
		undo:function(){
			var array = game.history();
			if(array.length == 0 && side == 'white')
				return;
			if(array.length == 1 && side == 'black')
				return;
			adnan.push(array[array.length-2]);
			adnan.push(array[array.length-1]);
            game.undo();
            game.undo();
			$board.find('.' + squareClass).removeClass('highlight-red');
			$board.find('.' + squareClass).removeClass('highlight-blue');
			$board.find('.' + squareClass).removeClass('highlight-yellow');
			flag = false;
			announced_game_over = false;
			chessEngine.prepareAiMove();
        },
		redo:function(){
			if(adnan.length == 0)
				return;
            var mv1, mv2;
			mv1 = adnan.pop();
			mv2 = adnan.pop();
			game.move(mv2);
			game.move(mv1);
			$('#pgn').html(game.pgn());
			board.position(game.fen());
        },
		loadPgn: function(pgn) {
			if(!game.load_pgn(pgn))
				return false;
			adnan = []; // for stop redo()
			$board.find('.' + squareClass).removeClass('highlight-red');
			$board.find('.' + squareClass).removeClass('highlight-blue');
			$board.find('.' + squareClass).removeClass('highlight-yellow');
			if(side == 'white')
				flag = false;
			chessEngine.prepareAiMove();
			return true;
		},
		restartEngine: function() {
			chessEngine.prepareAiMove();
		},
		destroy: function() {
			board.destroy();
		},
		reset:function(){
			adnan = []; // for stop redo()
			bK='e8';
			wK='e1';
			$board.find('.' + squareClass).removeClass('highlight-red');
			$board.find('.' + squareClass).removeClass('highlight-blue');
			$board.find('.' + squareClass).removeClass('highlight-yellow');
			if(side == 'white')
				flag = false;
			$('#pgn').html('');
            game.reset();
            board.start();
			announced_game_over = false;
        }
    }
}