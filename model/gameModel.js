var mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/game");

var active = 0;

var gameSchema = new mongoose.Schema({
    gameId: String,
    player1Name: String,
    player2Name: String,
    moveCnt: Number,
    lastMoveTime: Number,
    board: [Number],
    state: String //waiting,player1Turn,player2Turn,player1Win,player2Win
});

var game = mongoose.model("game", gameSchema);
var winPattern = [
    [0, 1, 2],
    [0, 3, 6],
    [0, 4, 8],
    [2, 5, 8],
    [2, 4, 6],
    [6, 7, 8],
    [3, 4, 5],
    [1, 4, 7]
];

var debug = false;

function debugLog(m) {
    if (debug)
        console.log(m);
}

function debugLog(m, n) {
    if (debug) {
        console.log(m, n);
    }
}

//helper function to create random id string
function createIdString() {
    var id = "";
    for (var i = 0; i < 6; i++) {
        var ltr = Math.floor(Math.random() * 26) + 65;
        var ltr1 = String.fromCharCode(ltr);
        id += ltr1;
    }

    debugLog("Id=" + id);

    return id;
}

//async  to actually create id and check it is unique
async function createId() {
    var ok = false;
    while (!ok) { //keep looping until its unique
        var id = createIdString();
        try {
            var rec = await getGame(id);
            debugLog("check if exists ", rec);
        } catch (error) {
            debugLog("create id reject ", error);
            console.log("Emergency - error on getGame inside createId");
        }
        if (rec == null)
            ok = true;
    }
    //console.log("id="+id);
    return id;
}


//returns a promise to get the game element given a game id
function getGame(gameId) {
    //look for entry
    return new Promise(function(resolv, reject) {
        game.findOne({ gameId: gameId }, function(error, record) {
            if (error) {
                debug.log("on play, existig id error", error);
                reject(error)
            } else {
                console.log("find game", record);
                debugLog("getGame=", record);
                resolv(record);
            }
        });
    });

}

// Find games in progress
function inProgress() {
    return new Promise(function(resolv, reject) {
        game.find({ $or: [{ state: "player1Turn" }, { state: "player2Turn" }] }, function(error, record) {
            if (error) {
                debug.log("Error getting inprogress games", error);
                reject(error)
            } else {
                console.log("Games: ", record);
                debugLog("Games: ", record);
                resolv(record);
            }
        });
    });
}

// Find orphaned games
function getOrphaned() {
    return new Promise(function(resolv, reject) {
        game.find({ state: "waiting" }, function(error, record) {
            if (error) {
                debug.log("Error getting orphan list", error);
                reject(error)
            } else {
                console.log("Orphaned: ", record);
                debugLog("Orphaned: ", record);
                resolv(record);
            }
        });
    });
}

//player name
//gameId => if 0 then this is a new game an an id will be returned. If >0 looking for game player that is waiting
//return:  gameId, state,errorMsg
function play(playerName, gameId) {
    return new Promise(function(resolv, reject) {
        if (gameId === "0") {
            //create and check gameID
            createId().then((id) => {

                //add to db
                //console.log(id);
                var d = new Date();
                var now = d.getTime();
                var rec = new game({ gameId: id, player1Name: playerName, player2Name: "", nextMove: 1, moveCnt: 0, lastMoveTime: now, board: [0, 0, 0, 0, 0, 0, 0, 0, 0], state: "waiting" });
                rec.save().then(() => {
                    resolv(rec);
                });
            });

        } else {
            getGame(gameId).then((gamePlay) => {
                    if (gamePlay === null) {
                        //console.log("sending reject");
                        reject("game id not found");
                    } else {

                        //add player to game
                        //console.log("sending resolv");
                        gamePlay.set({ player2Name: playerName });
                        gamePlay.set({ state: "player1Turn" });
                        //console.log("after set",gamePlay);
                        gamePlay.save().then(() => {
                            resolv(gamePlay);
                        });
                    }
                })
                .catch((err) => {
                    reject(err);
                });
        }
    });
}



//function to see if the game is over
function checkWin(thisGame) {
    debugLog("in check win");
    //I stored all win patterns in winPattern and now check them
    for (var i = 0, len = winPattern.length; i < len; i++) {
        debugLog("in for " + i + " " + len);
        if (thisGame.board[winPattern[i][0]] != 0 && thisGame.board[winPattern[i][0]] == thisGame.board[winPattern[i][1]] && thisGame.board[winPattern[i][1]] === thisGame.board[winPattern[i][2]]) {
            debugLog("won");
            if (thisGame.board[winPattern[i][0]] == 1) {
                console.log("1win", winPattern[i], winPattern[i][0], i)
                thisGame.set({ state: "player1Win" });
            } else {
                console.log("2win", winPattern[i], winPattern[i][0], i)
                thisGame.set({ state: "player2Win" });
            }
            return thisGame;
        }
    }
    //check stalemate
    var cnt = 0;
    for (i = 0; i < 9; i++)
        if (thisGame.board[i] != 0)
            cnt++;
    if (cnt == 9)
        thisGame.set({ state: "stalemate" });

    return thisGame;

}

