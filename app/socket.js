module.exports = function (io) {
	
	var mongoose = require('mongoose');
	var User = mongoose.model('User');
	
	var games = {};
	var names = [];
    var users = 0;
	var times = [];

    /*
     * Socketio to monitor events
     */
    var monitor = io.of('/monitor');
    monitor.on('connection', function(socket){
        socket.emit('update', {nbUsers: users, nbGames: Object.keys(games).length});
    });

    /*
     * Socketio event handlers
     */
    io.sockets.on('connection', function (socket) {

        var user = socket.handshake.query.user;
		if(user != 'AU') {
			User.findOneAndUpdate({username: user}, { status: 'online' }, {} ,function (err, user) {});
			names.push({ id: socket.id, name: user });
		}
		
        users++;
        monitor.emit('update', {nbUsers: users, nbGames: Object.keys(games).length});
		
		socket.on('time', function (t) {
			times.push({ time: t, name: user });
		});

        /*
         * Player joins a game
         */
        socket.on('join', function (data) {
            var room = data.token;

            // If player is the first to join, initialize players and game array
            if (!(room in games)) {
                var players = [{
                    socket: socket,
                    name: user,
                    status: 'joined',
                    side: data.side
                }, {
                    socket: null,
                    name: "",
                    status: 'open',
                    side: data.side === "black" ? "white" : "black"
                }];
                games[room] = {
                    room: room,
                    creator: socket,
                    status: 'waiting',
                    creationDate: Date.now(),
                    players: players
                };

                socket.join(room);
                socket.emit('wait'); // tell the game creator to wait until a opponent joins the game
                return;
            }

            var game = games[room];

            /* a third player attempts to join the game after already 2 players has joined the game*/
            if (game.status === "ready") {
                socket.emit('full');
				return;
            }
			
			/* a player attempts to join the game with a user that already there in the room*/
			if(user == game.players[0].name) {
				socket.emit('user');
				return;
			}
			
			/* a player attempts to join the game with a side that already there in the room*/
			if(data.side == game.players[0].side) {
				socket.emit('side');
				return;
			}
			
            socket.join(room);
            game.players[1].socket = socket;
            game.players[1].name = user;
            game.players[1].status = "joined";
            game.status = "ready";
			
			var time = null;
			for(var i=0;i<times.length;i++){
				if(times[i].name == user){
					time = times[i].time * 60;
					times.splice(i,1);
					break;
				}
			}
			
            io.sockets.to(room).emit('ready', { white: getPlayerName(room, "white"), black: getPlayerName(room, "black"), time: time });

        });
		
		/*
         * A player send request to friend => broadcast that request to the user (friend)
         */
        socket.on('friendRequestTo', function(friend, url, time) {
			for(var i=0;i<names.length;i++){
				if(names[i].name === friend){
					socket.broadcast.to(names[i].id).emit('friendRequestFrom', user, url, time, socket.id);
					break;
				}
			}
        });
		
		/*
         * A friend send reply to player => broadcast that reply to the user (player)
         */
        socket.on('replyToPlayer', function(msg, id) {
			socket.broadcast.to(id).emit('replyFromPlayer', msg);
        });

        /*
         * A player makes a new move => broadcast that move to the opponent
         */
        socket.on('new-move', function(data) {
            socket.broadcast.to(data.token).emit('new-move', data);
        });
		
		/*
         * Check => notify opponent
         */
        socket.on('check', function (data) {
			var game = games[data.token];
			var player;
			if(game.players[0].side == data.side)
				player = game.players[0];
			else
				player = game.players[1];
			socket.broadcast.to(player.socket.id).emit('check-notify');
        });
		
		/*
         * A player send a message => broadcast that message to the opponent
         */
        socket.on('sendMessage', function(token, message) {
            socket.broadcast.to(token).emit('receiptMessage', message);
        });
		
		/*
         * A player draw request => notify opponent
         */
        socket.on('draw', function (data) {
			var game = games[data.token];
			var player;
			if(game.players[0].side == data.side)
				player = game.players[1];
			else
				player = game.players[0];
			socket.broadcast.to(player.socket.id).emit('draw-request', socket.id);
        });
		
		/*
         * A player send deny draw => broadcast that reply to opponent
         */
        socket.on('deny-draw', function(id) {
			socket.broadcast.to(id).emit('drawIsDeny');
        });
		
		socket.on("accept-draw", function (room) {
            if (room in games) {
                io.sockets.to(room).emit('drawing');
                games[room].players[0].socket.leave(room);
                games[room].players[1].socket.leave(room);
                delete games[room];
                monitor.emit('update', {nbUsers: users, nbGames: Object.keys(games).length});
            }
        });

        /*
         * A player resigns => notify opponent, leave game room and delete the game
         */
        socket.on('resign', function (data) {
            var room = data.token;
            if (room in games) {
                io.sockets.to(room).emit('player-resigned', data.side);
                games[room].players[0].socket.leave(room);
                games[room].players[1].socket.leave(room);
                delete games[room];
                monitor.emit('update', {nbUsers: users, nbGames: Object.keys(games).length});
            }
        });

        /*
         * A player disconnects => notify opponent, leave game room and delete the game
         */
        socket.on('disconnect', function(){
            users--;
            monitor.emit('update', {nbUsers: users, nbGames: Object.keys(games).length});
			for(var i=0;i<names.length;i++){
				if(names[i].id === socket.id){
					for(var j=i+1;j<names.length;j++){
						if(names[j].name == names[i].name){
							break;
						}
						if(j == names.length-1){
							User.findOneAndUpdate({username: names[i].name}, { status: 'offline' }, {} ,function (err, user) {});
							User.findOneAndUpdate({username: names[i].name}, { lastConnection: new Date() }, {} ,function (err, user) {});
						}
					}
					if(i == names.length-1){
						User.findOneAndUpdate({username: names[i].name}, { status: 'offline' }, {} ,function (err, user) {});
						User.findOneAndUpdate({username: names[i].name}, { lastConnection: new Date() }, {} ,function (err, user) {});
					}
					names.splice(i,1);
					break;
				}
			}
            for (var token in games) {
                var game = games[token];
                for (var p in game.players) {
                    var player = game.players[p];
                    if (player.socket === socket) {
                        socket.broadcast.to(token).emit('opponent-disconnected', player.side);
                        delete games[token];
                        monitor.emit('update', {nbUsers: users, nbGames: Object.keys(games).length});
                    }
                }
            }
        });
    });

    /*
     * Utility function to find the player name of a given side.
     */
    function getPlayerName(room, side) {
        var game = games[room];
        for (var p in game.players) {
            var player = game.players[p];
            if (player.side === side) {
                return player.name;
            }
        }
    }
};