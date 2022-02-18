//Junyu Yan
var app = require("../app.js");

var request = require("supertest");


// Test clear function
describe("GET /api/v1/clear", function() {
    it("clear the database", function(done) {
        request(app)
            .get('/api/v1/clear')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
});

// Create test data
describe("GET /api/v1/testAdd", function() {
    it("add game as test data", function(done) {
        request(app)
            .post('/api/v1/testAdd')
            .send({
                game: {
                    gameId: "ABCDEF",
                    player1Name: "player1",
                    player2Name: "player2",
                    moveCnt: 3,
                    lastMoveTime: (new Date()).getTime(),
                    board: [0, 0, 0, 0, 1, 0, 0, 1, 1],
                    state: "player1Turn"
                }
            })
            .set('Accept', 'application/json')
            .expect(200, done);
    });
});
// Test getGames() 
// show json objects
describe("GET /api/v1/games", function() {
    it("test getGames()", function(done) {
        request(app)
            .get('/api/v1/games')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, done);
    });
});


describe("POST /api/v1/game", function() {
    it("start a new game with id = '0'", function(done) {
        request(app)
            .post('/api/v1/game')
            .send({ playerName: "player1", gameID: "0" })
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, done);
    });


    it("try to join an unexisting game", function(done) {
        request(app)
            .post('/api/v1/game')
            .send({ playerName: "player2", gameID: "tyuiop" })
            .set('Accept', 'application/json')
            .expect(404, done);
    });

});


describe("GET /api/v1/move/:gameID/:playerName/:movePosition", function() {
    it("wrong turn", function(done) {
        request(app)
            .get('/api/v1/move/ABCDEF/player2/8')
            .set('Accept', 'application/json')
            .expect(404, done);
    });
    it("valid move", function(done) {
        request(app)
            .get('/api/v1/move/ABCDEF/player1/2')
            .set('Accept', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200, done);
    });


    // Security Check
    it("invalid gameId", function(done) {
        request(app)
            // cannot find the game
            .get('/api/v1/move/fghjlm/player1/0')
            .set('Accept', 'application/json')
            .expect(404, done);
    });
    it("invalid input", function(done) {
        request(app)
            // can find the game
            .get('/api/v1/move/ABCDEF/player1/dfg')
            .set('Accept', 'application/json')
            .expect(404, done);
    });

    it("invalid move", function(done) {
        request(app)
            // can find the game
            .get('/api/v1/move/ABCDEF/player1/-1')
            .set('Accept', 'application/json')
            .expect(404, done);
    });



});

// Clear db
describe("GET /api/v1/clear", function() {
    it("clear the database", function(done) {
        request(app)
            .get('/api/v1/clear')
            .set('Accept', 'application/json')
            .expect(200, done);
    });
});