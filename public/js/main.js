var init = function() {
    var socket = SocketClient();
	
	/*
     * Show error message on login failure
     */
    if ($("#loginError").length && !$("#loginError").is(':empty')) {
		
        Messenger({
            extraClasses: 'messenger-fixed messenger-on-right messenger-on-bottom'
        }).post({
            message: $("#loginError").html(),
            type: 'error',
            showCloseButton: true,
            hideAfter: 10
        });
    }

    /*
     * Show error message on registration failure
     */
    if ($("#registerError").length && !$("#registerError").is(':empty')) {

        Messenger({
            extraClasses: 'messenger-fixed messenger-on-right messenger-on-bottom'
        }).post({
            message: $("#registerError").html(),
            type: 'error',
            showCloseButton: true,
            hideAfter: 10
        });
    }

    /*
     * Show message on successful logout
     */
    if ($("#logoutSuccess").length && !$("#logoutSuccess").is(':empty')) {

        Messenger({
            extraClasses: 'messenger-fixed messenger-on-right messenger-on-bottom'
        }).post({
            message: $("#logoutSuccess").html(),
            type: 'success',
            showCloseButton: true,
            hideAfter: 10
        });
    }

    /*
     * Show welcome message on registration or login success
     */
    if ($("#welcomeMessage").length && !$("#welcomeMessage").is(':empty')) {

        Messenger({
            extraClasses: 'messenger-fixed messenger-on-right messenger-on-bottom'
        }).post({
            message: $("#welcomeMessage").html(),
            type: 'success',
            showCloseButton: true,
            hideAfter: 10
        });
    }

    /*
     * Show message on account update success
     */
    if ($("#updateStatus").length && !$("#updateStatus").is(':empty')) {
        var ok = $("#updateStatus").data('ok');

        Messenger({
            extraClasses: 'messenger-fixed messenger-on-right messenger-on-bottom'
        }).post({
            message: $("#updateStatus").html(),
            type: ok ? 'success' : 'error',
            showCloseButton: true,
            hideAfter: 10
        });
    }
	
	if ($("#board").length) {
		var board = Board();
		board.setSocket(socket);
		socket.setBoard(board);
		var saveData = function(data, fileName) {
			var a = document.createElement("a");
			document.body.appendChild(a);
			a.style = "display: none";
			var json = JSON.stringify(data),
				blob = new Blob([data], {type: "text/plain;charset=utf-8"}),
				url = window.URL.createObjectURL(blob);
			a.href = url;
			a.download = fileName;
			a.click();
			window.URL.revokeObjectURL(url);
		};
		
		$('#saveButton').click(function (ev) {
			//ev.preventDefault();
			var pgn = board.getPgn({ max_width: 5, newline_char: '\n' });
			saveData(pgn, "pgn.txt");
		});
	}
	
	if ($("#board").length && !board.isCompetingCpu()) {
		document.getElementById("friend").addEventListener("change", function () {
			if(this.value == 'c') {
				alert("Choose a friend");
			}
			else {
				var time = $('#time').val();
				socket.requestFriend(this.value, time);
				alert("The request has been sent successfully");
			}
		});
	}

	if ($("#board").length && board.isCompetingCpu()) {
		var engine = EngineGame();
		board.setChessEngine(engine);
		engine.setBoard(board);
        engine.setSkillLevel(parseInt($('#skillLevel').val()));
        engine.start();
		$('#skillLabel').tooltip();
		
		document.getElementById("engine").addEventListener("change", function () {
			engine = EngineGame(this.value);
			board.setChessEngine(engine);
			engine.setBoard(board);
			engine.setSkillLevel(parseInt($('#skillLevel').val()));
			engine.start();
		});
		
		document.getElementById("skillLevel").addEventListener("change", function () {
			engine.setSkillLevel(parseInt(this.value));
		});
		
		document.getElementById("chessPieces").addEventListener("change", function () {
			var confirm = window.confirm("This option will restart the game, Do you accept?");
			if(confirm){
				board.destroy();
				board = Board();
				board.setSocket(socket);
				socket.setBoard(board);
				board.setChessEngine(engine);
				engine.setBoard(board);
				engine.prepareAiMove();
			}
		});

		var pgn = null;
		document.getElementById('loadButton').disabled = true;
		document.getElementById('file').value = "";
		document.getElementById('file').addEventListener('change', function selectedFileChanged() {
			if (this.files.length === 0) {
				return;
			}
			document.getElementById('loadButton').disabled = false;
			var reader = new FileReader();
			reader.onload = function fileReadCompleted() {
				// when the reader is done, the content is in reader.result.
				pgn = reader.result;
			};
			reader.readAsText(this.files[0]);
		});

		$('#loadButton').click(function () {
			var success;
			success = board.loadPgn(pgn);
			if(!success) {
				alert("File format unsupported");
				document.getElementById('file').value = "";
				document.getElementById('loadButton').disabled = true;
			}
		});
		
		$('#undoButton').click(function () {
			if(board.isCompetingCpu()) {
				board.undo();
			}
		});
		
		$('#redoButton').click(function () {
			if(board.isCompetingCpu()) {
				board.redo();
			}
        });
		
		$('#hintButton').click(function () {
			engine.hint();
		});
	}
};

$(document).ready(init);