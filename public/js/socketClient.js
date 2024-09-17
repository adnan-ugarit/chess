function SocketClient(){
	/*
     * When the user is logged in, it's name is loaded in the "data" attribute of the "#loggedUser" element.
     * This name is then passed to the socket connection handshake query
     */
    var username;
    if($("#loggedUser").length) {
        username = $("#loggedUser").data("user");
    } else {
        username = "AU";
    }
	var path = window.location.protocol + '//' + window.location.hostname + ':' + window.location.port;
	
    // socket used for real time games
    var socket = io(path, { query: 'user=' + username });

    // socket used to broadcast events to monitoring page
    var monitorSocket = io(path + '/monitor');
	
	var board;
	
	/*
     * Game page
     */
    if ($("#board").length) {

        /*
         * Initialize a new game
         */
        var token = $("#board").data('token');
        var side = $("#board").data('side');
        var opponentSide = side === "black" ? "white" : "black";
		var env = $("#env").data("env");
		
	    /*
         * Timer : displays time taken by each player while making moves
         */
        var timer=function(time_set)
        {
            if(true)
            {
                if(board.getTurn().toString()=='w')
                {
					if(!token) {
						time_set[0]+=1;
					}
					else {
						 time_set[0]-=1;
						if(time_set[0]<0)
						{
							//handle time out
							$('#gameResult').html('Game Over, Time out, Black won');
							$('#resultGame').val(1);
							$('#userWin').val($('#player-black').html());
							$('#gameResultPopup').modal({
								keyboard: false,
								backdrop: 'static'
							});
							clearInterval(timer_interval);
						}
					}
                    $("#timew").html(("0" + Math.floor(time_set[0]/3600)%60).slice (-2)+":"+("0" + Math.floor(time_set[0]/60)%60).slice (-2)+":"+("0" + time_set[0]%60).slice (-2));
                }
                if(board.getTurn().toString()=='b')
                {
					if(!token) {
						time_set[1]+=1;
					}
					else {
						time_set[1]-=1;
						if(time_set[1]<0) {
							//handle time out
							$('#gameResult').html('Game Over, Time out, White won');
							$('#resultGame').val(1);
							$('#userWin').val($('#player-white').html());
							$('#gameResultPopup').modal({
								keyboard: false,
								backdrop: 'static'
							});
							clearInterval(timer_interval);
						}
					}
                    $("#timeb").html(("0" + Math.floor(time_set[0]/3600)%60).slice (-2)+":"+("0" + Math.floor(time_set[1]/60)%60).slice (-2)+":"+("0" + time_set[1]%60).slice (-2));
                }
            }
            return time_set;
        };
		
		/*
         * When the game page is loaded, fire a join event to join the game room
         */
		if(token) {
			socket.emit('join', {
				'token': token,
				'side': side
			});
			socket.on('reconnect', function(){
				window.location = window.location.href;
			});
		}

        /*
         * When a new game is created, the game creator should wait for an opponent to join the game
         */
        socket.on('wait', function () {
            var url = "https://" + env.DOMAIN + ":" + env.PORT + "/game/" + token + "/" + opponentSide;
            $('#gameUrl').html(url);
            $('#gameUrlPopup').modal({ // show modal popup to wait for opponent
                keyboard: false,
                backdrop: 'static'
            });
        });

        /*
         * A second player has joined the game => the game can start
         */
        socket.on('ready', function (data) {
			//intialize the timer
			var time = data.time?data.time:parseInt(env.TIME)*60;
            var time_sets=[time,time];
			$("#timew").html(("0" + Math.floor(time/3600)%60).slice (-2)+":"+("0" + Math.floor(time/60)%60).slice (-2)+":"+("0" + time%60).slice (-2));
			$("#timeb").html(("0" + Math.floor(time/3600)%60).slice (-2)+":"+("0" + Math.floor(time/60)%60).slice (-2)+":"+("0" + time%60).slice (-2));
            var timer_interval = setInterval(function(){ time_sets=timer(time_sets)}, 1000); // repeat every second
            $('#player-white').html(data.white);
            $('#player-black').html(data.black);
            $('#gameUrlPopup').modal('hide');
        });
		
		/*
         * A new move has been made by a player => update the UI
         */
		socket.on('new-move',function(moveData){
			var from, to, promo;
			from = moveData.from;
			to = moveData.to;
			promo = moveData.promotion;
			board.makeMove(from, to, promo);
			board.setFenPosition();
			board.notifyMove(from, to);
			$('#pgn').html(board.getPgn());
		});
		
		/*
		 * A player draw request in the game
		 */
		if(token) {
			$('#drawButton').click(function () {
				$(this).attr("disabled", true); 
				socket.emit('draw', {
					'token': token,
					'side': side
				});
				alert("The request has been sent successfully");
			});
		}
        
        var interval;
		if(!token) {
			var time_sets=[0,0];
			interval = setInterval(function(){ time_sets=timer(time_sets)}, parseInt(env.REPEAT)); // repeat every 100 ms
			if(side == 'white'){
				$('#player-white').html('Human');
				$('#player-black').html('Computer');
			}
			else {
				$('#player-white').html('Computer');
				$('#player-black').html('Human');
			}
		}
        
        /*
		 * A player resigns the game
		 */
		$('#resignButton').click(function (ev) {
			ev.preventDefault();
			if(board.isCompetingCpu()) {
                board.reset();
				board.restartEngine();
				$("#timew").html('00:00:00');
				$("#timeb").html('00:00:00');
				var time_sets=[0,0];
				clearInterval(interval);
				interval = setInterval(function(){ time_sets=timer(time_sets)}, parseInt(env.REPEAT)); // repeat every 100 ms
			}
			else {
				socket.emit('resign', {
                'token': token,
                'side': side
				});
			}
		});
		
		/*
         * Notify Drawing
         */
        socket.on('drawing', function () {
            $('#gameResult').html('Game Over, Drawn');
			$('#resultGame').val(0);
			$('#userWin').val('');
            $('#gameResultPopup').modal({
                keyboard: false,
                backdrop: 'static'
            });
        });
		
		/*
         * Notify opponent resignation
         */
        socket.on('player-resigned', function (side) {
			var opponentSide = side === "black" ? "white" : "black";
            $('#gameResult').html(side + ' withdraw, ' + opponentSide + ' won');
			$('#resultGame').val(1);
			if(opponentSide == 'white')
				$('#userWin').val($('#player-white').html());
				$('#userLose').val($('#player-black').html());
			else
				$('#userWin').val($('#player-black').html());
				$('#userLose').val($('#player-white').html());
            $('#gameResultPopup').modal({
                keyboard: false,
                backdrop: 'static'
            });
        });

        /*
         * Notify opponent disconnection
         */
        socket.on('opponent-disconnected', function (side) {
			$('#gameResult').html('Your opponent has been disconnected! - You win');
			$('#resultGame').val(1);
			if(side == 'black')
				$('#userWin').val($('#player-white').html());
			else
				$('#userWin').val($('#player-black').html());
			$('#gameResultPopup').modal({
				keyboard: false,
				backdrop: 'static'
			});
        });

        /*
         * Notify that the game is full => impossible to join the game
         */
        socket.on('full', function () {
            alert("This game has been already joined by another person.");
            window.location = '/';
        });
		
		/*
         * Notify that the user is found in the game => impossible to join the game
         */
        socket.on('user', function () {
            alert("This user is already found in this game.");
            window.location = '/';
        });
		
		/*
         * Notify that the side is found in the game => impossible to join the game
         */
        socket.on('side', function () {
            alert("This side has been already used by another person.");
            window.location = '/';
        });
		
		//Send message to opponent
		$('#sendButton').click(function (ev) {
			var message = $('#chat').val();
			if(message.length == 0) {
				return;
			}
			socket.emit("sendMessage", token, message);
			var li = $('<li/>').append($('<p/>',{
				text: message,
				class: "message recipient-message"
			}));
			$('#messages').append(li);
			$('#chat').val('');
		});
		
		//recieve message from other player
		socket.on('receiptMessage', function(message){
			var li = $('<li/>').append($('<p/>',{
				text: message,
				class: "message sender-message"
			}));
			$('#messages').append(li);
		});
		
		socket.on('draw-request', function(id) {
			var confirm = window.confirm("Draw request from " + opponentSide + ", Do you accept?");
			if(confirm){
				socket.emit("accept-draw", token);
			}
			else {
				socket.emit("deny-draw", id);
			}
		});
		
		socket.on('drawIsDeny', function() {
			alert('Draw is deny');
			$('#drawButton').attr("disabled", false);
		});
		
		/*
		 * Reply from friend has been arrived here => handle message
		 */
		socket.on('replyFromPlayer', function(msg) {
			var message = 'Your friend ' + msg + ', try with other friend';
			alert(message);
		});
	}
	
	/*
     * Friend request from player has been arrived here => reply to him
     */
	socket.on('friendRequestFrom', function(player, url, time, id) {
		var token = $("#board").data('token');
		if(!token){
			var confirm = window.confirm("Join request from " + player + ", Time is " + time + " minutes, Do you accept?");
			if(confirm){
				socket.emit("time", time);
				window.location = url;
			}
			else {
				socket.emit("replyToPlayer", "deny", id);
			}
		}
		else {
			socket.emit("replyToPlayer", "ingame", id);
		}
	});
	
	/*
	 * Reply from friend has been arrived here => handle message
	 */
	socket.on('check-notify', function() {
		board.setCheck()
	});
	
	/*
     * Monitoring page
     */
    if ($("#monitor").length) {
        var nbUsers, nbGames;
        monitorSocket.on('update', function(data) {
			/*
             * load monitoring event data
             */
            nbUsers = data.nbUsers;
            nbGames = data.nbGames;
            $("#nbUsers").html(nbUsers);
            $("#nbGames").html(nbGames);
        });
    }
	
    return {
        setBoard:function(newBoard){
            board= newBoard;
        },
		requestFriend:function(friend, time){
			var url = $('#gameUrl').html();
            socket.emit("friendRequestTo", friend, url, time);
        },
        sendMove:function(move){
            socket.emit("new-move", move);
        },
		sendCheckTo:function(side, token){
		socket.emit("check", { side, token });
        }
    }
}