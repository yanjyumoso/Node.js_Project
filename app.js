// Junyu Yan 
// CSE 270 E
// FInal Project
// Jan 24th


var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var app = express();
var dataModel = require("./model/gameModel.js");


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.resolve(__dirname, "public")));

// Use EJS as the view engine, and servers the views out of a views folder
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");


// index Page
app.get("/", function(req, res) {
    res.render("index");
});


// Manage Board page
app.get("/manage", function(req, res) {
    res.render("manageBoards");
});



// Statistic Page
app.get("/manage/statistics", function(req, res) {
    dataModel.getStats().then(function(result) {
        res.render("statistics", { stats: result });
    });
});


// Games Page
app.get("/manage/games", function(req, res) {
    dataModel.getGames().then(function(result) {
        res.render("games", { stats: result });
    });
});



// In progress page

app.get("/manage/inProgress", function(req, res) {
    dataModel.inProgress().then(function(result) {
        res.render("inProgress", { stats: result });
    });
});


// Orphaned page

app.get("/manage/orphanedGame", function(req, res) {
    dataModel.getOrphaned().then(function(result) {
        res.render("orphanedGame", { stats: result });
    });
});

// Clear Page

app.get("/manage/clear", function(req, res) {
    res.render("clear", { msg: [""] });
});


app.post("/manage/clear", function(req, res) {
    if (!req.body.password || !req.body.time) {
        res.render("clear", { msg: ["Password and time required"] });
    } else {
        if (req.body.password == "CLEAR") {
            dataModel.clearOld(req.body.time).then(function(result) {
                res.render("clear", { msg: ["Cleared Entries"] });
            });
        } else {
            res.render("clear", { msg: ["Wrong password."] });
        }
    }
});

app.listen(3016, function() {
    console.log("App started on port 3016");
});





// dataModel API
app.get("/api/v1/games", function(req, res) {
    dataModel.getGames().then(function(result) {
        res.json({ message: result });
    }, function(err) {
        res.status(404);
        res.json({ error: err });
        return;
    });
});

app.post("/api/v1/game", function(req, res) {
    var playerName = req.body.playerName;
    var gameID = req.body.gameID;
    if (playerName == null) {
        // if no playername input, no reaction
        console.log("Empty player name input");

    } else {
        // console.log("Player Name: " + playerName + " GameID: " + gameID);
        if (gameID == null) {
            console.log("new gameID");
            dataModel.play(playerName, "0").then(function(result) {
                res.json({ status: "OK", game: result });
            });
        } else {
            // Join exist game
            console.log("In playername and iD");
            dataModel.play(playerName, gameID).then(function(result) {
                    res.json({ status: "OK", game: result });
                },

                function(err) {
                    res.status(404);
                    res.json({ error: err });
                    return;
                });
        }
    }
});

app.get("/api/v1/game/:gameID", function(req, res) {
    var gameID = (req.params.gameID);
    if (gameID == null) {
        console.log("empty gameId");
    } else {
        dataModel.getGame(gameID).then(function(result) {
            res.json({ status: "OK", game: result });
        }, function(err) {
            res.status(404);
            res.json({ error: err });
            return;
        });
    }
});

app.get("/api/v1/play/:gameID/:playerName", function(req, res) {
    var gameID = (req.params.gameID);
    var playerName = (req.params.playerName);
    if (playerName == null) {
        console.log("Empty player name");
    } else {

        console.log("Player name: " + playerName + " GameID: " + gameID);
        if (gameID == "0") {
            console.log("new game created");
            dataModel.play(playerName, "0").then(function(result) {
                res.json({ status: "OK", game: result });
            }, function(err) {
                res.status(404);
                res.json({ error: err });
                return;
            });
        } else {
            console.log("In playername and ID");
            dataModel.play(playerName, gameID).then(function(result) {
                res.json({ status: "OK", game: result });
            }, function(err) {
                res.status(404);
                res.json({ error: err });
                return;
            });
        }
    }
});

app.get("/api/v1/move/:gameID/:playerName/:movePosition", function(req, res) {
    var gameID = (req.params.gameID);
    var playerName = (req.params.playerName);
    var movePosition = (req.params.movePosition);

    if (gameID == null || playerName == null || movePosition == null) {
        console.log("No enough parameters");
    } else {
        console.log("Game: " + gameID + " Name: " + playerName + " Pos: " + movePosition);
        dataModel.move(gameID, playerName, movePosition).then(function(result) {
            res.json({ status: "OK", game: result });
        }, function(err) {
            res.status(404);
            res.json({ error: err });
            return;
        });
    }
});

module.exports = app;