//make a move
function move(gameId, playerName, move) {

    return new Promise(function(resolv, reject) {
        //get game
        var thisGame = getGame(gameId).then((thisGame) => {
            if (thisGame == null) {
                var ret = { status: "fail", msg: "Invalid thisGame" };
                reject(ret);
                return;
            }

            //console.log("board for move ",thisGame);
            debugLog("checking for waiting");
            if (thisGame.state == "waiting") {
                debugLog("error on move - in waiting");
                var ret = { status: "gameNotStarted", thisGame: thisGame };
                reject(ret);
                return;
            }

            debugLog("checking for move when game is won");
            if (thisGame.state == "player1Win" || thisGame.state == "player2Win") {
                debugLog("error on move - in waiting");
                var ret = { status: "gameOver", thisGame: thisGame };
                reject(ret);
                return;
            }

            //see if its the right player
            debugLog("check turn " + playerName + " " + thisGame.state);
            if (!(thisGame.state == "player1Turn" && playerName === thisGame.player1Name) && !(thisGame.state == "player2Turn" && playerName === thisGame.player2Name)) {
                //console.log("failed check turn");
                var ret = { status: "fail", msg: "not your turn", thisGame: thisGame };
                reject(ret);
                return;
            }
            //console.log("check move");

            //check valid move
            //console.log("this position " + thisGame.board[move]);
            if (move < 0 || move > 8 || thisGame.board[move] != 0) {
                //console.log("invalid move");
                var ret = { status: "fail", msg: "invalid move", thisGame: thisGame };
                reject(ret);
                return;
            }

            //update
            //console.log("updateing");

            board = thisGame.board;
            if (thisGame.state == "player1Turn") {
                board[move] = 1;
                thisGame.set({ state: "player2Turn" });
                thisGame.set({ board: board });
                //console.log("set ",thisGame);
            } else {
                board[move] = 2;
                thisGame.set({ state: "player1Turn" });
                thisGame.set({ board: board });
            }


            debugLog("checking for win");
            thisGame = checkWin(thisGame);
            debugLog("checking for win", thisGame);

            //console.log("updated board " + thisGame);
            thisGame.markModified('board');
            var a = thisGame.moveCnt + 1;
            thisGame.set({ moveCnt: a });
            var d = new Date();
            var now = d.getTime();
            thisGame.set({ lastMoveTime: now });
            thisGame.save((err, u) => {
                //console.log(" move save erro=", err, "u=",u);

                //return
                var ret = { status: "ok", msg: "", thisGame: thisGame }
                resolv(ret);
            });
        });
    });
}

//return list of all boards
function getGames() {
    //look for entry
    return new Promise(function(resolv, reject) {
        game.find(function(error, record) {
            if (error) {
                //console.log("on getBoards, existig id error",error);
                reject(error)
            } else {
                //console.log("getGame=",record);
                resolv(record);
            }
        });
    });
}


// Clear out games
async function clear() {
    await game.collection.drop();
}

// Clear games older than a time (in epochs)
function clearOld(time) {
    return new Promise(function(resolv, reject) {
        game.deleteMany({ "lastMoveTime": { $lt: time } }, function(error, record) {
            if (error) {
                reject(error)
            } else {
                resolv(record);
            }
        });
    });
}

var players = [];

function getIndex(name) {
    for (i = 0; i < players.length; i++) {
        if (players[i].name == name)
            return i;
    }
    return -1;
}

// Get stats on different users
function getStats() {
    players = [];
    return new Promise(function(resolv, reject) {
        game.find(function(error, record) {
            for (var i = 0; i < record.length; i++) {
                var num1 = getIndex(record[i].player1Name);
                console.log(record[i].player1Name, num1);
                if (num1 == -1) {
                    var newP = { name: record[i].player1Name, won: 0, lost: 0, stalemate: 0 };
                    players.push(newP);
                    num1 = getIndex(record[i].player1Name);
                }
                var num2 = getIndex(record[i].player2Name);
                console.log(record[i].player2Name, num2);
                if (num2 == -1) {
                    var newP2 = { name: record[i].player2Name, won: 0, lost: 0, stalemate: 0 };
                    players.push(newP2);
                    num2 = getIndex(record[i].player2Name);
                }


                if (record[i].state == "player1Win") {
                    players[num1].won++;
                    players[num2].lost++;
                } else if (record[i].state == "player2Win") {
                    players[num1].lost++;
                    players[num2].won++;
                } else if (record[i].state == "stalemate") {
                    players[num1].stalemate++;
                    players[num2].stalemate++;
                }
            }
            resolv(players);
        });
    });
}

exports.getOrphaned = getOrphaned;
exports.inProgress = inProgress;
exports.play = play;
exports.clear = clear;
exports.getGame = getGame;
exports.move = move;
exports.getGames = getGames;
exports.getStats = getStats;
exports.clearOld = clearOld;