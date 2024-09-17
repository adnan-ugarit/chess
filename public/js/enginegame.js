function EngineGame(option){
	var hint = false;
    var board;
	var $board = $('#board');
	var squareClass = 'square-55d63';
	var env = $("#env").data("env");
	option = option?option:'s';
	if(option == 's')
		var engine = new Worker('../lib/engines/stockfish-10.0.2.js');
	else if(option == 't')
		var engine = new Worker('../lib/engines/tomitankChess-4.0.0.js');
	else if(option == 'l')
		var engine = new Worker('../lib/engines/lozza-1.18.0.js');
	
    // show the engine status to the front end
    var isEngineReady = false; // default
	var engineInfo = '';

    var time = {};
	var playerColor = $("#board").data('side'); // default is 'white'

    //interface to send commands to the UCI
    function uciCmd(cmd){
        console.log("[INPUT] UCI: " + cmd);
        engine.postMessage(cmd);
    }

    // tell the engine to use UCI
    uciCmd('uci');
	
	// tell the engine (Stockfish) to use Ponder
	if(option == 's')
		uciCmd('setoption name Ponder value true');

    function reportEngineStatus(){
		var engine;
		if(option == 's')
			engine = 'Stockfish';
		else if(option == 't')
			engine = 'TomitankChess';
		else if(option == 'l')
			engine = 'Lozza';
        var status = 'Engine (' + engine + '): ';
        if(!isEngineReady){
            status+='Loading ...';
        } else {
            status+='Ready';
        }
		if(engineInfo) {
			status += '<br>' + engineInfo;
		}
        $("#engineStatus").html(status);
    }
	
    //get all the moves were made 
    function getMoves(){
        var moves = "";
        var history = board.getMoveHistory();
        for(var i =0;i<history.length;i++){
            var move = history[i];
            moves+= " " + move.from + move.to + (move.promotion?move.promotion:"");
        }
        console.log("******************");
        console.log("MOVES : " + moves);
        return moves;
    }
	
    //prepare the move, this function asks the engine to start
    //look for best move, the engine will invoke onmessage when
    //it has completed search within specific depth
    function prepareMove(){
        $('#pgn').html(board.getPgn());
       
        console.log("CPU is thinking ... ");
		
        //update the latest board positions before search for moves
        board.setFenPosition();
		
        var turn = board.getTurn()=='w'?'white':'black';

        if(!board.isGameOver() && turn!=playerColor){
			$board.find('.' + squareClass).removeClass('highlight-yellow');
			
            //tell the engines all the moves that were made
            uciCmd('position startpos moves ' + getMoves());
			
            //start searching, if depth exists, use depth paramter, else let the engine use default
            uciCmd('go '+(time.depth?'depth ' + time.depth:''));
        }
    }

    engine.onmessage = function(event){
        var line = event.data?event.data:event;
        console.log("[OUTPUT] UCI :" + line);
        if(line == 'readyok'){
            isEngineReady=true;
            reportEngineStatus();
		}
		else if(line == 'readyok '){ // for Lozza
            isEngineReady=true;
            reportEngineStatus();
        } else {
            var match = line.match(/^bestmove ([a-h][1-8])([a-h][1-8])([qrbn])?/);
            console.log("match " + match);
            if(match){
				if(hint){
					$board.find('.' + squareClass).removeClass('highlight-yellow');
					$board.find('.square-' + match[1]).addClass('highlight-yellow');
					$board.find('.square-' + match[2]).addClass('highlight-yellow');
					hint = false;
				}
				else {
					board.makeMove(match[1],match[2],match[3]);
					prepareMove();
					
					// highlight move
					$board.find('.' + squareClass).removeClass('highlight-blue');
					$board.find('.square-' + match[1]).addClass('highlight-blue');
					board.setSquareToHighlight(match[2]);
							
					if(board.getPiece(match[2]).type == 'k'){
						if(board.getPiece(match[2]).color == 'b')
							board.setBlackKing(match[2]);
						else
							board.setWhiteKing(match[2]);
					}
					$board.find('.' + squareClass).removeClass('highlight-red');
					if(board.isCheck()){
						if(playerColor == 'white')
							$board.find('.square-' + board.getWhiteKing()).addClass('highlight-red');
						else
							$board.find('.square-' + board.getBlackKing()).addClass('highlight-red');
					}
				}
            }
			else if(option == 's') {
				if(match = line.match(/^info .*\bdepth (\d+) .*\bnodes (\d+) .*\bnps (\d+)/)) {
					engineInfo = 'Depth: ' + match[1] + ', Nodes: ' + match[2] + ', Nps: ' + match[3];
					reportEngineStatus();
				}
			}
			else if(option == 't') {
				if(match = line.match(/^info .*\bdepth (\d+) .*\bnodes (\d+)/)) {
					engineInfo = 'Depth: ' + match[1] + ', Nodes: ' + match[2];
					reportEngineStatus();
				}
			}
			else if(option == 'l') {
				if(match = line.match(/^info .*\bnodes (\d+) .*\bnps (\d+) .*\bdepth (\d+)/)) {
					engineInfo = 'Depth: ' + match[3] + ', Nodes: ' + match[1] + ', Nps: ' + match[2];
					reportEngineStatus();
				}
			}
        }
    };
    
    return {
        setBoard:function(newBoard){
            board = newBoard;
        },
        setSkillLevel:function(skill){
			var max_err, err_prob;
			
			if (!skill && !(skill===0)) {
				skill = parseInt(env.SKILL_LEVEL);
				$('#skillLevel').val(skill);
			}
			if (skill < 0) {
				skill = 0;
				$('#skillLevel').val(skill);
			}
			if (skill > 20) {
				skill = 20;
				$('#skillLevel').val(skill);
			}
			
			/// Change thinking depth allowance.
			if (skill < 5) {
				time.depth = "1";
			} else if (skill < 10) {
				time.depth = "2";
			} else if (skill < 15) {
				time.depth = "3";
			} else if (option == 'l') {
				time.depth = env.DEPTH_LOZZA;
			} else {
			/// Let the engine decide.
				time.depth = "";
			}
			
			uciCmd('setoption name Skill Level value ' + skill);
			///NOTE: Stockfish level 20 does not make errors (intentially), so these numbers have no effect on level 20.
			/// Level 0 starts at 1
			err_prob = Math.round((skill * 6.35) + 1);
			/// Level 0 starts at 10
			max_err = Math.round((skill * -0.5) + 10);
			
			uciCmd('setoption name Skill Level Maximum Error value ' + max_err);
			uciCmd('setoption name Skill Level Probability value ' + err_prob);
        },
        start:function(){
            uciCmd('ucinewgame');
            uciCmd('isready');
            reportEngineStatus();
            prepareMove();
        },
		hint:function(){
			if(!board.isGameOver()) {
				//tell the engines all the moves that were made
				uciCmd('position startpos moves ' + getMoves());
				
				//start searching, if depth exists, use depth paramter, else let the engine use default
				uciCmd('go '+(time.depth?'depth ' + time.depth:''));
				
				hint = true;
			}
        },
        prepareAiMove:function(){
            prepareMove();
        }
    }
}
