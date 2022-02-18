
/*
 * Scott Campbell
 * game play for cse270e
 * */

var playerNum=0;
var playerName="";
var gameId=0;
var game;
var run=1;
var turn=0;

//debug messages to bottom of screen
function writeDebug(m) {
	$("#debug").prepend("<p>"+m+"</p>");
}

//update the cells in the game board
function drawBoard(game) {
	for(i=0;i<9;i++) {
		var c= "#cell" + i;
		if (game.board[i]==1)
			$(c).html("X");
		else if (game.board[i]==2)
			$(c).html("Y");
		else
			$(c).html("");
	}
}

//takes in a game object and figures out the state
function parse(game) {
	$("#gameIDOutput").html(gameId);
	$("#startGame").hide();
	//waiting for game to start
	if (game.state == "waiting") {
		$("#waiting").show();
		$("#gameId").html(game.gameId);
		run=1;
	} else if ((game.state == "player1Win" && playerNum==1) || (game.state == "player2Win" && playerNum==2)) {
		$("#turn").html("<h2>YOU WON</h2><br><a href='/'>NEW GAME</a>");
		run=0;

	} else if ((game.state == "player1Win" && playerNum==2) || (game.state == "player2Win" && playerNum==1)) {
		$("#turn").html("<h2>YOU LOST</h2><br><a href='/'>NEW GAME</a>");
		run=0;
	} 
	else if (game.state=="stalemate") {
		drawBoard(game);
		$("#turn").html("<h2>STALEMATE</h2><br><a href='/'>NEW GAME</a>");
		run=0;
		run=0;

	}else if ((game.state == "player1Turn" && playerNum==1) || (game.state == "player2Turn" && playerNum==2)) {
		drawBoard(game);
		$("#waiting").hide();
		$("#play").show();
		$("#turn").html("Your Turn");
		writeDebug("your turn");
		turn=1;
		run=0;
	} else if ((game.state == "player1Turn" && playerNum==2) || (game.state == "player2Turn" && playerNum==1)) {
		drawBoard(game);
		$("#waiting").hide();
		$("#play").show();
		$("#turn").html("Your Turn");
	
		$("#waiting").hide();
		$("#play").show();
		turn=2;
		$("#turn").html("Waiting on opponent");
			writeDebug("waiting on opponent");
		run=1;

	}
	if (run==1)
		setTimeout(poll,100);
}

//poll the server and get update on game
	function poll() {
		$.ajax({url:"/api/v1/game/" + gameId,
			dataType: "json",
			success: function(data) {
				parse(data.game);
			},
			error: function(err) {
				console.log("poll error",err);
			}
		});
	}

//used to start "mid game" for player 2 - test only 
function testGame2(evt) {
		evt.preventDefault();
	playerName = $("#name").val();
	gameId = $("#gameid").val();
	playerNum=2;
	setTimeout(poll,100);
}
	
//used to start "mid game" for player 1 - test only 
function testGame(evt) {
	evt.preventDefault();
	playerName = $("#name").val();
	gameId = $("#gameid").val();
	playerNum=1;
	setTimeout(poll,100);
		
}

//handle start game event
	function startGame(evt) {
		evt.preventDefault();
		playerName = $("#name").val();
		gameId = $("#gameid").val();
		if (playerName !== "") {
			if (gameId == "")
			{playerNum=1;
				gameId = 0;
				run=1;
			} else
			{
				playerNum=2;
				run=1;
			}

			$.ajax({url: "/api/v1/play/" + gameId + "/" + playerName,
				dataType: "json",
				success: function(data) {
					console.log("ok",data);
					gameId=data.game.gameId;
					parse(data.game);
					setTimeout(poll,100);
				},
				error: function(err,data) {
					console.log("error",err,data);
					alert("Problem" + err);
				}
			});
		}

	}

//move handler, figure out which cell and if its their turn
function move(evt) {
	//see if its my turn
	if (turn==2)
		return;

	var cell = evt.target.id;
	var content = $("#"+cell).html();
	if (content != "")
		return;
	writeDebug("move " + cell);
	var cellNum= cell.slice(4,5);
	$.ajax({url:"/api/v1/move/" + gameId + "/" + playerName + "/" + cellNum,
		dataType:"json",
		success: function(game) {
			run=1;
			turn=2;
			setTimeout(poll,100);
		}
	});
}
	
//setup functions
	$(document).ready(function() {
		$("#start").on("submit",function(evt){evt.preventDefault});
		$("#play").hide();
		$("#waiting").hide();
		$("td").on("click",move);
		$("#testbutton1").on('click',testGame);
		$("#testbutton2").on('click',testGame2);
		$("#startbutton").on('click',startGame);
	});